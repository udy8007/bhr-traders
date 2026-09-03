import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { snap, writeAudit } from "../../../../../server/lib/logs.js";
import {
  escapeHtml,
  mailFacts,
  mailItemsTable,
  mailMoney,
  mailOrderCopy,
  mailOrderTrack,
  mailSectionLabel,
  mailStatStrip,
  wrapHtml
} from "../../../../../server/lib/mail.js";
import { queueShopEvent } from "../../../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

const STATUSES = [
  "Pending",
  "Confirmed — cash on delivery",
  "Confirmed — awaiting payment",
  "Confirmed — payment received",
  "Packing",
  "Packed",
  "Delivering",
  "Dispatched",
  "Delivered",
  "Cancelled"
];

export function OPTIONS() {
  return options();
}

export async function GET(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const oid = String(id || "").trim().toUpperCase();
    if (!oid) return json({ error: "Order ID is required." }, 400);
    const supabase = getSupabase();
    const { data: order, error } = await supabase.from("orders").select("*").eq("id", oid).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!order) return json({ error: "Order not found." }, 404);
    const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    return json({
      order: {
        ...order,
        paymentAttached: Boolean(order.payment_proof),
        items: items || []
      }
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const status = String(body.status || "").trim();
    if (!STATUSES.includes(status)) return json({ error: "Invalid order status." }, 400);
    const supabase = getSupabase();
    const oid = String(id).toUpperCase();
    const prev = await supabase.from("orders").select("*").eq("id", oid).maybeSingle();
    const cancelled = /cancel/i.test(status);
    const remark = String(body.remark || body.cancel_remark || "").trim().slice(0, 800);
    const note = String(body.note || body.status_note || "").trim().slice(0, 800);
    if (cancelled && !remark) {
      return json({ error: "Please add a cancel remark for the customer." }, 400);
    }
    const patch = cancelled ? { status, cancel_remark: remark, status_note: null } : { status, status_note: note || null };
    let { data, error } = await supabase.from("orders").update(patch).eq("id", oid).select().single();
    if (error && cancelled && /cancel_remark|schema cache/i.test(error.message || "")) {
      const retry = await supabase.from("orders").update({ status }).eq("id", oid).select().single();
      data = retry.data;
      error = retry.error;
      if (!error && data) data = { ...data, cancel_remark: remark };
    }
    if (error && !cancelled && /status_note|schema cache/i.test(error.message || "")) {
      const retry = await supabase.from("orders").update({ status }).eq("id", oid).select().single();
      data = retry.data;
      error = retry.error;
      if (!error && data) data = { ...data, status_note: note || null };
    }
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Order not found." }, 404);
    writeAudit({
      req,
      action: "status",
      entity: "order",
      entityId: oid,
      detail: cancelled ? status + " · " + remark : note ? status + " · " + note : status,
      before: snap("order", prev.data),
      after: snap("order", data)
    });
    const prevStatus = String(prev.data?.status || "");
    if (data.email && prevStatus !== status) {
      const copy = mailOrderCopy(status);
      const remarkText = cancelled ? remark : note;
      const { data: itemRows } = await supabase.from("order_items").select("*").eq("order_id", oid);
      const items = itemRows || [];
      const money = mailMoney(data.total);
      const name = String(data.name || "there").trim() || "there";
      const customerText = [
        "Hello " + name + ",",
        "",
        copy.lead,
        remarkText ? (cancelled ? "Remark: " : "Update: ") + remarkText : "",
        "",
        "Order: " + oid,
        "Status: " + status,
        "Total: " + money,
        "",
        "Warm regards,",
        "BHR Traders"
      ]
        .filter((line, i, all) => line !== "" || (all[i + 1] && all[i + 1] !== ""))
        .join("\n");
      queueShopEvent({
        event: cancelled ? "order_cancelled" : "order_status",
        title: copy.title + " · " + oid,
        body: customerText,
        skipAdmin: true,
        href: "/sales/orders/" + encodeURIComponent(oid),
        entity: "order",
        entityId: oid,
        customerEmail: data.email,
        customerText,
        customerHtml: wrapHtml(
          copy.title,
          "<p style=\"margin:0 0 14px\">Hello " +
            escapeHtml(name) +
            ",</p>" +
            "<p style=\"margin:0 0 16px\">" +
            escapeHtml(copy.lead) +
            "</p>" +
            (remarkText
              ? '<p style="margin:0 0 16px;padding:12px 14px;background:' +
                (cancelled ? "#fdecea;border:1px solid #f5c2c0;color:#7f1d1d" : "#eef8f2;border:1px solid #bfe8d4;color:#0d5c3a") +
                ';font-family:Arial,Helvetica,sans-serif;font-size:14px"><strong>' +
                (cancelled ? "Remark:" : "Update:") +
                "</strong> " +
                escapeHtml(remarkText) +
                "</p>"
              : "") +
            mailStatStrip([
              { label: "Order", value: oid },
              { label: "Total", value: money },
              { label: "Status", value: cancelled ? "Cancelled" : copy.kicker }
            ]) +
            mailSectionLabel("Live tracking") +
            mailOrderTrack(status) +
            (items.length ? mailSectionLabel("Items") + mailItemsTable(items) : "") +
            mailSectionLabel("Delivery") +
            mailFacts([
              { label: "Name", value: data.name },
              { label: "Phone", value: data.phone },
              { label: "Address", value: [data.address, data.city, data.pincode].filter(Boolean).join(", ") },
              { label: "Payment", value: data.pay },
              { label: "Detail", value: status },
              { label: "Remark", value: remarkText }
            ]) +
            "<p style=\"margin:18px 0 0\">Warm regards,<br/>BHR Traders<br/>Wholesale rice · Chennai</p>",
          {
            kicker: copy.kicker,
            preheader: "Order " + oid + " — " + copy.title
          }
        ),
        tags: cancelled ? "warning,bhr" : "package,bhr"
      });
    }
    return json({ order: data });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function DELETE(req, { params }) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const oid = String(id || "").trim().toUpperCase();
    if (!oid) return json({ error: "Order ID is required." }, 400);
    const supabase = getSupabase();
    const prev = await supabase.from("orders").select("*").eq("id", oid).maybeSingle();
    if (prev.error) return json({ error: prev.error.message }, 500);
    if (!prev.data) return json({ error: "Order not found." }, 404);
    const items = await supabase.from("order_items").delete().eq("order_id", oid);
    if (items.error) return json({ error: items.error.message }, 500);
    const { error } = await supabase.from("orders").delete().eq("id", oid);
    if (error) return json({ error: error.message }, 500);
    writeAudit({
      req,
      action: "delete",
      entity: "order",
      entityId: oid,
      detail: "Order removed · " + (prev.data.name || "") + " · ₹" + (prev.data.total || 0),
      before: snap("order", prev.data)
    });
    queueShopEvent({
      event: "order_deleted",
      title: "Order " + oid + " deleted",
      body: (prev.data.name || "Customer") + " · ₹" + (prev.data.total || 0) + " · " + (prev.data.status || ""),
      href: "/sales/orders",
      entity: "order",
      entityId: oid,
      tags: "warning,bhr"
    });
    return json({ ok: true, id: oid });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
