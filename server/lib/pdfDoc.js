import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fonts");
const REGULAR = path.join(DIR, "sans-regular.ttf");
const BOLD = path.join(DIR, "sans-bold.ttf");

/** Standard names so existing .font("Helvetica") calls keep working on Vercel. */
export function createPdfDocument(options = {}) {
  const doc = new PDFDocument({ ...options, font: null });
  doc.registerFont("Helvetica", REGULAR);
  doc.registerFont("Helvetica-Bold", BOLD);
  doc.font("Helvetica");
  return doc;
}
