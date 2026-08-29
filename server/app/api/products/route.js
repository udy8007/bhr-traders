import { getToken, requireAdmin, unauthorized, verifyToken } from "../../../lib/auth.js";
import { snap, writeAudit } from "../../../lib/logs.js";
import { getSupabase, json, mapProduct, options, SEED_PRODUCTS, slugId, toProductRow } from "../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("products").select("*").order("title");
    if (error) return json({ error: error.message }, 500);
    let rows = data;
    if (!rows?.length) {
      const seeded = await supabase.from("products").upsert(SEED_PRODUCTS, { onConflict: "id" }).select();
      if (seeded.error) return json({ error: seeded.error.message }, 500);
      rows = seeded.data || [];
    }
    const admin = Boolean(verifyToken(getToken(req))?.email);
    const products = rows.map(mapProduct).filter((p) => admin || p.active);
    return json({ products });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json();
    if (!String(body.title || "").trim()) return json({ error: "Product title is required." }, 400);
    const id = slugId(body.id || body.title);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("products").insert(toProductRow(body, id)).select().single();
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "create", entity: "product", entityId: id, detail: data.title, after: snap("product", data) });
    return json({ product: mapProduct(data) }, 201);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
