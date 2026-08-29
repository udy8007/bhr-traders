import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead } from "../components/Template.jsx";

const KINDS = [
  { id: "overall", label: "Overall", hint: "Catalog, orders, value, top products, shop visits" },
  { id: "orders", label: "Orders", hint: "Every order with customer and total" },
  { id: "products", label: "Products", hint: "Full catalog with category and price" },
  { id: "category", label: "Category", hint: "One rice category, products and sales" },
  { id: "visits", label: "Visits", hint: "Shop website visits, pages, cities, and referrers" }
];

function KindPicker({ kind, onKind, category, onCategory, categories }) {
  return (
    <>
      <p className="text-xs text-uppercase text-secondary font-weight-bold mb-2">Report type</p>
      <div className="bug-chips mb-3">
        {KINDS.map((k) => (
          <button key={k.id} type="button" className={"bug-chip" + (kind === k.id ? " on" : "")} onClick={() => onKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-secondary mb-3">{KINDS.find((k) => k.id === kind)?.hint}</p>
      {kind === "category" ? (
        <div className="report-select-wrap mb-3">
          <label className="report-select-label" htmlFor="report-category">Category</label>
          <select
            id="report-category"
            className="report-select"
            value={category}
            onChange={(e) => onCategory(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );
}

function Switch({ on, onChange, label, hint }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <div>
        <p className="text-sm font-weight-bold mb-0">{label}</p>
        {hint ? <p className="text-xs text-secondary mb-0">{hint}</p> : null}
      </div>
      <button type="button" className={"btn btn-sm mb-0 " + (on ? "bg-gradient-success" : "btn-outline-secondary")} onClick={() => onChange(!on)}>
        {on ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

function cronPreview(hour, minute, frequency) {
  const m = String(minute).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const dow = frequency === "weekdays" ? "1-5" : "*";
  return m + " " + h + " * * " + dow;
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

  return (
    <>
      <PageHead title="Download report" small="Pick overall, orders, products, or a category and save as PDF." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="row">
        <div className="col-lg-6">
          <Card title="Export PDF">
            <KindPicker kind={kind} onKind={setKind} category={category} onCategory={setCategory} categories={categories} />
            {ok ? <p className="text-success text-sm">{ok}</p> : null}
            <button className="btn bg-gradient-info mb-0" type="button" disabled={busy || (kind === "category" && !category)} onClick={download}>
              {busy ? "Preparing…" : "Download PDF"}
            </button>
          </Card>
        </div>
        <div className="col-lg-6">
          <Card title="What you get">
            <ul className="text-sm mb-0 ps-3">
              <li className="mb-2"><strong>Overall</strong> — counts, order value, status mix, top products, recent orders, and shop visits.</li>
              <li className="mb-2"><strong>Orders</strong> — full order list with customer, city, status and total.</li>
              <li className="mb-2"><strong>Products</strong> — catalog with category, pack, price and active/hidden.</li>
              <li className="mb-2"><strong>Category</strong> — products in that group and matching order lines.</li>
              <li className="mb-0"><strong>Visits</strong> — shop page views, last 14 days, top pages, cities, countries, and referrers.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
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
      const res = await api.saveReportSchedule(form);
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
      const res = await api.sendReportNow(form);
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
    <>
      <PageHead title="Schedule report" small="Enable a daily or weekday send. The PDF is emailed at the time you set (IST)." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="row">
        <div className="col-lg-7">
          <Card title="Cron schedule">
            {!form ? <p className="text-sm text-secondary mb-0">Loading…</p> : (
              <form onSubmit={save}>
                <Switch
                  on={form.enabled}
                  onChange={(v) => patch({ enabled: v })}
                  label="Scheduled send"
                  hint="When enabled, the report is emailed at the time below. Disable to pause."
                />
                <KindPicker
                  kind={form.kind}
                  onKind={(kind) => patch({ kind })}
                  category={form.category}
                  onCategory={(category) => patch({ category })}
                  categories={categories}
                />
                <div className="row">
                  <div className="col-md-6">
                    <div className="input-group input-group-outline mb-3 is-filled">
                      <label className="form-label">Time (IST)</label>
                      <input
                        className="form-control"
                        type="time"
                        value={timeVal}
                        onChange={(e) => {
                          const [h, m] = (e.target.value || "09:00").split(":");
                          patch({ hour: Number(h), minute: Number(m) });
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <p className="text-xs text-uppercase text-secondary font-weight-bold mb-2">Repeat</p>
                    <div className="bug-chips mb-3">
                      <button type="button" className={"bug-chip" + (form.frequency === "daily" ? " on" : "")} onClick={() => patch({ frequency: "daily" })}>Daily</button>
                      <button type="button" className={"bug-chip" + (form.frequency === "weekdays" ? " on" : "")} onClick={() => patch({ frequency: "weekdays" })}>Weekdays</button>
                    </div>
                  </div>
                </div>
                <div className={"input-group input-group-outline mb-3" + (form.email ? " is-filled" : "")}>
                  <label className="form-label">Send to email</label>
                  <input className="form-control" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="Uses notification admin email if empty" />
                </div>
                <p className="report-cron-line text-xs mb-3">
                  Cron: <code>{cronPreview(form.hour, form.minute, form.frequency)}</code>
                  <span className="text-secondary"> · Asia/Kolkata</span>
                </p>
                {form.last_sent_at ? <p className="text-xs text-secondary">Last sent {new Date(form.last_sent_at).toLocaleString("en-GB")}</p> : null}
                {form.last_error ? <p className="text-xs text-danger">Last error: {form.last_error}</p> : null}
                {ok ? <p className="text-success text-sm">{ok}</p> : null}
                <button className="btn bg-gradient-info mb-0 me-2" type="submit" disabled={busy}>{busy ? "Saving…" : "Save schedule"}</button>
                <button className="btn btn-outline-info mb-0" type="button" disabled={busy} onClick={sendNow}>Send now</button>
              </form>
            )}
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="How it runs">
            <p className="text-sm">The API checks the clock every minute. If the schedule is <strong>enabled</strong> and the IST time matches, it builds the same PDF as Download report and emails it.</p>
            <p className="text-sm mb-0">Keep SMTP configured in the server env. Use Send now to test without waiting for the clock.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
