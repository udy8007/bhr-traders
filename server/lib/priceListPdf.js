import { createPdfDocument } from "./pdfDoc.js";
import { findPdfLogo } from "./pdfAssets.js";
import { getSupabase, mapProduct, seedIfEmpty, SEED_PRODUCTS } from "./supabase.js";
import { istParts, pdfResponse } from "./reports.js";

const FOREST = "#143524";
const GREEN = "#1f4d32";
const GOLD = "#c4a35a";
const CREAM = "#f6f0e4";
const INK = "#1a2418";
const MUTED = "#5e6b57";
const ROW_A = "#ffffff";
const ROW_B = "#f3eee4";
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 36;

function logoFile() {
  return findPdfLogo();
}

function money(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function groupByCategory(products) {
  const map = new Map();
  products.forEach((p) => {
    const key = String(p.cat || "Rice varieties").trim() || "Rice varieties";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  });
  return [...map.entries()];
}

async function loadCatalog() {
  const supabase = getSupabase();
  const rows = await seedIfEmpty(supabase, "products", SEED_PRODUCTS, "title");
  return rows.map(mapProduct).filter((p) => p.active);
}

function paintHeader(doc, stamp, first) {
  doc.save();
  doc.rect(0, 0, PAGE_W, first ? 148 : 72).fill(FOREST);
  doc.rect(0, first ? 148 : 72, PAGE_W, 6).fill(GOLD);
  doc.rect(0, 0, 10, PAGE_H).fill(GOLD);

  const file = logoFile();
  if (file) {
    try {
      doc.image(file, 28, first ? 22 : 14, { height: first ? 54 : 36 });
    } catch {
      /* text fallback below */
    }
  }

  const left = 28 + (file ? 70 : 0);
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("WHOLESALE RICE · CHENNAI", left, first ? 26 : 18);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(first ? 22 : 14).text("BHR TRADERS", left, first ? 40 : 30);
  if (first) {
    doc.fillColor("#d7e4d4").font("Helvetica").fontSize(9).text("Premium quality rice · Competitive wholesale rates · Reliable supply", left, 68, {
      width: 340
    });
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(16).text("Price List", PAGE_W - 210, 36, { width: 174, align: "right" });
    doc.fillColor("#d7e4d4").font("Helvetica").fontSize(8).text(stamp, PAGE_W - 210, 58, { width: 174, align: "right" });
  } else {
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(10).text("Price List", PAGE_W - 210, 22, { width: 174, align: "right" });
    doc.fillColor("#d7e4d4").font("Helvetica").fontSize(7).text(stamp, PAGE_W - 210, 38, { width: 174, align: "right" });
  }
  doc.restore();
  doc.y = first ? 172 : 96;
}

function paintFooter(doc, page, total) {
  doc.save();
  doc.rect(0, PAGE_H - 48, PAGE_W, 48).fill(FOREST);
  doc.rect(0, PAGE_H - 52, PAGE_W, 4).fill(GOLD);
  doc.fillColor("#d7e4d4")
    .font("Helvetica")
    .fontSize(7)
    .text("No. 66, Kannagi Nagar, Puthagaram Road, Anna Nagar West, Chennai 600040", 24, PAGE_H - 40, { width: 390, lineBreak: false });
  doc.text("+91 99403 38654  ·  +91 99403 39654  ·  info@bhrtraders.com  ·  GSTIN 33BDJPB0270L2ZT", 24, PAGE_H - 26, {
    width: 390,
    lineBreak: false
  });
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(8).text("Page " + page + " / " + total, PAGE_W - 110, PAGE_H - 34, {
    width: 80,
    align: "right",
    lineBreak: false
  });
  doc.restore();
}

function drawIntro(doc, count) {
  const y = doc.y;
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 52, 6).fill(CREAM);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text("Current wholesale catalogue", MARGIN + 14, y + 10);
  doc.fillColor(MUTED)
    .font("Helvetica")
    .fontSize(8)
    .text(
      count +
        " active varieties. Rates are per kilogram, exclusive of GST and transport. Packing, moisture and MOQ are shown for trade planning. Prices may change with market conditions — confirm before dispatch.",
      MARGIN + 14,
      y + 26,
      { width: PAGE_W - MARGIN * 2 - 28 }
    );
  doc.y = y + 66;
}

function drawCategoryBar(doc, name, y) {
  doc.save();
  doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 22, 3).fill(GREEN);
  doc.rect(MARGIN, y, 6, 22).fill(GOLD);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10).text(name.toUpperCase(), MARGIN + 16, y + 6);
  doc.restore();
  return y + 22;
}

function drawColHeads(doc, y) {
  const cols = [
    [MARGIN, 210, "Variety"],
    [MARGIN + 210, 78, "Grain"],
    [MARGIN + 288, 92, "Packing"],
    [MARGIN + 380, 62, "MOQ"],
    [MARGIN + 442, 81, "Rate / kg"]
  ];
  doc.save();
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 18).fill("#2d5c40");
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(7.5);
  cols.forEach(([x, w, label]) => doc.text(label, x + 6, y + 5, { width: w - 10 }));
  doc.restore();
  return y + 18;
}

function rowHeight() {
  return 30;
}

function drawProductRow(doc, p, y, alt) {
  const h = rowHeight();
  doc.save();
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, h).fill(alt ? ROW_B : ROW_A);
  doc.circle(MARGIN + 14, y + 15, 3).fill(GOLD);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(clip(p.title, 38), MARGIN + 24, y + 5, { width: 186 });
  if (p.short) {
    doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(clip(p.short, 46), MARGIN + 24, y + 16, { width: 186 });
  }
  doc.fillColor(INK).font("Helvetica").fontSize(8);
  doc.text(clip(p.grain || "—", 16), MARGIN + 216, y + 11, { width: 70 });
  doc.text(clip(p.pack || "—", 18), MARGIN + 294, y + 11, { width: 86 });
  doc.text(clip(p.moq || "—", 12), MARGIN + 386, y + 11, { width: 56 });
  doc.roundedRect(MARGIN + 444, y + 7, 76, 16, 8).fill(GREEN);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8).text(money(p.price), MARGIN + 444, y + 10, { width: 76, align: "center" });
  doc.restore();
  return y + h;
}

export function buildPriceListPdf(products) {
  const ist = istParts();
  const groups = groupByCategory(products);
  const stamp = ist.stamp;

  return new Promise((resolve, reject) => {
    const doc = createPdfDocument({ size: "A4", margin: 0, bufferPages: true, info: { Title: "BHR Traders Price List", Author: "BHR Traders" } });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    paintHeader(doc, stamp, true);
    drawIntro(doc, products.length);

    let y = doc.y;
    const bottom = PAGE_H - 64;

    function newPage() {
      doc.addPage();
      paintHeader(doc, stamp, false);
      y = doc.y;
    }

    function need(h) {
      if (y + h > bottom) newPage();
    }

    if (!products.length) {
      need(40);
      doc.fillColor(MUTED).font("Helvetica").fontSize(10).text("No active products in the catalogue. Please contact BHR Traders for current rates.", MARGIN, y, {
        width: PAGE_W - MARGIN * 2
      });
    }

    groups.forEach(([cat, items]) => {
      need(48);
      y = drawCategoryBar(doc, cat, y);
      y = drawColHeads(doc, y);
      items.forEach((p, i) => {
        const h = rowHeight();
        if (y + h > bottom) {
          newPage();
          y = drawCategoryBar(doc, cat + " (continued)", y);
          y = drawColHeads(doc, y);
        }
        y = drawProductRow(doc, p, y, i % 2 === 1);
      });
      y += 12;
    });

    need(58);
    doc.roundedRect(MARGIN, y, PAGE_W - MARGIN * 2, 48, 6).fill(CREAM);
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(9).text("Trade notes", MARGIN + 14, y + 8);
    doc.fillColor(MUTED)
      .font("Helvetica")
      .fontSize(7.5)
      .text(
        "Minimum order as listed per variety. Hygienic 25 kg / 50 kg packing unless specified. Quality checked for grain length, moisture and broken percentage before dispatch. For mixed loads and export lots, write to info@bhrtraders.com or call the numbers below.",
        MARGIN + 14,
        y + 22,
        { width: PAGE_W - MARGIN * 2 - 28 }
      );

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      paintFooter(doc, i + 1, range.count);
    }
    doc.end();
  });
}

export async function makePriceListPdf() {
  const products = await loadCatalog();
  const buffer = await buildPriceListPdf(products);
  const filename = "BHR-Price-List-" + istParts().dateKey + ".pdf";
  return { buffer, filename };
}

export function priceListPdfResponse(buffer, filename) {
  return pdfResponse(buffer, filename);
}
