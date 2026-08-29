import { GSTIN } from "../data/site.js";
import { formatInr } from "../lib/packs.js";
import { useStore } from "../context/StoreContext.jsx";
import { CartIcon } from "./Icons.jsx";

export function Toast() {
  const { toast } = useStore();
  return <div className={"toast" + (toast ? " show" : "")}>{toast}</div>;
}

export function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSum,
    cartOpen,
    setCartOpen,
    changeQty,
    removeItem,
    openCheckout
  } = useStore();

  return (
    <div
      className={"cart-drawer" + (cartOpen ? " show" : "")}
      role="dialog"
      aria-labelledby="cartTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) setCartOpen(false);
      }}
    >
      <div className="cart-panel">
        <div className="cart-head">
          <div className="cart-head-title">
            <span className="cart-head-ico" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a85e" strokeWidth="1.8">
                <path d="M6 7h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 4H2" />
                <circle cx="9" cy="20" r="1.3" />
                <circle cx="18" cy="20" r="1.3" />
              </svg>
            </span>
            <div>
              <h3 id="cartTitle">Your Cart</h3>
              <small>{cartCount} {cartCount === 1 ? "item" : "items"}</small>
            </div>
          </div>
          <button className="cart-close" type="button" aria-label="Close cart" onClick={() => setCartOpen(false)}>
            ×
          </button>
        </div>
        <div className="cart-items">
          {!cart.length ? (
            <div className="cart-empty">
              <div className="bag">
                <CartIcon />
              </div>
              <p>Your cart is empty</p>
              <span>Add rice varieties to place an order.</span>
            </div>
          ) : (
            cart.map((i) => (
              <div className="cart-row" key={i.id}>
                <img src={i.img} alt="" />
                <div>
                  <h4>{i.title}</h4>
                  <div className="meta">{i.packLabel ? i.packLabel + " · " : ""}{formatInr(i.price)} / bag</div>
                  <div className="qty-box">
                    <button type="button" onClick={() => changeQty(i.id, -1)}>−</button>
                    <span>{i.qty}</span>
                    <button type="button" onClick={() => changeQty(i.id, 1)}>+</button>
                  </div>
                  <button type="button" className="cart-remove" onClick={() => removeItem(i.id)}>
                    Remove
                  </button>
                </div>
                <div className="cart-line">{formatInr(i.price * i.qty)}</div>
              </div>
            ))
          )}
        </div>
        <div className="cart-foot">
          <div className="cart-total-box">
            <div className="cart-total">
              <span>Order total</span>
              <span>{formatInr(cartSum)}</span>
            </div>
            <small>Inclusive of GST · GSTIN {GSTIN}</small>
          </div>
          <button className="btn btn-gold" type="button" style={{ width: "100%" }} disabled={!cart.length} onClick={openCheckout}>
            Place order
          </button>
        </div>
      </div>
    </div>
  );
}
