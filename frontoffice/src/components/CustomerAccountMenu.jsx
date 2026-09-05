import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext.jsx";
import { AccountDropdownMenuItems } from "./CustomerAccountUI.jsx";

function useDropdownPosition(open, anchorRef) {
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null);
      return;
    }
    function update() {
      const r = anchorRef.current.getBoundingClientRect();
      const width = Math.min(300, window.innerWidth - 16);
      const right = Math.max(8, window.innerWidth - r.right);
      const top = r.bottom + 8;
      const maxTop = window.innerHeight - 16;
      setPos({
        top: Math.min(top, maxTop),
        right,
        width
      });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);

  return pos;
}

export function CustomerAccountMenu({ compact }) {
  const { customer, isLoggedIn, openLogin, logout } = useCustomer();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const pos = useDropdownPosition(open, btnRef);

  useEffect(() => {
    function onDocClick(e) {
      const t = e.target;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
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

  const menu = open && pos ? (
    <div
      ref={menuRef}
      className="account-dropdown account-dropdown-mobile account-dropdown-portal"
      role="menu"
      style={{
        top: pos.top + "px",
        right: pos.right + "px",
        width: pos.width + "px"
      }}
    >
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
  ) : null;

  return (
    <div className={"account-menu-wrap" + (compact ? " account-menu-compact" : "") + (open ? " is-open" : "")} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="account-avatar header-icon-btn account-avatar-btn"
        aria-label="My account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {letter}
      </button>

      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
