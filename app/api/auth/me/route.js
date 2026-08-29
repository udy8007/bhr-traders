import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    const user = requireAdmin(req);
    return json({ user: { email: user.email, name: "BHR Admin", role: "admin" } });
  } catch {
    return unauthorized();
  }
}
