import { escapeHtml } from "./mail.js";
import { notifyShopEvent } from "./notify.js";
import { getSupabase } from "./supabase.js";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const CONFIG_ID = "default";

function isPending(status) {
  const s = String(status || "Pending").trim();
  return !s || /^pending$/i.test(s);
}

function ageMs(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isNaN(t) ? 0 : Date.now() - t;
}

async function readLastAlertAt() {
  if (globalThis.__bhrEnquiryAlertAt) return Number(globalThis.__bhrEnquiryAlertAt) || 0;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("notification_config").select("enquiry_alert_at").eq("id", CONFIG_ID).maybeSingle();
    const n = Number(data?.enquiry_alert_at || 0) || 0;
    globalThis.__bhrEnquiryAlertAt = n;
    return n;
  } catch {
    return Number(globalThis.__bhrEnquiryAlertAt || 0) || 0;
  }
}

async function writeLastAlertAt(ts) {
  globalThis.__bhrEnquiryAlertAt = ts;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("notification_config").update({ enquiry_alert_at: ts }).eq("id", CONFIG_ID);
    if (error && /enquiry_alert_at|schema cache/i.test(error.message || "")) return;
  } catch {
    /* keep in-memory stamp */
  }
}

export async function tickPendingEnquiryAlerts() {
  const last = await readLastAlertAt();
  if (last && Date.now() - last < TWO_HOURS_MS - 15000) return { skipped: "too soon" };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("enquiries")
    .select("id,name,phone,email,company,product,qty,status,created_at")
    .order("created_at", { ascending: true });
  if (error) return { skipped: "query", error: error.message };

  const stuck = (data || []).filter((e) => isPending(e.status) && ageMs(e.created_at) >= TWO_HOURS_MS);
  if (!stuck.length) return { skipped: "none" };

  const lines = stuck.map((e) => {
    return (e.name || "—") + " · " + (e.product || "General") + " · " + (e.phone || "") + " · " + (e.email || "");
  });
  const title = stuck.length === 1 ? "Enquiry still pending · resolve needed" : stuck.length + " enquiries still pending · resolve needed";
  const body =
    "These wholesale enquiries have been Pending for 2 hours or more. Please mark them Resolved in backoffice.\n\n" +
    lines.join("\n") +
    "\n\nOpen backoffice Sales → Enquiries.";
  const listHtml = stuck
    .map((e) => {
      return (
        "<tr>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        escapeHtml(e.name || "") +
        "</td>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        escapeHtml(e.product || "General") +
        "</td>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        escapeHtml(e.phone || "") +
        "</td>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        escapeHtml(e.email || "") +
        "</td></tr>"
      );
    })
    .join("");

  await notifyShopEvent({
    event: "enquiry_action_due",
    title,
    body,
    href: "/sales/enquiries",
    entity: "enquiries",
    entityId: "pending-digest-" + Math.floor(Date.now() / TWO_HOURS_MS),
    adminHtml:
      "<p style=\"margin:0 0 12px\">Still Pending after 2 hours. Resolve these in Sales → Enquiries. Customers are not notified by this reminder.</p>" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfc8">' +
      "<tr>" +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Customer</th>' +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Product</th>' +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Phone</th>' +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Email</th>' +
      "</tr>" +
      listHtml +
      "</table>",
    tags: "warning,bhr",
    priority: "high"
  });
  await writeLastAlertAt(Date.now());

  return { ok: true, count: stuck.length };
}
