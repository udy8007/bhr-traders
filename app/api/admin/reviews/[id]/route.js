import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function DELETE(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const supabase = getSupabase();
    const { error } = await supabase.from("product_reviews").delete().eq("id", String(id));
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
