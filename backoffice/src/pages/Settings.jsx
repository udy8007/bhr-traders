import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { PageHead } from "../components/Template.jsx";

const CRON_PRESETS = [
  { id: "0 2 1 * *", label: "Monthly once", icon: "calendar_month" },
  { id: "0 2 * * *", label: "Daily 2:00 AM", icon: "nights_stay" },
  { id: "0 9 * * *", label: "Daily 9:00 AM", icon: "wb_sunny" },
  { id: "0 2 * * 0", label: "Sunday 2:00 AM", icon: "event" },
  { id: "0 */6 * * *", label: "Every 6 hours", icon: "update" }
];

function cronParts(expr) {
  const p = String(expr || "0 2 * * *").trim().split(/\s+/);
  return {
    minute: p[0] || "0",
    hour: p[1] || "2",
    day: p[2] || "*",
    month: p[3] || "*",
    weekday: p[4] || "*"
  };
}

function isMonthlyOnce(expr) {
  const p = cronParts(expr);
  return p.day === "1" && p.month === "*" && (p.weekday === "*" || p.weekday === "?");
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

export function ChangePassword() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError("");
    setOk("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setOk("Password updated. Use it the next time you sign in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gform">
      <PageHead
        title="Change password"
        small="Update the backoffice sign-in password for this admin account."
      />
      <form className="gform-shell" onSubmit={save} style={{ maxWidth: 520 }}>
        <div className="gform-head">
          <div>
            <p className="gform-kicker">Account</p>
            <h4>{user?.email || "admin@bhrtraders.com"}</h4>
          </div>
          <span className="gform-badge">
            <i className="material-symbols-rounded">lock</i>
            Admin
          </span>
        </div>
        <label className="gform-field">
          <span>Current password</span>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <label className="gform-field">
          <span>New password</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </label>
        <label className="gform-field">
          <span>Confirm new password</span>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        </label>
        {error ? <p className="gform-err">{error}</p> : null}
        {ok ? <p className="gform-ok">{ok}</p> : null}
        <div className="gform-actions">
          <button type="submit" className="gform-btn-primary" disabled={busy}>
            <i className="material-symbols-rounded">save</i>
            {busy ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function DbBackup() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.backupSchedule().then((d) => setForm(d.schedule)).catch((e) => setError(e.message));
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
      const res = await api.saveBackupSchedule({
        enabled: form.enabled,
        email_enabled: form.email_enabled,
        cron: form.cron
      });
      setForm(res.schedule);
      setOk("Backup schedule saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function backupNow() {
    setBusy(true);
    setError("");
    setOk("");
    try {
      const res = await api.sendBackupNow({
        enabled: form.enabled,
        email_enabled: form.email_enabled,
        cron: form.cron
      });
      setForm(res.schedule);
      setOk("Dump emailed to " + (res.sent?.to || form.email) + " (" + (res.sent?.rows || 0) + " rows).");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const parts = form ? cronParts(form.cron) : cronParts("0 2 * * *");
  const monthly = form ? isMonthlyOnce(form.cron) : false;
  const sunday = parts.weekday === "0";
  const everyN = String(form?.cron || "").includes("/");
  const daily = Boolean(form) && !monthly && !sunday && !everyN && parts.day === "*";
  const known = CRON_PRESETS.some((p) => p.id === form?.cron);

  return (
    <div className="gform">
      <PageHead title="DB backup" small="Dump the database and email it now, or on a cron schedule (IST)." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      {!form ? (
        <div className="gform-shell gform-loading">Loading backup schedule…</div>
      ) : (
        <div className="gform-layout">
          <form className="gform-shell" onSubmit={save}>
            <div className="gform-head">
              <div>
                <p className="gform-kicker">Backup & schedule</p>
                <h4>Automatic database dump</h4>
              </div>
              <Toggle on={form.enabled} onChange={(v) => patch({ enabled: v })} label="Scheduled backup" />
            </div>

            <div className="gform-channels">
              <section className={"gform-channel" + (form.enabled ? " is-on" : "")}>
                <span className="ncfg-icon" aria-hidden="true">
                  <i className="material-symbols-rounded">schedule</i>
                </span>
                <div>
                  <strong>Scheduled backup</strong>
                  <p>When on, a dump is emailed when the cron matches India time.</p>
                </div>
              </section>
              <section className={"gform-channel" + (form.email_enabled ? " is-on" : "")}>
                <span className="ncfg-icon is-gold" aria-hidden="true">
                  <i className="material-symbols-rounded">mail</i>
                </span>
                <div>
                  <strong>Email dump</strong>
                  <p>Required for Backup now and for the schedule.</p>
                </div>
                <Toggle on={form.email_enabled} onChange={(v) => patch({ email_enabled: v })} label="Email dump" />
              </section>
            </div>

            <label className="gform-field">
              <span>Send to email</span>
              <input type="email" value={form.email || ""} readOnly tabIndex={-1} />
            </label>
            <p className="gform-help">
              This is the admin email from <Link to="/notifications/config">Notification configure</Link>. Change it there.
            </p>

            <div className="gform-block">
              <p className="gform-label">Repeat</p>
              <div className="gform-tiles gform-tiles-3">
                <button
                  type="button"
                  className={"gform-tile" + (daily ? " is-on" : "")}
                  onClick={() => {
                    const p = cronParts(form.cron);
                    patch({ cron: p.minute + " " + p.hour + " * * *" });
                  }}
                >
                  <i className="material-symbols-rounded">today</i>
                  <strong>Daily</strong>
                </button>
                <button
                  type="button"
                  className={"gform-tile" + (monthly ? " is-on" : "")}
                  onClick={() => {
                    const p = cronParts(form.cron);
                    patch({ cron: p.minute + " " + p.hour + " 1 * *" });
                  }}
                >
                  <i className="material-symbols-rounded">calendar_month</i>
                  <strong>Monthly once</strong>
                </button>
                <button
                  type="button"
                  className={"gform-tile" + (sunday ? " is-on" : "")}
                  onClick={() => {
                    const p = cronParts(form.cron);
                    patch({ cron: p.minute + " " + p.hour + " * * 0" });
                  }}
                >
                  <i className="material-symbols-rounded">event</i>
                  <strong>Sunday</strong>
                </button>
              </div>
              {monthly ? (
                <p className="gform-hint">Once a month — 1st of the month at this time (IST).</p>
              ) : null}
            </div>

            <div className="gform-block">
              <p className="gform-label">Time presets</p>
              <div className="gform-tiles gform-tiles-2">
                {CRON_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={"gform-tile" + (form.cron === p.id ? " is-on" : "")}
                    onClick={() => patch({ cron: p.id })}
                  >
                    <i className="material-symbols-rounded">{p.icon}</i>
                    <strong>{p.label}</strong>
                  </button>
                ))}
              </div>
            </div>

            <label className="gform-field">
              <span>Cron (min hour day month weekday)</span>
              <input value={form.cron} onChange={(e) => patch({ cron: e.target.value })} placeholder="0 2 * * *" />
            </label>
            {!known && form.cron ? <p className="gform-hint">Custom expression — not one of the presets.</p> : null}

            <div className="gform-cron">
              <span>Cron</span>
              <code>{form.cron || "0 2 * * *"}</code>
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
              <button className="gform-btn-gold" type="button" disabled={busy} onClick={backupNow}>
                <i className="material-symbols-rounded">cloud_download</i>
                Backup now
              </button>
            </div>
          </form>

          <aside className="gform-aside">
            <div className="gform-aside-art" aria-hidden="true">
              <i className="material-symbols-rounded">database</i>
            </div>
            <p className="gform-kicker">What is sent</p>
            <ol className="gform-steps">
              <li>
                <strong>JSON dump</strong>
                <span>Gzipped snapshot of products, orders, enquiries, visits, reviews, and settings.</span>
              </li>
              <li>
                <strong>SQL script</strong>
                <span>Insert statements you can restore from.</span>
              </li>
              <li>
                <strong>IST cron</strong>
                <span>Checked every minute. Use Monthly 1st for a once-a-month dump.</span>
              </li>
            </ol>
            <p className="gform-help mb-0">SMTP must be set on the server.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
