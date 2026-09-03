import { useEffect, useState } from "react";
import { PHONE } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { TRACK_STEPS, orderStepIndex } from "../lib/orderStatus.js";

const STEP_COPY = [
  { label: "Confirmed", hint: "Order received" },
  { label: "Packing", hint: "Rice being packed" },
  { label: "Delivering", hint: "On the way" },
  { label: "Delivered", hint: "At your door" }
];

function StepIcon({ name }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", "aria-hidden": true };
  if (name === "Confirmed") {
    return (
      <svg {...common}>
        <path d="M9 11.5 11 13.5 15.5 9" />
        <circle cx="12" cy="12" r="8.2" />
      </svg>
    );
  }
  if (name === "Packing") {
    return (
      <svg {...common}>
        <path d="M4 8h16l-1.2 11.2A2 2 0 0 1 16.8 21H7.2a2 2 0 0 1-2-1.8L4 8z" />
        <path d="M8 8V6.4A4 4 0 0 1 12 2.5 4 4 0 0 1 16 6.4V8" />
      </svg>
    );
  }
  if (name === "Delivering") {
    return (
      <svg {...common}>
        <path d="M3 16V8h11v8" />
        <path d="M14 11h4.2L21 14.2V16h-7" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17.5" cy="17.5" r="1.6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" />
    </svg>
  );
}

export function TrackModal() {
  const { trackOpen, setTrackOpen, trackPrefill, setTrackPrefill, trackOrder } = useStore();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (trackOpen && trackPrefill) {
      setQuery(trackPrefill);
      lookup(trackPrefill);
      setTrackPrefill("");
    }
    if (!trackOpen) {
      setError("");
      setOrder(null);
      setBusy(false);
    }
  }, [trackOpen, trackPrefill, setTrackPrefill]);

  async function lookup(id) {
    const q = String(id || "").trim().toUpperCase();
    setError("");
    setOrder(null);
    setBusy(true);
    try {
      const found = await trackOrder(q);
      setOrder(found);
    } catch {
      setError("No order found for this ID. Check the ID from your confirmation, or call " + PHONE + ".");
    } finally {
      setBusy(false);
    }
  }

  if (!trackOpen) return null;

  const cancelled = /cancelled/i.test(order?.status || "");
  const pending = /pending/i.test(order?.status || "");
  const step = order ? orderStepIndex(order.status) : -1;
  const items = order?.items || [];
  const progress = cancelled || pending || step < 0 ? 0 : ((step + 0.5) / TRACK_STEPS.length) * 100;

  return (
    <div
      className="modal show"
      role="dialog"
      aria-labelledby="trackTitle"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setTrackOpen(false);
      }}
    >
      <div className="modal-box track-box">
        <div className="track-hero">
          <div className="track-hero-copy">
            <small>Live rice delivery</small>
            <h3 id="trackTitle">Track your order</h3>
            <p>Enter the ID from your invoice or confirmation message.</p>
          </div>
          <button className="modal-close track-x" type="button" aria-label="Close" onClick={() => setTrackOpen(false)}>
            ×
          </button>
        </div>

        <form
          className="track-form"
          onSubmit={(e) => {
            e.preventDefault();
            lookup(query);
          }}
        >
          <label className="track-field">
            <span className="track-field-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16.2 16.2 21 21" />
              </svg>
            </span>
            <span className="track-field-copy">
              <small>Transaction ID</small>
              <input
                name="orderId"
                required
                placeholder="BHR-1830"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
              />
            </span>
          </label>
          <button className="btn btn-green track-submit" type="submit" disabled={busy}>
            {busy ? "Tracking…" : "Track order"}
          </button>
        </form>

        {!order && !error ? (
          <div className="track-preview">
            <p className="track-preview-label">How an order moves</p>
            <div className="track-journey" aria-hidden="true">
              <div className="track-rail" />
              {STEP_COPY.map((s) => (
                <div key={s.label} className="track-node idle">
                  <span className="track-node-ico">
                    <StepIcon name={s.label} />
                  </span>
                  <strong>{s.label}</strong>
                  <small>{s.hint}</small>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="track-empty">
            <div className="track-empty-ico" aria-hidden="true">!</div>
            <strong>No order for this ID</strong>
            <p>{error}</p>
            <a className="btn btn-outline" href={"tel:" + PHONE.replace(/\s/g, "")}>
              Call {PHONE}
            </a>
          </div>
        ) : null}

        {order ? (
          <div className="track-panel">
            <div className="track-status-card">
              <span className={"track-status-ico" + (cancelled ? " cancelled" : "")}>
                {cancelled ? "×" : <StepIcon name={TRACK_STEPS[Math.max(0, step)]} />}
              </span>
              <div>
                <small>Transaction ID</small>
                <strong>{order.id}</strong>
                <span className={"track-badge" + (cancelled ? " cancelled" : "")}>{order.status}</span>
              </div>
            </div>

            {cancelled ? (
              <div className="track-status-note is-cancel">
                <span className="track-status-note-icon" aria-hidden="true">ℹ️</span>
                <div>
                  <strong>Order cancelled</strong>
                  <p>{order.cancel_remark || "This order was cancelled. Call " + PHONE + " if you need help."}</p>
                </div>
              </div>
            ) : pending ? (
              <p className="track-cancelled">Payment is pending. Complete UPI or wait for BHR Traders to confirm this order.</p>
            ) : (
              <>
                <div className="track-journey live" role="list" aria-label="Order progress">
                  <div className="track-rail">
                    <i style={{ width: progress + "%" }} />
                  </div>
                  {STEP_COPY.map((s, i) => (
                    <div
                      key={s.label}
                      role="listitem"
                      className={"track-node" + (i < step ? " done" : i === step ? " current" : "")}
                    >
                      <span className="track-node-ico">
                        {i < step ? "✓" : <StepIcon name={s.label} />}
                      </span>
                      <strong>{s.label}</strong>
                      <small>{i === step ? "Current" : s.hint}</small>
                    </div>
                  ))}
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
              </>
            )}

            <div className="track-facts">
              {order.total ? (
                <div>
                  <small>Total</small>
                  <b>₹{Number(order.total).toFixed(2)}</b>
                </div>
              ) : null}
              {order.pay ? (
                <div>
                  <small>Payment</small>
                  <b>{order.pay}</b>
                </div>
              ) : null}
              <div>
                <small>Placed</small>
                <b>{order.placed}</b>
              </div>
            </div>

            {items.length ? (
              <ul className="track-items">
                {items.map((i) => (
                  <li key={i.title + i.qty}>
                    <span>{i.title}</span>
                    <b>{i.qty} kg</b>
                  </li>
                ))}
              </ul>
            ) : null}

            {order.address ? (
              <div className="track-ship">
                <small>Deliver to</small>
                <p>
                  {order.address}
                  {order.city ? ", " + order.city : ""}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
