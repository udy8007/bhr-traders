import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { snap, writeAudit } from "../../../../server/lib/logs.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function PUT(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const supabase = getSupabase();
    const prev = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    const { data, error } = await supabase
      .from("categories")
      .update({ name: String(body.name || "").trim(), sort: Number(body.sort || 0) })
      .eq("id", id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "update", entity: "category", entityId: id, detail: data?.name, before: snap("category", prev.data), after: snap("category", data) });
    return json({ category: data });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const supabase = getSupabase();
    const prev = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "delete", entity: "category", entityId: id, detail: prev.data?.name || "Category removed", before: snap("category", prev.data) });
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
