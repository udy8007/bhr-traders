import { heartbeatAppDevice } from "../../../../server/lib/appDevices.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabase();
    const result = await heartbeatAppDevice(supabase, body);
    return json(result);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
