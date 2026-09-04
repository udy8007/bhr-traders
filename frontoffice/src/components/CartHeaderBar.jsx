import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext.jsx";
import { formatInr } from "../lib/packs.js";
import { HeaderGlassCard } from "./HeaderDecor.jsx";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 7h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 4H2" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </svg>
  );
}

export function CartHeaderBar() {
  const { cartCount, cartSum } = useStore();
  const hasItems = cartCount > 0;

  return (
    <HeaderGlassCard className={hasItems ? "is-user" : "is-guest"}>
      <div className="home-welcome-avatar-wrap">
        {hasItems ? <span className="home-welcome-avatar-ring" aria-hidden="true" /> : null}
        <span className="home-welcome-avatar home-welcome-avatar-guest header-bar-icon-avatar" aria-hidden="true">
          <CartIcon />
        </span>
      </div>

      <div className="home-welcome-body">
        <p className="home-welcome-greet">
          Your cart
          {hasItems ? <span className="home-welcome-wave" aria-hidden="true">🛍️</span> : null}
        </p>
        {hasItems ? (
          <>
            <div className="home-welcome-delivery-chip">
              <small className="home-welcome-label">
                {cartCount} item{cartCount === 1 ? "" : "s"} ready to order
              </small>
            </div>
            <strong className="home-welcome-addr">{formatInr(cartSum)} estimated total</strong>
          </>
        ) : (
          <>
            <div className="home-welcome-delivery-chip">
              <small className="home-welcome-label">Cart is empty</small>
            </div>
            <strong className="home-welcome-addr">Add rice, millets &amp; dhall from the shop</strong>
            <Link to="/shop" className="home-welcome-link">
              Browse products →
            </Link>
          </>
        )}
      </div>
    </HeaderGlassCard>
  );
}
