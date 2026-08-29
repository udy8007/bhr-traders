import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function orderIdFrom(row) {
  if (row.entity === "order" && row.entity_id && /^BHR-/i.test(String(row.entity_id))) {
    return String(row.entity_id).toUpperCase();
  }
  const blob = [row.entity_id, row.title, row.body, row.href].filter(Boolean).join(" ");
  const match = blob.match(/BHR-\d+/i);
  return match ? match[0].toUpperCase() : "";
}

function targetFor(row) {
  const orderId = orderIdFrom(row);
  if (orderId) return "/sales/orders/" + encodeURIComponent(orderId);
  if (row.entity === "enquiry" && row.entity_id) {
    return "/sales/enquiries?id=" + encodeURIComponent(row.entity_id);
  }
  if (row.entity === "review" && row.entity_id) {
    return "/sales/reviews?id=" + encodeURIComponent(row.entity_id);
  }
  const href = String(row.href || "");
  if (href.startsWith("/")) return href;
  return "/sales/orders";
}

function toneFor(row) {
  const t = (row.title + " " + (row.entity || "")).toLowerCase();
  if (t.includes("cancel")) return { icon: "cancel", color: "danger" };
  if (t.includes("order")) return { icon: "shopping_bag", color: "success" };
  if (t.includes("enquiry")) return { icon: "mail", color: "info" };
  if (t.includes("listen") || t.includes("sample") || row.entity === "ntfy") return { icon: "campaign", color: "primary" };
  return { icon: "notifications", color: "info" };
}

export function NotificationBell() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [rows, setRows] = useState([]);

  async function load() {
    try {
      const d = await api.inbox({ quiet: true });
      setUnread(d.unread || 0);
      setRows(d.rows || []);
    } catch {
      /* ignore while polling */
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function openItem(row) {
    try {
      if (!row.read) await api.readInbox(row.id, { quiet: true });
    } catch {
      /* still navigate */
    }
    setOpen(false);
    navigate(targetFor(row));
    load();
  }

  async function markAll(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.readAllInbox({ quiet: true });
      await load();
    } catch {
      /* keep panel open */
    }
  }

  async function clearAll(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.clearInbox({ quiet: true });
      await load();
    } catch {
      /* keep panel open */
    }
  }

  return (
    <li className="nav-item dropdown pe-2 d-flex align-items-center ms-3 position-relative" ref={wrapRef}>
      <a
        href="#"
        className="nav-link text-body p-0 position-relative"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        <span className={"notif-bell-btn" + (unread ? " has-unread" : "")}>
          <i className="material-symbols-rounded">notifications</i>
        </span>
        {unread ? <span className="notif-badge">{unread > 9 ? "9+" : unread}</span> : null}
      </a>
      {open ? (
        <div className="notif-panel">
          <div className="notif-head">
            <div>
              <p className="notif-head-title mb-0">Notifications</p>
              <p className="notif-head-sub mb-0">{unread ? unread + " unread" : "You're all caught up"}</p>
            </div>
            <button type="button" className="notif-close" aria-label="Close" onClick={() => setOpen(false)}>
              <i className="material-symbols-rounded">close</i>
            </button>
          </div>
          <div className="notif-actions">
            <button type="button" onClick={markAll}>Mark all read</button>
            <button type="button" onClick={clearAll}>Clear all</button>
          </div>
          <div className="notif-list">
            {rows.map((r) => {
              const tone = toneFor(r);
              return (
                <button type="button" className={"notif-card" + (r.read === true || r.read === "true" ? "" : " unread")} key={r.id} onClick={() => openItem(r)}>
                  <span className={"notif-icon bg-gradient-" + tone.color}>
                    <i className="material-symbols-rounded">{tone.icon}</i>
                  </span>
                  <span className="notif-copy">
                    <span className="notif-title">{r.title}</span>
                    <span className="notif-body">{r.body}</span>
                    <span className="notif-time">{when(r.created_at)}</span>
                  </span>
                  {r.read === true || r.read === "true" ? null : <span className="notif-dot" />}
                </button>
              );
            })}
            {!rows.length ? (
              <div className="notif-empty">
                <span className="notif-icon bg-gradient-info"><i className="material-symbols-rounded">notifications_off</i></span>
                <p className="text-sm mb-0 mt-2">No notifications yet</p>
                <p className="text-xs text-secondary mb-0">Shop events and push alerts will show here</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
