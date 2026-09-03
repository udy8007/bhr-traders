import { useEffect, useState } from "react";
import { EMAIL, MARQUEE, NAV_LINKS, PHONE } from "../data/site.js";
import { useStore } from "../context/StoreContext.jsx";
import { CustomerAccountMenu } from "./CustomerAccountMenu.jsx";
import { CartIcon, LeafIcon } from "./Icons.jsx";

export function Topbar() {
  return (
    <div className="topbar">
      <div className="wrap">
        <span className="topbar-item">
          <LeafIcon />
          Welcome to BHR TRADERS
        </span>
        <span className="topbar-item center">
          <LeafIcon />
          Trusted Quality, Delivered with Care
        </span>
        <span className="topbar-item right">
          <a className="topbar-item" href={"mailto:" + EMAIL}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11zm1.7.7 7.05 5.1a.5.5 0 0 0 .5 0L19.3 7.2H4.7z" />
            </svg>
            {EMAIL}
          </a>
          <a className="topbar-item" href="tel:+919940338654">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.2 3.6c.5-.5 1.3-.6 1.9-.2l2.2 1.5c.6.4.8 1.2.5 1.9l-.8 1.8c-.2.4-.1.8.2 1.1 1.1 1.2 2.4 2.4 3.7 3.4.4.3.9.3 1.3.1l1.8-.7c.7-.3 1.5 0 1.9.6l1.6 2.2c.4.6.3 1.4-.2 1.9l-1.3 1.3c-.6.6-1.5.9-2.3.7-2.2-.4-5.3-2.1-8.5-5.3S4.9 8.2 4.6 6c-.2-.8.1-1.7.7-2.3l1.9-1.1z" />
            </svg>
            {PHONE}
          </a>
        </span>
      </div>
    </div>
  );
}

function hashToHref() {
  const h = location.hash || "#home";
  if (h.startsWith("#product/")) return "#products";
  return h.split("?")[0] || "#home";
}

function sectionInView() {
  if (location.hash.startsWith("#product/")) return "#products";
  const nav = document.querySelector(".navbar");
  const line = (nav?.offsetHeight || 120) + 8;
  const sections = NAV_LINKS.map((link) => {
    const el = document.getElementById(link.href.slice(1));
    return el ? { href: link.href, top: el.getBoundingClientRect().top } : null;
  })
    .filter(Boolean)
    .sort((a, b) => a.top - b.top);

  let current = sections[0]?.href || "#home";
  sections.forEach((s) => {
    if (s.top - line <= 0) current = s.href;
  });
  const doc = document.documentElement;
  if (window.innerHeight + window.scrollY >= doc.scrollHeight - 48) {
    current = sections[sections.length - 1]?.href || current;
  }
  return current;
}

export function Navbar() {
  const { cartCount, setCartOpen, menuOpen, setMenuOpen } = useStore();
  const [activeHref, setActiveHref] = useState(hashToHref);

  useEffect(() => {
    let frame = 0;
    function sync() {
      setActiveHref(sectionInView());
    }
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    }
    function onHash() {
      setActiveHref(hashToHref());
      requestAnimationFrame(sync);
    }
    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const closeNav = () => setMenuOpen(false);

  return (
    <>
      <div
        className={"nav-overlay" + (menuOpen ? " show" : "")}
        onClick={closeNav}
      />
      <header className="navbar">
        <div className="wrap nav-row">
          <button className="menu-toggle" type="button" aria-label="Open menu" onClick={() => setMenuOpen((o) => !o)}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <a className="logo" href="#home">
            <img src="images/logo.png?v=3" alt="BHR TRADERS" />
          </a>
          <ul className={"nav-links" + (menuOpen ? " open" : "")}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  className={activeHref === link.href ? "active" : ""}
                  href={link.href}
                  onClick={() => {
                    setActiveHref(link.href);
                    closeNav();
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            <CustomerAccountMenu />
            <button
              className="btn btn-green cart-btn"
              type="button"
              aria-label="Open cart"
              onClick={() => setCartOpen(true)}
            >
              <CartIcon />
              Cart
              <span className="cart-badge">{cartCount}</span>
            </button>
          </div>
        </div>
        <div className="nav-marquee" aria-label="Highlights">
          <div className="nav-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span className="nav-marquee-item" key={item + i}>
                <LeafIcon />
                {item}
              </span>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
