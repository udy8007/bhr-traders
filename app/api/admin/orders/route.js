import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    const { data: items } = await supabase.from("order_items").select("*");
    const grouped = {};
    (items || []).forEach((i) => {
      grouped[i.order_id] = grouped[i.order_id] || [];
      grouped[i.order_id].push(i);
    });
    return json({
      orders: (orders || []).map((o) => {
        const { payment_proof, ...safe } = o;
        return { ...safe, paymentAttached: Boolean(payment_proof), items: grouped[o.id] || [] };
      })
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
