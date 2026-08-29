import { requireAdmin, unauthorized } from "../../../../lib/auth.js";
import { snap, writeAudit } from "../../../../lib/logs.js";
import { getSupabase, json, options } from "../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

function packRow(body, id) {
  return {
    size: String(body.size || "").trim(),
    best_for: String(body.best_for || body.bestFor || ""),
    typical_use: String(body.typical_use || body.typicalUse || ""),
    buying_tip: String(body.buying_tip || body.buyingTip || ""),
    sort: Number(body.sort || 0)
  };
}

export async function PUT(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const row = packRow(body, id);
    if (!row.size) return json({ error: "Pack size is required." }, 400);
    const supabase = getSupabase();
    const prev = await supabase.from("pack_sizes").select("*").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("pack_sizes").update(row).eq("id", id).select().single();
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "update", entity: "pack", entityId: id, detail: row.size, before: snap("pack", prev.data), after: snap("pack", data) });
    return json({ pack: data });
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
    const prev = await supabase.from("pack_sizes").select("*").eq("id", id).maybeSingle();
    const { error } = await supabase.from("pack_sizes").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "delete", entity: "pack", entityId: id, detail: prev.data?.size || "Pack size removed", before: snap("pack", prev.data) });
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
