import { loginCustomer } from "../../../../server/lib/customerAuth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabase();
    const result = await loginCustomer(supabase, body);
    return json(result);
  } catch (err) {
    return json(
      {
        error: err.message,
        code: err.code || null,
        field: err.field || null,
        attemptsRemaining: err.attemptsRemaining ?? null
      },
      err.status || 500
    );
  }
}
