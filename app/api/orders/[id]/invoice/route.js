import { invoiceResponse } from "../../../../../server/lib/invoicePdf.js";
import { json, options } from "../../../../../server/lib/supabase.js";

export const runtime = "nodejs";

export function OPTIONS() {
  return options();
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    return await invoiceResponse(id);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
