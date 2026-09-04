import { useEffect, useRef, useState } from "react";
import { useCustomer } from "../context/CustomerContext.jsx";
import { AccountDropdownMenuItems } from "./CustomerAccountUI.jsx";

export function CustomerAccountMenu() {
  const { customer, isLoggedIn, openLogin, openProfile, logout } = useCustomer();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <button
        className="btn btn-outline sign-in-btn"
        type="button"
        aria-label="Sign in"
        onClick={() => openLogin({ hint: "Sign in or register to view orders and profile." })}
      >
        <span className="sign-in-btn-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
          </svg>
        </span>
        Sign in
      </button>
    );
  }

  const letter = (customer?.name || customer?.email || "U").trim().charAt(0).toUpperCase();

  function pick(tab) {
    setOpen(false);
    openProfile(tab);
  }

  return (
    <div className="account-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="account-avatar"
        aria-label="My account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {letter}
      </button>

      {open ? (
        <div className="account-dropdown" role="menu">
          <div className="account-dropdown-banner">
            <div className="account-dropdown-head">
              <div className="account-dropdown-avatar" aria-hidden="true">
                {letter}
              </div>
              <div>
                <strong>{customer?.name || "My account"}</strong>
                <span>{customer?.email}</span>
              </div>
            </div>
          </div>

          <AccountDropdownMenuItems
            onPick={pick}
            onLogout={() => {
              setOpen(false);
              logout();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
