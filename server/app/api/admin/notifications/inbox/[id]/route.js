import { requireAdmin, unauthorized } from "../../../../../../lib/auth.js";
import { getSupabase, json, options } from "../../../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function PATCH(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("admin_inbox").update({ read: true }).eq("id", String(id)).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ item: data });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
