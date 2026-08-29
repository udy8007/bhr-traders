import { useEffect, useState } from "react";
import { PHONE } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { TRACK_STEPS, orderStepIndex } from "../lib/orderStatus.js";

export function TrackModal() {
  const { trackOpen, setTrackOpen, trackPrefill, setTrackPrefill, trackOrder } = useStore();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (trackOpen && trackPrefill) {
      setQuery(trackPrefill);
      lookup(trackPrefill);
      setTrackPrefill("");
    }
    if (!trackOpen) {
      setError("");
      setOrder(null);
    }
  }, [trackOpen, trackPrefill, setTrackPrefill]);

  async function lookup(id) {
    const q = String(id || "").trim().toUpperCase();
    setError("");
    setOrder(null);
    try {
      const found = await trackOrder(q);
      setOrder(found);
    } catch {
      setError("No order found for this ID. Check the ID from your confirmation, or call " + PHONE + ".");
    }
  }

  if (!trackOpen) return null;

  const cancelled = /cancelled/i.test(order?.status || "");
  const step = order ? orderStepIndex(order.status) : -1;
  const items = (order?.items || []).map((i) => i.title + " × " + i.qty + " kg").join(", ");

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
      <div className="modal-box">
        <div className="modal-head">
          <div>
            <h3 id="trackTitle">Track your order</h3>
            <p className="hint">Enter your transaction / order ID (for example BHR-1830) to see Confirmed, Packing, Delivering, and Delivered.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={() => setTrackOpen(false)}>
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(query);
          }}
        >
          <input
            name="orderId"
            required
            placeholder="Transaction ID e.g. BHR-1830"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-green" type="submit" style={{ width: "100%" }}>
            Track order
          </button>
        </form>
        {error ? <div className="track-result show">{error}</div> : null}
        {order ? (
          <div className="track-panel">
            <div className="track-meta">
              <strong>{order.id}</strong>
              <span className={"track-badge" + (cancelled ? " cancelled" : "")}>{order.status}</span>
            </div>
            {cancelled ? (
              <p className="track-cancelled">This order was cancelled. Call {PHONE} if you need help.</p>
            ) : (
              <ol className="track-steps" aria-label="Order progress">
                {TRACK_STEPS.map((label, i) => (
                  <li key={label} className={i < step ? "done" : i === step ? "current" : ""}>
                    <span className="dot">{i < step ? "✓" : i + 1}</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="track-detail">
              {order.total ? "Total ₹" + Number(order.total).toFixed(2) + ". " : ""}
              Placed {order.placed}
              {order.pay ? ". Payment: " + order.pay : ""}
              {items ? ". " + items : ""}
              {order.address ? ". Deliver to " + order.address + ", " + order.city : ""}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
