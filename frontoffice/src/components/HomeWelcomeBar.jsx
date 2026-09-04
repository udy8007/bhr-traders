import { Link } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext.jsx";
import { LOCATION_LABEL } from "../data/site.js";
import { HeaderGlassCard } from "./HeaderDecor.jsx";

function firstName(name) {
  const part = String(name || "")
    .trim()
    .split(/\s+/)[0];
  return part || "there";
}

function formatCustomerAddress(customer) {
  if (!customer) return "";
  const parts = [customer.address, customer.city, customer.pincode].map((v) => String(v || "").trim()).filter(Boolean);
  return parts.join(", ");
}

function PinIcon() {
  return (
    <svg className="home-welcome-pin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.22" />
      <path d="M12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" fill="currentColor" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="home-welcome-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

export function HomeWelcomeBar() {
  const { customer, isLoggedIn, openLogin } = useCustomer();
  const savedAddress = formatCustomerAddress(customer);
  const loggedIn = isLoggedIn && customer?.name;
  const displayAddress = loggedIn && savedAddress ? savedAddress : LOCATION_LABEL;

  return (
    <HeaderGlassCard className={loggedIn ? "is-user" : "is-guest"}>
      <div className="home-welcome-avatar-wrap">
        {loggedIn ? (
          <>
            <span className="home-welcome-avatar-ring" aria-hidden="true" />
            <span className="home-welcome-avatar" aria-hidden="true">
              {(customer.name.trim()[0] || "B").toUpperCase()}
            </span>
          </>
        ) : (
          <span className="home-welcome-avatar home-welcome-avatar-guest" aria-hidden="true">
            <PinIcon />
          </span>
        )}
      </div>

      <div className="home-welcome-body">
        {loggedIn ? (
          <>
            <p className="home-welcome-greet">
              Welcome, <span>{firstName(customer.name)}</span>
              <span className="home-welcome-wave" aria-hidden="true">👋</span>
            </p>
            <div className="home-welcome-delivery-chip">
              <TruckIcon />
              <small className="home-welcome-label">
                {savedAddress ? "Delivering to your address" : "Delivery area"}
              </small>
            </div>
            <div className="home-welcome-addr-row">
              <PinIcon />
              <strong className="home-welcome-addr">{displayAddress}</strong>
            </div>
            {!savedAddress ? (
              <Link to="/profile?tab=profile" className="home-welcome-link">
                Add delivery address →
              </Link>
            ) : null}
          </>
        ) : (
          <>
            <div className="home-welcome-delivery-chip">
              <TruckIcon />
              <small className="home-welcome-label">Delivering to</small>
            </div>
            <div className="home-welcome-addr-row">
              <PinIcon />
              <strong className="home-welcome-addr">{LOCATION_LABEL}</strong>
            </div>
            <button type="button" className="home-welcome-link" onClick={() => openLogin({ hint: "Sign in to save your name and delivery address." })}>
              Sign in for saved address →
            </button>
          </>
        )}
      </div>
    </HeaderGlassCard>
  );
}
