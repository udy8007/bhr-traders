import catalog from "./catalog.json";

export const PRODUCTS = catalog.products.map((row) => ({
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
  packs: row.packs || [],
  origin: row.origin || "",
  moq: row.moq || "",
  broken: row.broken || "",
  aroma: row.aroma || "",
  cook: row.cook || "",
  use: row.use_for || "",
  active: row.active !== false
}));

export const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
