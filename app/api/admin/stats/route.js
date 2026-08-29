import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { buildDashboard } from "../../../../server/lib/dashboard.js";
import { startReportCron } from "../../../../server/lib/reportCron.js";
import { tickScheduledReports } from "../../../../server/lib/reports.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    startReportCron();
    tickScheduledReports().catch(() => {});
    const supabase = getSupabase();
    const [products, orders, enquiries, items, visits] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("qty,price"),
      supabase.from("visits").select("*").order("created_at", { ascending: false })
    ]);
    const payload = buildDashboard(
      products.data || [],
      orders.data || [],
      enquiries.data || [],
      items.data || [],
      visits.error ? [] : visits.data || []
    );
    return json(payload);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
