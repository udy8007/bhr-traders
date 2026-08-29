import { requireAdmin, unauthorized } from "../../../../../lib/auth.js";
import { snap, writeAudit } from "../../../../../lib/logs.js";
import { wrapHtml } from "../../../../../lib/mail.js";
import { notifyShopEvent } from "../../../../../lib/notify.js";
import { getSupabase, json, options } from "../../../../../lib/supabase.js";

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
    await notifyShopEvent({
      event: "enquiry_status",
      title: "Enquiry " + status.toLowerCase(),
      body: (data.name || "") + " · " + (data.product || "Enquiry") + " is now " + status,
      href: "/sales/enquiries",
      entity: "enquiry",
      entityId: String(id),
      customerEmail: data.email,
      customerText: "Hello " + (data.name || "") + ", your enquiry is now marked " + status + ".",
      customerHtml: wrapHtml(
        "Enquiry update",
        "<p>Hello " + (data.name || "") + ",</p><p>Your enquiry is now marked <strong>" + status + "</strong>.</p>"
      ),
      tags: "email,bhr"
    });
    return json({ enquiry: { ...data, status: data.status || "Pending" } });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
