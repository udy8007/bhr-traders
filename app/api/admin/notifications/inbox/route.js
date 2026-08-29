import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { clearAdminInbox, ingestNtfyMessage, markAdminInboxRead, syncNtfyInbox } from "../../../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    await syncNtfyInbox().catch(() => {});
    const supabase = getSupabase();
    const { data, error } = await supabase.from("admin_inbox").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    const rows = (data || []).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return json({
      unread: rows.filter((r) => r.read !== true && r.read !== "true").length,
      rows: rows.slice(0, 40)
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    await ingestNtfyMessage(body);
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function PATCH(req) {
  try {
    requireAdmin(req);
    await markAdminInboxRead();
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function DELETE(req) {
  try {
    requireAdmin(req);
    await clearAdminInbox();
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
