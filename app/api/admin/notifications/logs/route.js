import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { writeAudit } from "../../../../../server/lib/logs.js";
import { resetNotificationHistory } from "../../../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const url = new URL(req.url);
    const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize") || 10)));
    const channel = url.searchParams.get("channel") || "all";
    const supabase = getSupabase();
    const { data, error } = await supabase.from("notification_logs").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    const list = (data || []).filter((r) => channel === "all" || r.channel === channel);
    const pages = Math.max(1, Math.ceil(list.length / pageSize) || 1);
    const page = Math.min(Math.max(1, Number(url.searchParams.get("page") || 1)), pages);
    const start = (page - 1) * pageSize;
    return json({
      total: list.length,
      page,
      pageSize,
      pages,
      start,
      rows: list.slice(start, start + pageSize)
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function DELETE(req) {
  try {
    requireAdmin(req);
    await resetNotificationHistory();
    writeAudit({ req, action: "delete", entity: "notification", entityId: "logs", detail: "Reset notification log and inbox" });
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
