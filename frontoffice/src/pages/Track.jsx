import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { TRACK_STEPS, orderStepIndex, statusTone } from "../lib/orderStatus.js";
import { PHONE } from "../data/site.js";
import { formatInr } from "../lib/packs.js";

const STEP_COPY = [
  { label: "Confirmed", hint: "Order received" },
  { label: "Packing", hint: "Rice being packed" },
  { label: "Delivering", hint: "On the way" },
  { label: "Delivered", hint: "At your door" }
];

export function Track() {
  const { trackOrder } = useStore();
  const location = useLocation();
  const [query, setQuery] = useState(location.state?.orderId || "");
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (location.state?.orderId) lookup(location.state.orderId);
  }, [location.state?.orderId]);

  async function lookup(id) {
    const q = String(id || query).trim().toUpperCase();
    if (!q) {
      setError("Enter your order ID.");
      return;
    }
    setError("");
    setOrder(null);
    setBusy(true);
    try {
      const found = await trackOrder(q);
      setOrder(found);
      setQuery(q);
    } catch {
      setError("No order found. Check the ID or call " + PHONE + ".");
    } finally {
      setBusy(false);
    }
  }

  const stepIdx = order ? orderStepIndex(order.status) : -1;
  const tone = order ? statusTone(order.status) : "";

  return (
    <MobileLayout title="Track order">
      <div className="track-page">
        {location.state?.justPlaced ? (
          <div className="track-placed-banner">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Order placed!</strong>
              <p>Your order is confirmed. Track delivery status below.</p>
            </div>
          </div>
        ) : null}

        <form
          className="track-form"
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
        >
          <label>
            Order ID
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="e.g. BHR-2024-001"
              autoCapitalize="characters"
            />
          </label>
          <button type="submit" className="btn btn-gold btn-block" disabled={busy}>
            {busy ? "Looking up…" : "Track"}
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}

        {order && (
          <div className="track-result">
            <div className={"status-pill tone-" + tone}>{order.status}</div>
            <p className="track-id">{order.id}</p>

            <div className="track-steps">
              {TRACK_STEPS.map((label, i) => {
                const copy = STEP_COPY[i];
                const done = stepIdx >= i;
                const active = stepIdx === i;
                return (
                  <div className={"track-step" + (done ? " done" : "") + (active ? " active" : "")} key={label}>
                    <div className="step-dot">{done ? "✓" : i + 1}</div>
                    <div>
                      <strong>{copy.label}</strong>
                      <span>{copy.hint}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {order.status_note ? (
              <div className="track-status-note">
                <span className="track-status-note-icon" aria-hidden="true">📋</span>
                <div>
                  <strong>Update from BHR Traders</strong>
                  <p>{order.status_note}</p>
                </div>
              </div>
            ) : null}

            {order.cancel_remark ? (
              <div className="track-status-note is-cancel">
                <span className="track-status-note-icon" aria-hidden="true">ℹ️</span>
                <div>
                  <strong>Order cancelled</strong>
                  <p>{order.cancel_remark}</p>
                </div>
              </div>
            ) : null}

            {order.items?.length > 0 && (
              <div className="track-items">
                <h3>Items</h3>
                {order.items.map((item, i) => (
                  <div className="track-item-row" key={i}>
                    <span>{item.title} × {item.qty}</span>
                    <span>{formatInr(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
            )}

            <a href={"tel:" + PHONE.replace(/\s/g, "")} className="btn btn-outline btn-block">
              Call support
            </a>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
