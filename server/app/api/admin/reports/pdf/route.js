import { requireAdmin, unauthorized } from "../../../../../lib/auth.js";
import { startReportCron } from "../../../../../lib/reportCron.js";
import { makeReportPdf, pdfResponse } from "../../../../../lib/reports.js";
import { json, options } from "../../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    startReportCron();
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") || "overall";
    const category = url.searchParams.get("category") || "";
    const { buffer, filename } = await makeReportPdf(kind, category);
    return pdfResponse(buffer, filename);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status === 400 ? 400 : 500);
  }
}
