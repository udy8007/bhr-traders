import { makePriceListPdf, priceListPdfResponse } from "../../../server/lib/priceListPdf.js";
import { json, options } from "../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET() {
  try {
    const { buffer, filename } = await makePriceListPdf();
    return priceListPdfResponse(buffer, filename);
  } catch (err) {
    return json({ error: err.message || "Could not build the price list." }, 500);
  }
}
