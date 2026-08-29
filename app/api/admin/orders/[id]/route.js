import { requireAdmin, unauthorized } from "../../../../../server/lib/auth.js";
import { snap, writeAudit } from "../../../../../server/lib/logs.js";
import { wrapHtml } from "../../../../../server/lib/mail.js";
import { notifyShopEvent } from "../../../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../../../server/lib/supabase.js";

const STATUSES = [
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
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", oid)
      .select()
      .single();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Order not found." }, 404);
    writeAudit({ req, action: "status", entity: "order", entityId: oid, detail: status, before: snap("order", prev.data), after: snap("order", data) });
    const cancelled = status.toLowerCase().includes("cancel");
    await notifyShopEvent({
      event: cancelled ? "order_cancelled" : "order_status",
      title: cancelled ? "Order " + oid + " cancelled" : "Order " + oid + " updated",
      body: "Status is now " + status + " · " + (data.name || "") + " · ₹" + (data.total || 0),
      href: "/sales/orders/" + encodeURIComponent(oid),
      entity: "order",
      entityId: oid,
      customerEmail: data.email,
      customerText: "Hello " + (data.name || "") + ", your order " + oid + " is now: " + status + ".",
      customerHtml: wrapHtml(
        cancelled ? "Order cancelled" : "Order update",
        "<p>Hello " + (data.name || "") + ",</p><p>Your order <strong>" + oid + "</strong> is now: <strong>" + status + "</strong>.</p>"
      ),
      tags: cancelled ? "warning,bhr" : "package,bhr"
    });
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
    await notifyShopEvent({
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
