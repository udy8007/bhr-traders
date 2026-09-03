import { snap, writeAudit } from "../../../server/lib/logs.js";
import { verifyCustomerToken } from "../../../server/lib/customerAuth.js";
import { getToken } from "../../../server/lib/auth.js";
import { escapeHtml, mailFacts, mailItemsTable, mailMoney, mailSectionLabel, mailStatStrip, wrapHtml } from "../../../server/lib/mail.js";
import { queueShopEvent } from "../../../server/lib/notify.js";
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
    let email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const city = String(body.city || "").trim();
    const pincode = String(body.pincode || "").trim();
    const notes = String(body.notes || "").trim().slice(0, 800);
    if (!name || !phone || !email || !address || !city || !pincode) {
      return json({ error: "Delivery details are required." }, 400);
    }

    const customerAuth = verifyCustomerToken(getToken(req));

    const pay = String(body.pay || "upi");
    const skipPayment = Boolean(body.skipPayment || body.skip_payment);
    const payment_proof = sanitizeProof(body.paymentProof || body.payment_proof);
    if (pay === "upi" && !payment_proof && !skipPayment) {
      return json({ error: "Please attach a payment screenshot before placing the order." }, 400);
    }
    const total = items.reduce((n, i) => n + Number(i.price) * Number(i.qty || 1), 0);
    const id = "BHR-" + String(Math.floor(1000 + Math.random() * 9000));
    const pending = skipPayment && pay !== "cod";
    const status = pending
      ? "Pending"
      : pay === "cod"
        ? "Confirmed — cash on delivery"
        : "Confirmed — payment received";

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
      status,
      customer_id: customerAuth?.sub || null
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
    const payLabel = PAY_LABELS[pay] || pay;
    const money = mailMoney(total);
    const adminBody =
      "Order " +
      id +
      " from " +
      name +
      " (" +
      phone +
      ")\n" +
      address +
      "\n" +
      city +
      " " +
      pincode +
      "\n" +
      money +
      " · " +
      payLabel +
      (pending ? " · PAYMENT SKIPPED · status Pending" : "") +
      (payment_proof ? " · screenshot attached" : "") +
      (notes ? "\nNotes: " + notes : "") +
      "\n" +
      itemLines;
    const orderGraphic =
      mailStatStrip([
        { label: "Order", value: id },
        { label: "Total", value: money },
        { label: "Payment", value: payLabel }
      ]) +
      mailSectionLabel("Items") +
      mailItemsTable(items) +
      mailSectionLabel("Delivery") +
      mailFacts([
        { label: "Name", value: name },
        { label: "Phone", value: phone },
        { label: "Email", value: email },
        { label: "Address", value: address },
        { label: "City", value: [city, pincode].filter(Boolean).join(" ") },
        { label: "Status", value: status },
        { label: "Notes", value: notes }
      ]);
    const customerLead = pending
      ? "Thank you for ordering wholesale rice from BHR Traders. We have captured your order. Payment is still pending — please complete UPI when you can, or we will confirm once our team verifies it."
      : "Thank you for ordering wholesale rice from BHR Traders. Your order is confirmed and our team will pack it shortly.";
    queueShopEvent({
      event: pending ? "order_pending" : "order_placed",
      title: (pending ? "Pending order " : "New order ") + id,
      body: adminBody,
      href: "/sales/orders/" + encodeURIComponent(id),
      entity: "order",
      entityId: id,
      adminHtml: orderGraphic,
      customerEmail: email,
      customerText:
        "Hello " +
        name +
        ",\n\n" +
        customerLead +
        "\nOrder: " +
        id +
        "\nTotal: " +
        money +
        "\nPayment: " +
        payLabel +
        "\nStatus: " +
        status +
        "\nItems: " +
        itemLines +
        "\nDeliver to: " +
        [address, city, pincode].filter(Boolean).join(", ") +
        "\n\nWe will update you as the order moves. For help call +91 99403 38654.\n\nWarm regards,\nBHR Traders",
      customerHtml: wrapHtml(
        pending ? "Order " + id + " received" : "Order " + id + " confirmed",
        "<p style=\"margin:0 0 16px\">Hello " +
          escapeHtml(name) +
          ",</p>" +
          "<p style=\"margin:0 0 18px\">" +
          escapeHtml(customerLead) +
          "</p>" +
          orderGraphic +
          "<p style=\"margin:18px 0 0\">Warm regards,<br/>BHR Traders<br/>Wholesale rice · Chennai</p>",
        { kicker: pending ? "Order pending payment" : "Order confirmation", preheader: "Order " + id + " · " + money }
      ),
      tags: "shopping_cart,bhr",
      priority: "high"
    });
    return json({ order: { id, total, status, pay: payLabel } }, 201);
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
