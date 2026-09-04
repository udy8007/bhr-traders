import { Link, useNavigate } from "react-router-dom";
import { MobileLayout } from "../layout/MobileLayout.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { formatInr } from "../lib/packs.js";
import { GSTIN } from "../data/site.js";

export function Cart() {
  const { cart, cartCount, cartSum, changeQty, removeItem } = useStore();
  const navigate = useNavigate();

  return (
    <MobileLayout variant="cart">
      {!cart.length ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 4H2" />
              <circle cx="9" cy="20" r="1.3" />
              <circle cx="18" cy="20" r="1.3" />
            </svg>
          </div>
          <p>Your cart is empty</p>
          <span>Add rice varieties to place an order.</span>
          <Link to="/shop" className="btn btn-accent">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map((i) => (
              <div className="cart-item" key={i.id}>
                <img src={i.img} alt="" />
                <div className="cart-item-body">
                  <h3>{i.title}</h3>
                  <div className="meta">{i.packLabel ? i.packLabel + " · " : ""}{formatInr(i.price)} / bag</div>
                  <div className="cart-item-actions">
                    <div className="qty-box">
                      <button type="button" onClick={() => changeQty(i.id, -1)}>
                        −
                      </button>
                      <span>{i.qty}</span>
                      <button type="button" onClick={() => changeQty(i.id, 1)}>
                        +
                      </button>
                    </div>
                    <button type="button" className="link-danger" onClick={() => removeItem(i.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-line-total">{formatInr(i.price * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-row">
              <span>{cartCount} items</span>
              <strong>{formatInr(cartSum)}</strong>
            </div>
            <small className="gst-note">GSTIN {GSTIN} · Invoice on order</small>
            <button type="button" className="btn btn-accent btn-block" onClick={() => navigate("/checkout")}>
              Proceed to checkout
            </button>
          </div>
        </>
      )}
    </MobileLayout>
  );
}
