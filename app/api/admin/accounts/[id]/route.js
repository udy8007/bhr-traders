import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { unlockCustomerAccount } from "../../../../../server/lib/customerAuth.js";
import { writeAudit } from "../../../../../server/lib/logs.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function PATCH(req, { params }) {
  try {
    const admin = requireAdmin(req);
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));
    if (body.action !== "unlock") {
      return json({ error: "Unsupported action." }, 400);
    }
    const result = await unlockCustomerAccount(supabase, params.id);
    writeAudit({
      actor: admin.email || admin.sub || "admin",
      action: "unlock",
      entity: "customer",
      entityId: params.id,
      detail: "Unlocked customer account " + (result.email || params.id)
    });
    return json({ ok: true, email: result.email });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status || 500);
  }
}
