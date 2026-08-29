import { requireAdmin, unauthorized } from "../../../../lib/auth.js";
import { summarizeAudits, summarizeErrors } from "../../../../lib/logs.js";
import { getSupabase, json, options } from "../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") || "all";
    const page = url.searchParams.get("page") || "1";
    const pageSize = url.searchParams.get("pageSize") || "10";
    const entity = url.searchParams.get("entity") || "all";
    const level = url.searchParams.get("level") || "all";
    const supabase = getSupabase();
    const [errors, audits] = await Promise.all([
      supabase.from("error_logs").select("*").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false })
    ]);
    const errorRows = errors.error ? [] : errors.data || [];
    const auditRows = audits.error ? [] : audits.data || [];
    const errorOpts = { page, pageSize, level };
    const auditOpts = { page, pageSize, entity };
    if (kind === "error") return json(summarizeErrors(errorRows, errorOpts));
    if (kind === "audit") return json(summarizeAudits(auditRows, auditOpts));
    return json({
      errors: summarizeErrors(errorRows, errorOpts),
      audits: summarizeAudits(auditRows, auditOpts)
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
