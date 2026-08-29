import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { listCustomers } from "../../../../server/lib/dashboard.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const [orders, enquiries] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("enquiries").select("*").order("created_at", { ascending: false })
    ]);
    const customers = listCustomers(orders.data || [], enquiries.data || []);
    return json({
      customers,
      stats: {
        total: customers.length,
        withOrders: customers.filter((c) => c.orders > 0).length,
        withEnquiries: customers.filter((c) => c.enquiries > 0).length
      }
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
