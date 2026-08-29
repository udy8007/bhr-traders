import { requireAdmin, unauthorized } from "../../../server/lib/auth.js";
import { snap, writeAudit } from "../../../server/lib/logs.js";
import { getSupabase, json, options, seedIfEmpty, SEED_PACKS } from "../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const packs = await seedIfEmpty(supabase, "pack_sizes", SEED_PACKS, "sort");
    return json({ packs });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json();
    const supabase = getSupabase();
    const row = {
      id: body.id || "p-" + Date.now(),
      size: String(body.size || "").trim(),
      best_for: String(body.best_for || body.bestFor || ""),
      typical_use: String(body.typical_use || body.typicalUse || ""),
      buying_tip: String(body.buying_tip || body.buyingTip || ""),
      sort: Number(body.sort || 99)
    };
    if (!row.size) return json({ error: "Pack size is required." }, 400);
    const { data, error } = await supabase.from("pack_sizes").upsert(row).select().single();
    if (error) return json({ error: error.message }, 500);
    writeAudit({ req, action: "create", entity: "pack", entityId: row.id, detail: row.size, after: snap("pack", data) });
    return json({ pack: data }, 201);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
