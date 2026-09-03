import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext.jsx";
import { AccountDropdownMenuItems } from "./CustomerAccountUI.jsx";

export function CustomerAccountMenu({ compact }) {
  const { customer, isLoggedIn, openLogin, logout } = useCustomer();
  const navigate = useNavigate();
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
        type="button"
        className="header-icon-btn"
        aria-label="Sign in"
        onClick={() => openLogin({ hint: "Sign in or register to view orders and profile." })}
      >
        🔐
      </button>
    );
  }

  const letter = (customer?.name || customer?.email || "U").trim().charAt(0).toUpperCase();

  function pick(tab) {
    setOpen(false);
    navigate("/profile?tab=" + tab);
  }

  return (
    <div className={"account-menu-wrap" + (compact ? " account-menu-compact" : "")} ref={wrapRef}>
      <button
        type="button"
        className="account-avatar header-icon-btn account-avatar-btn"
        aria-label="My account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {letter}
      </button>

      {open ? (
        <div className="account-dropdown account-dropdown-mobile" role="menu">
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
