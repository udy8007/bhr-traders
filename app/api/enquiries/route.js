import { snap, writeAudit } from "../../../server/lib/logs.js";
import { escapeHtml, mailFacts, wrapHtml } from "../../../server/lib/mail.js";
import { queueShopEvent } from "../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../server/lib/supabase.js";

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
    const qty = String(data.qty || "").trim();
    const company = String(data.company || "").trim();
    const adminLines = ["Name: " + name, "Phone: " + phone, "Email: " + email];
    if (company) adminLines.push("Company: " + company);
    adminLines.push("Product: " + product);
    if (qty) adminLines.push("Quantity: " + qty);
    adminLines.push("", "Message:", message);
    queueShopEvent({
      event: "enquiry_placed",
      title: "New enquiry from " + name,
      body: adminLines.join("\n"),
      adminHtml:
        mailFacts([
          { label: "Name", value: name },
          { label: "Phone", value: phone },
          { label: "Email", value: email },
          { label: "Company", value: company },
          { label: "Product", value: product },
          { label: "Quantity", value: qty }
        ]) +
        '<p style="margin:16px 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b08d3e;font-family:Arial,Helvetica,sans-serif">Message</p>' +
        '<p style="margin:0;white-space:pre-wrap">' +
        escapeHtml(message).replace(/\n/g, "<br/>") +
        "</p>",
      href: "/sales/enquiries?id=" + encodeURIComponent(data.id),
      entity: "enquiry",
      entityId: data.id,
      customerEmail: email,
      customerText: "Thank you, " + name + ". We received your enquiry about " + product + " and will get back to you shortly.",
      customerHtml: wrapHtml(
        "Enquiry received",
        "<p style=\"margin:0 0 16px\">Thank you, " +
          escapeHtml(name) +
          ". We have your message and will get back to you shortly.</p>" +
          mailFacts([
            { label: "Product", value: product },
            { label: "Quantity", value: qty },
            { label: "Company", value: company }
          ]),
        { kicker: "Wholesale enquiry", preheader: "We received your enquiry about " + product }
      ),
      tags: "email,bhr",
      priority: "high"
    });
    return json({ enquiry: data }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
