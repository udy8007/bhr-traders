import { getSupabase, json, options } from "../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

function stars(n) {
  const r = Math.max(1, Math.min(5, Number(n) || 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function phoneKey(v) {
  const d = String(v || "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : d;
}

function itemIsProduct(item, productId, productTitle) {
  const pid = String(item.product_id || "");
  if (pid && pid === productId) return true;
  if (pid && pid.startsWith(productId + "::")) return true;
  const title = String(item.title || "").toLowerCase();
  const want = String(productTitle || "").toLowerCase().trim();
  if (want && (title === want || title.startsWith(want + " —") || title.startsWith(want + " -") || title.startsWith(want + " ·"))) {
    return true;
  }
  return false;
}

function mapReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title || "",
    name: row.name,
    city: row.city || "",
    rating: Number(row.rating || 5),
    stars: stars(row.rating),
    comment: row.comment,
    verified: Boolean(row.order_id),
    created_at: row.created_at
  };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const productId = String(url.searchParams.get("product_id") || "").trim();
    const supabase = getSupabase();
    const { data, error } = await supabase.from("product_reviews").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    let rows = (data || []).map(mapReview);
    if (productId) rows = rows.filter((r) => r.productId === productId);
    const avg = rows.length ? rows.reduce((n, r) => n + r.rating, 0) / rows.length : 0;
    return json({ reviews: rows, average: Math.round(avg * 10) / 10, count: rows.length });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId || body.product_id || "").trim();
    const productTitle = String(body.productTitle || body.product_title || "").trim();
    const orderId = String(body.orderId || body.order_id || "").trim().toUpperCase();
    const phone = String(body.phone || "").trim();
    const nameIn = String(body.name || "").trim();
    const city = String(body.city || "").trim();
    const comment = String(body.comment || body.text || "").trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
    if (!productId) return json({ error: "Product is required." }, 400);
    if (!orderId) return json({ error: "Order ID is required to post a review." }, 400);
    if (!phone) return json({ error: "Phone number used on the order is required." }, 400);
    if (!comment) return json({ error: "Please write a comment." }, 400);

    const supabase = getSupabase();
    const { data: order, error: orderErr } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (orderErr) return json({ error: orderErr.message }, 500);
    if (!order) return json({ error: "No order found for this ID." }, 404);
    if (/cancelled/i.test(String(order.status || ""))) {
      return json({ error: "Cancelled orders cannot be reviewed." }, 400);
    }
    if (phoneKey(order.phone) !== phoneKey(phone)) {
      return json({ error: "Phone number does not match this order." }, 403);
    }

    const { data: items, error: itemErr } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    if (itemErr) return json({ error: itemErr.message }, 500);
    const bought = (items || []).some((item) => itemIsProduct(item, productId, productTitle));
    if (!bought) return json({ error: "This order does not include this product." }, 403);

    const { data: existing } = await supabase.from("product_reviews").select("id").eq("product_id", productId).eq("order_id", order.id);
    if (existing?.length) return json({ error: "You already reviewed this product for this order." }, 409);

    const name = nameIn || String(order.name || "").trim();
    if (!name) return json({ error: "Your name is required." }, 400);

    const row = {
      id: "rv-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
      product_id: productId,
      product_title: productTitle,
      name,
      city: city || String(order.city || ""),
      phone: order.phone,
      order_id: order.id,
      rating,
      comment,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("product_reviews").insert(row).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ review: mapReview(data || row) }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
