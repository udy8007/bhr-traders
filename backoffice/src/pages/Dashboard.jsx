import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Card, Pager, StatusSelect, usePager } from "../components/Template.jsx";

function rupee(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const PALETTE = ["#143524", "#c4a35a", "#1f4d32", "#8b7355", "#2a6b40", "#d4af37"];

function chartPoints(rows, key, pad, innerW, innerH, max) {
  const n = Math.max(rows.length, 1);
  const group = innerW / n;
  return rows.map((r, i) => {
    const x = pad.l + group * i + group / 2;
    const y = pad.t + innerH - (Number(r[key] || 0) / max) * innerH;
    return { x, y, label: r.label };
  });
}

function toLine(pts) {
  return pts.map((p, i) => (i ? "L" : "M") + p.x + " " + p.y).join(" ");
}

function toArea(pts, base) {
  if (!pts.length) return "";
  return toLine(pts) + " L" + pts[pts.length - 1].x + " " + base + " L" + pts[0].x + " " + base + " Z";
}

function WeekChart({ rows }) {
  const w = 520;
  const h = 200;
  const pad = { t: 18, r: 10, b: 28, l: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...rows.flatMap((r) => [Number(r.count || 0), Number(r.visits || 0)]));
  const visits = chartPoints(rows, "visits", pad, innerW, innerH, max);
  const orders = chartPoints(rows, "count", pad, innerW, innerH, max);
  const base = pad.t + innerH;

  return (
    <div>
      <svg className="dash-svg" viewBox={"0 0 " + w + " " + h} role="img" aria-label="Orders and visits last 7 days">
        <defs>
          <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4a35a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c4a35a" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#143524" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#143524" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#eadfc8" />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#5e6b57">{Math.round(max * t)}</text>
            </g>
          );
        })}
        {visits.length ? <path d={toArea(visits, base)} fill="url(#gVisits)" /> : null}
        {orders.length ? <path d={toArea(orders, base)} fill="url(#gOrders)" /> : null}
        {visits.length ? <path d={toLine(visits)} fill="none" stroke="#c4a35a" strokeWidth="2.5" /> : null}
        {orders.length ? <path d={toLine(orders)} fill="none" stroke="#143524" strokeWidth="2.5" /> : null}
        {visits.map((p) => <circle key={"v" + p.label} cx={p.x} cy={p.y} r="3.5" fill="#c4a35a" stroke="#fff" strokeWidth="1.5" />)}
        {orders.map((p) => <circle key={"o" + p.label} cx={p.x} cy={p.y} r="3.5" fill="#143524" stroke="#fff" strokeWidth="1.5" />)}
        {visits.map((p) => (
          <text key={"l" + p.label} x={p.x} y={h - 8} textAnchor="middle" fontSize="9" fill="#5e6b57">{p.label}</text>
        ))}
      </svg>
      <div className="dash-legend">
        <span><i style={{ background: "#c4a35a" }} /> Visits</span>
        <span><i style={{ background: "#143524" }} /> Orders</span>
      </div>
    </div>
  );
}

function DonutChart({ live, hidden }) {
  const total = Math.max(1, live + hidden);
  const livePct = live / total;
  const r = 34;
  const c = 2 * Math.PI * r;
  const liveLen = c * livePct;
  return (
    <div className="d-flex align-items-center dash-donut">
      <svg className="dash-svg dash-donut-svg" viewBox="0 0 100 100" aria-label="Catalog health">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eadfc8" strokeWidth="12" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#c4a35a"
          strokeWidth="12"
          strokeDasharray={liveLen + " " + c}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="700" fill="#143524">{Math.round(livePct * 100)}%</text>
      </svg>
      <div className="text-xs ms-3">
        <p className="mb-1"><span className="dash-dot" style={{ background: "#c4a35a" }} /> Active ({live})</p>
        <p className="mb-0"><span className="dash-dot" style={{ background: "#eadfc8" }} /> Hidden ({hidden})</p>
      </div>
    </div>
  );
}

function StatusChart({ rows }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count || 0)));
  const colors = PALETTE;
  if (!rows.length) {
    return <p className="text-xs text-secondary mb-0">No orders placed yet.</p>;
  }
  return (
    <div className="dash-status">
      {rows.map((r, i) => (
        <div className="dash-status-row" key={r.status}>
          <div className="d-flex justify-content-between text-xs mb-1">
            <span>{r.status}</span>
            <strong>{r.count}</strong>
          </div>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eadfc8" />
            <rect width={Math.max(4, (r.count / max) * 100)} height="8" rx="4" fill={colors[i % colors.length]} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

function CityChart({ rows }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count || 0)));
  if (!rows.length) return <p className="text-xs text-secondary mb-0">No visits logged yet.</p>;
  return (
    <div className="dash-status">
      {rows.map((r) => (
        <div className="dash-status-row" key={r.city}>
          <div className="d-flex justify-content-between text-xs mb-1">
            <span>{r.city}</span>
            <strong>{r.count}</strong>
          </div>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eadfc8" />
            <rect width={Math.max(4, (r.count / max) * 100)} height="8" rx="4" fill="#c4a35a" />
          </svg>
        </div>
      ))}
    </div>
  );
}

const VISIT_TONES = ["info", "success", "warning", "primary", "danger", "dark"];

function visitTone(place) {
  let n = 0;
  String(place || "").split("").forEach((ch) => { n += ch.charCodeAt(0); });
  return VISIT_TONES[n % VISIT_TONES.length];
}

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(new Date());

  function load(quiet) {
    api.stats(quiet).then((d) => {
      setData(d);
      setTick(new Date());
    }).catch((e) => setError(e.message));
  }
  useEffect(() => {
    load(false);
    const t = setInterval(() => load(true), 5000);
    return () => clearInterval(t);
  }, []);

  async function changeStatus(id, status) {
    try {
      await api.updateOrder(id, status);
      load(true);
    } catch (e) {
      setError(e.message);
    }
  }

  const s = data?.stats || {};
  const health = data?.catalogHealth || { live: 0, hidden: 0, visitsToday: 0 };
  const cards = [
    { label: "Orders today", value: s.ordersToday ?? 0, hint: "Placed today", icon: "shopping_bag", tone: "forest", to: "/sales/orders" },
    { label: "Needs attention", value: s.needsAttention ?? 0, hint: "Awaiting payment", icon: "priority_high", tone: "gold", to: "/sales/orders" },
    { label: "Incomplete checkouts", value: s.incompleteCheckouts ?? 0, hint: "Started, not finished", icon: "shopping_cart", tone: "forest", to: "/sales/orders" },
    { label: "Net revenue", value: rupee(s.netRevenue), hint: "Excl. cancelled / pending", icon: "payments", tone: "gold", to: "/reports" },
    { label: "Visits today", value: s.visitsToday ?? 0, hint: "of " + (s.visitsTotal ?? 0) + " total", icon: "visibility", tone: "forest", to: "/reports" },
    { label: "Customers", value: s.customers ?? 0, hint: "From orders & enquiries", icon: "group", tone: "gold", to: "/sales/customers" },
    { label: "Live catalog", value: s.live ?? s.products ?? 0, hint: (s.hidden ?? 0) + " hidden", icon: "inventory_2", tone: "forest", to: "/master/products" }
  ];

  const visitPager = usePager(data?.liveVisits || [], 9);

  return (
    <>
      <div className="bhr-hero mb-4">
        <div className="bhr-hero-copy">
          <p className="bhr-hero-kicker mb-1">Wholesale rice · Chennai</p>
          <h3 className="text-white mb-1">Command centre</h3>
          <p className="text-white text-sm mb-0 opacity-8">Live snapshot of orders, traffic, and catalog health.</p>
        </div>
        <div className="bhr-hero-actions">
          <div className="bhr-hero-btns">
            <Link className="btn btn-sm bg-gradient-warning mb-0" to="/sales/orders">Review pending ({s.needsAttention ?? 0})</Link>
            <Link className="btn btn-sm btn-outline-light mb-0" to="/reports">Full analytics</Link>
            <Link className="btn btn-sm btn-outline-light mb-0" to="/master/products">Products</Link>
          </div>
          <p className="text-xs text-white mb-0 mt-2 opacity-8">
            <span className="analytics-pulse me-1" /> Live · every 5s · {tick.toLocaleTimeString()}
          </p>
        </div>
      </div>
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="bhr-stat-grid">
        {cards.map((c) => (
          <Link to={c.to} className="text-decoration-none" key={c.label}>
            <div className="card h-100 bhr-stat">
              <div className="card-body p-3">
                <div className="bhr-stat-top">
                  <div className={"bhr-stat-icon is-" + c.tone} aria-hidden="true">
                    <i className="material-symbols-rounded">{c.icon}</i>
                  </div>
                  <p className="bhr-stat-label mb-0">{c.label}</p>
                </div>
                <h4 className="bhr-stat-value mb-1">{c.value}</h4>
                <p className="mb-0 text-xs text-secondary">{c.hint}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="row">
        <div className="col-lg-5 mb-4">
          <Card title="Orders & visits — last 7 days">
            <WeekChart rows={data?.orders7d || []} />
          </Card>
        </div>
        <div className="col-lg-3 mb-4">
          <Card title="Catalog health">
            <DonutChart live={health.live} hidden={health.hidden} />
            <p className="text-xs text-secondary mb-0 mt-3">Visits today ({health.visitsToday})</p>
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Orders by status">
            <StatusChart rows={data?.ordersByStatus || []} />
          </Card>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="Top visitor cities">
            <CityChart rows={data?.topCities || []} />
          </Card>
        </div>
        <div className="col-lg-8 mb-4">
          <Card title="Recent orders" bodyClass="px-0 pt-0 pb-2">
            <div className="table-responsive p-0 d-none d-md-block">
              <table className="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Order</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Customer</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Total</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentOrders || []).map((o) => (
                    <tr key={o.id}>
                      <td className="ps-3"><p className="text-xs font-weight-bold mb-0">{o.id}</p></td>
                      <td>
                        <p className="text-xs font-weight-bold mb-0">{o.name}</p>
                        <p className="text-xs text-secondary mb-0">{o.phone}{o.email ? " · " + o.email : ""}</p>
                        <p className="text-xs text-secondary mb-0">{[o.city, o.pincode].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td><p className="text-xs mb-0">{rupee(o.total)}</p></td>
                      <td className="pe-3 dash-status-cell">
                        <StatusSelect value={o.status} onChange={(status) => changeStatus(o.id, status)} />
                      </td>
                      <td><p className="text-xs mb-0">{when(o.created_at)}</p></td>
                    </tr>
                  ))}
                  {!data?.recentOrders?.length ? (
                    <tr>
                      <td colSpan="5" className="ps-3 text-sm">No live orders yet. Place one from the shop.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="d-md-none px-3 pb-2">
              {(data?.recentOrders || []).map((o) => (
                <div className="dash-order-card" key={o.id}>
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <p className="text-xs font-weight-bold mb-0">{o.id}</p>
                      <p className="text-sm font-weight-bold mb-0">{o.name}</p>
                      <p className="text-xs text-secondary mb-0">{o.phone}{o.email ? " · " + o.email : ""}</p>
                      <p className="text-xs text-secondary mb-0">{[o.city, o.pincode].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-weight-bold mb-0">{rupee(o.total)}</p>
                      <p className="text-xs text-secondary mb-0">{when(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <StatusSelect value={o.status} onChange={(status) => changeStatus(o.id, status)} />
                  </div>
                </div>
              ))}
              {!data?.recentOrders?.length ? (
                <p className="text-sm text-secondary mb-0">No live orders yet. Place one from the shop.</p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-8 mb-4">
          <Card title="Customers">
            {(data?.customers || []).map((c) => (
              <div className="cust-row" key={c.id}>
                <div className="cust-avatar">{initials(c.name)}</div>
                <div className="cust-row-body">
                  <p className="text-sm font-weight-bold mb-0">{c.name || "Unknown"}</p>
                  <p className="text-xs text-secondary mb-0">
                    {c.phone || "—"}
                    {c.email ? " · " + c.email : ""}
                    {c.city ? " · " + c.city : ""}
                    {c.company ? " · " + c.company : ""}
                  </p>
                  <p className="text-xs text-secondary mb-0">
                    Last {c.lastKind}
                    {c.lastStatus ? " · " + c.lastStatus : ""}
                    {c.lastAt ? " · " + when(c.lastAt) : ""}
                  </p>
                </div>
                <div className="cust-row-spend">
                  <p className="text-sm font-weight-bold mb-0">{rupee(c.spend)}</p>
                  <p className="text-xs text-secondary mb-0">{c.orders} order{c.orders === 1 ? "" : "s"} · {c.enquiries} enq</p>
                </div>
              </div>
            ))}
            {!data?.customers?.length ? <p className="text-sm text-secondary mb-0">No customer records yet. Orders and enquiries will appear here.</p> : null}
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Top spenders">
            {(data?.topSpenders || []).map((c) => {
              const max = Math.max(1, ...(data.topSpenders || []).map((x) => Number(x.spend || 0)));
              return (
                <div className="dash-status-row mb-3" key={c.id}>
                  <div className="d-flex justify-content-between text-xs mb-1">
                    <span>{c.name || c.phone}</span>
                    <strong>{rupee(c.spend)}</strong>
                  </div>
                  <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
                    <rect width="100" height="8" rx="4" fill="#eadfc8" />
                    <rect width={Math.max(4, (c.spend / max) * 100)} height="8" rx="4" fill="#143524" />
                  </svg>
                </div>
              );
            })}
            {!data?.topSpenders?.length ? <p className="text-xs text-secondary mb-0">Spend appears after orders are placed.</p> : null}
          </Card>
        </div>
      </div>
      <div className="row">
        <div className="col-12 mb-4">
          <Card title="Live shop visits">
            <div className="row">
              {visitPager.slice.map((v) => (
                <div className="col-md-6 col-xl-4 mb-3" key={v.id || v.place + v.at}>
                  <div className="visit-card">
                    <div className={"visit-pin bg-gradient-" + visitTone(v.place)}>
                      <i className="material-symbols-rounded">location_on</i>
                    </div>
                    <p className="text-sm font-weight-bold mb-1">{v.place}</p>
                    <p className="text-xs text-secondary mb-0 mt-2">{when(v.at)}</p>
                  </div>
                </div>
              ))}
            </div>
            {!visitPager.slice.length ? <p className="text-sm text-secondary mb-0">Waiting for storefront traffic…</p> : null}
            <Pager {...visitPager} />
          </Card>
        </div>
      </div>
    </>
  );
}
