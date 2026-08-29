import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { getNotifyConfig, saveNotifyConfig } from "../../../../../server/lib/notify.js";
import { json, options } from "../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const config = await getNotifyConfig();
    return json({ config });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function PUT(req) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const config = await saveNotifyConfig(body);
    return json({ config });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
