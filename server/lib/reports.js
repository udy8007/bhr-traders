import { createPdfDocument } from "./pdfDoc.js";
import { findPdfLogo } from "./pdfAssets.js";
import { adminDeepLink, adminNotifyEmail } from "./notify.js";
import {
  escapeHtml,
  mailFacts,
  mailMoney,
  mailPreviewTable,
  mailSectionLabel,
  mailStatStrip,
  sendMail,
  wrapHtml
} from "./mail.js";
import { isShopVisit } from "./shopVisits.js";
import { getSupabase } from "./supabase.js";

function logoPath() {
  return findPdfLogo();
}

const SCHEDULE_ID = "default";
export const REPORT_KINDS = ["overall", "orders", "products", "category", "visits"];

export const DEFAULT_SCHEDULE = {
  id: SCHEDULE_ID,
  enabled: false,
  kind: "overall",
  category: "",
  hour: 9,
  minute: 0,
  frequency: "daily",
  email: "",
  last_run_key: "",
  last_attempt_key: "",
  last_sent_at: "",
  last_error: ""
};

function asBool(v, fallback = false) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

export function normalizeSchedule(row) {
  const base = { ...DEFAULT_SCHEDULE, ...(row || {}) };
  const hour = Math.min(23, Math.max(0, Number(base.hour) || 0));
  const minute = Math.min(59, Math.max(0, Number(base.minute) || 0));
  const kind = REPORT_KINDS.includes(base.kind) ? base.kind : "overall";
  const frequency = base.frequency === "weekdays" || base.frequency === "monthly" ? base.frequency : "daily";
  return {
    id: SCHEDULE_ID,
    enabled: asBool(base.enabled, false),
    kind,
    category: String(base.category || "").trim(),
    hour,
    minute,
    frequency,
    email: String(base.email || "").trim(),
    last_run_key: String(base.last_run_key || ""),
    last_attempt_key: String(base.last_attempt_key || ""),
    last_sent_at: String(base.last_sent_at || ""),
    last_error: String(base.last_error || "")
  };
}

function rowForDb(schedule) {
  const row = {
    id: schedule.id,
    enabled: schedule.enabled,
    kind: schedule.kind,
    category: schedule.category,
    hour: schedule.hour,
    minute: schedule.minute,
    frequency: schedule.frequency,
    email: schedule.email,
    last_run_key: schedule.last_run_key || "",
    last_attempt_key: schedule.last_attempt_key || "",
    last_error: schedule.last_error || ""
  };
  const stamp = String(schedule.last_sent_at || "").trim();
  if (stamp && !Number.isNaN(new Date(stamp).getTime())) row.last_sent_at = stamp;
  return row;
}

async function withNotifyEmail(schedule) {
  return { ...schedule, email: await adminNotifyEmail() };
}

export async function getReportSchedule() {
  const supabase = getSupabase();
  const { data } = await supabase.from("report_schedules").select("*").eq("id", SCHEDULE_ID).maybeSingle();
  return withNotifyEmail(normalizeSchedule(data));
}

export async function saveReportSchedule(input) {
  const supabase = getSupabase();
  const { data } = await supabase.from("report_schedules").select("*").eq("id", SCHEDULE_ID).maybeSingle();
  const prev = normalizeSchedule(data);
  const rest = { ...(input || {}) };
  delete rest.email;
  if (!String(rest.last_sent_at || "").trim()) delete rest.last_sent_at;
  const next = normalizeSchedule({ ...prev, ...rest, email: prev.email, id: SCHEDULE_ID });
  if (next.enabled && next.kind === "category" && !next.category) {
    const err = new Error("Select a category for the category report.");
    err.status = 400;
    throw err;
  }
  await supabase.from("report_schedules").upsert(rowForDb(next));
  return withNotifyEmail(next);
}

export function istParts(date = new Date()) {
  const map = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false
  })
    .formatToParts(date)
    .forEach((p) => {
      map[p.type] = p.value;
    });
  return {
    hour: Number(map.hour) % 24,
    minute: Number(map.minute),
    dateKey: map.year + "-" + map.month + "-" + map.day,
    day: Number(map.day),
    weekday: map.weekday,
    stamp: map.day + "/" + map.month + "/" + map.year + " " + map.hour + ":" + map.minute + " IST"
  };
}

export function reportFilename(kind, category) {
  const ist = istParts();
  const cat = category ? "-" + String(category).replace(/[^\w-]+/g, "").slice(0, 24) : "";
  return "BHR-" + kind + cat + "-" + ist.dateKey + ".pdf";
}

export function productInCategory(product, category) {
  if (!category) return true;
  const id = String(category.id || category).toLowerCase();
  const name = String(category.name || category).toLowerCase();
  const cats = String(product.cats || "").toLowerCase();
  const catName = String(product.cat || "").toLowerCase();
  const tokens = cats.split(/[\s,]+/).filter(Boolean);
  return cats === id || catName === name || catName === id || tokens.includes(id) || tokens.includes(name);
}

function money(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

export function resolveKind(kind, category) {
  const k = REPORT_KINDS.includes(kind) ? kind : "overall";
  if (k === "category" && !String(category || "").trim()) {
    const err = new Error("Select a category for the category report.");
    err.status = 400;
    throw err;
  }
  return k;
}

export async function loadReportData() {
  const supabase = getSupabase();
  const [products, orders, items, enquiries, categories, visits] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*"),
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("sort"),
    supabase.from("visits").select("*").order("created_at", { ascending: false })
  ]);
  const grouped = {};
  (items.data || []).forEach((row) => {
    grouped[row.order_id] = grouped[row.order_id] || [];
    grouped[row.order_id].push(row);
  });
  const orderRows = (orders.data || []).map((o) => ({ ...o, items: grouped[o.id] || [] }));
  return {
    products: products.data || [],
    orders: orderRows,
    items: items.data || [],
    enquiries: enquiries.data || [],
    categories: categories.data || [],
    visits: (visits.data || []).filter(isShopVisit)
  };
}

function categoryMeta(categories, category) {
  const key = String(category || "").toLowerCase();
  return (
    categories.find((c) => String(c.id).toLowerCase() === key || String(c.name).toLowerCase() === key) || {
      id: category,
      name: category
    }
  );
}

function kindTitle(kind, cat) {
  if (kind === "orders") return "Orders report";
  if (kind === "products") return "Products report";
  if (kind === "visits") return "Website visits report";
  if (kind === "category") return "Category report — " + (cat.name || cat.id);
  return "Overall business report";
}

function drawHeader(doc, title, stamp, compact = false) {
  const file = logoPath();
  const top = 22;
  const logoH = compact ? 34 : 52;
  if (file) {
    try {
      doc.image(file, 40, top, { height: logoH });
    } catch {
      doc.fillColor("#1f4d32").fontSize(compact ? 14 : 18).font("Helvetica-Bold").text("BHR Traders", 40, top);
    }
  } else {
    doc.fillColor("#1f4d32").fontSize(compact ? 14 : 18).font("Helvetica-Bold").text("BHR Traders", 40, top);
  }
  let y = top + logoH + 6;
  doc.fillColor("#5e6b57").fontSize(8).font("Helvetica").text("Wholesale rice · GSTIN 33BDJPB0270L2ZT", 40, y);
  y = doc.y + 2;
  if (!compact) {
    doc.fillColor("#1f2a1a").fontSize(13).font("Helvetica-Bold").text(title, 40, y);
    y = doc.y + 2;
    doc.fillColor("#5e6b57").fontSize(8).font("Helvetica").text("Generated " + stamp, 40, y);
    y = doc.y + 8;
  } else {
    y = doc.y + 6;
  }
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#c9d4c4").stroke();
  doc.y = y + 12;
}

function drawTable(doc, headers, rows, widths) {
  const left = 40;
  const pageBottom = 770;
  function ensure(h) {
    if (doc.y + h > pageBottom) {
      doc.addPage();
    }
  }
  function row(cells, header) {
    const h = header ? 20 : 18;
    ensure(h);
    const y = doc.y;
    let x = left;
    if (header) {
      doc.rect(left, y, widths.reduce((a, b) => a + b, 0), h).fill("#1f4d32");
      doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
    } else {
      doc.fillColor("#1f2a1a").fontSize(8).font("Helvetica");
    }
    cells.forEach((cell, i) => {
      doc.text(String(cell ?? ""), x + 4, y + 5, { width: widths[i] - 8, height: h - 6, ellipsis: true });
      x += widths[i];
    });
    if (!header) {
      doc.moveTo(left, y + h).lineTo(left + widths.reduce((a, b) => a + b, 0), y + h).strokeColor("#edf0f5").stroke();
    }
    doc.y = y + h;
  }
  row(headers, true);
  rows.forEach((r) => row(r, false));
}

function visitPlace(v) {
  return [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown";
}

function visitDayKey(iso) {
  if (!iso) return "";
  try {
    return istParts(new Date(iso)).dateKey;
  } catch {
    return "";
  }
}

function countBy(rows, keyFn) {
  const map = {};
  rows.forEach((r) => {
    const k = keyFn(r) || "Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => [clip(label, 36), String(count)]);
}

function referrerHost(ref) {
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

function sectionTitle(doc, text) {
  if (doc.y > 720) doc.addPage();
  doc.fillColor("#1f4d32").fontSize(11).font("Helvetica-Bold").text(text, 40, doc.y + 6);
  doc.y += 16;
}

function shopPageVisits(rows) {
  return (rows || []).filter((v) => (v.kind || "page") === "page");
}

function drawVisitReport(doc, allVisits, { full }) {
  const pages = shopPageVisits(allVisits);
  const today = istParts().dateKey;
  const todayCount = pages.filter((v) => visitDayKey(v.created_at) === today).length;
  const checkouts = (allVisits || []).filter((v) => v.kind === "checkout_start").length;
  const completes = (allVisits || []).filter((v) => v.kind === "checkout_complete").length;
  kv(doc, "Shop visits", String(pages.length));
  kv(doc, "Visits today (IST)", String(todayCount));
  kv(doc, "Cities", String(new Set(pages.map(visitPlace)).size));
  kv(doc, "Checkout started", String(checkouts));
  kv(doc, "Checkout complete", String(completes));
  doc.y += 8;

  const last14 = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = istParts(d).dateKey;
    const label = d.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });
    last14.push([label, String(pages.filter((v) => visitDayKey(v.created_at) === key).length)]);
  }
  sectionTitle(doc, "Visits last 14 days");
  drawTable(doc, ["Day", "Views"], last14, [260, 255]);

  sectionTitle(doc, "Top locations");
  const locTbl = countBy(pages, visitPlace);
  drawTable(doc, ["Place", "Views"], locTbl.length ? locTbl.slice(0, full ? 20 : 8) : [["No visits yet", "—"]], [360, 155]);

  if (!full) return;

  sectionTitle(doc, "Top countries");
  const countries = countBy(pages, (v) => v.country || "Unknown");
  drawTable(doc, ["Country", "Views"], countries.length ? countries.slice(0, 15) : [["No visits yet", "—"]], [360, 155]);

  sectionTitle(doc, "Referrers");
  const refs = countBy(pages, (v) => referrerHost(v.referrer));
  drawTable(doc, ["Source", "Views"], refs.length ? refs.slice(0, 12) : [["Direct", "0"]], [360, 155]);

  sectionTitle(doc, "Recent visits");
  const recent = pages.slice(0, 40).map((v) => [when(v.created_at), clip(visitPlace(v), 36)]);
  drawTable(doc, ["When", "Place"], recent.length ? recent : [["No visits yet", ""]], [200, 315]);
}

function kv(doc, label, value) {
  const y = doc.y;
  doc.fillColor("#5e6b57").fontSize(9).font("Helvetica").text(label, 40, y, { width: 160 });
  doc.fillColor("#1f2a1a").fontSize(10).font("Helvetica-Bold").text(String(value), 200, y, { width: 350 });
  doc.y = y + 16;
}

export function buildReportPdf(kind, data, category) {
  const ist = istParts();
  const cat = categoryMeta(data.categories, category);
  const title = kindTitle(kind, cat);
  const products = data.products || [];
  const orders = data.orders || [];
  const enquiries = data.enquiries || [];
  const visits = data.visits || [];
  const catProducts = kind === "category" ? products.filter((p) => productInCategory(p, cat)) : products;
  const catIds = new Set(catProducts.map((p) => p.id));
  const catTitles = new Set(catProducts.map((p) => String(p.title || "").toLowerCase()));
  const catOrders =
    kind === "category"
      ? orders.filter((o) =>
          (o.items || []).some((i) => catIds.has(i.product_id) || catTitles.has(String(i.title || "").toLowerCase()))
        )
      : orders;
  const catItems = kind === "category" ? catOrders.flatMap((o) => (o.items || []).filter((i) => catIds.has(i.product_id))) : orders.flatMap((o) => o.items || []);
  const orderRevenue = (list) => list.reduce((s, o) => s + Number(o.total || 0), 0);

  return new Promise((resolve, reject) => {
    const doc = createPdfDocument({
      size: "A4",
      margins: { top: 40, left: 40, right: 40, bottom: 0 },
      bufferPages: true,
      info: { Title: title, Author: "BHR Traders" }
    });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.on("pageAdded", () => {
      drawHeader(doc, title, ist.stamp, true);
    });

    drawHeader(doc, title, ist.stamp);

    if (kind === "overall" || kind === "category") {
      kv(doc, "Products", String(catProducts.length) + (kind === "category" ? " in category" : " in catalog"));
      kv(doc, "Orders", String(kind === "category" ? catOrders.length : orders.length));
      kv(doc, "Order value", money(kind === "category" ? catItems.reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0) : orderRevenue(orders)));
      kv(doc, "Enquiries", String(enquiries.length));
      kv(doc, "Shop visits", String(shopPageVisits(visits).length));
      doc.y += 8;
    }

    if (kind === "overall") {
      const byStatus = {};
      orders.forEach((o) => {
        const st = o.status || "Unknown";
        byStatus[st] = (byStatus[st] || 0) + 1;
      });
      doc.fillColor("#1f4d32").fontSize(11).font("Helvetica-Bold").text("Orders by status", 40, doc.y);
      doc.y += 8;
      drawTable(doc, ["Status", "Count"], Object.entries(byStatus).map(([k, v]) => [k, String(v)]), [360, 155]);
      doc.y += 14;
      const sold = {};
      orders.forEach((o) => {
        (o.items || []).forEach((i) => {
          const key = i.title || i.product_id || "Item";
          sold[key] = sold[key] || { qty: 0, value: 0 };
          sold[key].qty += Number(i.qty || 0);
          sold[key].value += Number(i.qty || 0) * Number(i.price || 0);
        });
      });
      const top = Object.entries(sold)
        .sort((a, b) => b[1].qty - a[1].qty)
        .slice(0, 20)
        .map(([name, v]) => [clip(name, 36), String(v.qty), money(v.value)]);
      doc.fillColor("#1f4d32").fontSize(11).font("Helvetica-Bold").text("Top products by quantity", 40, doc.y + 6);
      doc.y += 16;
      drawTable(doc, ["Product", "Qty", "Value"], top.length ? top : [["No order items yet", "—", "—"]], [280, 80, 155]);
      doc.y += 14;
      doc.fillColor("#1f4d32").fontSize(11).font("Helvetica-Bold").text("Recent orders", 40, doc.y + 6);
      doc.y += 16;
      const recent = orders.slice(0, 25).map((o) => [clip(o.id, 16), when(o.created_at), clip(o.name, 18), clip(o.status, 12), money(o.total)]);
      drawTable(doc, ["Order", "When", "Customer", "Status", "Total"], recent.length ? recent : [["No orders yet", "", "", "", ""]], [90, 130, 120, 80, 95]);
      doc.y += 10;
      drawVisitReport(doc, visits, { full: false });
    }

    if (kind === "orders") {
      const rows = orders.map((o) => [
        clip(o.id, 14),
        when(o.created_at),
        clip(o.name, 16),
        clip(o.city, 12),
        clip(o.status, 12),
        money(o.total)
      ]);
      drawTable(
        doc,
        ["Order", "When", "Customer", "City", "Status", "Total"],
        rows.length ? rows : [["No orders yet", "", "", "", "", ""]],
        [80, 115, 95, 70, 70, 85]
      );
    }

    if (kind === "products") {
      const rows = products.map((p) => [
        clip(p.title, 28),
        clip(p.cat, 18),
        clip(p.pack, 16),
        money(p.price),
        p.active === false ? "Hidden" : "Active"
      ]);
      drawTable(
        doc,
        ["Product", "Category", "Pack", "Price / kg", "Status"],
        rows.length ? rows : [["No products yet", "", "", "", ""]],
        [170, 110, 90, 80, 65]
      );
    }

    if (kind === "category") {
      const rows = catProducts.map((p) => [clip(p.title, 32), clip(p.pack, 18), money(p.price), p.active === false ? "Hidden" : "Active"]);
      drawTable(doc, ["Product", "Pack", "Price / kg", "Status"], rows.length ? rows : [["No products in this category", "", "", ""]], [220, 110, 95, 90]);
      doc.y += 14;
      doc.fillColor("#1f4d32").fontSize(11).font("Helvetica-Bold").text("Orders with this category", 40, doc.y + 6);
      doc.y += 16;
      const orows = catOrders.map((o) => [clip(o.id, 14), when(o.created_at), clip(o.name, 18), clip(o.status, 12), money(o.total)]);
      drawTable(doc, ["Order", "When", "Customer", "Status", "Total"], orows.length ? orows : [["No matching orders", "", "", "", ""]], [90, 130, 120, 80, 95]);
      doc.y += 14;
      const sold = {};
      catItems.forEach((i) => {
        const key = i.title || i.product_id || "Item";
        sold[key] = sold[key] || { qty: 0, value: 0 };
        sold[key].qty += Number(i.qty || 0);
        sold[key].value += Number(i.qty || 0) * Number(i.price || 0);
      });
      const top = Object.entries(sold)
        .sort((a, b) => b[1].value - a[1].value)
        .map(([name, v]) => [clip(name, 36), String(v.qty), money(v.value)]);
      doc.fillColor("#1f4d32").fontSize(11).font("Helvetica-Bold").text("Category quantity sold", 40, doc.y + 6);
      doc.y += 16;
      drawTable(doc, ["Product", "Qty", "Value"], top.length ? top : [["No sales in this category", "—", "—"]], [280, 80, 155]);
    }

    if (kind === "visits") {
      drawVisitReport(doc, visits, { full: true });
    }

    doc.font("Helvetica").fillColor("#5e6b57").fontSize(8).text(
      "No. 66 Kannagi Nagar, Anna Nagar West, Chennai 600040 · info@bhrtraders.com",
      40,
      812,
      { width: 515, align: "center", lineBreak: false }
    );
    doc.end();
  });
}

export async function makeReportPdf(kind, category) {
  const k = resolveKind(kind, category);
  const data = await loadReportData();
  const buffer = await buildReportPdf(k, data, category);
  return { buffer, filename: reportFilename(k, category), kind: k, data };
}

function frequencyLabel(frequency) {
  if (frequency === "weekdays") return "Weekdays (Mon–Fri)";
  if (frequency === "monthly") return "Monthly once (1st of month)";
  return "Daily";
}

function reportMailSnapshot(kind, data, category) {
  const orders = data.orders || [];
  const products = data.products || [];
  const visits = shopPageVisits(data.visits);
  const cat = { name: category, id: category };
  if (kind === "orders") {
    return mailPreviewTable(
      ["Order", "Customer", "Status", "Total"],
      orders.slice(0, 8).map((o) => [o.id, clip(o.name, 22), o.status || "—", mailMoney(o.total)])
    );
  }
  if (kind === "products") {
    return mailPreviewTable(
      ["Product", "Category", "Price"],
      products.slice(0, 8).map((p) => [clip(p.title, 28), clip(p.cat, 18), mailMoney(p.price)])
    );
  }
  if (kind === "category") {
    const rows = products.filter((p) => productInCategory(p, cat)).slice(0, 8);
    return mailPreviewTable(
      ["Product", "Pack", "Price"],
      rows.map((p) => [clip(p.title, 28), clip(p.pack || p.price_label, 16), mailMoney(p.price)])
    );
  }
  if (kind === "visits") {
    return mailPreviewTable(
      ["When", "Place", "Page"],
      visits.slice(0, 8).map((v) => [when(v.created_at), clip(visitPlace(v), 24), clip(v.path || "home", 18)])
    );
  }
  return mailPreviewTable(
    ["Order", "Status", "Total"],
    orders.slice(0, 6).map((o) => [o.id, o.status || "—", mailMoney(o.total)])
  );
}

function reportMailBody({ kind, title, data, category, filename, ist, meta }) {
  const orders = data.orders || [];
  const products = data.products || [];
  const visits = shopPageVisits(data.visits);
  const unpaid = (s) => /pending|awaiting|cancelled/i.test(s || "");
  const net = orders.filter((o) => !unpaid(o.status)).reduce((n, o) => n + Number(o.total || 0), 0);
  const today = ist.dateKey;
  const ordersToday = orders.filter((o) => visitDayKey(o.created_at) === today).length;
  const visitsToday = visits.filter((v) => visitDayKey(v.created_at) === today).length;
  const repeat = frequencyLabel(meta.frequency);
  const time =
    meta.hour != null
      ? String(meta.hour).padStart(2, "0") + ":" + String(meta.minute || 0).padStart(2, "0") + " IST"
      : ist.stamp;
  const mode = meta.scheduled ? "Scheduled send" : "Manual send";
  return (
    "<p style=\"margin:0 0 14px\">Hello,</p>" +
    "<p style=\"margin:0 0 16px\">Please find the <strong>" +
    escapeHtml(title) +
    "</strong> for BHR Traders. The full PDF is attached to this email.</p>" +
    mailStatStrip([
      { label: "Orders", value: String(orders.length) },
      { label: "Today", value: String(ordersToday) },
      { label: "Net value", value: mailMoney(net) },
      { label: "Visits", value: String(visitsToday) }
    ]) +
    mailSectionLabel("Schedule") +
    mailFacts([
      { label: "Report", value: title },
      { label: "Send type", value: mode },
      { label: "Repeat", value: repeat },
      { label: "Time", value: time },
      { label: "Generated", value: ist.stamp },
      { label: "Attachment", value: filename },
      { label: "Products", value: String(products.length) },
      { label: "Enquiries", value: String((data.enquiries || []).length) }
    ]) +
    mailSectionLabel("Snapshot") +
    reportMailSnapshot(kind, data, category) +
    "<p style=\"margin:16px 0 0;font-size:13px;color:#5e6b57\">This is an automated BHR Traders backoffice mail. Open reports in admin if you need another PDF.</p>"
  );
}

async function recipientFor() {
  return adminNotifyEmail();
}

export async function sendReportEmail(kind, category, to, meta = {}) {
  const { buffer, filename, kind: k, data } = await makeReportPdf(kind, category);
  const title = kindTitle(k, { name: category, id: category });
  const ist = istParts();
  const click = adminDeepLink("/reports/download");
  const html = wrapHtml(title, reportMailBody({ kind: k, title, data, category, filename, ist, meta }), {
    kicker: meta.scheduled ? "Scheduled report" : "Admin report",
    preheader: title + " · " + filename,
    button: { href: click, label: "Open reports" }
  });
  const text = [
    "Hello,",
    "",
    title + " is attached as a PDF.",
    "Generated: " + ist.stamp,
    "Repeat: " + frequencyLabel(meta.frequency),
    "File: " + filename,
    "",
    "Open reports: " + click,
    "",
    "BHR Traders"
  ].join("\n");
  await sendMail({
    to,
    subject: "BHR Traders · " + title + " · " + ist.dateKey,
    text,
    html,
    attachments: [{ filename, content: buffer, contentType: "application/pdf" }]
  });
  return { filename, to };
}

export async function sendScheduledReport(schedule) {
  const to = await recipientFor();
  return sendReportEmail(schedule.kind, schedule.category, to, {
    scheduled: true,
    frequency: schedule.frequency,
    hour: schedule.hour,
    minute: schedule.minute
  });
}

const WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

export async function tickScheduledReports() {
  const cfg = await getReportSchedule();
  if (!cfg.enabled) return { skipped: "disabled" };
  const now = istParts();
  if (cfg.hour !== now.hour) return { skipped: "time" };
  if (cfg.frequency === "weekdays" && !WEEKDAYS.has(now.weekday)) return { skipped: "weekend" };
  if (cfg.frequency === "monthly" && now.day !== 1) return { skipped: "not monthly" };
  const runKey = now.dateKey + "-" + String(now.hour).padStart(2, "0");
  if (cfg.last_attempt_key === runKey) return { skipped: "already" };
  await saveReportSchedule({ ...cfg, last_attempt_key: runKey });
  try {
    await sendScheduledReport(cfg);
    await saveReportSchedule({
      ...cfg,
      last_attempt_key: runKey,
      last_run_key: runKey,
      last_sent_at: new Date().toISOString(),
      last_error: ""
    });
    return { ok: true, runKey };
  } catch (err) {
    await saveReportSchedule({
      ...cfg,
      last_attempt_key: runKey,
      last_error: String(err.message || err)
    });
    return { ok: false, error: String(err.message || err) };
  }
}

export function pdfResponse(buffer, filename) {
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + filename + '"',
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
