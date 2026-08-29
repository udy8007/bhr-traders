import { requireAdmin, unauthorized } from "../../../../lib/auth.js";
import { snap, writeAudit } from "../../../../lib/logs.js";
import { getSupabase, json, mapProduct, options, toProductRow } from "../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Product not found" }, 404);
    return json({ product: mapProduct(data) });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function PUT(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const supabase = getSupabase();
    const prev = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    const row = toProductRow(body, id);
    delete row.id;
    const { data, error } = await supabase.from("products").update(row).eq("id", id).select().single();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Product not found" }, 404);
    writeAudit({ req, action: "update", entity: "product", entityId: id, detail: data.title, before: snap("product", prev.data), after: snap("product", data) });
    return json({ product: mapProduct(data) });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    if (typeof body.active !== "boolean") return json({ error: "active is required." }, 400);
    const supabase = getSupabase();
    const prev = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    const { data, error } = await supabase.from("products").update({ active: body.active }).eq("id", id).select().single();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Product not found" }, 404);
    writeAudit({
      req,
      action: body.active ? "activate" : "deactivate",
      entity: "product",
      entityId: id,
      detail: data.title,
      before: snap("product", prev.data),
      after: snap("product", data)
    });
    return json({ product: mapProduct(data) });
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
    const prev = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "delete", entity: "product", entityId: id, detail: prev.data?.title || "Product removed", before: snap("product", prev.data) });
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
