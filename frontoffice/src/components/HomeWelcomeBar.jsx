import { Link } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext.jsx";
import { LOCATION_LABEL } from "../data/site.js";

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

export function HomeWelcomeBar() {
  const { customer, isLoggedIn, openLogin } = useCustomer();
  const savedAddress = formatCustomerAddress(customer);
  const loggedIn = isLoggedIn && customer?.name;

  return (
    <div className={"home-welcome-card" + (loggedIn ? " is-user" : " is-guest")}>
      <span className="home-welcome-bg" aria-hidden="true" />
      <span className="home-welcome-spark home-welcome-spark-a" aria-hidden="true">✨</span>
      <span className="home-welcome-spark home-welcome-spark-b" aria-hidden="true">🌾</span>

      {loggedIn ? (
        <span className="home-welcome-avatar" aria-hidden="true">
          {(customer.name.trim()[0] || "B").toUpperCase()}
        </span>
      ) : (
        <span className="home-welcome-avatar home-welcome-avatar-guest" aria-hidden="true">
          📍
        </span>
      )}

      <div className="home-welcome-body">
        {loggedIn ? (
          <>
            <p className="home-welcome-greet">
              Welcome, <span>{firstName(customer.name)}</span>
            </p>
            {savedAddress ? (
              <>
                <small className="home-welcome-label">Delivering to your address</small>
                <strong className="home-welcome-addr">{savedAddress}</strong>
              </>
            ) : (
              <>
                <small className="home-welcome-label">Delivery area</small>
                <strong className="home-welcome-addr">{LOCATION_LABEL}</strong>
                <Link to="/profile?tab=profile" className="home-welcome-link">
                  Add delivery address →
                </Link>
              </>
            )}
          </>
        ) : (
          <>
            <small className="home-welcome-label">Delivering to</small>
            <strong className="home-welcome-addr">{LOCATION_LABEL}</strong>
            <button type="button" className="home-welcome-link" onClick={() => openLogin({ hint: "Sign in to save your name and delivery address." })}>
              Sign in for saved address →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
