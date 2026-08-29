import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const q = String(id || "").trim().toUpperCase();
    if (!q) return json({ error: "Order ID is required." }, 400);
    const supabase = getSupabase();
    const { data: order, error } = await supabase.from("orders").select("*").eq("id", q).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!order) return json({ error: "No order found for this ID." }, 404);
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    const { payment_proof, ...safe } = order;
    return json({
      order: {
        ...safe,
        paymentAttached: Boolean(payment_proof),
        items: items || [],
        placed: new Date(order.created_at).toLocaleString()
      }
    });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
