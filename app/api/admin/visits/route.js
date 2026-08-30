import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { writeAudit } from "../../../../server/lib/logs.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function DELETE(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("visits").select("id");
    if (error) return json({ error: error.message }, 500);
    const rows = data || [];
    for (const row of rows) {
      const del = await supabase.from("visits").delete().eq("id", row.id);
      if (del.error) return json({ error: del.error.message }, 500);
    }
    writeAudit({
      req,
      action: "delete",
      entity: "visit",
      entityId: "all",
      detail: "Reset all page visits (" + rows.length + ")"
    });
    return json({ ok: true, deleted: rows.length });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
