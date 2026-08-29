import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { StatusSelect } from "../components/Template.jsx";
import { FLOW_STEPS, flowIndex, formatInr, formatWhen, itemCount, itemLabel, statusForFlow, waNumber } from "../lib/orderStatus.js";

function copyText(value) {
  return navigator.clipboard.writeText(value);
}

const STEP_ICONS = {
  confirmed: "verified",
  packing: "inventory_2",
  delivering: "local_shipping",
  delivered: "home_pin"
};

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelRemark, setCancelRemark] = useState("");

  function load() {
    api.order(id).then((r) => setOrder(r.order)).catch((e) => setError(e.message));
  }
  useEffect(load, [id]);

  async function flash(label) {
    setCopied(label);
    setTimeout(() => setCopied(""), 1600);
  }

  async function changeStatus(status, extra = {}) {
    try {
      await api.updateOrder(order.id, status, extra);
      setOrder((prev) => ({ ...prev, status, ...(extra.remark ? { cancel_remark: extra.remark } : {}) }));
      setCancelOpen(false);
      setCancelRemark("");
    } catch (e) {
      setError(e.message);
    }
  }

  function requestCancel() {
    setError("");
    setCancelOpen(true);
  }

  async function confirmCancel() {
    const remark = cancelRemark.trim();
    if (!remark) {
      setError("Please add a cancel remark for the customer.");
      return;
    }
    await changeStatus("Cancelled", { remark });
  }

  async function invoice() {
    try {
      await api.downloadOrderInvoice(order.id);
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteOrder() {
    if (!confirm("Delete order " + order.id + " permanently? This cannot be undone.")) return;
    setBusy(true);
    try {
      await api.deleteOrder(order.id);
      navigate("/sales/orders", { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (!order && !error) {
    return (
      <div className="od-page">
        <div className="od-hero">
          <p className="od-kicker">Sales · Orders</p>
          <h2>Loading order…</h2>
        </div>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="od-page">
        <div className="od-hero">
          <p className="od-kicker">Sales · Orders</p>
          <h2>Order not found</h2>
          <p className="od-meta">{error}</p>
          <Link className="od-back" to="/sales/orders">Back to orders</Link>
        </div>
      </div>
    );
  }

  const phone = waNumber(order.phone);
  const address = [order.address, order.city, order.pincode].filter(Boolean).join(", ");
  const waText = encodeURIComponent(
    "Hello " + (order.name || "") + ", this is BHR Traders regarding order " + order.id + " (₹" + Number(order.total || 0) + ")."
  );
  const cur = flowIndex(order.status);
  const cancelled = /cancelled/i.test(order.status || "");
  const pending = /pending/i.test(order.status || "");
  const qty = itemCount(order);

  return (
    <div className="od-page">
      <section className="od-hero">
        <div className="od-hero-copy">
          <p className="od-kicker">Wholesale rice · Transaction ID</p>
          <h2>{order.id}</h2>
          <p className="od-meta">
            {formatWhen(order.created_at)} · {order.pay || "UPI"} · {qty} item{qty === 1 ? "" : "s"}
          </p>
          <span className={"od-status-pill" + (cancelled ? " is-cancel" : pending ? " is-pending" : "")}>{order.status}</span>
        </div>
        <div className="od-hero-total">
          <span>Order value</span>
          <strong>{formatInr(order.total)}</strong>
          <Link className="od-back" to="/sales/orders">← Back to orders</Link>
        </div>
        <div className="od-hero-glow" aria-hidden="true" />
      </section>

      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      {copied ? <div className="od-toast">{copied}</div> : null}

      <div className="od-actions">
        <button type="button" className="od-act primary" onClick={invoice}>
          <i className="material-symbols-rounded">picture_as_pdf</i>
          Invoice PDF
        </button>
        {phone ? (
          <a className="od-act primary" href={"https://wa.me/" + phone + "?text=" + waText} target="_blank" rel="noreferrer">
            <i className="material-symbols-rounded">chat</i>
            WhatsApp
          </a>
        ) : null}
        {order.phone ? (
          <a className="od-act" href={"tel:" + order.phone}>
            <i className="material-symbols-rounded">call</i>
            Call
          </a>
        ) : null}
        {order.email ? (
          <a className="od-act" href={"mailto:" + order.email + "?subject=" + encodeURIComponent("BHR Traders order " + order.id)}>
            <i className="material-symbols-rounded">mail</i>
            Email
          </a>
        ) : null}
        <button type="button" className="od-act" onClick={() => copyText(order.id).then(() => flash("Order ID copied"))}>
          <i className="material-symbols-rounded">content_copy</i>
          Copy ID
        </button>
        <button type="button" className="od-act" onClick={() => copyText(address).then(() => flash("Address copied"))}>
          <i className="material-symbols-rounded">location_on</i>
          Copy address
        </button>
        <button type="button" className="od-act" onClick={() => window.print()}>
          <i className="material-symbols-rounded">print</i>
          Print
        </button>
      </div>

      <section className="od-card od-track">
        <div className="od-card-head">
          <div>
            <p className="od-kicker">Live tracking</p>
            <h3>Update status</h3>
          </div>
          <p className="od-hint">Customer tracks this with {order.id}</p>
        </div>
        <div className="od-steps" role="group" aria-label="Update order status">
          {FLOW_STEPS.map((step, i) => {
            const on = cur === i;
            const done = cur > i;
            return (
              <button
                key={step.id}
                type="button"
                className={"od-step" + (on ? " is-on" : "") + (done ? " is-done" : "")}
                disabled={cancelled}
                onClick={() => changeStatus(statusForFlow(step.id, order))}
              >
                <span className="od-step-icon">
                  <i className="material-symbols-rounded">{done ? "check" : STEP_ICONS[step.id]}</i>
                </span>
                <strong>{step.label}</strong>
                <small>{step.hint}</small>
              </button>
            );
          })}
        </div>
        <div className="od-status-row">
          <StatusSelect
            value={order.status}
            onChange={(status) => {
              if (/cancel/i.test(status)) requestCancel();
              else changeStatus(status);
            }}
          />
          <button type="button" className="od-act danger" disabled={cancelled} onClick={requestCancel}>
            Cancel order
          </button>
          <button type="button" className="od-act danger solid" disabled={busy} onClick={deleteOrder}>
            <i className="material-symbols-rounded">delete</i>
            {busy ? "Deleting…" : "Delete order"}
          </button>
        </div>
        {cancelOpen ? (
          <div className="od-cancel">
            <p>Cancel remark</p>
            <textarea
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              rows={3}
              placeholder="Reason shown to the customer, e.g. payment not received / duplicate order"
            />
            <div className="od-cancel-actions">
              <button type="button" className="od-act danger solid" onClick={confirmCancel}>
                Confirm cancel
              </button>
              <button type="button" className="od-act" onClick={() => { setCancelOpen(false); setCancelRemark(""); }}>
                Keep order
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="od-grid">
        <section className="od-card">
          <div className="od-card-head">
            <div>
              <p className="od-kicker">Ship to</p>
              <h3>Customer & delivery</h3>
            </div>
          </div>
          <div className="od-person">
            <span className="od-avatar">{String(order.name || "?").slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{order.name}</strong>
              <p>{order.city} · {order.pincode}</p>
            </div>
          </div>
          <ul className="od-facts">
            <li>
              <i className="material-symbols-rounded">call</i>
              <span>{order.phone}</span>
            </li>
            <li>
              <i className="material-symbols-rounded">mail</i>
              <span>{order.email}</span>
            </li>
            <li>
              <i className="material-symbols-rounded">home</i>
              <span>{order.address}<br />{order.city} — {order.pincode}</span>
            </li>
          </ul>
          {order.notes ? (
            <div className="od-notes">
              <p>Customer notes</p>
              <span>{order.notes}</span>
            </div>
          ) : null}
          {order.cancel_remark ? (
            <div className="od-notes od-notes-cancel">
              <p>Cancel remark</p>
              <span>{order.cancel_remark}</span>
            </div>
          ) : null}
        </section>

        <section className="od-card od-pay">
          <div className="od-card-head">
            <div>
              <p className="od-kicker">Collected</p>
              <h3>Payment</h3>
            </div>
            <strong className="od-pay-amt">{formatInr(order.total)}</strong>
          </div>
          <p className="od-pay-method">{order.pay || "UPI"}{order.paymentAttached || order.payment_proof ? " · screenshot attached" : ""}</p>
          {order.payment_proof ? (
            <a className="od-shot" href={order.payment_proof} target="_blank" rel="noreferrer">
              <img src={order.payment_proof} alt="Payment screenshot" />
              <span>Open screenshot</span>
            </a>
          ) : (
            <div className="od-shot empty">No payment screenshot attached.</div>
          )}
        </section>
      </div>

      <section className="od-card od-items">
        <div className="od-card-head">
          <div>
            <p className="od-kicker">Catalogue</p>
            <h3>Items</h3>
          </div>
          <span className="od-hint">{qty} line{qty === 1 ? "" : "s"}</span>
        </div>
        <div className="table-responsive">
          <table className="od-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((i, idx) => (
                <tr key={i.id || idx}>
                  <td>
                    <strong>{i.title}</strong>
                  </td>
                  <td>{i.qty}</td>
                  <td>{formatInr(i.price)}</td>
                  <td className="od-line">{formatInr(Number(i.price) * Number(i.qty || 1))}</td>
                </tr>
              ))}
              {!order.items?.length ? (
                <tr>
                  <td colSpan="4">{itemLabel(order) || "No items."}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
