import { requireCustomer } from "../../../../server/lib/customerAuth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

function stars(n) {
  const r = Math.max(1, Math.min(5, Number(n) || 5));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function mapReview(row) {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title || "",
    orderId: row.order_id || "",
    rating: Number(row.rating || 5),
    stars: stars(row.rating),
    comment: row.comment,
    created_at: row.created_at
  };
}

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    const auth = requireCustomer(req);
    const supabase = getSupabase();
    const { data: customer } = await supabase.from("customers").select("email").eq("id", auth.sub).maybeSingle();
    const email = String(customer?.email || auth.email || "").toLowerCase();

    let orders = [];
    const byCustomer = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", auth.sub)
      .order("created_at", { ascending: false });
    if (!byCustomer.error) orders = byCustomer.data || [];

    if (email) {
      const byEmail = await supabase.from("orders").select("*").ilike("email", email).order("created_at", { ascending: false });
      if (!byEmail.error) {
        const seen = new Set(orders.map((o) => o.id));
        for (const o of byEmail.data || []) {
          if (!seen.has(o.id)) orders.push(o);
        }
      }
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const orderIds = orders.map((o) => o.id);
    let items = [];
    if (orderIds.length) {
      const { data: itemRows } = await supabase.from("order_items").select("*").in("order_id", orderIds);
      items = itemRows || [];
    }

    let reviews = [];
    if (orderIds.length) {
      const { data: reviewRows } = await supabase.from("product_reviews").select("*").in("order_id", orderIds);
      reviews = (reviewRows || []).map(mapReview);
    }

    const reviewKey = (orderId, productId) => orderId + "::" + productId;
    const reviewed = new Set(reviews.map((r) => reviewKey(r.orderId, r.productId)));

    const productIds = [
      ...new Set(items.map((i) => String(i.product_id || "").split("::")[0]).filter(Boolean))
    ];
    const productImgs = {};
    if (productIds.length) {
      const { data: products } = await supabase.from("products").select("id, img").in("id", productIds);
      for (const p of products || []) {
        productImgs[p.id] = p.img || "";
      }
    }

    const mapped = orders.map((order) => {
      const orderItems = items
        .filter((i) => i.order_id === order.id)
        .map((i) => {
          const productId = String(i.product_id || "").split("::")[0];
          return {
            productId,
            title: i.title,
            qty: i.qty,
            price: i.price,
            img: productImgs[productId] || "",
            reviewed: reviewed.has(reviewKey(order.id, productId))
          };
        });
      return {
        id: order.id,
        status: order.status,
        status_note: order.status_note || "",
        cancel_remark: order.cancel_remark || "",
        total: order.total,
        pay: order.pay,
        created_at: order.created_at,
        address: order.address,
        city: order.city,
        pincode: order.pincode,
        items: orderItems,
        canReview: !/cancelled/i.test(String(order.status || ""))
      };
    });

    return json({ orders: mapped, reviews });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}

export async function POST(req) {
  try {
    const auth = requireCustomer(req);
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || body.order_id || "").trim().toUpperCase();
    const productId = String(body.productId || body.product_id || "").trim();
    const productTitle = String(body.productTitle || body.product_title || "").trim();
    const comment = String(body.comment || "").trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating || 5)));
    if (!orderId || !productId || !comment) {
      return json({ error: "Order, product and comment are required." }, 400);
    }

    const supabase = getSupabase();
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return json({ error: "Order not found." }, 404);
    if (order.customer_id && order.customer_id !== auth.sub) {
      return json({ error: "This order does not belong to your account." }, 403);
    }
    if (!order.customer_id) {
      const { data: customer } = await supabase.from("customers").select("email").eq("id", auth.sub).maybeSingle();
      if (String(order.email || "").toLowerCase() !== String(customer?.email || auth.email || "").toLowerCase()) {
        return json({ error: "This order does not belong to your account." }, 403);
      }
    }
    if (/cancelled/i.test(String(order.status || ""))) {
      return json({ error: "Cancelled orders cannot be reviewed." }, 400);
    }

    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    const bought = (items || []).some((item) => {
      const pid = String(item.product_id || "").split("::")[0];
      return pid === productId;
    });
    if (!bought) return json({ error: "This product is not in that order." }, 403);

    const { data: existing } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("order_id", orderId);
    if (existing?.length) return json({ error: "You already reviewed this item." }, 409);

    const { data: customerRow } = await supabase.from("customers").select("*").eq("id", auth.sub).maybeSingle();
    const row = {
      id: "rv-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
      product_id: productId,
      product_title: productTitle,
      name: customerRow?.name || order.name || "Customer",
      city: customerRow?.city || order.city || "",
      phone: customerRow?.phone || order.phone,
      order_id: orderId,
      customer_id: auth.sub,
      rating,
      comment,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from("product_reviews").insert(row).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ review: mapReview(data || row) }, 201);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
