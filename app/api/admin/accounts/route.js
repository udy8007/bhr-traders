import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { listCustomerAccounts } from "../../../../server/lib/customerAuth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const supabase = getSupabase();
    const accounts = await listCustomerAccounts(supabase);
    return json({ accounts });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status || 500);
  }
}
