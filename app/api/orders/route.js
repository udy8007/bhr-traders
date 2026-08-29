import { snap, writeAudit } from "../../../server/lib/logs.js";
import { escapeHtml, mailFacts, wrapHtml } from "../../../server/lib/mail.js";
import { notifyShopEvent } from "../../../server/lib/notify.js";
import { getSupabase, json, options } from "../../../server/lib/supabase.js";

const PAY_LABELS = {
  cod: "Cash on delivery",
  upi: "UPI",
  bank: "Bank transfer"
};

function sanitizeProof(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (!value.startsWith("data:image/")) {
    throw Object.assign(new Error("Payment screenshot must be an image."), { status: 400 });
  }
  return value;
}

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return json({ error: "Cart is empty." }, 400);
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const pincode = String(body.pincode || "").trim();
    const notes = String(body.notes || "").trim().slice(0, 800);
    if (!name || !phone || !email || !address || !city || !pincode) {
      return json({ error: "Delivery details are required." }, 400);
    }

    const pay = String(body.pay || "upi");
    const payment_proof = sanitizeProof(body.paymentProof || body.payment_proof);
    if (pay === "upi" && !payment_proof) {
      return json({ error: "Please attach a payment screenshot before placing the order." }, 400);
    }
    const total = items.reduce((n, i) => n + Number(i.price) * Number(i.qty || 1), 0);
    const id = "BHR-" + String(Math.floor(1000 + Math.random() * 9000));
    const status = pay === "cod" ? "Confirmed — cash on delivery" : "Confirmed — payment received";

    const supabase = getSupabase();
    const row = {
      id,
      name,
      phone,
      email,
      address,
      city,
      pincode,
      pay: PAY_LABELS[pay] || pay,
      notes,
      payment_proof,
      total,
      status
    };
    let { error: orderErr } = await supabase.from("orders").insert(row);
    if (orderErr && /notes|payment_proof|schema cache/i.test(orderErr.message || "")) {
      const retry = await supabase.from("orders").insert({
        id,
        name,
        phone,
        email,
        address,
        city,
        pincode,
        pay: PAY_LABELS[pay] || pay,
        total,
        status
      });
      orderErr = retry.error;
    }
    if (orderErr) return json({ error: orderErr.message }, 500);

    const rows = items.map((i) => ({
      order_id: id,
      product_id: i.id || null,
      title: i.title,
      qty: Number(i.qty || 1),
      price: Number(i.price)
    }));
    const { error: itemErr } = await supabase.from("order_items").insert(rows);
    if (itemErr) return json({ error: itemErr.message }, 500);

    writeAudit({
      actor: "storefront",
      action: "create",
      entity: "order",
      entityId: id,
      detail: name + " · ₹" + total,
      after: snap("order", { status, name, phone, city, total, pay: PAY_LABELS[pay] || pay, notes })
    });
    const itemLines = items.map((i) => (i.title || "Item") + " × " + (i.qty || 1)).join(", ");
    const adminBody =
      "Order " +
      id +
      " from " +
      name +
      " (" +
      phone +
      ")\n" +
      city +
      " " +
      pincode +
      "\n₹" +
      total +
      " · " +
      (PAY_LABELS[pay] || pay) +
      (payment_proof ? " · screenshot attached" : "") +
      (notes ? "\nNotes: " + notes : "") +
      "\n" +
      itemLines;
    await notifyShopEvent({
      event: "order_placed",
      title: "New order " + id,
      body: adminBody,
      href: "/sales/orders/" + encodeURIComponent(id),
      entity: "order",
      entityId: id,
      customerEmail: email,
      customerText: "Thank you, " + name + ". Your order " + id + " has been placed. Total ₹" + total + ". Status: " + status + ".",
      customerHtml: wrapHtml(
        "Order placed",
        "<p style=\"margin:0 0 16px\">Thank you, " +
          escapeHtml(name) +
          ". Your order has been received and our team will process it shortly.</p>" +
          mailFacts([
            { label: "Order ID", value: id },
            { label: "Total", value: "₹" + total },
            { label: "Payment", value: PAY_LABELS[pay] || pay },
            { label: "Status", value: status }
          ]) +
          "<p style=\"margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#b08d3e\">Items</p>" +
          "<p style=\"margin:0\">" +
          escapeHtml(itemLines) +
          "</p>",
        { kicker: "Order confirmation", preheader: "Order " + id + " · ₹" + total }
      ),
      tags: "shopping_cart,bhr",
      priority: "high"
    });
    return json({ order: { id, total, status, pay: PAY_LABELS[pay] || pay } }, 201);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
