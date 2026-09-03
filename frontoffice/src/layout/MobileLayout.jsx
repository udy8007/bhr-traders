import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext.jsx";
import { logPageVisit } from "../lib/visits.js";
import { FloatingCartBar } from "../components/VisualBlocks.jsx";
import { CustomerAccountMenu } from "../components/CustomerAccountMenu.jsx";
import { useRouteTransition } from "../hooks/useRouteTransition.js";
import { SITE_NAME, LOCATION_LABEL } from "../data/site.js";

function NavIcon({ name, active }) {
  const fill = active ? "currentColor" : "none";
  const s = { viewBox: "0 0 24 24", fill, stroke: "currentColor", strokeWidth: active ? "0" : "1.8" };
  if (name === "home") {
    return active ? (
      <svg {...s}><path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" /></svg>
    ) : (
      <svg {...s}><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z" /></svg>
    );
  }
  if (name === "shop") {
    return (
      <svg {...s}>
        <path d="M6 7h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 4H2" />
        {!active && <><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></>}
      </svg>
    );
  }
  if (name === "cart") {
    return (
      <svg {...s}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeWidth="1.8" fill="none" />
        <path d="M3 6h18" strokeWidth="1.8" fill="none" />
      </svg>
    );
  }
  if (name === "track") {
    return (
      <svg {...s}>
        <circle cx="12" cy="12" r="8.2" fill="none" />
        <path d="M12 7v5l3 2" fill="none" />
      </svg>
    );
  }
  return (
    <svg {...s}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" fill="none" />
    </svg>
  );
}

export function Toast() {
  const { toast } = useStore();
  return <div className={"toast" + (toast ? " show" : "")}>{toast}</div>;
}

export function AppHeader({ title, back, variant }) {
  const { cartCount } = useStore();
  const navigate = useNavigate();

  if (variant === "home") {
    return (
      <header className="app-header app-header-home">
        <div className="header-gradient" />
        <div className="home-header-stack">
          <div className="home-row home-row-top">
            <img className="header-logo-sm" src="/images/logo.png" alt={SITE_NAME} />
            <div className="home-header-actions">
              <NavLink to="/cart" className="header-icon-btn" aria-label="Cart">
                🛒
                {cartCount > 0 && <span className="badge">{cartCount > 99 ? "99+" : cartCount}</span>}
              </NavLink>
              <CustomerAccountMenu compact />
            </div>
          </div>
          <div className="home-row home-row-loc">
            <div className="home-location">
              <span className="loc-pin" aria-hidden="true">📍</span>
              <div className="home-location-text">
                <small>Delivering to</small>
                <strong>{LOCATION_LABEL}</strong>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="app-header app-header-gradient">
      <div className="header-gradient" />
      <div className="app-header-inner page-header-inner">
        {back ? (
          <button type="button" className="header-btn" aria-label="Go back" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <img className="header-logo" src="/images/logo.png" alt={SITE_NAME} />
        )}
        <h1 className="header-title">{title || SITE_NAME}</h1>
        {title !== "Cart" && (
          <NavLink to="/cart" className="header-btn cart-btn" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h15l-1.6 8.2a2 2 0 0 1-2 1.6H9.2a2 2 0 0 1-2-1.5L5 4H2" />
              <circle cx="9" cy="20" r="1.3" />
              <circle cx="18" cy="20" r="1.3" />
            </svg>
            {cartCount > 0 && <span className="badge">{cartCount > 99 ? "99+" : cartCount}</span>}
          </NavLink>
        )}
        {title === "Cart" && <span className="header-spacer" aria-hidden="true" />}
      </div>
    </header>
  );
}

export function BottomNav() {
  const { cartCount } = useStore();

  const tabs = [
    { to: "/", label: "Home", icon: "home", end: true },
    { to: "/shop", label: "Shop", icon: "shop" },
    { to: "/cart", label: "Cart", icon: "cart", badge: cartCount },
    { to: "/profile", label: "Profile", icon: "contact" }
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => "nav-tab" + (isActive ? " active" : "")}>
          {({ isActive }) => (
            <>
              <span className="nav-icon">
                <NavIcon name={t.icon} active={isActive} />
                {t.badge > 0 && t.icon === "cart" && (
                  <span className="nav-badge">{t.badge > 99 ? "99+" : t.badge}</span>
                )}
              </span>
              <span className="nav-label">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function MobileLayout({ children, title, back, hideNav, variant }) {
  const location = useLocation();
  const animClass = useRouteTransition();

  useEffect(() => {
    logPageVisit();
  }, []);

  useEffect(() => {
    const main = document.querySelector(".app-main");
    if (main) main.scrollTop = 0;
  }, [location.pathname]);

  return (
    <div className={"app-shell" + (variant === "home" ? " app-shell-home" : "")}>
      <AppHeader title={title} back={back} variant={variant} />
      <main className="app-main">
        <div className={"route-view " + animClass} key={location.pathname + location.search}>
          {children}
        </div>
      </main>
      {!hideNav && <FloatingCartBar />}
      {!hideNav && <BottomNav />}
      <Toast />
    </div>
  );
}
