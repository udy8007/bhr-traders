import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { writeAudit } from "../../../../server/lib/logs.js";
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

export async function DELETE(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("enquiries").select("id");
    if (error) return json({ error: error.message }, 500);
    const rows = data || [];
    for (const row of rows) {
      const del = await supabase.from("enquiries").delete().eq("id", row.id);
      if (del.error) return json({ error: del.error.message }, 500);
    }
    writeAudit({
      req,
      action: "delete",
      entity: "enquiry",
      entityId: "all",
      detail: "Reset all enquiries (" + rows.length + ")"
    });
    return json({ ok: true, deleted: rows.length });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
