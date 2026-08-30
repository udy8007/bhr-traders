import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager } from "../components/Template.jsx";

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      className={"ncfg-toggle" + (on ? " is-on" : "")}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="ncfg-toggle-knob" />
      <span className="ncfg-toggle-text">{on ? "On" : "Off"}</span>
    </button>
  );
}

export function NotificationConfig() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    api.notificationConfig().then((d) => setForm(d.config)).catch((e) => setError(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await api.saveNotificationConfig(form);
      setForm(res.config);
      setOk("Notification settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetLogs() {
    if (!confirm("Delete all notification log data? This also clears the admin inbox and cannot be undone.")) return;
    setResetting(true);
    setError("");
    setOk("");
    try {
      await api.resetNotificationLogs();
      setOk("Notification log and inbox were reset.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="ncfg">
      <PageHead title="Notification configure" small="Enable email and push, and set the admin inbox address." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      {!form ? (
        <div className="ncfg-shell">
          <p className="text-sm text-secondary mb-0">Loading…</p>
        </div>
      ) : (
        <form className="ncfg-shell" onSubmit={save}>
          <p className="ncfg-kicker">Channels</p>
          <div className="ncfg-grid">
            <section className={"ncfg-channel" + (form.email_enabled ? " is-live" : "")}>
              <div className="ncfg-channel-head">
                <span className="ncfg-icon" aria-hidden="true">
                  <i className="material-symbols-rounded">mail</i>
                </span>
                <div className="ncfg-channel-copy">
                  <h6>Email notification</h6>
                  <p>Shop alerts and scheduled reports. Database backups use a separate email on DB backup. Customers still get their own order and enquiry emails.</p>
                </div>
                <Toggle
                  on={form.email_enabled}
                  onChange={(v) => setForm({ ...form, email_enabled: v })}
                  label="Email notification"
                />
              </div>
              <label className="ncfg-field">
                <span>Admin notification email</span>
                <input
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                />
              </label>
              <p className="ncfg-help">Used for orders, enquiries, and scheduled reports. DB backup has its own recipient.</p>
            </section>

            <section className={"ncfg-channel" + (form.push_enabled ? " is-live" : "")}>
              <div className="ncfg-channel-head">
                <span className="ncfg-icon is-gold" aria-hidden="true">
                  <i className="material-symbols-rounded">notifications_active</i>
                </span>
                <div className="ncfg-channel-copy">
                  <h6>Push notification</h6>
                  <p>Sends to an ntfy.sh topic. Subscribe on your phone at ntfy.sh.</p>
                </div>
                <Toggle
                  on={form.push_enabled}
                  onChange={(v) => setForm({ ...form, push_enabled: v })}
                  label="Push notification"
                />
              </div>
              <label className="ncfg-field">
                <span>ntfy topic</span>
                <input
                  type="text"
                  value={form.ntfy_topic}
                  onChange={(e) => setForm({ ...form, ntfy_topic: e.target.value })}
                  placeholder="bhr-traders"
                />
              </label>
              <p className="ncfg-help">
                Open the ntfy app and subscribe to <strong>{form.ntfy_topic || "bhr-traders"}</strong>.
              </p>
            </section>
          </div>

          {ok ? <p className="ncfg-ok">{ok}</p> : null}
          <div className="ncfg-actions">
            <button className="ncfg-save" type="submit" disabled={busy || resetting}>
              {busy ? "Saving…" : "Save settings"}
            </button>
            <button className="ncfg-reset" type="button" disabled={busy || resetting} onClick={resetLogs}>
              {resetting ? "Resetting…" : "Reset logs"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function when(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function NotificationLog() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [channel, setChannel] = useState("all");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [resetting, setResetting] = useState(false);

  function load(p, ch, quiet) {
    api.notificationLogs({ page: p, pageSize: 10, channel: ch, quiet }).then(setData).catch((e) => setError(e.message));
  }
  useEffect(() => { load(page, channel, false); }, [page, channel]);

  async function resetLogs() {
    if (!confirm("Delete all notification log data? This also clears the admin inbox and cannot be undone.")) return;
    setResetting(true);
    setError("");
    setOk("");
    try {
      await api.resetNotificationLogs();
      setPage(1);
      await load(1, channel, false);
      setOk("Notification log and inbox were reset.");
    } catch (e) {
      setError(e.message);
    } finally {
      setResetting(false);
    }
  }

  const pager = data
    ? { page: data.page, setPage, pages: data.pages, pageSize: data.pageSize, total: data.total, start: data.start }
    : null;

  return (
    <>
      <PageHead
        title="Notification log"
        small="Email, push, and skipped sends for shop events."
        action={
          <button type="button" className="btn btn-sm btn-outline-danger mb-0" disabled={resetting} onClick={resetLogs}>
            {resetting ? "Resetting…" : "Reset"}
          </button>
        }
      />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      {ok ? <div className="alert alert-success text-white">{ok}</div> : null}
      <Card title="Delivery log" bodyClass="px-0 pt-0 pb-0">
        <div className="px-3 pt-3 d-flex flex-wrap gap-2">
          {["all", "email", "push"].map((c) => (
            <button
              key={c}
              type="button"
              className={"btn btn-sm mb-0 text-capitalize " + (channel === c ? "bg-gradient-info" : "btn-outline-info")}
              onClick={() => { setChannel(c); setPage(1); }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="table-responsive p-0">
          <table className="table align-items-center mb-0">
            <thead>
              <tr>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7 ps-3">When</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Channel</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">To</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Event</th>
                <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows || []).map((r) => (
                <tr key={r.id}>
                  <td className="ps-3"><p className="text-xs mb-0">{when(r.created_at)}</p></td>
                  <td><p className="text-xs mb-0 text-capitalize">{r.channel} · {r.audience}</p></td>
                  <td><p className="text-xs mb-0">{r.to_addr}</p></td>
                  <td>
                    <p className="text-xs mb-0 font-weight-bold">{r.title}</p>
                    <p className="text-xs text-secondary mb-0">{r.event}</p>
                  </td>
                  <td>
                    <span className={"badge badge-sm bg-gradient-" + (r.status === "sent" ? "success" : r.status === "failed" ? "danger" : "secondary")}>{r.status}</span>
                    {r.error ? <p className="text-xs text-secondary mb-0 mt-1">{r.error}</p> : null}
                  </td>
                </tr>
              ))}
              {!data?.rows?.length ? (
                <tr><td colSpan="5" className="ps-3 text-sm">No notification attempts yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {pager ? <Pager {...pager} /> : null}
      </Card>
    </>
  );
}
