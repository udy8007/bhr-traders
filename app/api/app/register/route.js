import { registerAppDevice } from "../../../../server/lib/appDevices.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabase();
    const result = await registerAppDevice(supabase, body, req);
    return json(result, result.created ? 201 : 200);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
