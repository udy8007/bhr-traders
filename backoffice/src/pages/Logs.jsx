import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager } from "../components/Template.jsx";

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function SeriesChart({ rows, color }) {
  const w = 720;
  const h = 200;
  const pad = { t: 24, r: 12, b: 32, l: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const max = Math.max(1, ...rows.map((r) => Number(r.count || 0)));
  const group = innerW / Math.max(rows.length, 1);
  const barW = Math.max(8, group * 0.5);
  return (
    <svg className="dash-svg" viewBox={"0 0 " + w + " " + h} role="img">
      {[0, 0.5, 1].map((t) => {
        const y = pad.t + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="#edf0f5" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#8392ab">{Math.round(max * t)}</text>
          </g>
        );
      })}
      {rows.map((r, i) => {
        const x = pad.l + group * i + group / 2;
        const vh = (Number(r.count || 0) / max) * innerH;
        return (
          <g key={r.label + i}>
            <rect x={x - barW / 2} y={pad.t + innerH - vh} width={barW} height={Math.max(vh, 2)} rx="3" fill={color} />
            <text x={x} y={h - 8} textAnchor="middle" fontSize="8" fill="#8392ab">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function MixDonut({ rows, colors }) {
  const total = Math.max(1, rows.reduce((n, r) => n + Number(r.count || 0), 0));
  const r = 36;
  const c = 2 * Math.PI * r;
  let offset = 0;
  if (!rows.length) return <p className="text-xs text-secondary mb-0">No activity yet.</p>;
  return (
    <div className="d-flex align-items-center">
      <svg className="dash-svg dash-donut-svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#eef0f3" strokeWidth="12" />
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
        <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#344767">{total}</text>
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

function RankBars({ rows, color }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.count || 0)));
  if (!rows.length) return <p className="text-xs text-secondary mb-0">No data yet.</p>;
  return (
    <div className="dash-status">
      {rows.map((r) => (
        <div className="dash-status-row" key={r.label}>
          <div className="d-flex justify-content-between text-xs mb-1">
            <span className="text-capitalize">{r.label}</span>
            <strong>{r.count}</strong>
          </div>
          <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="dash-status-bar">
            <rect width="100" height="8" rx="4" fill="#eef0f3" />
            <rect width={Math.max(4, (r.count / max) * 100)} height="8" rx="4" fill={color} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function useLog(kind, extra) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(new Date());
  const page = extra.page;
  const entity = extra.entity;
  const level = extra.level;
  function load(quiet) {
    api.logs(kind, { page, pageSize: 10, entity, level, quiet }).then((d) => {
      setData(d);
      setTick(new Date());
    }).catch((e) => setError(e.message));
  }
  useEffect(() => {
    load(false);
    const t = setInterval(() => load(true), 8000);
    return () => clearInterval(t);
  }, [kind, page, entity, level]);
  return { data, error, tick };
}

function Kpi({ label, value, icon, color }) {
  return (
    <div className="card h-100">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between">
          <div>
            <p className="text-xs text-uppercase text-secondary mb-1">{label}</p>
            <h4 className="mb-0">{value}</h4>
          </div>
          <div className={"icon icon-md icon-shape bg-gradient-" + color + " shadow-" + color + " text-center border-radius-lg"}>
            <i className="material-symbols-rounded opacity-10">{icon}</i>
          </div>
        </div>
      </div>
    </div>
  );
}

const AUDIT_ICONS = {
  login: "login",
  login_failed: "lock_person",
  create: "add_circle",
  update: "edit",
  delete: "delete",
  status: "sync",
  activate: "visibility",
  deactivate: "visibility_off"
};

function prettyField(name) {
  return String(name || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventTone(row) {
  if (row.action === "login_failed" || row.action === "delete") return "danger";
  if (row.action === "create" || row.action === "login" || row.action === "activate") return "success";
  if (row.action === "deactivate") return "secondary";
  if (row.action === "status") {
    const next = (row.changes || []).find((c) => c.field === "status")?.next || "";
    if (/resolved|delivered/i.test(next)) return "success";
    if (/pending|awaiting|cancelled/i.test(next)) return "warning";
  }
  return "info";
}

function eventStatus(row) {
  if (row.action === "status") {
    return (row.changes || []).find((c) => c.field === "status")?.next || "Updated";
  }
  const map = {
    create: "Created",
    update: "Updated",
    delete: "Removed",
    login: "Signed in",
    login_failed: "Failed",
    activate: "Activated",
    deactivate: "Deactivated"
  };
  return map[row.action] || prettyField(row.action);
}

function ChangeTree({ row }) {
  const changes = row.changes || [];
  if (!changes.length) {
    return <p className="text-xs text-secondary mb-0 mt-2">No field snapshot on this older event.</p>;
  }
  return (
    <div className="audit-tree">
      <div className="audit-root">
        <span className="audit-root-dot" />
        <strong className="text-capitalize">{row.entity}</strong>
        {row.entity_id ? <span className="text-xs text-secondary ms-1">{row.entity_id}</span> : null}
        <span className="text-xs text-secondary ms-2">{changes.length} field{changes.length === 1 ? "" : "s"}</span>
      </div>
      <ul className="audit-branches">
        {changes.map((c) => (
          <li className={"audit-leaf is-" + c.kind} key={c.field}>
            <span className={"audit-kind is-" + c.kind}>{c.kind}</span>
            <span className="audit-field">{prettyField(c.field)}</span>
            <div className="audit-values">
              {c.kind !== "added" ? <span className="audit-old" title={c.old}>{c.old || "—"}</span> : <span className="audit-empty">new</span>}
              <i className="material-symbols-rounded audit-arrow">east</i>
              {c.kind !== "removed" ? <span className="audit-new" title={c.next}>{c.next || "—"}</span> : <span className="audit-old">removed</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ErrorLog() {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const { data, error, tick } = useLog("error", { page, level: tab });
  const rows = data?.rows || [];

  function changeTab(id) {
    setTab(id);
    setPage(1);
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
        <PageHead title="Error log" small="API failures, validation issues, and system warnings" />
        <span className="analytics-live text-xs text-secondary mb-3">
          <span className="analytics-pulse" /> Live · {tick.toLocaleTimeString()}
        </span>
      </div>
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <div className="row">
        <div className="col-md-3 mb-4"><Kpi label="Total" value={data?.total ?? 0} icon="bug_report" color="danger" /></div>
        <div className="col-md-3 mb-4"><Kpi label="Today" value={data?.today ?? 0} icon="today" color="warning" /></div>
        <div className="col-md-3 mb-4"><Kpi label="Errors" value={data?.errors ?? 0} icon="error" color="danger" /></div>
        <div className="col-md-3 mb-4"><Kpi label="Warnings" value={data?.warnings ?? 0} icon="warning" color="warning" /></div>
      </div>
      <div className="row">
        <div className="col-lg-8 mb-4">
          <Card title="Last 14 days">
            <SeriesChart rows={data?.series14 || []} color="#ea0606" />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="By level">
            <MixDonut rows={data?.byLevel || []} colors={["#ea0606", "#fb8c00", "#8392ab"]} />
          </Card>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="By source">
            <RankBars rows={data?.bySource || []} color="#fb6340" />
          </Card>
        </div>
        <div className="col-lg-8 mb-4">
          <Card title="Timeline">
            <div className="d-flex flex-wrap gap-2 mb-3">
              {[
                { id: "all", label: "All" },
                { id: "error", label: "Errors" },
                { id: "warn", label: "Warnings" }
              ].map((t) => (
                <button key={t.id} type="button" className={"btn btn-sm mb-0 " + (tab === t.id ? "bg-gradient-danger" : "btn-outline-danger")} onClick={() => changeTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="log-feed">
              {rows.map((r) => (
                <div className={"log-item is-" + (r.level === "error" || Number(r.status) >= 500 ? "error" : "warn")} key={r.id}>
                  <div className={"log-icon bg-gradient-" + (r.level === "error" || Number(r.status) >= 500 ? "danger" : "warning")}>
                    <i className="material-symbols-rounded">{r.level === "error" || Number(r.status) >= 500 ? "error" : "warning"}</i>
                  </div>
                  <div>
                    <p className="text-sm mb-0 font-weight-bold">{r.message}</p>
                    <p className="text-xs text-secondary mb-0">
                      {(r.source || "api").toUpperCase()}
                      {r.status ? " · HTTP " + r.status : ""}
                      {r.path ? " · " + r.path : ""}
                      {" · " + when(r.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {!rows.length ? <p className="text-sm text-secondary mb-0">No errors recorded yet. Failed API calls will appear here.</p> : null}
            </div>
            <Pager
              page={data?.page || 1}
              setPage={setPage}
              pages={data?.pages || 1}
              pageSize={data?.pageSize || 10}
              total={data?.filtered || 0}
              start={data?.start || 0}
            />
          </Card>
        </div>
      </div>
    </>
  );
}

export function AuditLog() {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const { data, error, tick } = useLog("audit", { page, entity: tab });
  const rows = data?.rows || [];

  function changeTab(id) {
    setTab(id);
    setPage(1);
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start mb-3">
        <PageHead title="Audit log" small="Who changed what across catalog, sales, and sign-in" />
        <span className="analytics-live text-xs text-secondary mb-3">
          <span className="analytics-pulse" /> Live · {tick.toLocaleTimeString()}
        </span>
      </div>
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      <div className="row">
        <div className="col-md-3 mb-4"><Kpi label="Events" value={data?.total ?? 0} icon="history" color="info" /></div>
        <div className="col-md-3 mb-4"><Kpi label="Today" value={data?.today ?? 0} icon="today" color="success" /></div>
        <div className="col-md-3 mb-4"><Kpi label="Sign-in" value={data?.logins ?? 0} icon="login" color="primary" /></div>
        <div className="col-md-3 mb-4"><Kpi label="Sales" value={data?.sales ?? 0} icon="receipt_long" color="warning" /></div>
      </div>
      <div className="row">
        <div className="col-lg-8 mb-4">
          <Card title="Last 14 days">
            <SeriesChart rows={data?.series14 || []} color="#5e72e4" />
          </Card>
        </div>
        <div className="col-lg-4 mb-4">
          <Card title="By area">
            <MixDonut rows={data?.byEntity || []} colors={["#5e72e4", "#2dce89", "#fb6340", "#11cdef", "#7928ca"]} />
          </Card>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-4 mb-4">
          <Card title="By action">
            <RankBars rows={data?.byAction || []} color="#5e72e4" />
          </Card>
        </div>
        <div className="col-lg-8 mb-4">
          <Card title="Activity">
            <div className="d-flex flex-wrap gap-2 mb-3">
              {["all", "auth", "product", "category", "pack", "order", "enquiry"].map((t) => (
                <button key={t} type="button" className={"btn btn-sm mb-0 text-capitalize " + (tab === t ? "bg-gradient-info" : "btn-outline-info")} onClick={() => changeTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div className="log-feed">
              {rows.map((r) => (
                <div className="audit-card" key={r.id}>
                  <div className="d-flex align-items-start gap-3">
                    <div className={"log-icon bg-gradient-" + eventTone(r)}>
                      <i className="material-symbols-rounded">{AUDIT_ICONS[r.action] || "account_tree"}</i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <p className="text-sm mb-0 font-weight-bold">
                          <span className="text-capitalize">{String(r.action || "").replace("_", " ")}</span>
                          {" · "}
                          <span className="text-capitalize">{r.entity}</span>
                          {r.entity_id ? " · " + r.entity_id : ""}
                        </p>
                        <span className={"badge badge-sm bg-gradient-" + eventTone(r)}>{eventStatus(r)}</span>
                      </div>
                      <p className="text-xs text-secondary mb-2">
                        {r.actor || "system"} · {when(r.created_at)}
                      </p>
                      <ChangeTree row={r} />
                    </div>
                  </div>
                </div>
              ))}
              {!rows.length ? <p className="text-sm text-secondary mb-0">No audit events yet. Logins and admin changes will appear here.</p> : null}
            </div>
            <Pager
              page={data?.page || 1}
              setPage={setPage}
              pages={data?.pages || 1}
              pageSize={data?.pageSize || 10}
              total={data?.filtered || 0}
              start={data?.start || 0}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
