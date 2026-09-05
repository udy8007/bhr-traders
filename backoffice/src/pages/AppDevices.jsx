import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead, StatusSelect } from "../components/Template.jsx";

const DEVICE_STATUSES = ["Active", "Inactive", "Blocked"];

function statusTone(status) {
  if (status === "Active") return "success";
  if (status === "Blocked") return "danger";
  return "secondary";
}

function fmtWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fmtShort(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return iso;
  }
}

function ago(iso) {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return "Just now";
  if (ms < 3600000) return Math.floor(ms / 60000) + "m ago";
  if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago";
  return Math.floor(ms / 86400000) + "d ago";
}

function groupCount(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item) || "Unknown";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function DonutChart({ rows, colors, centerLabel }) {
  const total = Math.max(1, rows.reduce((n, r) => n + Number(r.count || 0), 0));
  const r = 36;
  const c = 2 * Math.PI * r;
  const palette = colors || ["#143524", "#c4a35a", "#1f4d32", "#8b7355", "#2a6b40", "#d4af37", "#5e6b57"];
  let offset = 0;
  if (!rows.length) return <p className="text-xs text-secondary mb-0">No data yet.</p>;
  return (
    <div className="d-flex align-items-center app-dev-donut-wrap">
      <svg className="dash-svg dash-donut-svg" viewBox="0 0 100 100" aria-hidden="true">
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
              stroke={palette[i % palette.length]}
              strokeWidth="12"
              strokeDasharray={len + " " + c}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="50" y="54" textAnchor="middle" fontSize="13" fontWeight="700" fill="#143524">
          {centerLabel ?? total}
        </text>
      </svg>
      <div className="text-xs ms-3 app-dev-legend">
        {rows.map((row, i) => (
          <p className="mb-1" key={row.label}>
            <span className="dash-dot" style={{ background: palette[i % palette.length] }} />
            {row.label} ({row.count})
          </p>
        ))}
      </div>
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

function LocationMap({ devices, selectedId, onSelect }) {
  const withLoc = devices.filter((d) => d.lastLocation?.lat != null && d.lastLocation?.lng != null);
  if (!withLoc.length) {
    return (
      <div className="app-dev-map-empty">
        <i className="material-symbols-rounded">map</i>
        <p className="text-sm text-secondary mb-0">Waiting for location reports from the app…</p>
      </div>
    );
  }

  const lats = withLoc.map((d) => d.lastLocation.lat);
  const lngs = withLoc.map((d) => d.lastLocation.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latPad = Math.max((maxLat - minLat) * 0.15, 0.005);
  const lngPad = Math.max((maxLng - minLng) * 0.15, 0.005);
  const bMinLat = minLat - latPad;
  const bMaxLat = maxLat + latPad;
  const bMinLng = minLng - lngPad;
  const bMaxLng = maxLng + lngPad;

  function px(lng) {
    return 8 + ((lng - bMinLng) / (bMaxLng - bMinLng || 1)) * 84;
  }
  function py(lat) {
    return 92 - ((lat - bMinLat) / (bMaxLat - bMinLat || 1)) * 84;
  }

  return (
    <svg className="dash-svg app-dev-map" viewBox="0 0 100 100" role="img" aria-label="Device locations">
      <defs>
        <linearGradient id="appDevMapBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eef8f1" />
          <stop offset="100%" stopColor="#f6f0e4" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="8" fill="url(#appDevMapBg)" />
      {[20, 40, 60, 80].map((y) => (
        <line key={"h" + y} x1="6" x2="94" y1={y} y2={y} stroke="#eadfc8" strokeWidth="0.4" />
      ))}
      {[20, 40, 60, 80].map((x) => (
        <line key={"v" + x} x1={x} x2={x} y1="6" y2="94" stroke="#eadfc8" strokeWidth="0.4" />
      ))}
      {withLoc.map((d) => {
        const x = px(d.lastLocation.lng);
        const y = py(d.lastLocation.lat);
        const active = selectedId === d.id;
        return (
          <g key={d.id} className="app-dev-map-pin" onClick={() => onSelect?.(d.id)} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={active ? 5.5 : 4} fill={d.online ? "#2a6b40" : "#8b7355"} stroke="#fff" strokeWidth="1.2" />
            {active ? <circle cx={x} cy={y} r="8" fill="none" stroke="#c4a35a" strokeWidth="1" opacity="0.8" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

function DeviceDetailPanel({ deviceId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    setError("");
    api.appDevice(deviceId, { quiet: true })
      .then(setDetail)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [deviceId]);

  if (!deviceId) return null;
  const d = detail?.device;

  return (
    <div className="app-dev-detail-backdrop" onClick={onClose}>
      <div className="app-dev-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="app-dev-detail-head">
          <div>
            <p className="app-dev-detail-kicker">Device detail</p>
            <h5 className="mb-0">{d?.model || d?.platform || deviceId}</h5>
            <p className="text-xs text-secondary mb-0 mt-1">{deviceId}</p>
          </div>
          <button type="button" className="app-dev-detail-close" aria-label="Close" onClick={onClose}>
            <i className="material-symbols-rounded">close</i>
          </button>
        </div>

        {loading ? <p className="text-sm text-secondary p-3 mb-0">Loading…</p> : null}
        {error ? <div className="alert alert-warning text-white mx-3">{error}</div> : null}

        {d ? (
          <div className="app-dev-detail-body">
            <div className="app-dev-detail-stats">
              <span className={"badge badge-sm bg-gradient-" + statusTone(d.status)}>{d.status || "Active"}</span>
              <span className={"app-dev-status-pill" + (d.online ? " is-online" : "")}>
                <span className="app-dev-status-dot" />
                {d.online ? "Online" : "Offline"}
              </span>
              {d.network ? <span className="app-dev-chip">{d.network}</span> : null}
              {d.appVersion ? <span className="app-dev-chip">v{d.appVersion}</span> : null}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <p className="text-xs text-secondary mb-1">Platform</p>
                <strong className="text-sm">{d.platform || "—"}</strong>
              </div>
              <div className="col-6">
                <p className="text-xs text-secondary mb-1">Device type</p>
                <strong className="text-sm">{d.device || "—"}</strong>
              </div>
              <div className="col-6">
                <p className="text-xs text-secondary mb-1">Last heartbeat</p>
                <strong className="text-sm">{ago(d.lastHeartbeatAt)}</strong>
              </div>
              <div className="col-6">
                <p className="text-xs text-secondary mb-1">Registered</p>
                <strong className="text-sm">{fmtShort(d.registeredAt)}</strong>
              </div>
            </div>

            {d.lastLocation ? (
              <div className="app-dev-detail-loc mb-3">
                <p className="text-xs text-secondary mb-1">Last location</p>
                <strong className="text-sm d-block">
                  {[d.lastLocation.city, d.lastLocation.region, d.lastLocation.country].filter(Boolean).join(", ") || "Coordinates only"}
                </strong>
                <span className="text-xs text-secondary">
                  {d.lastLocation.lat.toFixed(5)}, {d.lastLocation.lng.toFixed(5)}
                  {d.lastLocation.accuracy != null ? " · ±" + Math.round(d.lastLocation.accuracy) + "m" : ""}
                </span>
              </div>
            ) : null}

            <h6 className="text-sm mb-2">Location history</h6>
            <div className="app-dev-history">
              {(detail?.locations || []).length ? (
                detail.locations.map((loc) => (
                  <div className="app-dev-history-row" key={loc.id}>
                    <span className="app-dev-history-pin" />
                    <div>
                      <strong className="text-xs d-block">
                        {[loc.city, loc.region].filter(Boolean).join(", ") || loc.lat.toFixed(4) + ", " + loc.lng.toFixed(4)}
                      </strong>
                      <span className="text-xs text-secondary">{fmtShort(loc.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary mb-0">No location history yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function platformLabel(p) {
  const v = String(p || "").toLowerCase();
  if (v.includes("android")) return "Android";
  if (v.includes("ios") || v.includes("iphone")) return "iOS";
  if (v.includes("web")) return "Web";
  return p || "Unknown";
}

export function AppDevices() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [tick, setTick] = useState(new Date());
  const [busyId, setBusyId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [detailId, setDetailId] = useState("");

  function load(quiet) {
    api.appDevices({ quiet })
      .then((d) => {
        setData(d);
        setTick(new Date());
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load(false);
    const t = setInterval(() => load(true), 15000);
    return () => clearInterval(t);
  }, []);

  const devices = data?.devices || [];
  const stats = data?.stats || {};

  const charts = useMemo(() => {
    const onlineRows = [
      { label: "Online", count: stats.online || 0 },
      { label: "Offline", count: Math.max(0, (stats.total || 0) - (stats.online || 0)) }
    ];
    const statusRows = [
      { label: "Active", count: stats.active || 0 },
      { label: "Inactive", count: stats.inactive || 0 },
      { label: "Blocked", count: stats.blocked || 0 }
    ];
    const platformRows = groupCount(devices, (d) => platformLabel(d.platform));
    const deviceRows = groupCount(devices, (d) => d.device || "Unknown");
    const cityRows = groupCount(
      devices.filter((d) => d.lastLocation?.city),
      (d) => d.lastLocation.city
    ).slice(0, 6);
    const recencyRows = [
      { label: "< 5 min", count: 0 },
      { label: "5–30 min", count: 0 },
      { label: "30–60 min", count: 0 },
      { label: "> 1 hour", count: 0 },
      { label: "Never", count: 0 }
    ];
    devices.forEach((d) => {
      if (!d.lastHeartbeatAt) {
        recencyRows[4].count += 1;
        return;
      }
      const ms = Date.now() - new Date(d.lastHeartbeatAt).getTime();
      if (ms <= 5 * 60000) recencyRows[0].count += 1;
      else if (ms <= 30 * 60000) recencyRows[1].count += 1;
      else if (ms <= 60 * 60000) recencyRows[2].count += 1;
      else recencyRows[3].count += 1;
    });
    return { onlineRows, statusRows, platformRows, deviceRows, cityRows, recencyRows };
  }, [devices, stats]);

  async function updateStatus(id, status) {
    setBusyId(id);
    setError("");
    setOk("");
    try {
      await api.updateAppDeviceStatus(id, status);
      setOk("Device status updated to " + status + ".");
      load(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId("");
    }
  }

  const kpis = [
    { label: "Total devices", value: stats.total ?? 0, icon: "devices", tone: "is-forest" },
    { label: "Active", value: stats.active ?? 0, icon: "verified", tone: "is-gold" },
    { label: "Online now", value: stats.online ?? 0, icon: "sensors", tone: "is-forest" },
    { label: "Blocked", value: stats.blocked ?? 0, icon: "block", tone: "is-gold" }
  ];

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
        <PageHead
          title="App devices"
          small="Mobile / webview installs — update status instead of deleting records"
        />
        <div className="ms-3 mb-3 text-end">
          <span className="analytics-live text-xs text-secondary">
            <span className="analytics-pulse" /> Live · every 15s · {tick.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      {ok ? <div className="alert alert-success text-white">{ok}</div> : null}

      <div className="bhr-stat-grid mb-4">
        {kpis.map((k) => (
          <div className="card bhr-stat h-100" key={k.label}>
            <div className="card-body p-3">
              <div className="bhr-stat-top">
                <span className={"bhr-stat-icon " + k.tone}>
                  <i className="material-symbols-rounded">{k.icon}</i>
                </span>
                <p className="bhr-stat-label mb-0">{k.label}</p>
              </div>
              <h3 className="bhr-stat-value mb-0">{k.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <Card title="Live location map">
            <LocationMap devices={devices} selectedId={selectedId} onSelect={setSelectedId} />
            <p className="text-xs text-secondary mb-0 mt-2">
              Green = online · brown = offline · tap a pin to highlight
            </p>
          </Card>
        </div>
        <div className="col-lg-3 mb-4">
          <Card title="Account status">
            <DonutChart rows={charts.statusRows} colors={["#2a6b40", "#c4a35a", "#c0392b"]} />
          </Card>
        </div>
        <div className="col-lg-3 mb-4">
          <Card title="Online status">
            <DonutChart rows={charts.onlineRows} colors={["#2a6b40", "#eadfc8"]} centerLabel={stats.online ?? 0} />
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="Platforms">
            <DonutChart rows={charts.platformRows} />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Device types">
            <RankBars rows={charts.deviceRows} color="#143524" />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="Last seen">
            <RankBars rows={charts.recencyRows} color="#c4a35a" />
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-5 mb-4">
          <Card title="Top cities">
            <RankBars rows={charts.cityRows} color="#1f4d32" />
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-12 mb-4">
          <Card title="Registered devices" bodyClass="px-0 pt-0 pb-2">
            <div className="table-responsive p-0">
              <table className="table align-items-center mb-0 app-dev-table">
                <thead>
                  <tr>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-3">Device</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Online</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Location</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Heartbeat</th>
                    <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 text-end pe-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => {
                    const place = d.lastLocation
                      ? [d.lastLocation.city, d.lastLocation.region].filter(Boolean).join(", ") || "GPS"
                      : "—";
                    const active = selectedId === d.id;
                    return (
                      <tr
                        key={d.id}
                        className={active ? "app-dev-row-active" : ""}
                        onClick={() => setSelectedId(d.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="ps-3">
                          <div className="app-dev-cell-device">
                            <span className="app-dev-device-icon">
                              <i className="material-symbols-rounded">
                                {String(d.platform || "").toLowerCase().includes("ios") ? "phone_iphone" : "smartphone"}
                              </i>
                            </span>
                            <div>
                              <p className="text-xs font-weight-bold mb-0">{d.model || platformLabel(d.platform)}</p>
                              <p className="text-xxs text-secondary mb-0">{d.id.slice(0, 18)}{d.id.length > 18 ? "…" : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={"app-dev-status-pill" + (d.online ? " is-online" : "")}>
                            <span className="app-dev-status-dot" />
                            {d.online ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <StatusSelect
                            value={d.status || "Active"}
                            options={DEVICE_STATUSES}
                            onChange={(status) => updateStatus(d.id, status)}
                          />
                          {busyId === d.id ? <p className="text-xxs text-secondary mb-0 mt-1">Saving…</p> : null}
                        </td>
                        <td>
                          <p className="text-xs mb-0">{place}</p>
                        </td>
                        <td>
                          <p className="text-xs mb-0">{ago(d.lastHeartbeatAt)}</p>
                          <p className="text-xxs text-secondary mb-0">{fmtShort(d.lastHeartbeatAt)}</p>
                        </td>
                        <td className="text-end pe-3">
                          <button
                            type="button"
                            className="btn btn-link text-dark text-xs mb-0 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailId(d.id);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!devices.length ? (
                    <tr>
                      <td colSpan="5" className="ps-3 py-4">
                        <div className="app-dev-empty-inline">
                          <i className="material-symbols-rounded">phonelink_ring</i>
                          <p className="text-sm mb-0">No app devices registered yet. Devices appear after calling <code>/api/app/register</code>.</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {detailId ? <DeviceDetailPanel deviceId={detailId} onClose={() => setDetailId("")} /> : null}
    </>
  );
}
