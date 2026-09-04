import { requestAccountUnlock } from "../../../../server/lib/customerAuth.js";
import { writeAudit } from "../../../../server/lib/logs.js";
import { escapeHtml } from "../../../../server/lib/mail.js";
import { queueShopEvent } from "../../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = getSupabase();
    const result = await requestAccountUnlock(supabase, body);
    const customer = result.customer || {};
    const name = String(body.name || customer.name || "Customer").trim();
    const phone = String(body.phone || customer.phone || "").trim();
    const email = String(body.email || customer.email || "").trim();
    const note = String(body.message || "").trim() || "Customer account locked after failed sign-in attempts.";

    if (supabase) {
      await supabase.from("enquiries").insert({
        id: crypto.randomUUID(),
        name,
        phone: phone || "—",
        email,
        company: "",
        product: "Account unlock",
        qty: "",
        message: note,
        status: "Pending"
      });

      queueShopEvent({
        event: "account_unlock_request",
        title: "Account unlock request — " + email,
        body: ["Name: " + name, "Email: " + email, phone ? "Phone: " + phone : "", "", note].filter(Boolean).join("\n"),
        adminHtml:
          "<p><strong>Account unlock request</strong></p>" +
          "<p>Email: " + escapeHtml(email) + "<br/>Name: " + escapeHtml(name) +
          (phone ? "<br/>Phone: " + escapeHtml(phone) : "") +
          "</p><p>" + escapeHtml(note) + "</p>",
        href: "/sales/accounts",
        entity: "customer",
        entityId: customer.id,
        priority: "high",
        skipCustomerEmail: true
      });

      writeAudit({
        actor: email,
        action: "unlock_request",
        entity: "customer",
        entityId: customer.id,
        detail: "Account unlock requested after lockout"
      });
    }

    return json({ ok: true, message: result.message });
  } catch (err) {
    return json({ error: err.message, code: err.code || null, field: err.field || null }, err.status || 500);
  }
}
