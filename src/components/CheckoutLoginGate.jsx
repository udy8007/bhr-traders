import { formatInr } from "../lib/packs.js";

export function CheckoutLoginGate({ cartCount, cartSum, onSignIn }) {
  return (
    <div className="checkout-login-gate">
      <div className="checkout-login-card">
        <div className="checkout-login-bg" aria-hidden="true">
          <span className="checkout-login-blob checkout-login-blob-a" />
          <span className="checkout-login-blob checkout-login-blob-b" />
        </div>
        <span className="checkout-login-spark checkout-login-spark-a" aria-hidden="true">✨</span>
        <span className="checkout-login-spark checkout-login-spark-b" aria-hidden="true">🌾</span>
        <span className="checkout-login-spark checkout-login-spark-c" aria-hidden="true">🍚</span>
        <div className="checkout-login-icon-wrap" aria-hidden="true">
          <span className="checkout-login-icon-ring" />
          <span className="checkout-login-icon">👤</span>
        </div>
        <h3>Sign in to place your order</h3>
        <p>Create a free account or sign in to checkout, track delivery, and save your address.</p>
        {cartCount > 0 ? (
          <div className="checkout-login-total">
            <span className="checkout-login-total-dot" aria-hidden="true" />
            {cartCount} item{cartCount === 1 ? "" : "s"} · {formatInr(cartSum)}
          </div>
        ) : null}
        <ul className="checkout-login-benefits">
          <li>
            <span aria-hidden="true">📦</span>
            <span>Track orders in your profile</span>
          </li>
          <li>
            <span aria-hidden="true">📍</span>
            <span>Saved delivery address</span>
          </li>
          <li>
            <span aria-hidden="true">⭐</span>
            <span>Rate products after delivery</span>
          </li>
        </ul>
        <div className="checkout-login-actions">
          <button type="button" className="checkout-login-btn checkout-login-btn-primary" onClick={() => onSignIn("signin")}>
            <span className="checkout-login-btn-icon" aria-hidden="true">🔐</span>
            <span className="checkout-login-btn-copy">
              <strong>Sign in</strong>
              <small>Welcome back</small>
            </span>
          </button>
          <button type="button" className="checkout-login-btn checkout-login-btn-secondary" onClick={() => onSignIn("register")}>
            <span className="checkout-login-btn-icon" aria-hidden="true">✨</span>
            <span className="checkout-login-btn-copy">
              <strong>Create account</strong>
              <small>Free & quick</small>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
