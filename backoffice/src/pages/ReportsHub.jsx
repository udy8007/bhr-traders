import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { PageHead } from "../components/Template.jsx";

const KINDS = [
  { id: "overall", label: "Overall", hint: "Catalog, orders, value, top products, visits", icon: "analytics" },
  { id: "orders", label: "Orders", hint: "Every order with customer and total", icon: "shopping_bag" },
  { id: "products", label: "Products", hint: "Full catalog with category and price", icon: "inventory_2" },
  { id: "category", label: "Category", hint: "One rice category, products and sales", icon: "grain" },
  { id: "visits", label: "Visits", hint: "Shop visits, cities, countries, times", icon: "travel_explore" }
];

function cronPreview(hour, minute, frequency) {
  const m = String(minute).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  if (frequency === "weekdays") return m + " " + h + " * * 1-5";
  if (frequency === "monthly") return m + " " + h + " 1 * *";
  return m + " " + h + " * * *";
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      className={"gform-toggle" + (on ? " is-on" : "")}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="gform-toggle-knob" />
      <span className="gform-toggle-text">{on ? "Enabled" : "Disabled"}</span>
    </button>
  );
}

function KindTiles({ kind, onKind, category, onCategory, categories }) {
  return (
    <div className="gform-block">
      <p className="gform-label">Report type</p>
      <div className="gform-tiles">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={"gform-tile" + (kind === k.id ? " is-on" : "")}
            onClick={() => onKind(k.id)}
          >
            <i className="material-symbols-rounded">{k.icon}</i>
            <strong>{k.label}</strong>
          </button>
        ))}
      </div>
      <p className="gform-hint">{KINDS.find((k) => k.id === kind)?.hint}</p>
      {kind === "category" ? (
        <label className="gform-field">
          <span>Category</span>
          <select value={category} onChange={(e) => onCategory(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

export function DownloadReport() {
  const [kind, setKind] = useState("overall");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.categories().then((d) => setCategories(d.categories || [])).catch((e) => setError(e.message));
  }, []);

  async function download() {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await api.downloadReportPdf(kind, kind === "category" ? category : "");
      setOk("PDF downloaded.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const active = KINDS.find((k) => k.id === kind);

  return (
    <div className="gform">
      <PageHead title="Download report" small="Pick overall, orders, products, or a category and save as PDF." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="gform-layout">
        <section className="gform-shell">
          <div className="gform-head">
            <div>
              <p className="gform-kicker">Export PDF</p>
              <h4>Choose a report</h4>
            </div>
            <span className="gform-badge">
              <i className="material-symbols-rounded">picture_as_pdf</i>
              Instant
            </span>
          </div>
          <KindTiles kind={kind} onKind={setKind} category={category} onCategory={setCategory} categories={categories} />
          {ok ? <p className="gform-ok">{ok}</p> : null}
          <div className="gform-actions">
            <button
              className="gform-btn-primary"
              type="button"
              disabled={busy || (kind === "category" && !category)}
              onClick={download}
            >
              <i className="material-symbols-rounded">download</i>
              {busy ? "Preparing…" : "Download PDF"}
            </button>
          </div>
        </section>
        <aside className="gform-aside">
          <div className="gform-aside-art" aria-hidden="true">
            <i className="material-symbols-rounded">{active?.icon || "analytics"}</i>
          </div>
          <p className="gform-kicker">What you get</p>
          <ul>
            <li><strong>Overall</strong> — counts, order value, status mix, top products, visits.</li>
            <li><strong>Orders</strong> — full list with customer, city, status and total.</li>
            <li><strong>Products</strong> — catalog with category, pack, price.</li>
            <li><strong>Category</strong> — one rice group and matching sales.</li>
            <li><strong>Visits</strong> — cities, countries, and times.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

export function ScheduleReport() {
  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.reportSchedule(), api.categories()])
      .then(([s, c]) => {
        setForm(s.schedule);
        setCategories(c.categories || []);
      })
      .catch((e) => setError(e.message));
  }, []);

  function patch(next) {
    setForm({ ...form, ...next });
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await api.saveReportSchedule({
        enabled: form.enabled,
        kind: form.kind,
        category: form.category,
        hour: form.hour,
        minute: form.minute,
        frequency: form.frequency
      });
      setForm(res.schedule);
      setOk("Schedule saved. When enabled, the PDF is emailed at this time (India).");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendNow() {
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await api.sendReportNow({
        enabled: form.enabled,
        kind: form.kind,
        category: form.category,
        hour: form.hour,
        minute: form.minute,
        frequency: form.frequency
      });
      setForm(res.schedule);
      setOk("Report emailed to " + (res.sent?.to || form.email) + ".");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const timeVal = form ? String(form.hour).padStart(2, "0") + ":" + String(form.minute).padStart(2, "0") : "09:00";

  return (
    <div className="gform">
      <PageHead title="Schedule report" small="Enable a daily, weekday, or monthly send. The PDF is emailed at the time you set (IST)." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      {!form ? (
        <div className="gform-shell gform-loading">Loading schedule…</div>
      ) : (
        <div className="gform-layout">
          <form className="gform-shell" onSubmit={save}>
            <div className="gform-head">
              <div>
                <p className="gform-kicker">Cron schedule</p>
                <h4>Automatic PDF email</h4>
              </div>
              <Toggle on={form.enabled} onChange={(v) => patch({ enabled: v })} label="Scheduled send" />
            </div>

            <KindTiles
              kind={form.kind}
              onKind={(kind) => patch({ kind })}
              category={form.category}
              onCategory={(category) => patch({ category })}
              categories={categories}
            />

            <div className="gform-split">
              <label className="gform-field gform-time">
                <span>Time (IST)</span>
                <div className="gform-time-wrap">
                  <input
                    type="time"
                    value={timeVal}
                    onChange={(e) => {
                      const [h, m] = (e.target.value || "09:00").split(":");
                      patch({ hour: Number(h), minute: Number(m) });
                    }}
                  />
                  <i className="material-symbols-rounded">schedule</i>
                </div>
              </label>
            </div>
            <div className="gform-block">
              <p className="gform-label">Repeat</p>
              <div className="gform-tiles gform-tiles-3">
                <button type="button" className={"gform-tile" + (form.frequency === "daily" ? " is-on" : "")} onClick={() => patch({ frequency: "daily" })}>
                  <i className="material-symbols-rounded">today</i>
                  <strong>Daily</strong>
                </button>
                <button type="button" className={"gform-tile" + (form.frequency === "weekdays" ? " is-on" : "")} onClick={() => patch({ frequency: "weekdays" })}>
                  <i className="material-symbols-rounded">date_range</i>
                  <strong>Weekdays</strong>
                </button>
                <button type="button" className={"gform-tile" + (form.frequency === "monthly" ? " is-on" : "")} onClick={() => patch({ frequency: "monthly" })}>
                  <i className="material-symbols-rounded">calendar_month</i>
                  <strong>Monthly</strong>
                </button>
              </div>
              {form.frequency === "monthly" ? (
                <p className="gform-hint">Once a month — 1st of the month at this time (IST).</p>
              ) : null}
            </div>

            <label className="gform-field">
              <span>Send to email</span>
              <input type="email" value={form.email || ""} readOnly tabIndex={-1} />
            </label>
            <p className="gform-help">
              This is the admin email from <Link to="/notifications/config">Notification configure</Link>. Change it there.
            </p>

            <div className="gform-cron">
              <span>Cron</span>
              <code>{cronPreview(form.hour, form.minute, form.frequency)}</code>
              <em>Asia/Kolkata</em>
            </div>
            {form.last_sent_at ? (
              <p className="gform-meta">Last sent {new Date(form.last_sent_at).toLocaleString("en-GB")}</p>
            ) : null}
            {form.last_error ? <p className="gform-err">Last error: {form.last_error}</p> : null}
            {ok ? <p className="gform-ok">{ok}</p> : null}

            <div className="gform-actions">
              <button className="gform-btn-primary" type="submit" disabled={busy}>
                <i className="material-symbols-rounded">save</i>
                {busy ? "Saving…" : "Save schedule"}
              </button>
              <button className="gform-btn-gold" type="button" disabled={busy} onClick={sendNow}>
                <i className="material-symbols-rounded">send</i>
                Send now
              </button>
            </div>
          </form>

          <aside className="gform-aside">
            <div className="gform-aside-art is-gold" aria-hidden="true">
              <i className="material-symbols-rounded">schedule_send</i>
            </div>
            <p className="gform-kicker">How it runs</p>
            <ol className="gform-steps">
              <li>
                <strong>Enable</strong>
                <span>Turn the schedule on. Disabled means no automatic send.</span>
              </li>
              <li>
                <strong>Match IST</strong>
                <span>Checks every minute. Daily, weekdays (Mon–Fri), or once on the 1st of each month.</span>
              </li>
              <li>
                <strong>Email PDF</strong>
                <span>Same file as Download report, sent to the admin inbox address.</span>
              </li>
            </ol>
            <p className="gform-help mb-0">Keep SMTP set on the server. Use Send now to test without waiting.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
