import { useEffect, useState } from "react";
import { GSTIN, UPI_ID, UPI_QR } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { useCustomer } from "../context/CustomerContext.jsx";
import { logCheckoutStart } from "../lib/visits.js";
import { formatInr } from "../lib/packs.js";
import { customerToCheckoutInfo, isCheckoutProfileComplete, getMissingCheckoutFields, mergeCheckoutInfo } from "../lib/checkoutProfile.js";
import { AccountFormField, AccountFormShell, AccountUserChip } from "./CustomerAccountUI.jsx";

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
    downloadInvoice,
    ping,
    setTrackOpen,
    setTrackPrefill
  } = useStore();
  const { isLoggedIn, openProfile, customer } = useCustomer();
  const [proof, setProof] = useState("");
  const [proofName, setProofName] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);

  const savedInfo = customerToCheckoutInfo(customer);
  const profileComplete = isLoggedIn && isCheckoutProfileComplete(savedInfo);
  const needsDetails = !profileComplete;
  const missingFields = isLoggedIn ? getMissingCheckoutFields(savedInfo) : ["name", "phone", "email", "address", "city", "pincode"];
  const loggedInQuick = isLoggedIn && missingFields.length > 0 && missingFields.length < 6;

  useEffect(() => {
    if (!checkoutOpen) return;
    if (isLoggedIn && customer) {
      const info = customerToCheckoutInfo(customer);
      setCheckoutInfo(info);
      setCheckoutStep(isCheckoutProfileComplete(info) ? 2 : 1);
    } else {
      setCheckoutStep(1);
    }
  }, [checkoutOpen, isLoggedIn, customer, setCheckoutInfo, setCheckoutStep]);

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

  const title =
    checkoutStep === 3 ? "Order placed" : checkoutStep === 2 ? "Pay with UPI" : loggedInQuick ? "Delivery address" : "Your details";
  const hint =
    checkoutStep === 1
      ? loggedInQuick
        ? "You're signed in — just add what's missing below, then continue to payment."
        : isLoggedIn
          ? "Complete delivery details below, or save them in your profile to skip this step next time."
          : "Tell us where to deliver. Notes are optional."
      : checkoutStep === 2
        ? profileComplete
          ? "Your saved delivery details are used. Scan the QR, pay, and attach your payment screenshot to place the order."
          : "Scan the QR or pay to the UPI ID, then attach your payment screenshot to place the order."
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

  async function copyOrderId() {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1600);
    } catch {
      ping("Copy the order ID: " + orderId);
    }
  }

  const isSuccess = checkoutStep === 3;
  const isPending = /pending/i.test(orderStatus || "");

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
        <div className={"checkout-hero" + (isSuccess ? " is-success" : "")}>
          <div className="checkout-hero-copy">
            <small>BHR Traders · Wholesale rice</small>
            <strong>{isSuccess ? "Thank you" : "Place your order"}</strong>
            {isSuccess ? <span className="checkout-hero-sub">Order confirmed — invoice ready</span> : null}
          </div>
          {isSuccess ? (
            <div className="checkout-hero-deco" aria-hidden="true">
              <span>🌾</span>
              <span>🍚</span>
              <span>✨</span>
            </div>
          ) : null}
          <button className="modal-close checkout-x" type="button" aria-label="Close" onClick={() => !busy && setCheckoutOpen(false)}>
            ×
          </button>
        </div>
        {!isSuccess ? (
          <>
            <div className="modal-head">
              <div>
                <h3 id="chkTitle">{title}</h3>
                <p className="hint">{hint}</p>
              </div>
            </div>
            <div className="chk-steps">
              {[
                { label: "Delivery", icon: "📍" },
                { label: "Payment", icon: "💳" },
                { label: "Invoice", icon: "📄" }
              ].map((step, i) => (
                <div
                  className={"chk-step" + (i + 1 === checkoutStep ? " on" : "") + (i + 1 < checkoutStep ? " done" : "")}
                  key={step.label}
                >
                  <i>{i + 1 < checkoutStep ? "✓" : step.icon}</i>
                  {step.label}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {checkoutStep === 1 && needsDetails ? (
          <form
            className="checkout-details-form"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const patch = {
                name: fd.has("name") ? String(fd.get("name")) : undefined,
                phone: fd.has("phone") ? String(fd.get("phone")) : undefined,
                email: fd.has("email") ? String(fd.get("email")) : undefined,
                address: fd.has("address") ? String(fd.get("address")) : undefined,
                city: fd.has("city") ? String(fd.get("city")) : undefined,
                pincode: fd.has("pincode") ? String(fd.get("pincode")) : undefined,
                notes: String(fd.get("notes") || "").trim()
              };
              setCheckoutInfo(mergeCheckoutInfo(savedInfo || checkoutInfo, patch));
              setCheckoutStep(2);
            }}
          >
            <AccountFormShell
              lead={
                loggedInQuick
                  ? "Your account details are already saved. Complete delivery info to place the order."
                  : isLoggedIn
                    ? "Fill in delivery details, or save them under Delivery option in your account."
                    : "Tell us where to deliver. Notes are optional."
              }
              footer={
                <button className="btn btn-green btn-block account-form-submit" type="submit">
                  Continue to payment
                </button>
              }
            >
              {isLoggedIn ? <AccountUserChip customer={customer} /> : null}

              {loggedInQuick && missingFields.includes("address") ? (
                <div className="chk-saved-hint">
                  <span>Delivery address not saved yet.</span>
                  <button type="button" className="link-btn inline" onClick={() => { setCheckoutOpen(false); openProfile("address"); }}>
                    Save in account →
                  </button>
                </div>
              ) : null}

              {missingFields.includes("name") ? (
                <AccountFormField icon="👤" label="Full name" required>
                  <input name="name" required placeholder="Your name" defaultValue={checkoutInfo?.name || savedInfo?.name} />
                </AccountFormField>
              ) : null}
              {missingFields.includes("phone") ? (
                <AccountFormField icon="📱" label="Phone" required>
                  <input name="phone" required placeholder="+91" defaultValue={checkoutInfo?.phone || savedInfo?.phone} />
                </AccountFormField>
              ) : null}
              {missingFields.includes("email") ? (
                <AccountFormField icon="✉️" label="Email" required>
                  <input name="email" type="email" required placeholder="you@email.com" defaultValue={checkoutInfo?.email || savedInfo?.email} readOnly={Boolean(savedInfo?.email)} className={savedInfo?.email ? "is-readonly" : ""} />
                </AccountFormField>
              ) : null}
              {missingFields.includes("address") ? (
                <AccountFormField icon="🏠" label="Delivery address" required>
                  <textarea name="address" required rows={3} placeholder="Door no, street, area, landmark" defaultValue={checkoutInfo?.address || savedInfo?.address} autoFocus={loggedInQuick} />
                </AccountFormField>
              ) : null}
              {missingFields.includes("city") || missingFields.includes("pincode") ? (
                <div className="account-form-row">
                  {missingFields.includes("city") ? (
                    <AccountFormField icon="🌆" label="City" required>
                      <input name="city" required placeholder="Chennai" defaultValue={checkoutInfo?.city || savedInfo?.city} />
                    </AccountFormField>
                  ) : null}
                  {missingFields.includes("pincode") ? (
                    <AccountFormField icon="📮" label="Pincode" required>
                      <input name="pincode" required pattern="[0-9]{6}" placeholder="600040" defaultValue={checkoutInfo?.pincode || savedInfo?.pincode} inputMode="numeric" />
                    </AccountFormField>
                  ) : null}
                </div>
              ) : null}
              <AccountFormField icon="📝" label="Notes" hint="Optional">
                <textarea name="notes" rows={2} placeholder="Delivery timing, shop name, GST needs…" defaultValue={checkoutInfo?.notes} />
              </AccountFormField>
            </AccountFormShell>
          </form>
        ) : null}

        {checkoutStep === 2 ? (
          <form
            className="checkout-pay-form"
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
            {profileComplete && checkoutInfo ? (
              <div className="chk-delivery-card">
                <div className="chk-delivery-icon" aria-hidden="true">
                  🚚
                </div>
                <div className="chk-delivery-body">
                  <div className="chk-delivery-head">
                    <strong>Delivering to your saved address</strong>
                    <button type="button" className="link-btn inline" onClick={() => { setCheckoutOpen(false); openProfile("address"); }}>
                      Edit
                    </button>
                  </div>
                  <p>
                    {checkoutInfo.name} · {checkoutInfo.phone}
                    <br />
                    {checkoutInfo.address}, {checkoutInfo.city} – {checkoutInfo.pincode}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="chk-order-card">
              <div className="chk-card-head">
                <span className="chk-card-icon" aria-hidden="true">
                  🛒
                </span>
                <div>
                  <strong>Order summary</strong>
                  <span>
                    {cart.length} item{cart.length === 1 ? "" : "s"} · {formatInr(cartSum)}
                  </span>
                </div>
              </div>
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
              </div>
              <div className="chk-total">
                <span>Amount to pay</span>
                <span>{formatInr(cartSum)}</span>
              </div>
              <p className="chk-gst">Inclusive of GST · GSTIN {GSTIN}</p>
            </div>

            <div className="chk-pay-card">
              <div className="chk-card-head">
                <span className="chk-card-icon pay" aria-hidden="true">
                  📱
                </span>
                <div>
                  <strong>Pay with UPI</strong>
                  <span>Scan QR, pay, then upload screenshot</span>
                </div>
              </div>

              <div className="pay-steps-strip" aria-hidden="true">
                <span className="done">1 · Scan</span>
                <span className="done">2 · Pay</span>
                <span className={"on" + (proof ? " done" : "")}>3 · Upload</span>
              </div>

              <div className="pay-panel">
                <div className="pay-qr">
                  <div className="pay-qr-frame">
                    <img src={UPI_QR} alt={"UPI QR for " + UPI_ID} />
                  </div>
                  <small>Scan to pay {formatInr(cartSum)}</small>
                </div>
                <div className="pay-upi">
                  <p>UPI ID</p>
                  <div className="upi-row">
                    <code>{UPI_ID}</code>
                    <button className="btn btn-outline" type="button" onClick={copyUpi}>
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <p className="pay-upi-hint">Pay the exact amount, then attach your payment confirmation below.</p>
                </div>
              </div>

              <label className={"proof-drop" + (proof ? " has" : "")}>
                <input type="file" accept="image/*" onChange={(e) => onProof(e.target.files?.[0])} />
                {proof ? (
                  <span className="proof-preview">
                    <img src={proof} alt="Payment screenshot preview" />
                    <span>
                      <strong>Screenshot attached ✓</strong>
                      <small>{proofName}</small>
                    </span>
                  </span>
                ) : (
                  <span className="proof-empty">
                    <span className="proof-empty-icon" aria-hidden="true">
                      📷
                    </span>
                    <span>
                      <strong>Attach payment screenshot</strong>
                      <small>Tap to upload JPG or PNG</small>
                    </span>
                  </span>
                )}
              </label>
            </div>

            {!profileComplete && checkoutInfo ? (
              <div className="chk-ship-card">
                <span aria-hidden="true">📍</span>
                <p>
                  Deliver to {checkoutInfo.name} · {checkoutInfo.phone}
                  <br />
                  {checkoutInfo.address}, {checkoutInfo.city} – {checkoutInfo.pincode}
                </p>
              </div>
            ) : null}

            <button className="btn btn-gold chk-place-btn" type="submit" disabled={busy || !proof}>
              {busy ? "Placing order…" : proof ? "Place order ✓" : "Attach screenshot to continue"}
            </button>
            {needsDetails ? (
              <button className="btn btn-outline chk-back-btn" type="button" disabled={busy} onClick={() => setCheckoutStep(1)}>
                Back to delivery
              </button>
            ) : null}
          </form>
        ) : null}

        {checkoutStep === 3 ? (
          <div className="chk-success order-success-screen">
            <div className="order-success-badge-wrap">
              <div className="order-success-ring" aria-hidden="true" />
              <div className="success-mark" aria-hidden="true">
                ✓
              </div>
            </div>
            <div className="order-success-head">
              <strong>Order placed!</strong>
              <span>{isPending ? "Saved — payment pending confirmation" : "Your wholesale rice order is confirmed"}</span>
            </div>

            <div className="order-success-journey" aria-label="Checkout complete">
              {[
                { label: "Delivery", icon: "📍" },
                { label: "Payment", icon: "💳" },
                { label: "Invoice", icon: "📄" }
              ].map((item) => (
                <div className="order-success-journey-step done" key={item.label}>
                  <i aria-hidden="true">✓</i>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <p className="order-success-msg">
              {isPending
                ? "Thank you. Your order is saved as pending. Keep the order ID — we will confirm after payment."
                : "Thank you. Your order is confirmed and the invoice PDF is downloading."}
            </p>

            <div className="oid-card order-success-id">
              <small>Transaction / Order ID</small>
              <div className="order-success-id-row">
                <div className="oid">{orderId}</div>
                <button type="button" className="order-success-copy" onClick={copyOrderId} aria-label="Copy order ID">
                  {copiedId ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <span className="order-success-id-hint">Use this ID to track your delivery anytime</span>
              {orderStatus ? <p className="hint order-success-status">Status: {orderStatus}</p> : null}
            </div>

            <div className="order-success-next">
              <small>What happens next</small>
              <div className="order-success-track-strip">
                {["Confirmed", "Packing", "Delivering", "Delivered"].map((label, i) => (
                  <span className={"order-success-track-dot" + (i === 0 ? " on" : "")} key={label}>
                    <i>{i === 0 ? "✓" : i + 1}</i>
                    <small>{label}</small>
                  </span>
                ))}
              </div>
            </div>

            <div className="order-success-actions">
              <button
                className="btn btn-gold order-success-btn"
                type="button"
                onClick={() => downloadInvoice(orderId)}
              >
                📄 {invoiceReady ? "Download invoice again" : "Download invoice PDF"}
              </button>
              <button
                className="btn btn-green order-success-btn"
                type="button"
                onClick={() => {
                  setCheckoutOpen(false);
                  setTrackPrefill(orderId);
                  setTrackOpen(true);
                }}
              >
                🚚 Track this order
              </button>
              {isLoggedIn ? (
                <button
                  className="btn btn-outline order-success-btn"
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(false);
                    openProfile("orders");
                  }}
                >
                  View in my account
                </button>
              ) : null}
              <button className="btn btn-outline order-success-btn subtle" type="button" onClick={() => setCheckoutOpen(false)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
