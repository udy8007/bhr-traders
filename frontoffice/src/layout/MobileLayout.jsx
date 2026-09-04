import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext.jsx";
import { logPageVisit } from "../lib/visits.js";
import { FloatingCartBar } from "../components/VisualBlocks.jsx";
import { CustomerAccountMenu } from "../components/CustomerAccountMenu.jsx";
import { HomeWelcomeBar } from "../components/HomeWelcomeBar.jsx";
import { customerLetter } from "../components/CustomerAccountUI.jsx";
import { useCustomer } from "../context/CustomerContext.jsx";
import { useRouteTransition } from "../hooks/useRouteTransition.js";
import { SITE_NAME } from "../data/site.js";

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
  if (name === "profile") {
    return active ? (
      <svg {...s}>
        <circle cx="12" cy="8.5" r="4" />
        <path d="M5 20c0-3.8 3.1-6.5 7-6.5s7 2.7 7 6.5" />
      </svg>
    ) : (
      <svg {...s}>
        <circle cx="12" cy="8.5" r="3.8" fill="none" />
        <path d="M5.5 19.5c0-3.3 2.8-5.8 6.5-5.8s6.5 2.5 6.5 5.8" fill="none" />
      </svg>
    );
  }
  return (
    <svg {...s}>
      <circle cx="12" cy="8.5" r="3.8" fill="none" />
      <path d="M5.5 19.5c0-3.3 2.8-5.8 6.5-5.8s6.5 2.5 6.5 5.8" fill="none" />
    </svg>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return <div className="toast show">{toast}</div>;
}

export function AppHeader({ title, back, variant, profileSubtitle, headerSlot }) {
  const { cartCount } = useStore();
  const { customer } = useCustomer();
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
            <HomeWelcomeBar />
          </div>
        </div>
      </header>
    );
  }

  if (variant === "profile") {
    return (
      <header className="app-header app-header-profile">
        <div className="header-gradient" />
        <div className="profile-header-stack">
          <div className="profile-header-row">
            <div className="profile-header-user">
              <span className="profile-header-avatar" aria-hidden="true">
                {customerLetter(customer)}
              </span>
              <div className="profile-header-text">
                <strong>{customer?.name || "My account"}</strong>
                <small>{profileSubtitle || customer?.email || "Signed in"}</small>
              </div>
            </div>
            <NavLink to="/cart" className="header-icon-btn" aria-label="Cart">
              🛒
              {cartCount > 0 && <span className="badge">{cartCount > 99 ? "99+" : cartCount}</span>}
            </NavLink>
          </div>
        </div>
      </header>
    );
  }

  if (variant === "shop") {
    return (
      <header className="app-header app-header-shop">
        <div className="header-gradient" />
        <span className="shop-header-deco shop-header-deco-a" aria-hidden="true">🌾</span>
        <span className="shop-header-deco shop-header-deco-b" aria-hidden="true">✨</span>
        <span className="shop-header-deco shop-header-deco-c" aria-hidden="true">🍚</span>
        <div className="shop-header-stack">
          <div className="shop-header-row">
            <div className="shop-header-brand">
              <img className="header-logo-sm" src="/images/logo.png" alt={SITE_NAME} />
              <div className="shop-header-copy">
                <h1 className="shop-header-title">Shop</h1>
                <small>Fresh rice &amp; millets</small>
              </div>
            </div>
            <NavLink to="/cart" className="header-icon-btn shop-cart-btn" aria-label="Cart">
              🛒
              {cartCount > 0 && <span className="badge">{cartCount > 99 ? "99+" : cartCount}</span>}
            </NavLink>
          </div>
          {headerSlot ? <div className="shop-header-slot">{headerSlot}</div> : null}
          <div className="shop-header-curve" aria-hidden="true" />
        </div>
      </header>
    );
  }

  if (variant === "checkout") {
    return null;
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
    { to: "/profile", label: "Profile", icon: "profile" }
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <span className="bottom-nav-glow" aria-hidden="true" />
      <span className="bottom-nav-spark bottom-nav-spark-a" aria-hidden="true">🌾</span>
      <span className="bottom-nav-spark bottom-nav-spark-b" aria-hidden="true">✨</span>
      <div className="bottom-nav-inner">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => "nav-tab nav-tab-" + t.icon + (isActive ? " active" : "")}
          >
            {({ isActive }) => (
              <>
                <span className="nav-icon-bubble">
                  <span className="nav-icon">
                    <NavIcon name={t.icon} active={isActive} />
                    {t.badge > 0 && t.icon === "cart" && (
                      <span className="nav-badge">{t.badge > 99 ? "99+" : t.badge}</span>
                    )}
                  </span>
                </span>
                <span className="nav-label">{t.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function MobileLayout({ children, title, back, hideNav, variant, profileSubtitle, headerSlot }) {
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
      <AppHeader title={title} back={back} variant={variant} profileSubtitle={profileSubtitle} headerSlot={headerSlot} />
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
