import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useCustomer } from "../context/CustomerContext.jsx";
import { formatInr } from "../lib/packs.js";
import { GSTIN, UPI_ID, UPI_QR } from "../data/site.js";
import { logCheckoutStart } from "../lib/visits.js";
import { api } from "../lib/api.js";
import { customerToCheckoutInfo, isCheckoutProfileComplete, getMissingCheckoutFields } from "../lib/checkoutProfile.js";
import { AccountFormField, AccountFormShell, AccountUserChip } from "../components/CustomerAccountUI.jsx";

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the screenshot."));
    reader.readAsDataURL(file);
  });
}

export function Checkout() {
  const { cart, cartSum, placeOrder, ping } = useStore();
  const { isLoggedIn, customer } = useCustomer();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState("");
  const [orderId, setOrderId] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Chennai",
    pincode: "",
    notes: "",
    pay: "upi"
  });

  const savedInfo = customerToCheckoutInfo(customer);
  const profileComplete = isLoggedIn && isCheckoutProfileComplete(savedInfo);
  const needsDetails = !profileComplete;
  const missingFields = isLoggedIn ? getMissingCheckoutFields(savedInfo) : ["name", "phone", "email", "address", "city", "pincode"];
  const loggedInQuick = isLoggedIn && missingFields.length > 0 && missingFields.length < 6;

  useEffect(() => {
    if (!cart.length && step < 3) navigate("/cart", { replace: true });
  }, [cart.length, step, navigate]);

  useEffect(() => {
    if (step === 1) logCheckoutStart();
  }, [step]);

  useEffect(() => {
    if (!isLoggedIn || !customer) return;
    setForm((f) => ({
      ...f,
      name: customer.name || f.name,
      phone: customer.phone || f.phone,
      email: customer.email || f.email,
      address: customer.address || f.address,
      city: customer.city || f.city,
      pincode: customer.pincode || f.pincode
    }));
  }, [isLoggedIn, customer]);

  useEffect(() => {
    if (!profileComplete || step !== 1) return;
    setStep(2);
  }, [profileComplete, step]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onProof(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      ping("Please attach an image screenshot.");
      return;
    }
    try {
      setProof(await readImage(file));
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

  async function submitDetails(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      ping("Fill all delivery details including email, city and pincode.");
      return;
    }
    if (form.pay === "upi") {
      setStep(2);
    } else {
      await finish({ pay: form.pay, skipPayment: form.pay === "cod" });
    }
  }

  async function finish(opts = {}) {
    setBusy(true);
    const order = await placeOrder(form, opts);
    setBusy(false);
    if (order) {
      setOrderId(order.id);
      setStep(3);
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

  const titles = [loggedInQuick ? "Delivery address" : needsDetails ? "Your details" : "Pay with UPI", "Pay with UPI", "Thank you"];

  return (
    <MobileLayout title={titles[step - 1]} back hideNav>
      <div className="checkout-page">
        {step === 1 && needsDetails && (
          <form className="checkout-form checkout-details-form" onSubmit={submitDetails}>
            <div className="order-total-pill">
              {cart.length} items · {formatInr(cartSum)}
            </div>

            <AccountFormShell
              lead={
                loggedInQuick
                  ? "You're signed in — just add what's missing, then continue."
                  : isLoggedIn
                    ? "Complete delivery details or save them in Delivery option."
                    : "Tell us where to deliver."
              }
              footer={
                <button type="submit" className="btn btn-gold btn-block account-form-submit" disabled={busy}>
                  Continue
                </button>
              }
            >
              {isLoggedIn ? <AccountUserChip customer={customer} /> : null}

              {loggedInQuick && missingFields.includes("address") ? (
                <div className="chk-saved-hint">
                  Delivery address not saved yet.{" "}
                  <button type="button" className="link-inline" onClick={() => navigate("/profile?tab=address")}>
                    Save in account →
                  </button>
                </div>
              ) : null}

              {missingFields.includes("name") ? (
                <AccountFormField icon="👤" label="Full name" required>
                  <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
                </AccountFormField>
              ) : null}
              {missingFields.includes("phone") ? (
                <AccountFormField icon="📱" label="Phone" required>
                  <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
                </AccountFormField>
              ) : null}
              {missingFields.includes("email") ? (
                <AccountFormField icon="✉️" label="Email" required>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required readOnly={!!customer?.email} className={customer?.email ? "is-readonly" : ""} />
                </AccountFormField>
              ) : null}
              {missingFields.includes("address") ? (
                <AccountFormField icon="🏠" label="Delivery address" required>
                  <textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} required autoFocus={loggedInQuick} />
                </AccountFormField>
              ) : null}
              {(missingFields.includes("city") || missingFields.includes("pincode")) && (
                <div className="account-form-row">
                  {missingFields.includes("city") ? (
                    <AccountFormField icon="🌆" label="City" required>
                      <input value={form.city} onChange={(e) => update("city", e.target.value)} required />
                    </AccountFormField>
                  ) : null}
                  {missingFields.includes("pincode") ? (
                    <AccountFormField icon="📮" label="Pincode" required>
                      <input inputMode="numeric" pattern="[0-9]{6}" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} required />
                    </AccountFormField>
                  ) : null}
                </div>
              )}
              <AccountFormField icon="📝" label="Notes" hint="Optional">
                <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </AccountFormField>

              <fieldset className="pay-options">
                <legend>Payment method</legend>
                <label className="radio-row">
                  <input type="radio" name="pay" checked={form.pay === "upi"} onChange={() => update("pay", "upi")} />
                  UPI
                </label>
                <label className="radio-row">
                  <input type="radio" name="pay" checked={form.pay === "cod"} onChange={() => update("pay", "cod")} />
                  Cash on delivery
                </label>
              </fieldset>
              <small className="gst-note">GSTIN {GSTIN}</small>
            </AccountFormShell>
          </form>
        )}

        {step === 2 && (
          <div className="upi-panel checkout-pay-form">
            {profileComplete ? (
              <div className="chk-delivery-card">
                <div className="chk-delivery-icon" aria-hidden="true">
                  🚚
                </div>
                <div className="chk-delivery-body">
                  <div className="chk-delivery-head">
                    <strong>Delivering to your saved address</strong>
                    <button type="button" className="link-inline" onClick={() => navigate("/profile?tab=address")}>
                      Edit
                    </button>
                  </div>
                  <p>
                    {form.name} · {form.phone}
                    <br />
                    {form.address}, {form.city} – {form.pincode}
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
              <div className="chk-items-mobile">
                {cart.map((i) => (
                  <div className="chk-item-mobile" key={i.id}>
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
              <div className="chk-total-mobile">
                <span>Amount to pay</span>
                <strong>{formatInr(cartSum)}</strong>
              </div>
            </div>

            <div className="chk-pay-card">
              <div className="chk-card-head">
                <span className="chk-card-icon pay" aria-hidden="true">
                  📱
                </span>
                <div>
                  <strong>Pay with UPI</strong>
                  <span>Scan · Pay · Upload screenshot</span>
                </div>
              </div>
              <div className="pay-steps-strip" aria-hidden="true">
                <span className="done">1 · Scan</span>
                <span className="done">2 · Pay</span>
                <span className={"on" + (proof ? " done" : "")}>3 · Upload</span>
              </div>
              <div className="upi-qr-wrap">
                <div className="pay-qr-frame">
                  <img src={UPI_QR} alt="UPI QR code" />
                </div>
                <small>Scan to pay {formatInr(cartSum)}</small>
              </div>
              <div className="upi-id-row">
                <code>{UPI_ID}</code>
                <button type="button" className="btn btn-outline btn-sm" onClick={copyUpi}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <label className={"proof-drop" + (proof ? " has" : "")}>
                <input type="file" accept="image/*" onChange={(e) => onProof(e.target.files?.[0])} />
                {proof ? (
                  <span className="proof-preview">
                    <img src={proof} alt="" />
                    <span>
                      <strong>Screenshot attached ✓</strong>
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

            <button
              type="button"
              className="btn btn-gold btn-block chk-place-btn"
              disabled={busy || !proof}
              onClick={() => finish({ pay: "upi", paymentProof: proof })}
            >
              {busy ? "Placing order…" : proof ? "Place order ✓" : "Attach screenshot to continue"}
            </button>
            {profileComplete ? (
              <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => finish({ pay: "cod", skipPayment: true })}>
                Cash on delivery
              </button>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <div className="order-success order-success-screen">
            <div className="order-success-hero-band" aria-hidden="true">
              <span>🌾</span>
              <span>🍚</span>
              <span>✨</span>
            </div>
            <div className="order-success-badge-wrap">
              <div className="order-success-ring" aria-hidden="true" />
              <div className="success-icon" aria-hidden="true">
                ✓
              </div>
            </div>
            <div className="order-success-head">
              <h2>Order placed!</h2>
              <p>Your wholesale rice order is confirmed</p>
            </div>

            <div className="order-success-journey" aria-label="Checkout complete">
              {[
                { label: "Details", icon: "📍" },
                { label: "Payment", icon: "💳" },
                { label: "Done", icon: "✓" }
              ].map((item) => (
                <div className="order-success-journey-step done" key={item.label}>
                  <i aria-hidden="true">✓</i>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="order-id-card">
              <small>Your order ID</small>
              <div className="order-success-id-row">
                <div className="order-id-box">{orderId}</div>
                <button type="button" className="order-success-copy" onClick={copyOrderId} aria-label="Copy order ID">
                  {copiedId ? "✓" : "Copy"}
                </button>
              </div>
              <p className="hint">Save this ID — use it to track your delivery anytime.</p>
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
              <button type="button" className="btn btn-gold btn-block" onClick={() => api.downloadInvoice(orderId)}>
                📄 Download invoice
              </button>
              <button
                type="button"
                className="btn btn-gold btn-block"
                onClick={() => navigate(isLoggedIn ? "/profile?tab=orders" : "/track", { state: { orderId } })}
              >
                🚚 {isLoggedIn ? "View my orders" : "Track this order"}
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={() => navigate("/shop")}>
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
