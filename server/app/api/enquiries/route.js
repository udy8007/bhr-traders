import { snap, writeAudit } from "../../../lib/logs.js";
import { wrapHtml } from "../../../lib/mail.js";
import { notifyShopEvent } from "../../../lib/notify.js";
import { getSupabase, json, options } from "../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    if (!name || !phone || !email || !message) {
      return json({ error: "Name, phone, email and message are required." }, 400);
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("enquiries")
      .insert({
        id: crypto.randomUUID(),
        name,
        phone,
        email,
        company: String(body.company || ""),
        product: String(body.product || ""),
        qty: String(body.qty || ""),
        message,
        status: "Pending"
      })
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    writeAudit({ actor: email, action: "create", entity: "enquiry", entityId: data.id, detail: name + " · " + (data.product || ""), after: snap("enquiry", data) });
    const product = data.product || "General";
    await notifyShopEvent({
      event: "enquiry_placed",
      title: "New enquiry from " + name,
      body: name + " (" + phone + ") · " + product + "\n" + message,
      href: "/sales/enquiries",
      entity: "enquiry",
      entityId: data.id,
      customerEmail: email,
      customerText: "Thank you, " + name + ". We received your enquiry about " + product + " and will get back to you shortly.",
      customerHtml: wrapHtml(
        "Enquiry received",
        "<p>Thank you, " + name + ".</p><p>We received your enquiry about <strong>" + product + "</strong> and will contact you shortly.</p>"
      ),
      tags: "email,bhr"
    });
    return json({ enquiry: data }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
