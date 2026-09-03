import { changeCustomerPassword, requireCustomer } from "../../../../server/lib/customerAuth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const auth = requireCustomer(req);
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabase();
    const result = await changeCustomerPassword(
      supabase,
      auth.sub,
      body.currentPassword || body.current_password,
      body.newPassword || body.new_password
    );
    return json(result);
  } catch (err) {
    return json({ error: err.message, field: err.field }, err.status || 500);
  }
}
