import { createClient } from "@supabase/supabase-js";
import catalog from "../../src/data/catalog.json" with { type: "json" };
import { applySchema, isMissingTableError } from "./applySchema.js";

function isRealSupabaseKey(key) {
  const k = String(key || "").trim();
  if (!k || k.includes("paste-")) return false;
  if (k.startsWith("sb_secret_") || k.startsWith("sb_publishable_") || k.startsWith("eyJ")) return true;
  return k.length > 40;
}

export function supabaseConfigured() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(process.env.SUPABASE_URL && isRealSupabaseKey(key));
}

export function getSupabase() {
  if (process.env.USE_FILE_STORE === "1") {
    return createLocalClient({
      products: SEED_PRODUCTS,
      categories: SEED_CATEGORIES,
      pack_sizes: SEED_PACKS
    });
  }
  if (!supabaseConfigured()) {
    throw new Error(
      "Supabase keys are missing. Open .env.local and paste SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY from Supabase → Project Settings → API. Local JSON (store.json) is not used unless USE_FILE_STORE=1."
    );
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
}

export async function seedIfEmpty(supabase, table, rows, orderCol) {
  async function load() {
    let query = supabase.from(table).select("*");
    if (orderCol) query = query.order(orderCol);
    return query;
  }
  let { data, error } = await load();
  if (error && isMissingTableError(error)) {
    await applySchema();
    ({ data, error } = await load());
  }
  if (error) throw new Error(error.message);
  if ((data || []).length) return data;
  if (!rows?.length) return [];
  const inserted = await supabase.from(table).insert(rows).select();
  if (inserted.error) throw new Error(inserted.error.message);
  return inserted.data || [];
}

export function json(data, status = 200) {
  if (status >= 400 && status !== 401 && data && data.error) {
    import("./logs.js")
      .then((m) =>
        m.writeError({
          message: String(data.error),
          status,
          source: "api",
          level: status >= 500 ? "error" : "warn"
        })
      )
      .catch(() => {});
  }
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
    }
  });
}

export function options() {
  return json({ ok: true });
}

export function mapProduct(row) {
  return {
    id: row.id,
    title: row.title,
    short: row.short || "",
    cat: row.cat || "",
    cats: row.cats || "",
    price: Number(row.price),
    priceLabel: row.price_label,
    img: row.img,
    desc: row.description || "",
    grain: row.grain || "",
    moisture: row.moisture || "",
    pack: row.pack || "",
    origin: row.origin || "",
    moq: row.moq || "",
    broken: row.broken || "Max 2%",
    aroma: row.aroma || "Mild, clean aroma",
    cook: row.cook || "Fluffy grains with good elongation",
    use: row.use_for || "Hotels, retail shops and wholesale supply",
    packs: Array.isArray(row.packs) ? row.packs : [],
    active: row.active !== false,
    hidden: row.active === false
  };
}

export const SEED_PRODUCTS = catalog.products;

export const SEED_CATEGORIES = catalog.categories;

export const SEED_PACKS = [
  { id: "p1", size: "500 g – 1 kg", best_for: "Trials & millets", typical_use: "Try new brands / health grains", buying_tip: "Ideal before committing to a full sack", sort: 1 },
  { id: "p2", size: "5 kg", best_for: "Small households", typical_use: "2–3 weeks everyday rice", buying_tip: "Good for premium basmati trials", sort: 2 },
  { id: "p3", size: "10 kg", best_for: "Family homes", typical_use: "Monthly kitchen stock", buying_tip: "Often best ₹/kg vs 5 kg", sort: 3 },
  { id: "p4", size: "25 – 26 kg", best_for: "Large families · messes", typical_use: "Wholesale standard in Tamil Nadu", buying_tip: "Most boiled / steam / idly SKUs", sort: 4 },
  { id: "p5", size: "30 kg", best_for: "Hotels · catering", typical_use: "Biryani basmati bags", buying_tip: "Compare aged vs new crop rates", sort: 5 },
  { id: "p6", size: "50 kg", best_for: "Retailers · bulk", typical_use: "Dhall & high-volume pulses", buying_tip: "Ask for GST invoice on wholesale", sort: 6 }
];

export function slugId(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item-" + Date.now();
}

export function toProductRow(body, id) {
  const price = Number(body.price || 0);
  let packs = body.packs;
  if (typeof packs === "string") {
    try {
      packs = JSON.parse(packs);
    } catch {
      packs = [];
    }
  }
  if (!Array.isArray(packs)) packs = [];
  packs = packs
    .map((p) => ({
      id: String(p.id || p.label || p.kg || "").trim(),
      label: String(p.label || "").trim(),
      kg: Number(p.kg) || 0,
      price: Number(p.price) || 0
    }))
    .filter((p) => p.kg > 0 && p.price > 0);
  return {
    id,
    title: String(body.title || "").trim(),
    short: String(body.short || ""),
    cat: String(body.cat || ""),
    cats: String(body.cats || body.cat || "").toLowerCase(),
    price,
    price_label: body.priceLabel || ("₹" + price.toFixed(2) + " / Kg"),
    img: body.img || "images/product-hero.jpg",
    description: body.desc || body.description || "",
    grain: body.grain || "",
    moisture: body.moisture || "",
    pack: body.pack || "",
    packs,
    origin: body.origin || "India",
    moq: body.moq || "",
    broken: body.broken || "",
    aroma: body.aroma || "",
    cook: body.cook || "",
    use_for: body.use || body.use_for || "",
    active: body.active !== false
  };
}
