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
        className="btn btn-outline track-btn"
        type="button"
        aria-label="Sign in"
        onClick={() => openLogin({ hint: "Sign in or register to view orders and profile." })}
      >
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
