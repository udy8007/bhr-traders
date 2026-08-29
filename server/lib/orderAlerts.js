import { mailMoney } from "./mail.js";
import { notifyShopEvent } from "./notify.js";
import { getSupabase } from "./supabase.js";

export const PENDING_STATUS = "Pending";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const CONFIG_ID = "default";

export function needsAdminAction(status) {
  const s = String(status || "");
  if (/cancel/i.test(s)) return false;
  if (/pack|dispatch|deliver/i.test(s)) return false;
  return true;
}

export function isPendingStatus(status) {
  return /^pending$/i.test(String(status || "").trim()) || /awaiting payment/i.test(String(status || ""));
}

function ageMs(iso) {
  const t = new Date(iso || 0).getTime();
  return Number.isNaN(t) ? 0 : Date.now() - t;
}

async function readLastAlertAt() {
  if (globalThis.__bhrPendingAlertAt) return Number(globalThis.__bhrPendingAlertAt) || 0;
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from("notification_config").select("pending_alert_at").eq("id", CONFIG_ID).maybeSingle();
    const n = Number(data?.pending_alert_at || 0) || 0;
    globalThis.__bhrPendingAlertAt = n;
    return n;
  } catch {
    return Number(globalThis.__bhrPendingAlertAt || 0) || 0;
  }
}

async function writeLastAlertAt(ts) {
  globalThis.__bhrPendingAlertAt = ts;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("notification_config").update({ pending_alert_at: ts }).eq("id", CONFIG_ID);
    if (error && /pending_alert_at|schema cache/i.test(error.message || "")) return;
  } catch {
    /* keep in-memory stamp */
  }
}

export async function tickPendingOrderAlerts() {
  const last = await readLastAlertAt();
  if (last && Date.now() - last < TWO_HOURS_MS - 15000) return { skipped: "too soon" };

  const supabase = getSupabase();
  const { data, error } = await supabase.from("orders").select("id,name,phone,email,city,total,status,pay,created_at").order("created_at", { ascending: true });
  if (error) return { skipped: "query", error: error.message };

  const stuck = (data || []).filter((o) => needsAdminAction(o.status) && ageMs(o.created_at) >= TWO_HOURS_MS);
  if (!stuck.length) return { skipped: "none" };

  const pending = stuck.filter((o) => isPendingStatus(o.status));
  const confirmed = stuck.filter((o) => /confirmed/i.test(o.status || ""));
  const other = stuck.filter((o) => !pending.includes(o) && !confirmed.includes(o));

  const lines = stuck.map((o) => {
    const money = mailMoney(o.total);
    return o.id + " · " + (o.status || "—") + " · " + money + " · " + (o.name || "") + " · " + (o.phone || "");
  });
  const title =
    "Orders need action · " +
    pending.length +
    " pending / " +
    confirmed.length +
    " confirmed";
  const body =
    "These orders are still waiting for cancel or packing (2-hour check):\n\n" +
    lines.join("\n") +
    "\n\nOpen backoffice Sales → Orders.";
  const listHtml = stuck
    .map((o) => {
      return (
        "<tr>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        String(o.id) +
        "</td>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        String(o.status || "") +
        "</td>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        mailMoney(o.total) +
        "</td>" +
        '<td style="padding:8px 10px;border-bottom:1px solid #eadfc8;font-family:Arial,Helvetica,sans-serif;font-size:13px">' +
        String(o.name || "") +
        "</td></tr>"
      );
    })
    .join("");

  await notifyShopEvent({
    event: "order_action_due",
    title,
    body,
    href: "/sales/orders",
    entity: "orders",
    entityId: "pending-digest-" + Math.floor(Date.now() / TWO_HOURS_MS),
    adminHtml:
      "<p style=\"margin:0 0 12px\">Still waiting for packing or cancel. Scheduler check every 2 hours.</p>" +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfc8">' +
      "<tr>" +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Order</th>' +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Status</th>' +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Total</th>' +
      '<th align="left" style="padding:8px 10px;background:#143524;color:#c4a35a;font-family:Arial,Helvetica,sans-serif;font-size:11px">Customer</th>' +
      "</tr>" +
      listHtml +
      "</table>",
    tags: "warning,bhr",
    priority: "high"
  });
  await writeLastAlertAt(Date.now());

  return { ok: true, count: stuck.length, pending: pending.length, confirmed: confirmed.length, other: other.length };
}
