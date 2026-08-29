import PDFDocument from "pdfkit";
import { readPdfFont } from "./pdfAssets.js";

let regular;
let bold;

function fonts() {
  if (!regular) {
    regular = readPdfFont("sans-regular.ttf");
    bold = readPdfFont("sans-bold.ttf");
  }
  return { regular, bold };
}

/** Standard names so existing .font("Helvetica") calls keep working on Vercel. */
export function createPdfDocument(options = {}) {
  const { regular: regularFont, bold: boldFont } = fonts();
  const doc = new PDFDocument({ ...options, font: null });
  doc.registerFont("Helvetica", regularFont);
  doc.registerFont("Helvetica-Bold", boldFont);
  doc.font("Helvetica");
  return doc;
}
