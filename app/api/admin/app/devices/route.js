import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { listAppDevices } from "../../../../../server/lib/appDevices.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const payload = await listAppDevices(supabase);
    return json(payload);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
