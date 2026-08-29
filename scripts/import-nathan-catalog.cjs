const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.join(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "images", "catalog");
const SRC = path.join(ROOT, "src");
const STORE = path.join(ROOT, "server", "data", "store.json");
const RAW = path.join(process.env.TEMP, "nt-products.json");

const CAT_META = {
  "Boiled Rice": {
    id: "boiled",
    grain: "Medium grain",
    moisture: "13–14%",
    aroma: "Mild, clean aroma",
    cook: "Firm, separate grains after cooking",
    use_for: "Everyday meals, hotels and canteens"
  },
  "Raw Rice": {
    id: "raw",
    grain: "Medium grain",
    moisture: "13%",
    aroma: "Mild, clean aroma",
    cook: "Softer bite, quicker cooking",
    use_for: "Tiffin meals, mixed rice and home kitchens"
  },
  "Steam Rice": {
    id: "steam",
    grain: "Long grain",
    moisture: "12–13%",
    aroma: "Mild steam-rice aroma",
    cook: "Non-sticky with good elongation",
    use_for: "Catering, packing and wholesale supply"
  },
  "Idly Rice": {
    id: "idly",
    grain: "Short to medium grain",
    moisture: "13–14%",
    aroma: "Clean milling aroma",
    cook: "Ferments well for batter",
    use_for: "Idly, dosa and hotel batter programs"
  },
  "Biriyani Rice": {
    id: "biriyani",
    grain: "Extra long grain",
    moisture: "12%",
    aroma: "Rich biryani aroma",
    cook: "Extra elongation, separate grains",
    use_for: "Biryani, fried rice and hotel kitchens"
  },
  "Broken Rice": {
    id: "broken",
    grain: "Broken grain",
    moisture: "13–14%",
    aroma: "Mild, clean aroma",
    cook: "Soft texture for porridge and mixes",
    use_for: "Value packs, kanji and bulk kitchens"
  },
  Millets: {
    id: "millets",
    grain: "Whole millet grain",
    moisture: "12–13%",
    aroma: "Earthy millet aroma",
    cook: "Nutty, wholesome texture",
    use_for: "Health meals and millet mixes"
  },
  Dhall: {
    id: "dhall",
    grain: "Split pulse",
    moisture: "12%",
    aroma: "Fresh dhall aroma",
    cook: "Cooks evenly for sambar and dals",
    use_for: "Kitchen packs and wholesale pulses"
  }
};

function slugId(title) {
  return (
    String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function kgFromKey(key, fallback) {
  if (/half/i.test(key)) return 0.5;
  const m = String(key).match(/^(\d+(?:\.\d+)?)_([a-z]+)$/i);
  if (m && /^kg/i.test(m[2])) return Number(m[1]);
  if (m && /^g$/i.test(m[2])) return Number(m[1]) / 1000;
  return fallback;
}

function displayLabel(kg) {
  if (kg === 0.5) return "0.5 KG";
  if (kg > 0 && kg < 1) return Math.round(kg * 1000) + " G";
  const n = Number.isInteger(kg) ? String(kg) : String(kg);
  return n + " KG";
}

function formatInr(n) {
  const x = Number(n) || 0;
  const whole = Math.abs(x - Math.round(x)) < 0.005;
  return "₹" + x.toLocaleString("en-IN", { maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: whole ? 0 : 2 });
}

function variantInfo(row) {
  const variants = row.variants && typeof row.variants === "object" ? row.variants : {};
  const enabled = Object.entries(variants).filter(([, v]) => v && v.enabled !== false && Number(v.price) > 0);
  const fallbackKg = Number(row.pack_size) || 1;
  const fallbackPrice = Number(row.price) || 0;
  let options = enabled.map(([key, v]) => {
    const kg = kgFromKey(key, fallbackKg) || 1;
    const price = Number(v.price);
    return { key, kg, price, perKg: price / kg };
  });
  if (!options.length && fallbackPrice > 0) {
    options = [
      {
        key: "pack",
        kg: fallbackKg,
        price: fallbackPrice,
        perKg: fallbackPrice / fallbackKg
      }
    ];
  }
  options.sort((a, b) => a.kg - b.kg);
  const packs = options.map((o) => ({
    id: o.key,
    label: displayLabel(o.kg),
    kg: o.kg,
    price: o.price
  }));
  const cheapest = [...options].sort((a, b) => a.perKg - b.perKg)[0] || { kg: 1, price: 0, perKg: 0 };
  const largest = options[options.length - 1] || cheapest;
  const pack = packs.map((p) => p.label).join(" / ") + (packs.length ? " packs" : "");
  return { cheapest, largest, packs, pack: pack || displayLabel(fallbackKg) + " packs" };
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(dest, () => {});
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error("HTTP " + res.statusCode));
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
    });
    req.on("error", (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const rows = JSON.parse(fs.readFileSync(RAW, "utf8")).filter((p) => p.is_active !== false);
  rows.sort((a, b) => {
    if (Boolean(b.is_bestseller) !== Boolean(a.is_bestseller)) return b.is_bestseller ? 1 : -1;
    return (Number(a.display_order) || 0) - (Number(b.display_order) || 0) || String(a.name).localeCompare(b.name);
  });

  const used = new Set();
  const planned = rows.map((row) => {
    const catName = row.category || "Boiled Rice";
    let id = slugId(row.name + " " + catName);
    let n = 2;
    while (used.has(id)) {
      id = slugId(row.name + " " + catName + " " + n++);
    }
    used.add(id);
    return { row, id, catName };
  });
  const products = [];

  await mapLimit(planned, 6, async ({ row, id, catName }) => {
    const meta = CAT_META[catName] || CAT_META["Boiled Rice"];

    const { cheapest, largest, packs, pack } = variantInfo(row);
    const perKg = Math.round(cheapest.perKg * 100) / 100;
    const plain = stripHtml(row.description);
    const short = (plain || catName + " from wholesale supply").slice(0, 90);
    const title = String(row.name || "").trim();
    const desc =
      title +
      " is a " +
      catName.toLowerCase() +
      " variety" +
      (plain ? " (" + plain + ")" : "") +
      ". Available in " +
      pack.replace(/ packs$/, "") +
      ". Sourced for wholesale and retail supply in Chennai.";

    let img = "images/product-hero.jpg";
    const srcUrl = row.image_url || (Array.isArray(row.image_urls) ? row.image_urls[0] : "");
    if (srcUrl) {
      const ext = path.extname(new URL(srcUrl).pathname) || ".png";
      const localRel = "images/catalog/" + id + ext;
      const dest = path.join(ROOT, "public", localRel);
      try {
        if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
          await download(srcUrl, dest);
        }
        img = localRel;
      } catch (err) {
        console.warn("img fail", title, err.message);
        img = srcUrl;
      }
    }

    products.push({
      id,
      title,
      short,
      cat: catName,
      cats: meta.id,
      price: perKg,
      price_label: formatInr(largest.price) + " / " + displayLabel(largest.kg),
      img,
      description: desc,
      grain: meta.grain,
      moisture: meta.moisture,
      pack,
      packs,
      origin: "India",
      moq: "1 bag",
      broken: catName === "Broken Rice" ? "Broken grain" : "Max 2%",
      aroma: meta.aroma,
      cook: meta.cook,
      use_for: meta.use_for,
      active: true
    });
    process.stdout.write(".");
  });

  products.sort((a, b) => a.title.localeCompare(b.title));

  const categories = [
    { id: "boiled", name: "Boiled Rice", slug: "boiled", sort: 1 },
    { id: "raw", name: "Raw Rice", slug: "raw", sort: 2 },
    { id: "steam", name: "Steam Rice", slug: "steam", sort: 3 },
    { id: "idly", name: "Idly Rice", slug: "idly", sort: 4 },
    { id: "biriyani", name: "Biriyani Rice", slug: "biriyani", sort: 5 },
    { id: "broken", name: "Broken Rice", slug: "broken", sort: 6 },
    { id: "millets", name: "Millets", slug: "millets", sort: 7 },
    { id: "dhall", name: "Dhall", slug: "dhall", sort: 8 }
  ];

  const catalog = { products, categories };
  fs.writeFileSync(path.join(SRC, "data", "catalog.json"), JSON.stringify(catalog, null, 2));
  fs.writeFileSync(path.join(ROOT, "server", "data", "catalog.json"), JSON.stringify(catalog, null, 2));

  const js = `import catalog from "./catalog.json";

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
`;
  fs.writeFileSync(path.join(SRC, "data", "products.js"), js);

  const store = JSON.parse(fs.readFileSync(STORE, "utf8"));
  store.products = products;
  store.categories = categories;
  fs.writeFileSync(STORE, JSON.stringify(store, null, 2));

  console.log("\nimported", products.length, "products");
  console.log("price range", Math.min(...products.map((p) => p.price)), Math.max(...products.map((p) => p.price)));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
