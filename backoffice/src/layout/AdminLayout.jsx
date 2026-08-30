import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { Icon } from "../components/Template.jsx";

const MENU = [
  { type: "link", to: "/", icon: "dashboard", label: "Dashboard", end: true },
  { type: "label", label: "Master" },
  { type: "link", to: "/master/categories", icon: "category", label: "Categories" },
  { type: "link", to: "/master/packs", icon: "inventory_2", label: "Pack sizes" },
  { type: "link", to: "/master/products", icon: "table_view", label: "Products" },
  { type: "label", label: "Sales" },
  { type: "link", to: "/sales/orders", icon: "receipt_long", label: "Orders" },
  { type: "link", to: "/sales/enquiries", icon: "mail", label: "Enquiries" },
  { type: "link", to: "/sales/customers", icon: "group", label: "Customers" },
  { type: "link", to: "/sales/reviews", icon: "star", label: "Customer reviews" },
  { type: "label", label: "Reports" },
  { type: "link", to: "/reports", icon: "bar_chart", label: "Analytics", end: true },
  { type: "link", to: "/reports/download", icon: "picture_as_pdf", label: "Download report" },
  { type: "link", to: "/reports/schedule", icon: "schedule", label: "Schedule report" },
  { type: "label", label: "Log" },
  { type: "link", to: "/logs/errors", icon: "bug_report", label: "Error log" },
  { type: "link", to: "/logs/audit", icon: "history", label: "Audit log" },
  { type: "label", label: "Notification" },
  { type: "link", to: "/notifications/config", icon: "tune", label: "Notification configure" },
  { type: "link", to: "/notifications/log", icon: "campaign", label: "Notification log" },
  { type: "label", label: "Settings" },
  { type: "link", to: "/settings/password", icon: "lock", label: "Change password" },
  { type: "link", to: "/settings/backup", icon: "database", label: "DB backup" },
  { type: "link", to: "/settings/endpoints", icon: "hub", label: "Endpoints" },
  { type: "link", to: "/report-bug", icon: "bug_report", label: "Report a bug" }
];

function navTrail(pathname) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  if (path.startsWith("/master/products/") && path !== "/master/products") {
    return ["Master", path.endsWith("/new") ? "Add product" : "Edit product"];
  }
  if (path.startsWith("/sales/orders/") && path !== "/sales/orders") {
    return ["Sales", "Orders", path.split("/").pop()];
  }
  let section = "";
  let match = null;
  MENU.forEach((item) => {
    if (item.type === "label") section = item.label;
    if (item.type !== "link") return;
    if (item.to === "/" && path === "/") match = { section: "", label: item.label };
    else if (item.to !== "/" && (path === item.to || path.startsWith(item.to + "/"))) {
      match = { section, label: item.label };
    }
  });
  if (!match) return ["Dashboard"];
  return match.section ? [match.section, match.label] : [match.label];
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pinned, setPinned] = useState(false);

  function closeNav() {
    setPinned(false);
  }

  useEffect(() => {
    closeNav();
  }, [location.pathname]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1200) closeNav();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.className = "g-sidenav-show bhr-graphic" + (pinned ? " g-sidenav-pinned" : "");
    const lock = pinned && window.innerWidth < 1200;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [pinned]);

  const trail = navTrail(location.pathname);
  const pageTitle = trail[trail.length - 1] || "Dashboard";

  return (
    <>
      {pinned ? (
        <button type="button" className="bhr-sidenav-backdrop d-xl-none" aria-label="Close menu" onClick={closeNav} />
      ) : null}
      <aside className="sidenav navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl fixed-start ms-2 my-2 bhr-sidenav" id="sidenav-main">
        <div className="sidenav-header">
          <div className="bhr-sidenav-head">
            <NavLink className="bhr-brand" to="/" onClick={closeNav}>
              <span className="bhr-brand-mark">
                <img src={import.meta.env.BASE_URL + "assets/img/logo.png?v=3"} alt="BHR Traders" />
              </span>
              <span className="bhr-brand-label">Backoffice</span>
            </NavLink>
            <button type="button" className="bhr-sidenav-close d-xl-none" aria-label="Close menu" onClick={closeNav}>
              <i className="material-symbols-rounded">close</i>
            </button>
          </div>
        </div>
        <hr className="horizontal light mt-0 mb-0" />
        <div className="bhr-sidenav-scroll" id="sidenav-collapse-main">
          <ul className="navbar-nav">
            {MENU.map((item, i) => {
              if (item.type === "label") {
                return (
                  <li className="nav-item mt-3" key={item.label + i}>
                    <h6 className="ps-4 ms-2 text-uppercase text-xs font-weight-bolder bhr-nav-label">{item.label}</h6>
                  </li>
                );
              }
              return (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={closeNav}
                    className={({ isActive }) =>
                      "nav-link " + (isActive ? "active bhr-nav-active" : "bhr-nav-link")
                    }
                  >
                    <Icon name={item.icon} />
                    <span className="nav-link-text ms-1">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
      <main className="main-content position-relative max-height-vh-100 h-100 border-radius-lg">
        <nav className="navbar navbar-main navbar-expand-lg px-0 mx-3 shadow-none border-radius-xl bhr-topbar" id="navbarBlur">
          <div className="container-fluid py-1 px-2 px-sm-3 bhr-topbar-inner">
            <div className="bhr-topbar-left">
              <button
                type="button"
                className="bhr-menu-btn d-xl-none"
                aria-label={pinned ? "Close menu" : "Open menu"}
                aria-expanded={pinned}
                onClick={() => setPinned((v) => !v)}
              >
                <span className="sidenav-toggler-inner">
                  <i className="sidenav-toggler-line" />
                  <i className="sidenav-toggler-line" />
                  <i className="sidenav-toggler-line" />
                </span>
              </button>
              <NavLink className="bhr-topbar-brand d-xl-none" to="/" onClick={closeNav}>
                <img src={import.meta.env.BASE_URL + "assets/img/logo.png?v=3"} alt="BHR Traders" />
                <span>
                  <small>Backoffice</small>
                  <strong>{pageTitle}</strong>
                </span>
              </NavLink>
              <nav aria-label="breadcrumb" className="bhr-crumb d-none d-xl-block">
                <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0">
                  {trail.map((crumb, i, all) => (
                    <li
                      key={crumb}
                      className={"breadcrumb-item text-sm" + (i === all.length - 1 ? " text-dark font-weight-bold" : "")}
                      aria-current={i === all.length - 1 ? "page" : undefined}
                    >
                      {i === all.length - 1 ? crumb : <span className="opacity-5 text-dark">{crumb}</span>}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <div className="bhr-topbar-actions">
              <ul className="navbar-nav d-flex flex-row align-items-center mb-0">
                <li className="nav-item d-none d-md-flex align-items-center">
                  <span className="text-sm text-secondary bhr-topbar-email">{user?.email || ""}</span>
                </li>
                <li className="nav-item d-flex align-items-center ms-2 ms-sm-3">
                  <button
                    type="button"
                    className="btn btn-sm mb-0 bhr-logout"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <div className="container-fluid py-2 px-2 px-sm-3 bhr-page">
          <Outlet />
        </div>
      </main>
    </>
  );
}
