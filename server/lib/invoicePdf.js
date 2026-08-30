import { createPdfDocument } from "./pdfDoc.js";
import { findPdfLogo } from "./pdfAssets.js";
import { getSupabase } from "./supabase.js";
import { istParts, pdfResponse } from "./reports.js";

const FOREST = "#143524";
const GREEN = "#1f4d32";
const GOLD = "#c4a35a";
const CREAM = "#f6f0e4";
const INK = "#1a2418";
const MUTED = "#5e6b57";
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;

function logoFile() {
  return findPdfLogo();
}

function money(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function bufferFromDoc(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function loadOrderInvoice(id) {
  const oid = String(id || "").trim().toUpperCase();
  if (!oid) {
    const err = new Error("Order ID is required.");
    err.status = 400;
    throw err;
  }
  const supabase = getSupabase();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", oid).maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) {
    const err = new Error("No order found for this ID.");
    err.status = 404;
    throw err;
  }
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  return { order, items: items || [] };
}

export async function makeInvoicePdf(order, items) {
  const ist = istParts(order.created_at ? new Date(order.created_at) : new Date());
  const doc = createPdfDocument({ size: "A4", margin: 0, bufferPages: true, info: { Title: "Invoice " + order.id, Author: "BHR Traders" } });
  const done = bufferFromDoc(doc);

  doc.save();
  doc.rect(0, 0, PAGE_W, 118).fill(FOREST);
  doc.rect(0, 118, PAGE_W, 6).fill(GOLD);
  doc.rect(0, 0, 10, PAGE_H).fill(GOLD);

  const file = logoFile();
  if (file) {
    try {
      doc.image(file, 28, 22, { height: 48 });
    } catch {
      /* text fallback */
    }
  }
  const left = 28 + (file ? 64 : 0);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("WHOLESALE RICE · CHENNAI", left, 26);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(22).text("BHR TRADERS", left, 40);
  doc.fillColor("#d7e4d4").font("Helvetica").fontSize(8).text("Tax invoice", left, 66);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(16).text("INVOICE", PAGE_W - 210, 32, { width: 174, align: "right" });
  doc.fillColor("#d7e4d4").font("Helvetica").fontSize(9).text(order.id, PAGE_W - 210, 54, { width: 174, align: "right" });
  doc.fillColor("#d7e4d4").font("Helvetica").fontSize(8).text(ist.stamp, PAGE_W - 210, 70, { width: 174, align: "right" });
  doc.restore();

  let y = 144;
  doc.roundedRect(MARGIN, y, 250, 92, 6).fill(CREAM);
  doc.roundedRect(MARGIN + 262, y, PAGE_W - MARGIN * 2 - 262, 92, 6).fill(CREAM);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("BILL TO", MARGIN + 12, y + 10);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(order.name || "", MARGIN + 12, y + 24, { width: 226, height: 14, ellipsis: true, lineBreak: false });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(
    [order.phone, order.email, order.address, (order.city || "") + " - " + (order.pincode || "")].filter(Boolean).join("\n"),
    MARGIN + 12,
    y + 40,
    { width: 226, height: 44, ellipsis: true }
  );
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("PAYMENT", MARGIN + 274, y + 10);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(order.pay || "UPI", MARGIN + 274, y + 24, { width: 230, height: 14, ellipsis: true, lineBreak: false });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(
    "UPI: bhr270906@okhdfcbank\nGSTIN 33BDJPB0270L2ZT\nStatus: " + (order.status || ""),
    MARGIN + 274,
    y + 40,
    { width: 230, height: 44, ellipsis: true }
  );

  y += 112;
  const cols = [
    [MARGIN, 36, "#"],
    [MARGIN + 36, 268, "Product"],
    [MARGIN + 304, 50, "Qty"],
    [MARGIN + 354, 90, "Rate"],
    [MARGIN + 444, 81, "Amount"]
  ];
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 20).fill(GREEN);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8);
  cols.forEach(([x, w, label]) => doc.text(label, x + 6, y + 6, { width: w - 10, lineBreak: false }));
  y += 20;

  const rows = items.length ? items : [{ title: "Items", qty: 1, price: order.total }];
  rows.forEach((item, i) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const amount = qty * price;
    if (y > PAGE_H - 140) {
      doc.addPage();
      y = MARGIN;
    }
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 22).fill(i % 2 ? "#f3eee4" : "#ffffff");
    doc.fillColor(INK).font("Helvetica").fontSize(8);
    doc.text(String(i + 1), MARGIN + 6, y + 7, { width: 28, height: 12, lineBreak: false });
    doc.text(String(item.title || "Item"), MARGIN + 42, y + 7, { width: 258, height: 12, ellipsis: true });
    doc.text(String(qty), MARGIN + 310, y + 7, { width: 44, height: 12, lineBreak: false });
    doc.text(money(price), MARGIN + 360, y + 7, { width: 84, height: 12, lineBreak: false });
    doc.font("Helvetica-Bold").text(money(amount), MARGIN + 450, y + 7, { width: 75, align: "right", height: 12, lineBreak: false });
    y += 22;
  });

  y += 10;
  doc.roundedRect(MARGIN + 280, y, PAGE_W - MARGIN * 2 - 280, 48, 6).fill(FOREST);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(9).text("TOTAL", MARGIN + 294, y + 10);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text(money(order.total), MARGIN + 294, y + 22, {
    width: PAGE_W - MARGIN * 2 - 308,
    align: "right"
  });

  if (order.notes) {
    y += 62;
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(8).text("NOTES", MARGIN, y);
    doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(String(order.notes), MARGIN, y + 12, {
      width: PAGE_W - MARGIN * 2,
      height: 36,
      ellipsis: true
    });
  }

  doc.save();
  doc.rect(0, PAGE_H - 48, PAGE_W, 48).fill(FOREST);
  doc.rect(0, PAGE_H - 52, PAGE_W, 4).fill(GOLD);
  doc.fillColor("#d7e4d4")
    .font("Helvetica")
    .fontSize(7)
    .text("No: 66, Kannagi Nagar, PadiKuppam Main Road, Anna Nagar West, Chennai 600040", 24, PAGE_H - 40, { width: 390, lineBreak: false });
  doc.text("+91 99403 38654  ·  +91 99403 39654  ·  info@bhrtraders.com  ·  GSTIN 33BDJPB0270L2ZT", 24, PAGE_H - 26, {
    width: 390,
    lineBreak: false
  });
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("Thank you", PAGE_W - 110, PAGE_H - 34, {
    width: 80,
    align: "right",
    lineBreak: false
  });
  doc.restore();
  doc.end();

  const buffer = await done;
  const filename = "BHR-Invoice-" + order.id + ".pdf";
  return { buffer, filename };
}

export async function invoiceResponse(id) {
  const { order, items } = await loadOrderInvoice(id);
  const { buffer, filename } = await makeInvoicePdf(order, items);
  return pdfResponse(buffer, filename);
}
