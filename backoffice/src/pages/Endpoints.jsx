import { useMemo, useState } from "react";
import { API_ENDPOINTS, AUTH } from "../data/endpoints.js";
import { PageHead } from "../components/Template.jsx";

const METHODS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"];
const AUTHS = ["all", "public", "mixed", "admin", "cron"];

export function Endpoints() {
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("ALL");
  const [auth, setAuth] = useState("all");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return API_ENDPOINTS.filter((e) => {
      if (method !== "ALL" && e.method !== method) return false;
      if (auth !== "all" && e.auth !== auth) return false;
      if (!s) return true;
      return [e.path, e.note, e.group, e.method, AUTH[e.auth]?.label].join(" ").toLowerCase().includes(s);
    });
  }, [q, method, auth]);

  const groups = [...new Set(rows.map((e) => e.group))];
  const counts = {
    all: API_ENDPOINTS.length,
    public: API_ENDPOINTS.filter((e) => e.auth === "public").length,
    mixed: API_ENDPOINTS.filter((e) => e.auth === "mixed").length,
    admin: API_ENDPOINTS.filter((e) => e.auth === "admin").length,
    cron: API_ENDPOINTS.filter((e) => e.auth === "cron").length
  };

  return (
    <div className="gform is-wide">
      <PageHead
        title="Endpoints"
        small="Every HTTP API: method, who can call it, and how to authenticate."
      />

      <section className="gform-shell mb-3">
        <div className="gform-head">
          <div>
            <p className="gform-kicker">API directory</p>
            <h4>{counts.all} routes</h4>
          </div>
          <span className="gform-badge">
            <i className="material-symbols-rounded">hub</i>
            REST
          </span>
        </div>
        <div className="ep-auth-grid">
          {Object.values(AUTH).map((a) => (
            <article key={a.id} className={"ep-auth-card is-" + a.id}>
              <strong>{a.label}</strong>
              <p>{a.hint}</p>
            </article>
          ))}
        </div>
        <p className="gform-help mb-0">
          All routes also accept <code>OPTIONS</code> for CORS. Admin calls send{" "}
          <code>Authorization: Bearer &lt;token&gt;</code> after login.
        </p>
      </section>

      <section className="gform-shell">
        <div className="gform-block">
          <p className="gform-label">HTTP method</p>
          <div className="gform-tiles gform-tiles-3">
            {METHODS.map((m) => (
              <button key={m} type="button" className={"gform-tile" + (method === m ? " is-on" : "")} onClick={() => setMethod(m)}>
                <strong>{m === "ALL" ? "All methods" : m}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="gform-block">
          <p className="gform-label">Authentication</p>
          <div className="gform-tiles gform-tiles-3">
            {AUTHS.map((id) => (
              <button key={id} type="button" className={"gform-tile" + (auth === id ? " is-on" : "")} onClick={() => setAuth(id)}>
                <strong>{id === "all" ? "All auth" : AUTH[id].label}</strong>
                <span className="ep-count">{id === "all" ? counts.all : counts[id]}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="gform-field">
          <span>Search</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Path, group, or note" />
        </label>

        {groups.map((group) => (
          <div className="ep-group" key={group}>
            <p className="gform-kicker">{group}</p>
            <div className="ep-list">
              {rows
                .filter((e) => e.group === group)
                .map((e) => (
                  <article className="ep-row" key={e.method + e.path + e.note}>
                    <span className={"ep-method is-" + e.method.toLowerCase()}>{e.method}</span>
                    <div className="ep-copy">
                      <code>{e.path}</code>
                      <p>{e.note}</p>
                    </div>
                    <span className={"ep-auth is-" + e.auth}>{AUTH[e.auth].label}</span>
                  </article>
                ))}
            </div>
          </div>
        ))}
        {!rows.length ? <p className="gform-help">No endpoints match these filters.</p> : null}
      </section>
    </div>
  );
}
