import { useCustomer } from "../context/CustomerContext.jsx";
import { customerLetter } from "./CustomerAccountUI.jsx";
import { HeaderGlassCard } from "./HeaderDecor.jsx";

function firstName(name) {
  const part = String(name || "")
    .trim()
    .split(/\s+/)[0];
  return part || "there";
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5" />
    </svg>
  );
}

export function ProfileHeaderBar({ subtitle }) {
  const { customer, isLoggedIn, openLogin } = useCustomer();
  const loggedIn = isLoggedIn && customer?.name;

  if (!loggedIn) {
    return (
      <HeaderGlassCard className="is-guest">
        <div className="home-welcome-avatar-wrap">
          <span className="home-welcome-avatar home-welcome-avatar-guest header-bar-icon-avatar" aria-hidden="true">
            <UserIcon />
          </span>
        </div>
        <div className="home-welcome-body">
          <p className="home-welcome-greet">My account</p>
          <div className="home-welcome-delivery-chip">
            <small className="home-welcome-label">Sign in to continue</small>
          </div>
          <strong className="home-welcome-addr">View orders, save address &amp; track deliveries</strong>
          <button type="button" className="home-welcome-link" onClick={() => openLogin()}>
            Sign in / Register →
          </button>
        </div>
      </HeaderGlassCard>
    );
  }

  const detail = subtitle || customer?.email || customer?.phone || "Signed in";

  return (
    <HeaderGlassCard className="is-user">
      <div className="home-welcome-avatar-wrap">
        <span className="home-welcome-avatar-ring" aria-hidden="true" />
        <span className="home-welcome-avatar" aria-hidden="true">
          {customerLetter(customer)}
        </span>
      </div>
      <div className="home-welcome-body">
        <p className="home-welcome-greet">
          Hello, <span>{firstName(customer.name)}</span>
          <span className="home-welcome-wave" aria-hidden="true">👋</span>
        </p>
        <div className="home-welcome-delivery-chip">
          <small className="home-welcome-label">Account</small>
        </div>
        <strong className="home-welcome-addr">{detail}</strong>
      </div>
    </HeaderGlassCard>
  );
}
