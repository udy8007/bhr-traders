import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { snap, writeAudit } from "../../../../../server/lib/logs.js";
import { escapeHtml, mailFacts, wrapHtml } from "../../../../../server/lib/mail.js";
import { notifyShopEvent } from "../../../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

const STATUSES = ["Pending", "Resolved"];

export function OPTIONS() {
  return options();
}

export async function PATCH(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const status = String(body.status || "").trim();
    if (!STATUSES.includes(status)) return json({ error: "Invalid enquiry status." }, 400);
    const supabase = getSupabase();
    const prev = await supabase.from("enquiries").select("*").eq("id", String(id)).maybeSingle();
    const { data, error } = await supabase
      .from("enquiries")
      .update({ status })
      .eq("id", String(id))
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Enquiry not found." }, 404);
    writeAudit({ req, action: "status", entity: "enquiry", entityId: String(id), detail: status, before: snap("enquiry", prev.data), after: snap("enquiry", data) });
    const becameResolved = status === "Resolved" && (prev.data?.status || "Pending") !== "Resolved";
    if (becameResolved && data.email) {
      const name = String(data.name || "there").trim() || "there";
      const product = String(data.product || "your rice requirement").trim();
      const qty = String(data.qty || "").trim();
      const company = String(data.company || "").trim();
      const message = String(data.message || "").trim();
      const customerText = [
        "Hello " + name + ",",
        "",
        "Thank you for contacting BHR Traders. We have reviewed your wholesale enquiry and marked it as resolved.",
        "",
        "Product: " + product,
        qty ? "Quantity: " + qty : "",
        company ? "Company: " + company : "",
        message ? "Your message: " + message : "",
        "",
        "If you would like to place an order or need a revised quote, reply to this email or call +91 99403 38654 / +91 99403 39654.",
        "",
        "Warm regards,",
        "BHR Traders",
        "Wholesale rice · Chennai"
      ]
        .filter((line, i, all) => line !== "" || (all[i + 1] && all[i + 1] !== ""))
        .join("\n");
      await notifyShopEvent({
        event: "enquiry_resolved",
        title: "Your enquiry has been resolved",
        body: customerText,
        skipAdmin: true,
        href: "/sales/enquiries?id=" + encodeURIComponent(String(id)),
        entity: "enquiry",
        entityId: String(id),
        customerEmail: data.email,
        customerText,
        customerHtml: wrapHtml(
          "Your enquiry has been resolved",
          "<p style=\"margin:0 0 14px\">Hello " +
            escapeHtml(name) +
            ",</p>" +
            "<p style=\"margin:0 0 14px\">Thank you for contacting BHR Traders. We have reviewed your wholesale rice enquiry and marked it as <strong>resolved</strong>.</p>" +
            "<p style=\"margin:0 0 18px\">Our team has noted your requirement. If you would like to place an order or need a revised quote, reply to this email or call us.</p>" +
            mailFacts([
              { label: "Name", value: data.name },
              { label: "Product", value: product },
              { label: "Quantity", value: qty },
              { label: "Company", value: company },
              { label: "Status", value: "Resolved" }
            ]) +
            (message
              ? '<p style="margin:16px 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b08d3e;font-family:Arial,Helvetica,sans-serif">Your message</p>' +
                '<p style="margin:0 0 18px;white-space:pre-wrap">' +
                escapeHtml(message).replace(/\n/g, "<br/>") +
                "</p>"
              : "") +
            "<p style=\"margin:18px 0 0\">Warm regards,<br/>BHR Traders<br/>Wholesale rice · Chennai</p>",
          {
            kicker: "Enquiry resolved",
            preheader: "We have resolved your enquiry about " + product
          }
        ),
        tags: "email,bhr"
      });
    }
    return json({ enquiry: { ...data, status: data.status || "Pending" }, mailed: Boolean(becameResolved && data.email) });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
