import { adminEmail, adminPassword, passwordsMatch, requireAdmin, setAdminPassword, unauthorized } from "../../../../server/lib/auth.js";
import { writeAudit } from "../../../../server/lib/logs.js";
import { json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const user = requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    if (!passwordsMatch(currentPassword, adminPassword())) {
      return json({ error: "Current password is incorrect." }, 400);
    }
    if (newPassword.length < 8) {
      return json({ error: "New password must be at least 8 characters." }, 400);
    }
    if (passwordsMatch(newPassword, currentPassword)) {
      return json({ error: "New password must be different from the current password." }, 400);
    }
    setAdminPassword(newPassword);
    writeAudit({
      actor: user.email || adminEmail(),
      action: "update",
      entity: "auth",
      detail: "Admin password changed",
      before: { session: "signed_in" },
      after: { session: "password_changed" }
    });
    return json({ ok: true });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
