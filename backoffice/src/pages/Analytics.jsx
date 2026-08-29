import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead } from "../components/Template.jsx";

function visitWhen(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function pageLabel(path) {
  const p = String(path || "home").replace(/^#\/?/, "").replace(/^\//, "") || "home";
  const names = {
    home: "Home",
    products: "Products",
    guide: "Buying guide",
    packs: "Pack sizes",
    about: "About",
    quality: "Quality",
    shop: "Shop",
    contact: "Location",
    enquiry: "Enquiry",
    checkout: "Checkout",
    "order-placed": "Order placed"
  };
  return names[p] || p;
}

function FourteenDayChart({ rows }) {
  const w = 720;
  const h = 240;
  const pad = { t: 28, r: 12, b: 36, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...rows.map((r) => Number(r.visits || 0)));
  const group = innerW / Math.max(rows.length, 1);
  const barW = Math.max(10, group * 0.55);

  return (
    <svg className="dash-svg" viewBox={"0 0 " + w + " " + h} role="img" aria-label="Visits last 14 days">
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#eadfc8" />
            <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#5e6b57">{Math.round(max * t)}</text>
          </g>
        );
      })}
      {rows.map((r, i) => {
        const x = pad.l + group * i + group / 2;
        const vh = (Number(r.visits || 0) / max) * innerH;
        const y = pad.t + innerH - vh;
        return (
          <g key={r.label + i}>
            <rect x={x - barW / 2} y={y} width={barW} height={Math.max(vh, 2)} rx="4" fill="#c4a35a" />
            <text x={x} y={y - 6} textAnchor="middle" fontSize="10" fill="#143524">{r.visits || 0}</text>
            <text x={x} y={h - 10} textAnchor="middle" fontSize="9" fill="#5e6b57">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function HourlyChart({ rows }) {
  const w = 360;
  const h = 120;
  const pad = { t: 10, r: 4, b: 22, l: 4 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...rows.map((r) => Number(r.visits || 0)));
  const group = innerW / Math.max(rows.length, 1);

  return (
    <svg className="dash-svg" viewBox={"0 0 " + w + " " + h} role="img" aria-label="Visits by hour today">
      {rows.map((r, i) => {
        const x = pad.l + group * i + group / 2;
        const vh = (Number(r.visits || 0) / max) * innerH;
        return (
          <g key={r.label}>
            <rect x={x - 3} y={pad.t + innerH - vh} width="6" height={Math.max(vh, 1)} rx="2" fill={r.visits ? "#143524" : "#eadfc8"} />
            {i % 3 === 0 ? (
              <text x={x} y={h - 6} textAnchor="middle" fontSize="8" fill="#5e6b57">{r.label}</text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function CountryDonut({ rows }) {
  const total = Math.max(1, rows.reduce((n, r) => n + Number(r.count || 0), 0));
  const r = 36;
  const c = 2 * Math.PI * r;
  const colors = ["#143524", "#c4a35a", "#1f4d32", "#8b7355", "#2a6b40", "#d4af37", "#5e6b57", "#8d6e3d"];
  let offset = 0;
  if (!rows.length) return <p className="text-xs text-secondary mb-0">No geography yet.</p>;
  return (
    <div className="d-flex align-items-center">
      <svg className="dash-svg dash-donut-svg" viewBox="0 0 100 100" aria-label="Visits by country">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eadfc8" strokeWidth="12" />
        {rows.map((row, i) => {
          const len = (Number(row.count || 0) / total) * c;
          const el = (
            <circle
              key={row.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="12"
              strokeDasharray={len + " " + c}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#143524">{total}</text>
      </svg>
      <div className="text-xs ms-3">
        {rows.map((row, i) => (
          <p className="mb-1" key={row.label}>
            <span className="dash-dot" style={{ background: colors[i % colors.length] }} />
            {row.label} ({row.count})
          </p>
        ))}
      </div>
    </div>
  );
}

function Funnel({ rows }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count || 0)));
  return (
    <div className="dash-status">
      {rows.map((r, i) => (
        <div className="dash-status-row" key={r.label}>
          <div className="d-flex justify-content-between text-xs mb-1">
            <span>{r.label}</span>
            <strong>{r.count}</strong>
          </div>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eadfc8" />
            <rect width={Math.max(4, (r.count / max) * 100)} height="8" rx="4" fill={["#143524", "#c4a35a", "#1f4d32", "#8b7355"][i % 4]} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function RankBars({ rows, color }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count || 0)));
  if (!rows.length) return <p className="text-xs text-secondary mb-0">No data yet.</p>;
  return (
    <div className="dash-status">
      {rows.map((r) => (
        <div className="dash-status-row" key={r.label}>
          <div className="d-flex justify-content-between text-xs mb-1">
            <span>{r.label}</span>
            <strong>{r.count}</strong>
          </div>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eadfc8" />
            <rect width={Math.max(4, (r.count / max) * 100)} height="8" rx="4" fill={color} />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function Analytics() {
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

  const s = data?.stats || {};
  const kpis = [
    { label: "Total visits", value: s.visitsTotal ?? 0 },
    { label: "Visits today", value: s.visitsToday ?? 0 },
    { label: "Cities", value: s.uniqueCities ?? 0 },
    { label: "Countries", value: s.uniqueCountries ?? 0 },
    { label: "Checkouts started", value: s.checkoutStarts ?? 0 },
    { label: "Orders", value: s.orders ?? 0 }
  ];

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
        <PageHead title="Analytics" small="Storefront visitor traffic and geography" />
        <div className="ms-3 mb-3 text-end">
          <span className="analytics-live text-xs text-secondary">
            <span className="analytics-pulse" /> Live · every 5s · {tick.toLocaleTimeString()}
          </span>
        </div>
      </div>
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}

      <div className="row">
        {kpis.map((k) => (
          <div className="col-xl-2 col-md-4 col-6 mb-4" key={k.label}>
            <div className="card analytics-kpi h-100">
              <div className="card-body p-3">
                <p className="text-uppercase text-xs text-secondary mb-1 font-weight-bold">{k.label}</p>
                <h3 className="mb-0">{k.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-12 mb-4">
          <Card title="Last 14 days">
            <FourteenDayChart rows={data?.visits14d || []} />
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="Today by hour">
            <HourlyChart rows={data?.hourlyToday || []} />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Countries">
            <CountryDonut rows={data?.topCountries || []} />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Checkout funnel">
            <Funnel rows={data?.checkoutFunnel || []} />
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="Top pages">
            <RankBars rows={data?.topPages || []} color="#143524" />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Referrers">
            <RankBars rows={data?.topReferrers || []} color="#c4a35a" />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Top cities" bodyClass="px-0 pt-0 pb-2">
            <div className="table-responsive p-0">
              <table className="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-3">City</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-end pe-3">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.topCities || []).map((r) => (
                    <tr key={r.city}>
                      <td className="ps-3"><p className="text-xs mb-0">{r.city}</p></td>
                      <td className="text-end pe-3"><p className="text-xs mb-0 analytics-visit-count">{r.count}</p></td>
                    </tr>
                  ))}
                  {!data?.topCities?.length ? (
                    <tr><td colSpan="2" className="ps-3 text-sm">No visits logged yet.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-12 mb-4">
          <Card title="Recent visits" bodyClass="px-0 pt-0 pb-2">
            <div className="table-responsive p-0 analytics-recent">
              <table className="table align-items-center mb-0">
                <thead>
                  <tr>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-3">Location</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Page</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 pe-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.liveVisits || []).map((v) => (
                    <tr key={v.id}>
                      <td className="ps-3"><p className="text-xs mb-0">{v.place}</p></td>
                      <td><p className="text-xs mb-0">{pageLabel(v.path)}</p></td>
                      <td className="pe-3"><p className="text-xs text-secondary mb-0">{visitWhen(v.at)}</p></td>
                    </tr>
                  ))}
                  {!data?.liveVisits?.length ? (
                    <tr><td colSpan="3" className="ps-3 text-sm">Waiting for storefront traffic…</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
