import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { useCustomer } from "../context/CustomerContext.jsx";
import { formatInr } from "../lib/packs.js";
import { GSTIN, UPI_ID, UPI_QR } from "../data/site.js";
import { logCheckoutStart } from "../lib/visits.js";
import { customerToCheckoutInfo } from "../lib/checkoutProfile.js";
import { AccountFormField, AccountFormShell } from "../components/CustomerAccountUI.jsx";
import { CheckoutLoginGate } from "../components/CheckoutLoginGate.jsx";

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the screenshot."));
    reader.readAsDataURL(file);
  });
}

const CHECKOUT_STEPS = [
  { label: "Delivery", icon: "📍" },
  { label: "Payment", icon: "💳" },
  { label: "Invoice", icon: "📄" }
];

export function Checkout() {
  const { cart, cartSum, placeOrder, ping } = useStore();
  const { isLoggedIn, customer, openLogin } = useCustomer();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proof, setProof] = useState("");
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

  useEffect(() => {
    if (!cart.length) navigate("/cart", { replace: true });
  }, [cart.length, navigate]);

  useEffect(() => {
    if (step === 1) logCheckoutStart();
  }, [step]);

  useEffect(() => {
    if (!isLoggedIn && cart.length) {
      openLogin({ hint: "Sign in or register to place your order." });
    }
  }, [isLoggedIn, cart.length, openLogin]);

  useEffect(() => {
    if (!customer) return;
    const saved = customerToCheckoutInfo(customer);
    setForm((f) => ({
      ...f,
      name: saved.name || f.name,
      phone: saved.phone || f.phone,
      email: saved.email || f.email,
      address: saved.address || f.address,
      city: saved.city || f.city,
      pincode: saved.pincode || f.pincode
    }));
  }, [customer]);

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
      navigate(isLoggedIn ? "/profile?tab=orders" : "/track", {
        replace: true,
        state: { orderId: order.id, justPlaced: true }
      });
    }
  }

  function goBack() {
    if (step > 1) setStep(1);
    else navigate(-1);
  }

  const title = !isLoggedIn ? "Sign in required" : step === 2 ? "Pay with UPI" : "Your details";
  const hint = !isLoggedIn
    ? "Sign in or create an account to continue checkout."
    : step === 1
      ? "Confirm delivery details for your order. Notes are optional."
      : "Scan the QR, pay, and attach your payment screenshot to place the order.";

  return (
    <MobileLayout variant="checkout" hideNav>
      <div className="checkout-page-shell">
        <div className="checkout-hero">
          <div className="checkout-hero-deco" aria-hidden="true">
            <span className="checkout-hero-grain checkout-hero-grain-a">🌾</span>
            <span className="checkout-hero-grain checkout-hero-grain-b">🍚</span>
            <span className="checkout-hero-grain checkout-hero-grain-c">✨</span>
          </div>
          <button type="button" className="checkout-back" aria-label="Go back" onClick={goBack}>
            ←
          </button>
          <div className="checkout-hero-copy">
            <small>BHR Traders · Wholesale rice</small>
            <strong>Place your order</strong>
          </div>
        </div>

        <div className="checkout-head">
          <div className="checkout-head-badge" aria-hidden="true">
            {step === 2 ? "💳" : "📍"}
          </div>
          <div>
            <h2>{title}</h2>
            <p>{hint}</p>
          </div>
        </div>

        <div className={"chk-steps chk-steps-" + step} aria-label="Checkout progress">
          {CHECKOUT_STEPS.map((item, i) => (
            <div className={"chk-step" + (i + 1 === step ? " on" : "") + (i + 1 < step ? " done" : "")} key={item.label}>
              <i aria-hidden="true">{item.icon}</i>
              {item.label}
            </div>
          ))}
        </div>

        {step === 1 && !isLoggedIn ? (
          <CheckoutLoginGate
            cartCount={cart.length}
            cartSum={cartSum}
            onSignIn={(mode) =>
              openLogin({
                mode,
                hint: "Sign in or register to place your order."
              })
            }
          />
        ) : null}

        {step === 1 && isLoggedIn ? (
          <form className="checkout-details-form" onSubmit={submitDetails}>
            <div className="order-total-pill">
              <span className="order-total-pill-icon" aria-hidden="true">🛒</span>
              <span className="order-total-pill-copy">
                <strong>{formatInr(cartSum)}</strong>
                <small>{cart.length} item{cart.length === 1 ? "" : "s"} in cart</small>
              </span>
            </div>

            <AccountFormShell
              lead="Confirm your delivery details below."
              footer={
                <button type="submit" className="btn btn-gold btn-block account-form-submit" disabled={busy}>
                  {form.pay === "upi" ? "Continue to payment" : busy ? "Placing order…" : "Place order"}
                </button>
              }
            >
              <AccountFormField icon="👤" label="Full name" required>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Your name" />
              </AccountFormField>
              <AccountFormField icon="📱" label="Phone" required>
                <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required placeholder="+91" />
              </AccountFormField>
              <AccountFormField icon="✉️" label="Email" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  placeholder="you@email.com"
                  readOnly={Boolean(customer?.email)}
                  className={customer?.email ? "is-readonly" : ""}
                />
              </AccountFormField>
              <AccountFormField icon="🏠" label="Delivery address" required>
                <textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} required placeholder="Door no, street, area, landmark" />
              </AccountFormField>
              <div className="account-form-row">
                <AccountFormField icon="🌆" label="City" required>
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} required placeholder="Chennai" />
                </AccountFormField>
                <AccountFormField icon="📮" label="Pincode" required>
                  <input inputMode="numeric" pattern="[0-9]{6}" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} required placeholder="600040" />
                </AccountFormField>
              </div>
              <AccountFormField icon="📝" label="Notes" hint="Optional">
                <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Delivery timing, shop name, GST needs…" />
              </AccountFormField>

              <fieldset className="pay-options">
                <legend>Payment method</legend>
                <div className="pay-option-grid">
                  <label className={"pay-option-card" + (form.pay === "upi" ? " on" : "")}>
                    <input type="radio" name="pay" checked={form.pay === "upi"} onChange={() => update("pay", "upi")} />
                    <span className="pay-option-icon upi" aria-hidden="true">📱</span>
                    <span className="pay-option-text">
                      <strong>UPI</strong>
                      <small>Scan QR & pay instantly</small>
                    </span>
                    <span className="pay-option-check" aria-hidden="true">✓</span>
                  </label>
                  <label className={"pay-option-card" + (form.pay === "cod" ? " on" : "")}>
                    <input type="radio" name="pay" checked={form.pay === "cod"} onChange={() => update("pay", "cod")} />
                    <span className="pay-option-icon cod" aria-hidden="true">💵</span>
                    <span className="pay-option-text">
                      <strong>Cash on delivery</strong>
                      <small>Pay when order arrives</small>
                    </span>
                    <span className="pay-option-check" aria-hidden="true">✓</span>
                  </label>
                </div>
              </fieldset>
              <small className="gst-note">GSTIN {GSTIN}</small>
            </AccountFormShell>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="upi-panel checkout-pay-form">
            <div className="chk-delivery-card">
              <div className="chk-delivery-icon" aria-hidden="true">
                🚚
              </div>
              <div className="chk-delivery-body">
                <div className="chk-delivery-head">
                  <strong>Delivering to</strong>
                  <button type="button" className="link-inline" onClick={() => setStep(1)}>
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
            <button type="button" className="btn btn-outline btn-block" disabled={busy} onClick={() => finish({ pay: "cod", skipPayment: true })}>
              Cash on delivery
            </button>
          </div>
        ) : null}
      </div>
    </MobileLayout>
  );
}
