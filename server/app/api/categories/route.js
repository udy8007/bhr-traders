import { requireAdmin, unauthorized } from "../../../lib/auth.js";
import { snap, writeAudit } from "../../../lib/logs.js";
import { getSupabase, json, options, SEED_CATEGORIES, slugId } from "../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

async function loadCategories(supabase) {
  const { data, error } = await supabase.from("categories").select("*").order("sort");
  if (error || !data?.length) {
    if (!error) {
      await supabase.from("categories").upsert(SEED_CATEGORIES, { onConflict: "id" });
    }
    return SEED_CATEGORIES;
  }
  return data;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const categories = await loadCategories(supabase);
    return json({ categories });
  } catch (err) {
    return json({ categories: SEED_CATEGORIES, warning: err.message });
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (!name) return json({ error: "Category name is required." }, 400);
    const id = slugId(body.id || name);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("categories")
      .upsert({ id, name, slug: id, sort: Number(body.sort || 99) })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "create", entity: "category", entityId: id, detail: name, after: snap("category", data) });
    return json({ category: data }, 201);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
