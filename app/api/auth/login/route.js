import { adminEmail, adminPassword, signToken } from "../../../../server/lib/auth.js";
import { writeAudit } from "../../../../server/lib/logs.js";
import { json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (email !== adminEmail().toLowerCase() || password !== adminPassword()) {
      writeAudit({ actor: email || "unknown", action: "login_failed", entity: "auth", detail: "Invalid email or password", before: { session: "signed_out" }, after: { session: "rejected" } });
      return json({ error: "Invalid email or password." }, 401);
    }
    const token = signToken({
      email: adminEmail(),
      role: "admin",
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    writeAudit({ actor: adminEmail(), action: "login", entity: "auth", detail: "Admin signed in", before: { session: "signed_out" }, after: { session: "signed_in" } });
    return json({ token, user: { email: adminEmail(), name: "BHR Admin", role: "admin" } });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
