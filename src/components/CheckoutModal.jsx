import { useEffect, useState } from "react";
import { GSTIN, UPI_ID, UPI_QR } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { logCheckoutStart } from "../lib/visits.js";
import { formatInr } from "../lib/packs.js";

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the screenshot."));
    reader.readAsDataURL(file);
  });
}

export function CheckoutModal() {
  const {
    cart,
    cartSum,
    checkoutOpen,
    setCheckoutOpen,
    checkoutStep,
    setCheckoutStep,
    checkoutInfo,
    setCheckoutInfo,
    orderId,
    orderStatus,
    placeOrder,
    setTrackOpen,
    setTrackPrefill,
    downloadInvoice,
    ping
  } = useStore();

  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);

  useEffect(() => {
    if (checkoutOpen && checkoutStep < 3) logCheckoutStart();
  }, [checkoutOpen, checkoutStep]);

  useEffect(() => {
    if (!checkoutOpen) {
      setProof("");
      setProofName("");
      setCopied(false);
      setBusy(false);
      setInvoiceReady(false);
    }
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  const title = checkoutStep === 3 ? "Order placed" : checkoutStep === 2 ? "Pay with UPI" : "Your details";
  const hint =
    checkoutStep === 1
      ? "Tell us where to deliver. Notes are optional."
      : checkoutStep === 2
        ? "Scan the QR or pay to the UPI ID, then attach your payment screenshot."
        : "Your invoice PDF is downloading. Keep the order ID for tracking.";

  async function onProof(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      ping("Please attach an image screenshot.");
      return;
    }
    try {
      setProof(await readImage(file));
      setProofName(file.name);
    } catch (err) {
      ping(err.message);
    }
  }

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      ping("Copy the UPI ID: " + UPI_ID);
    }
  }

  return (
    <div
      className="modal show"
      role="dialog"
      aria-labelledby="chkTitle"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) setCheckoutOpen(false);
      }}
    >
      <div className="modal-box checkout-box">
        <div className="checkout-hero">
          <div className="checkout-hero-copy">
            <small>BHR Traders · Wholesale rice</small>
            <strong>{checkoutStep === 3 ? "Thank you" : "Place your order"}</strong>
          </div>
          <button className="modal-close checkout-x" type="button" aria-label="Close" onClick={() => !busy && setCheckoutOpen(false)}>
            ×
          </button>
        </div>
        <div className="modal-head">
          <div>
            <h3 id="chkTitle">{title}</h3>
            <p className="hint">{hint}</p>
          </div>
        </div>
        <div className="chk-steps">
          {["Personal", "Payment", "Invoice"].map((label, i) => (
            <div
              className={"chk-step" + (i + 1 === checkoutStep ? " on" : "") + (i + 1 < checkoutStep ? " done" : "")}
              key={label}
            >
              <i>{i + 1 < checkoutStep ? "✓" : i + 1}</i>
              {label}
            </div>
          ))}
        </div>

        {checkoutStep === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              setCheckoutInfo({
                name: String(fd.get("name")),
                phone: String(fd.get("phone")),
                email: String(fd.get("email")),
                address: String(fd.get("address")),
                city: String(fd.get("city")),
                pincode: String(fd.get("pincode")),
                notes: String(fd.get("notes") || "").trim()
              });
              setCheckoutStep(2);
            }}
          >
            <div className="chk-grid">
              <label>
                Full name
                <input name="name" required placeholder="Your name" defaultValue={checkoutInfo?.name} />
              </label>
              <label>
                Phone
                <input name="phone" required placeholder="+91" defaultValue={checkoutInfo?.phone} />
              </label>
              <label className="full">
                Email
                <input name="email" type="email" required placeholder="you@email.com" defaultValue={checkoutInfo?.email} />
              </label>
              <label className="full">
                Delivery address
                <textarea name="address" required placeholder="Street, area, landmark" defaultValue={checkoutInfo?.address} />
              </label>
              <label>
                City
                <input name="city" required placeholder="Chennai" defaultValue={checkoutInfo?.city} />
              </label>
              <label>
                Pincode
                <input name="pincode" required pattern="[0-9]{6}" placeholder="600040" defaultValue={checkoutInfo?.pincode} />
              </label>
              <label className="full">
                Notes <span className="opt">(optional)</span>
                <textarea name="notes" placeholder="Delivery timing, shop name, GST needs…" defaultValue={checkoutInfo?.notes} />
              </label>
            </div>
            <button className="btn btn-green" type="submit" style={{ width: "100%", marginTop: 6 }}>
              Continue to payment
            </button>
          </form>
        ) : null}

        {checkoutStep === 2 ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!proof) {
                ping("Attach a payment screenshot to place the order.");
                return;
              }
              setBusy(true);
              try {
                const ok = await placeOrder({ pay: "upi", paymentProof: proof });
                if (ok) setInvoiceReady(true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="chk-items">
              {cart.map((i) => (
                <div className="chk-item" key={i.id}>
                  <img src={i.img} alt="" />
                  <div>
                    <strong>{i.title}</strong>
                    <small>
                      {i.packLabel ? i.packLabel + " · " : ""}
                      {formatInr(i.price)} × {i.qty}
                    </small>
                  </div>
                  <b>{formatInr(i.price * i.qty)}</b>
                </div>
              ))}
              <div className="chk-total">
                <span>Amount to pay</span>
                <span>{formatInr(cartSum)}</span>
              </div>
              <p className="chk-gst">Inclusive of GST · GSTIN {GSTIN}</p>
            </div>

            <div className="pay-panel">
              <div className="pay-qr">
                <img src={UPI_QR} alt={"UPI QR for " + UPI_ID} />
                <small>Scan to pay</small>
              </div>
              <div className="pay-upi">
                <p>UPI ID</p>
                <div className="upi-row">
                  <code>{UPI_ID}</code>
                  <button className="btn btn-outline" type="button" onClick={copyUpi}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="hint" style={{ marginBottom: 0 }}>
                  Pay exactly {formatInr(cartSum)}, then attach the confirmation screenshot below.
                </p>
              </div>
            </div>

            <label className={"proof-drop" + (proof ? " has" : "")}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onProof(e.target.files?.[0])}
              />
              {proof ? (
                <span className="proof-preview">
                  <img src={proof} alt="Payment screenshot preview" />
                  <span>
                    <strong>Screenshot attached</strong>
                    <small>{proofName}</small>
                  </span>
                </span>
              ) : (
                <span>
                  <strong>Attach payment screenshot</strong>
                  <small>JPG or PNG</small>
                </span>
              )}
            </label>

            {checkoutInfo ? (
              <div className="chk-ship">
                Deliver to {checkoutInfo.name} · {checkoutInfo.phone}
                <br />
                {checkoutInfo.address}, {checkoutInfo.city} - {checkoutInfo.pincode}
              </div>
            ) : null}

            <button className="btn btn-gold" type="submit" style={{ width: "100%" }} disabled={busy || !proof}>
              {busy ? "Placing order…" : "Place order"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              style={{ width: "100%", marginTop: 8 }}
              disabled={busy}
              onClick={() => setCheckoutStep(1)}
            >
              Back to details
            </button>
          </form>
        ) : null}

        {checkoutStep === 3 ? (
          <div className="chk-success">
            <div className="success-mark" aria-hidden="true">✓</div>
            <p>Thank you. Your order is confirmed and the invoice PDF is downloading.</p>
            <div className="oid-card">
              <small>Transaction / Order ID — use this to track</small>
              <div className="oid">{orderId}</div>
              {orderStatus ? <p className="hint" style={{ marginTop: 8 }}>Status: {orderStatus}</p> : null}
            </div>
            <button
              className="btn btn-gold"
              type="button"
              style={{ width: "100%" }}
              onClick={() => downloadInvoice(orderId)}
            >
              {invoiceReady ? "Download invoice again" : "Download invoice PDF"}
            </button>
            <button
              className="btn btn-green"
              type="button"
              style={{ width: "100%", marginTop: 10 }}
              onClick={() => {
                setCheckoutOpen(false);
                setTrackPrefill(orderId);
                setTrackOpen(true);
              }}
            >
              Track this order
            </button>
            <button className="btn btn-outline" type="button" style={{ width: "100%", marginTop: 8 }} onClick={() => setCheckoutOpen(false)}>
              Close
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
