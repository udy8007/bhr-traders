import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({
      enquiries: (data || []).map((e) => ({ ...e, status: e.status || "Pending" }))
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
