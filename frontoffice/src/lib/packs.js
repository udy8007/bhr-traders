export function formatInr(n) {
  const x = Number(n) || 0;
  const whole = Math.abs(x - Math.round(x)) < 0.005;
  return "₹" + x.toLocaleString("en-IN", { maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: whole ? 0 : 2 });
}

export function productPacks(p) {
  if (Array.isArray(p?.packs) && p.packs.length) {
    return p.packs.map((pack) => ({
      id: String(pack.id || pack.label || pack.kg),
      label: pack.label || pack.kg + " KG",
      kg: Number(pack.kg) || 1,
      price: Number(pack.price) || 0
    }));
  }
  const kg = 1;
  const price = Number(p?.price) || 0;
  return [{ id: "1_kg", label: "1 KG", kg, price }];
}

export function defaultPack(p) {
  const packs = productPacks(p);
  return packs.reduce((a, b) => (Number(b.kg) >= Number(a.kg) ? b : a), packs[0]);
}

export function listingPrice(p) {
  return Number(defaultPack(p).price) || Number(p?.price) || 0;
}

export function catalogPriceBounds(catalog) {
  const prices = (catalog || [])
    .flatMap((p) => productPacks(p).map((pack) => Number(pack.price) || 0))
    .filter((n) => n > 0);
  if (!prices.length) return { min: 20, max: 120, step: 10 };
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const step = high > 3000 ? 50 : 10;
  return {
    min: Math.max(step, Math.floor(low / step) * step),
    max: Math.ceil(high / step) * step,
    step
  };
}

export function cartLineId(productId, packId) {
  return String(productId) + "::" + String(packId || "pack");
}
