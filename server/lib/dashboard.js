import { isShopVisit } from "./shopVisits.js";

function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function dayLabel(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isToday(iso) {
  return dayKey(iso) === dayKey(new Date());
}

function loc(v) {
  return [v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown";
}

function countMap(rows, keyFn) {
  const map = {};
  rows.forEach((r) => {
    const k = keyFn(r) || "Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function daySeries(days, rows) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({
      label: dayLabel(d),
      visits: rows.filter((v) => dayKey(v.created_at) === key).length
    });
  }
  return out;
}

function referrerHost(ref) {
  if (!ref) return "Direct";
  try {
    return new URL(ref).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

function customerKey(row) {
  const phone = String(row.phone || "").replace(/\D/g, "");
  const email = String(row.email || "").trim().toLowerCase();
  return phone || email || String(row.name || "").trim().toLowerCase();
}

function buildCustomerList(orders, enquiryRows) {
  const map = {};
  function upsert(row, kind) {
    const key = customerKey(row);
    if (!key) return;
    const cur = map[key] || {
      id: key,
      name: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      pincode: "",
      company: "",
      orders: 0,
      enquiries: 0,
      spend: 0,
      lastAt: row.created_at,
      lastKind: kind,
      lastStatus: row.status || ""
    };
    if (row.name) cur.name = row.name;
    if (row.phone) cur.phone = row.phone;
    if (row.email) cur.email = row.email;
    if (row.city) cur.city = row.city;
    if (row.address) cur.address = row.address;
    if (row.pincode) cur.pincode = row.pincode;
    if (row.company) cur.company = row.company;
    if (kind === "order") {
      cur.orders += 1;
      if (!/cancelled/i.test(row.status || "")) cur.spend += Number(row.total || 0);
    } else {
      cur.enquiries += 1;
    }
    if (String(row.created_at || "") > String(cur.lastAt || "")) {
      cur.lastAt = row.created_at;
      cur.lastKind = kind;
      cur.lastStatus = row.status || "";
    }
    map[key] = cur;
  }
  (orders || []).forEach((o) => upsert(o, "order"));
  (enquiryRows || []).forEach((e) => upsert(e, "enquiry"));
  const list = Object.values(map).sort((a, b) => String(b.lastAt || "").localeCompare(String(a.lastAt || "")));
  return list;
}

export function listCustomers(orders, enquiryRows) {
  return buildCustomerList(orders, enquiryRows);
}

function buildCustomers(orders, enquiryRows) {
  const list = buildCustomerList(orders, enquiryRows);
  return {
    customers: list.slice(0, 12),
    customerCount: list.length,
    topSpenders: [...list].sort((a, b) => b.spend - a.spend).filter((c) => c.spend > 0).slice(0, 6)
  };
}

export function buildDashboard(products, orders, enquiries, items, visits) {
  const productRows = products || [];
  const orderRows = orders || [];
  const enquiryRows = Array.isArray(enquiries) ? enquiries : [];
  const enquiryCount = Array.isArray(enquiries) ? enquiries.length : Number(enquiries || 0);
  const visitRows = (visits || []).filter(isShopVisit);
  const hidden = productRows.filter((p) => p.hidden === true || p.active === false).length;
  const live = Math.max(0, productRows.length - hidden);

  const cancelled = (s) => /cancelled/i.test(s || "");
  const awaiting = (s) => /awaiting/i.test(s || "");

  const ordersToday = orderRows.filter((o) => isToday(o.created_at)).length;
  const needsAttention = orderRows.filter((o) => awaiting(o.status)).length;
  const netRevenue = orderRows
    .filter((o) => !cancelled(o.status) && !awaiting(o.status))
    .reduce((n, o) => n + Number(o.total || 0), 0);
  const sales = orderRows.reduce((n, o) => n + Number(o.total || 0), 0);
  const bags = (items || []).reduce((n, i) => n + Number(i.qty || 0), 0);

  const pageVisits = visitRows.filter((v) => (v.kind || "page") === "page");
  const visitsToday = pageVisits.filter((v) => isToday(v.created_at)).length;
  const checkoutStartsToday = visitRows.filter((v) => v.kind === "checkout_start" && isToday(v.created_at)).length;
  const incompleteCheckouts = Math.max(0, checkoutStartsToday - ordersToday);

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    last7.push({
      label: dayLabel(d),
      count: orderRows.filter((o) => dayKey(o.created_at) === key).length,
      visits: pageVisits.filter((v) => dayKey(v.created_at) === key).length
    });
  }

  const statusMap = {};
  orderRows.forEach((o) => {
    const s = o.status || "Unknown";
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const ordersByStatus = Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  const cityMap = {};
  pageVisits.forEach((v) => {
    const city = loc(v);
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const liveVisits = [...pageVisits]
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 200)
    .map((v) => ({
      id: v.id,
      place: loc(v),
      city: v.city || "",
      region: v.region || "",
      country: v.country || "",
      path: v.path || "home",
      at: v.created_at
    }));

  const hourly = Array.from({ length: 24 }, (_, h) => ({
    label: String(h).padStart(2, "0"),
    visits: pageVisits.filter((v) => isToday(v.created_at) && new Date(v.created_at).getHours() === h).length
  }));

  const topPages = countMap(pageVisits, (v) => v.path || "home").slice(0, 8);
  const topCountries = countMap(pageVisits, (v) => v.country || "Unknown").slice(0, 8);
  const topReferrers = countMap(pageVisits, (v) => referrerHost(v.referrer)).slice(0, 6);
  const uniqueCities = new Set(pageVisits.map(loc)).size;
  const uniqueCountries = new Set(pageVisits.map((v) => v.country || "Unknown")).size;
  const customerPack = buildCustomers(orderRows, enquiryRows);

  return {
    stats: {
      products: productRows.length,
      hidden,
      live,
      orders: orderRows.length,
      enquiries: enquiryCount,
      sales,
      bags,
      ordersToday,
      needsAttention,
      incompleteCheckouts,
      netRevenue,
      visitsToday,
      visitsTotal: pageVisits.length,
      uniqueCities,
      uniqueCountries,
      checkoutStarts: visitRows.filter((v) => v.kind === "checkout_start").length,
      checkoutCompletes: visitRows.filter((v) => v.kind === "checkout_complete").length,
      customers: customerPack.customerCount
    },
    catalogHealth: { live, hidden, visitsToday },
    orders7d: last7,
    visits14d: daySeries(14, pageVisits),
    hourlyToday: hourly,
    topPages,
    topCountries,
    topReferrers,
    checkoutFunnel: [
      { label: "Page views", count: pageVisits.length },
      { label: "Checkout started", count: visitRows.filter((v) => v.kind === "checkout_start").length },
      { label: "Checkout complete", count: visitRows.filter((v) => v.kind === "checkout_complete").length },
      { label: "Orders placed", count: orderRows.length }
    ],
    ordersByStatus,
    topCities,
    recentOrders: orderRows.slice(0, 8),
    customers: customerPack.customers,
    topSpenders: customerPack.topSpenders,
    liveVisits
  };
}
