import { Children, cloneElement, isValidElement, useState } from "react";
import { api } from "../lib/api.js";
import { formatInr } from "../lib/packs.js";
import { orderStepIndex, statusTone } from "../lib/orderStatus.js";

export const ACCOUNT_MENU_ITEMS = [
  { id: "profile", label: "My Profile", icon: "👤", hint: "Name, phone & email" },
  { id: "orders", label: "My Orders", icon: "📦", hint: "Track & review purchases" },
  { id: "address", label: "Delivery option", icon: "📍", hint: "Add or update address" },
  { id: "password", label: "Change Password", icon: "🔒", hint: "Keep your account secure" }
];

export const PROFILE_TAB_META = {
  profile: { title: "My Profile", emoji: "👤", sub: "Your contact details" },
  orders: { title: "My Orders", emoji: "📦", sub: "Track deliveries & leave reviews" },
  address: { title: "Delivery option", emoji: "📍", sub: "Where we deliver your orders" },
  password: { title: "Change Password", emoji: "🔒", sub: "Update your sign-in password" }
};

export function formatOrderDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

export function customerLetter(customer) {
  return (customer?.name || customer?.email || "U").trim().charAt(0).toUpperCase();
}

export function ProfileTabHero({ tab, customer, onClose }) {
  const meta = PROFILE_TAB_META[tab] || PROFILE_TAB_META.profile;
  const letter = customerLetter(customer);
  return (
    <div className="account-tab-hero">
      <div className="account-tab-hero-avatar" aria-hidden="true">
        {letter}
      </div>
      <div className="account-tab-hero-text">
        <strong>{meta.title}</strong>
        <span>{meta.sub}</span>
        {customer?.name ? <small>Signed in as {customer.name}</small> : null}
      </div>
      {onClose ? (
        <button type="button" className="account-tab-hero-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      ) : (
        <span className="account-tab-hero-badge" aria-hidden="true">
          {meta.emoji}
        </span>
      )}
    </div>
  );
}

export function AccountUserChip({ customer }) {
  if (!customer) return null;
  return (
    <div className="account-user-chip">
      <div className="account-user-chip-avatar" aria-hidden="true">
        {customerLetter(customer)}
      </div>
      <div>
        <strong>{customer.name || "Customer"}</strong>
        <span>{customer.email}</span>
      </div>
    </div>
  );
}

function withAccountFieldInputClass(children) {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const prev = child.props.className || "";
    return cloneElement(child, {
      className: [prev, "account-field-input"].filter(Boolean).join(" ")
    });
  });
}

export function AccountFormField({ icon, label, required, hint, children }) {
  return (
    <label className="account-field">
      <span className="account-field-label">
        {label}
        {required ? <em>*</em> : null}
      </span>
      <div className="account-field-control">
        <span className="account-field-icon" aria-hidden="true">
          {icon}
        </span>
        {withAccountFieldInputClass(children)}
      </div>
      {hint ? <small className="account-field-hint">{hint}</small> : null}
    </label>
  );
}

export function AccountFormShell({ lead, children, footer }) {
  return (
    <div className="account-form-shell">
      <div className="account-form-shell-accent" aria-hidden="true" />
      {lead ? <p className="account-form-lead">{lead}</p> : null}
      <div className="account-form-fields">{children}</div>
      {footer ? <div className="account-form-actions">{footer}</div> : null}
    </div>
  );
}

export function AccountFormActions({ primaryLabel, primaryBusy, secondary, secondaryLabel }) {
  return (
    <>
      <button className="btn btn-gold btn-block account-form-submit" type="submit" disabled={primaryBusy}>
        {primaryBusy ? "Saving…" : primaryLabel}
      </button>
      {secondary ? (
        <button type="button" className="btn btn-outline account-form-secondary danger-outline" onClick={secondary}>
          {secondaryLabel}
        </button>
      ) : null}
    </>
  );
}

export function OrderStatusBadge({ status }) {
  const tone = statusTone(status);
  const short =
    /delivered/i.test(status) && !/delivering/i.test(status)
      ? "Delivered"
      : /cancelled/i.test(status)
        ? "Cancelled"
        : /dispatch|delivering/i.test(status)
          ? "On the way"
          : /pack/i.test(status)
            ? "Packing"
            : /pending|awaiting/i.test(status)
              ? "Pending"
              : "Confirmed";
  return <span className={"order-status-badge tone-" + tone}>{short}</span>;
}

export function OrderProgressStrip({ status }) {
  const step = orderStepIndex(status);
  if (step < 0) return null;
  const labels = ["Confirmed", "Packing", "Delivering", "Delivered"];
  return (
    <div className="order-progress-strip" aria-hidden="true">
      {labels.map((label, i) => (
        <span key={label} className={"order-progress-dot" + (i <= step ? " done" : "")}>
          <i />
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}

export function OrderReviewForm({ orderId, item, onDone, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api.customerReview({
        orderId,
        productId: item.productId,
        productTitle: item.title,
        rating,
        comment
      });
      onDone();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="order-review-card" onSubmit={submit}>
      <div className="order-review-card-head">
        <span className="order-review-card-icon" aria-hidden="true">
          ⭐
        </span>
        <div>
          <strong>Rate this product</strong>
          <span>{item.title}</span>
        </div>
      </div>
      <div className="pdp-star-pick star-row-lg">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={"pdp-star-btn" + (rating >= n ? " on" : "")} onClick={() => setRating(n)} aria-label={n + " stars"}>
            ★
          </button>
        ))}
      </div>
      <label>
        Your review
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the quality and packing?" required />
      </label>
      {msg ? <p className="auth-msg err">{msg}</p> : null}
      <div className="order-review-actions">
        {onCancel ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button className="btn btn-accent btn-sm" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}

export function MyOrdersPanel({ orders, loading, reviewKey, setReviewKey, onReload }) {
  if (loading) {
    return (
      <div className="account-empty-state">
        <span className="account-empty-emoji spin" aria-hidden="true">
          📦
        </span>
        <strong>Loading your orders…</strong>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="account-empty-state">
        <span className="account-empty-emoji" aria-hidden="true">
          🛒
        </span>
        <strong>No orders yet</strong>
        <p>Place an order while signed in to track delivery and leave reviews here.</p>
      </div>
    );
  }

  return (
    <div className="my-orders-list">
      {orders.map((order) => (
        <article className="my-order-card" key={order.id}>
          <div className="my-order-card-top">
            <div className="my-order-id-block">
              <span className="my-order-icon" aria-hidden="true">
                📦
              </span>
              <div>
                <strong>{order.id}</strong>
                <span>{formatOrderDate(order.created_at)}</span>
              </div>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <OrderProgressStrip status={order.status} />

          {order.status_note ? (
            <div className="my-order-status-note">
              <span aria-hidden="true">📋</span>
              <p>{order.status_note}</p>
            </div>
          ) : null}

          {order.cancel_remark || /cancelled/i.test(order.status || "") ? (
            <div className="my-order-status-note is-cancel">
              <span aria-hidden="true">ℹ️</span>
              <div>
                <strong>Cancel reason</strong>
                <p>{order.cancel_remark || "This order was cancelled. Contact us if you need help."}</p>
              </div>
            </div>
          ) : null}

          <div className="my-order-stats">
            <div className="my-order-stat">
              <small>Total</small>
              <strong>{formatInr(order.total)}</strong>
            </div>
            <div className="my-order-stat">
              <small>Payment</small>
              <strong>{order.pay || "—"}</strong>
            </div>
            <div className="my-order-stat">
              <small>Items</small>
              <strong>{order.items.length}</strong>
            </div>
          </div>

          <div className="my-order-actions">
            <button type="button" className="btn-invoice-pill" onClick={() => api.downloadInvoice(order.id)}>
              <span className="btn-invoice-pill-icon" aria-hidden="true">
                📄
              </span>
              Download invoice
            </button>
          </div>

          <ul className="my-order-items">
            {order.items.map((item) => {
              const key = order.id + "::" + item.productId;
              return (
                <li key={key} className="my-order-item-row">
                  <div className="my-order-item-main">
                    <span className="my-order-item-emoji" aria-hidden="true">
                      🌾
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        Qty {item.qty} · {formatInr(item.price)}
                      </span>
                    </div>
                  </div>
                  {order.canReview && !item.reviewed ? (
                    reviewKey === key ? (
                      <OrderReviewForm
                        orderId={order.id}
                        item={item}
                        onDone={() => {
                          setReviewKey("");
                          onReload();
                        }}
                        onCancel={() => setReviewKey("")}
                      />
                    ) : (
                      <button type="button" className="btn-review-pill" onClick={() => setReviewKey(key)}>
                        <span aria-hidden="true">⭐</span> Write review
                      </button>
                    )
                  ) : item.reviewed ? (
                    <span className="reviewed-tag">
                      <span aria-hidden="true">✓</span> Reviewed
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function AccountDropdownMenuItems({ onPick, onLogout }) {
  return (
    <>
      <div className="account-dropdown-menu">
        {ACCOUNT_MENU_ITEMS.map((item) => (
          <button key={item.id} type="button" className="account-dropdown-item" role="menuitem" onClick={() => onPick(item.id)}>
            <span className="account-dropdown-item-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="account-dropdown-item-text">
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
            <span className="account-dropdown-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>
      <div className="account-dropdown-divider" />
      <button type="button" className="account-dropdown-item danger" role="menuitem" onClick={onLogout}>
        <span className="account-dropdown-item-icon" aria-hidden="true">
          🚪
        </span>
        <span className="account-dropdown-item-text">
          <strong>Sign out</strong>
          <small>End your session</small>
        </span>
      </button>
    </>
  );
}
