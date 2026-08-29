import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager, StatusBadge, StatusSelect, usePager } from "../components/Template.jsx";
import { ORDER_STATUSES, formatInr, formatWhen, itemCount, itemLabel, isPendingPay } from "../lib/orderStatus.js";

function EnquiryStatus({ value, onChange }) {
  const current = value === "Resolved" ? "Resolved" : "Pending";
  return (
    <div className="enq-status" role="group" aria-label="Enquiry status">
      <button
        type="button"
        className={"enq-chip is-pending" + (current === "Pending" ? " is-on" : "")}
        onClick={() => current !== "Pending" && onChange("Pending")}
      >
        <i className="material-symbols-rounded">schedule</i>
        Pending
      </button>
      <button
        type="button"
        className={"enq-chip is-resolved" + (current === "Resolved" ? " is-on" : "")}
        onClick={() => current !== "Resolved" && onChange("Resolved")}
      >
        <i className="material-symbols-rounded">check_circle</i>
        Resolved
      </button>
    </div>
  );
}

function inRange(iso, range) {
  if (range === "all") return true;
  const t = new Date(iso).getTime();
  if (!t) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "today") return t >= start.getTime();
  const days = range === "7" ? 7 : 30;
  return t >= start.getTime() - (days - 1) * 86400000;
}

function exportOrdersCsv(rows) {
  const cols = ["id", "created_at", "name", "phone", "email", "city", "pincode", "items", "total", "pay", "status", "notes"];
  const lines = [cols.join(",")];
  rows.forEach((o) => {
    const rec = {
      id: o.id,
      created_at: o.created_at || "",
      name: o.name || "",
      phone: o.phone || "",
      email: o.email || "",
      city: o.city || "",
      pincode: o.pincode || "",
      items: itemLabel(o),
      total: o.total,
      pay: o.pay || "UPI",
      status: o.status || "",
      notes: o.notes || ""
    };
    lines.push(cols.map((k) => '"' + String(rec[k] ?? "").replace(/"/g, '""') + '"').join(","));
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "BHR-orders.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function Orders() {
  const [params] = useSearchParams();
  const jumpId = String(params.get("id") || "").trim();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [range, setRange] = useState("all");
  const [status, setStatus] = useState("all");

  function load() {
    api.orders().then((r) => setRows(r.orders || [])).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((o) => {
      if (!inRange(o.created_at, range)) return false;
      if (status !== "all" && o.status !== status) return false;
      if (!s) return true;
      const blob = [o.id, o.name, o.phone, o.email, o.city, o.pincode, itemLabel(o), o.notes].join(" ").toLowerCase();
      return blob.includes(s);
    });
  }, [rows, q, range, status]);

  const pager = usePager(filtered, 10);
  const pending = rows.filter((o) => isPendingPay(o.status)).length;

  useEffect(() => {
    pager.setPage(1);
  }, [q, range, status]);

  if (jumpId) return <Navigate to={"/sales/orders/" + jumpId.toUpperCase()} replace />;

  async function changeStatus(id, next) {
    try {
      await api.updateOrder(id, next);
      setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <PageHead
        title="Orders"
        small={filtered.length + " matching · " + pending + " pending verification"}
        action={
          <div className="d-flex flex-wrap gap-2">
            <div className={"input-group input-group-outline input-group-sm mb-0" + (q ? " is-filled" : "")} style={{ minWidth: 240 }}>
              <label className="form-label">Search order id, name, phone...</label>
              <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button type="button" className="btn btn-sm btn-outline-secondary mb-0" onClick={() => exportOrdersCsv(filtered)}>
              Export CSV
            </button>
          </div>
        }
      />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}

      <div className="ord-filters mb-3">
        {[
          { id: "all", label: "All dates" },
          { id: "today", label: "Today" },
          { id: "7", label: "7 days" },
          { id: "30", label: "30 days" }
        ].map((t) => (
          <button key={t.id} type="button" className={"ord-chip" + (range === t.id ? " is-on" : "")} onClick={() => setRange(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="ord-filters mb-4">
        <button type="button" className={"ord-chip" + (status === "all" ? " is-on" : "")} onClick={() => setStatus("all")}>
          All
        </button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} type="button" className={"ord-chip" + (status === s ? " is-on" : "")} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      <Card title="Orders" bodyClass="px-0 pt-0 pb-2">
        <div className="table-responsive">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Order</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Customer</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Location</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Items</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Total</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Date</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((o) => (
                <tr key={o.id}>
                  <td className="ps-3">
                    <Link className="ord-id-link" to={"/sales/orders/" + o.id}>{o.id}</Link>
                  </td>
                  <td>
                    <p className="text-xs font-weight-bold mb-0">{o.name}</p>
                    <p className="text-xs text-secondary mb-0">{o.phone}</p>
                  </td>
                  <td><p className="text-xs mb-0">{o.city}{o.pincode ? " " + o.pincode : ""}</p></td>
                  <td>
                    <Link className="ord-item-link" to={"/sales/orders/" + o.id}>
                      {itemLabel(o) || "—"}
                      <span className="text-secondary"> · {itemCount(o)}</span>
                    </Link>
                  </td>
                  <td><p className="text-xs mb-0">{formatInr(o.total)}</p></td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                  <td><p className="text-xs mb-0">{formatWhen(o.created_at)}</p></td>
                  <td className="pe-3" style={{ minWidth: 210 }}>
                    <div className="d-flex align-items-center gap-2">
                      <StatusSelect value={o.status} onChange={(next) => changeStatus(o.id, next)} />
                      <Link className="btn btn-sm btn-outline-secondary mb-0" to={"/sales/orders/" + o.id} title="Open detail">
                        <i className="material-symbols-rounded" style={{ fontSize: 16 }}>visibility</i>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!pager.slice.length ? <tr><td colSpan="8" className="ps-3 text-sm">No orders match these filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pager {...pager} />
      </Card>
    </>
  );
}

export function Enquiries() {
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    api.enquiries().then((r) => setRows(r.enquiries || [])).catch((e) => setError(e.message));
  }, []);

  async function changeStatus(id, status) {
    try {
      await api.updateEnquiry(id, status);
      setRows((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } catch (e) {
      setError(e.message);
    }
  }

  const pending = rows.filter((e) => (e.status || "Pending") !== "Resolved").length;
  const resolved = rows.length - pending;
  const shown = rows.filter((e) => {
    const st = e.status || "Pending";
    if (tab === "pending") return st !== "Resolved";
    if (tab === "resolved") return st === "Resolved";
    return true;
  });
  const mix = rows.length ? (resolved / rows.length) * 100 : 0;

  return (
    <>
      <PageHead title="Enquiries" small="Wholesale enquiries from the storefront." />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-xs text-uppercase text-secondary mb-1">Pending</p>
                  <h4 className="mb-0">{pending}</h4>
                </div>
                <div className="icon icon-md icon-shape bg-gradient-warning shadow-warning text-center border-radius-lg">
                  <i className="material-symbols-rounded opacity-10">schedule</i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-xs text-uppercase text-secondary mb-1">Resolved</p>
                  <h4 className="mb-0">{resolved}</h4>
                </div>
                <div className="icon icon-md icon-shape bg-gradient-success shadow-success text-center border-radius-lg">
                  <i className="material-symbols-rounded opacity-10">check_circle</i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <p className="text-xs text-uppercase text-secondary mb-2">Closed</p>
              <h4 className="mb-2">{Math.round(mix)}%</h4>
              <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eadfc8" />
            <rect width={Math.max(mix ? 4 : 0, mix)} height="8" rx="4" fill="#c4a35a" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Card title="Enquiries">
        <div className="d-flex flex-wrap gap-2 mb-3">
          {[
            { id: "all", label: "All (" + rows.length + ")" },
            { id: "pending", label: "Pending (" + pending + ")" },
            { id: "resolved", label: "Resolved (" + resolved + ")" }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={"btn btn-sm mb-0 " + (tab === t.id ? "bg-gradient-info" : "btn-outline-info")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="table-responsive">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">When</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Name</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Product</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Qty</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Message</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id || e.created_at}>
                  <td className="ps-3"><p className="text-xs mb-0">{new Date(e.created_at).toLocaleString()}</p></td>
                  <td>
                    <div className="d-flex align-items-center">
                      <div className="icon icon-sm icon-shape bg-gradient-info shadow text-center border-radius-md me-2">
                        <i className="material-symbols-rounded opacity-10" style={{ fontSize: 16 }}>person</i>
                      </div>
                      <div>
                        <p className="text-xs font-weight-bold mb-0">{e.name}</p>
                        <p className="text-xs text-secondary mb-0">{e.phone} · {e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><p className="text-xs mb-0">{e.product}</p></td>
                  <td><p className="text-xs mb-0">{e.qty}</p></td>
                  <td><p className="text-xs mb-0 enq-msg">{e.message}</p></td>
                  <td className="pe-3" style={{ minWidth: 220 }}>
                    <EnquiryStatus value={e.status} onChange={(status) => changeStatus(e.id, status)} />
                  </td>
                </tr>
              ))}
              {!shown.length ? <tr><td colSpan="6" className="ps-3 text-sm">No enquiries yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function rupee(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

export function Customers() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ total: 0, withOrders: 0, withEnquiries: 0 });
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.customers()
      .then((r) => {
        setRows(r.customers || []);
        setStats(r.stats || { total: 0, withOrders: 0, withEnquiries: 0 });
      })
      .catch((e) => setError(e.message));
  }, []);

  const filtered = rows.filter((c) => {
    if (!q) return true;
    const hay = [c.name, c.phone, c.email, c.city, c.address, c.company].join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });
  const pager = usePager(filtered, 10);

  return (
    <>
      <PageHead title="Customers" small="Buyers from orders and enquiries." />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-xs text-uppercase text-secondary mb-1">Customers</p>
                  <h4 className="mb-0">{stats.total}</h4>
                </div>
                <div className="icon icon-md icon-shape bg-gradient-primary shadow-primary text-center border-radius-lg">
                  <i className="material-symbols-rounded opacity-10">group</i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-xs text-uppercase text-secondary mb-1">With orders</p>
                  <h4 className="mb-0">{stats.withOrders}</h4>
                </div>
                <div className="icon icon-md icon-shape bg-gradient-success shadow-success text-center border-radius-lg">
                  <i className="material-symbols-rounded opacity-10">shopping_bag</i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-xs text-uppercase text-secondary mb-1">With enquiries</p>
                  <h4 className="mb-0">{stats.withEnquiries}</h4>
                </div>
                <div className="icon icon-md icon-shape bg-gradient-info shadow-info text-center border-radius-lg">
                  <i className="material-symbols-rounded opacity-10">mail</i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Card title="Customer list">
        <div className={"input-group input-group-outline mb-3" + (q ? " is-filled" : "")}>
          <label className="form-label">Search name, phone, email, city</label>
          <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {pager.slice.map((c) => (
          <div className="cust-row" key={c.id}>
            <div className="cust-avatar">{initials(c.name)}</div>
            <div className="flex-grow-1">
              <p className="text-sm font-weight-bold mb-0">{c.name || "Unknown"}</p>
              <p className="text-xs text-secondary mb-0">
                {c.phone || "—"}
                {c.email ? " · " + c.email : ""}
              </p>
              <p className="text-xs text-secondary mb-0">
                {[c.address, c.city, c.pincode, c.company].filter(Boolean).join(" · ") || "No address on file"}
              </p>
              <p className="text-xs text-secondary mb-0">
                Last {c.lastKind}
                {c.lastStatus ? " · " + c.lastStatus : ""}
                {c.lastAt ? " · " + new Date(c.lastAt).toLocaleString() : ""}
              </p>
            </div>
            <div className="text-end">
              <p className="text-sm font-weight-bold mb-0">{rupee(c.spend)}</p>
              <p className="text-xs text-secondary mb-0">{c.orders} order{c.orders === 1 ? "" : "s"} · {c.enquiries} enq</p>
            </div>
          </div>
        ))}
        {!pager.slice.length ? <p className="text-sm text-secondary mb-0">No customers yet. They appear from shop orders and enquiries.</p> : null}
        <Pager {...pager} />
      </Card>
    </>
  );
}

