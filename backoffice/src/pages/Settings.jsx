import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { Card, PageHead } from "../components/Template.jsx";

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
    <>
      <PageHead
        title="Change password"
        small="Update the backoffice sign-in password for this admin account."
      />
      <div className="row">
        <div className="col-lg-6 col-xl-5">
          <Card title="Account">
            <p className="text-sm mb-4">{user?.email || "admin@bhrtraders.com"}</p>
            <form onSubmit={save}>
              <div className={"input-group input-group-outline mb-3" + (currentPassword ? " is-filled" : "")}>
                <label className="form-label">Current password</label>
                <input className="form-control" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className={"input-group input-group-outline mb-3" + (newPassword ? " is-filled" : "")}>
                <label className="form-label">New password</label>
                <input className="form-control" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className={"input-group input-group-outline mb-3" + (confirmPassword ? " is-filled" : "")}>
                <label className="form-label">Confirm new password</label>
                <input className="form-control" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              {error ? <p className="text-danger text-sm">{error}</p> : null}
              {ok ? <p className="text-success text-sm">{ok}</p> : null}
              <button type="submit" className="btn bg-gradient-info mb-0" disabled={busy}>
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

const CRON_PRESETS = [
  { id: "0 2 * * *", label: "Daily 2:00 AM" },
  { id: "0 9 * * *", label: "Daily 9:00 AM" },
  { id: "0 2 * * 0", label: "Sunday 2:00 AM" },
  { id: "0 */6 * * *", label: "Every 6 hours" }
];

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
      const res = await api.saveBackupSchedule(form);
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
      const res = await api.sendBackupNow(form);
      setForm(res.schedule);
      setOk("Dump emailed to " + (res.sent?.to || form.email) + " (" + (res.sent?.rows || 0) + " rows).");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="DB backup" small="Dump the database and email it now, or on a cron schedule (IST)." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="row">
        <div className="col-lg-7">
          <Card title="Backup & schedule">
            {!form ? <p className="text-sm text-secondary mb-0">Loading…</p> : (
              <form onSubmit={save}>
                <Switch
                  on={form.enabled}
                  onChange={(v) => patch({ enabled: v })}
                  label="Scheduled backup"
                  hint="When enabled, a dump is emailed when the cron matches (India time)."
                />
                <Switch
                  on={form.email_enabled}
                  onChange={(v) => patch({ email_enabled: v })}
                  label="Email dump"
                  hint="Required for Backup now and for the schedule. Disable to pause sending."
                />
                <div className={"input-group input-group-outline mb-3" + (form.email ? " is-filled" : "")}>
                  <label className="form-label">Send to email</label>
                  <input className="form-control" type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} required />
                </div>
                <p className="text-xs text-uppercase text-secondary font-weight-bold mb-2">Cron presets</p>
                <div className="bug-chips mb-3">
                  {CRON_PRESETS.map((p) => (
                    <button key={p.id} type="button" className={"bug-chip" + (form.cron === p.id ? " on" : "")} onClick={() => patch({ cron: p.id })}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className={"input-group input-group-outline mb-3 is-filled"}>
                  <label className="form-label">Cron (min hour day month weekday)</label>
                  <input className="form-control" value={form.cron} onChange={(e) => patch({ cron: e.target.value })} placeholder="0 2 * * *" />
                </div>
                <p className="report-cron-line text-xs mb-3">
                  Cron: <code>{form.cron || "0 2 * * *"}</code>
                  <span className="text-secondary"> · Asia/Kolkata · e.g. 0 2 * * * = every day at 2:00 AM</span>
                </p>
                {form.last_sent_at ? <p className="text-xs text-secondary">Last sent {new Date(form.last_sent_at).toLocaleString("en-GB")}</p> : null}
                {form.last_error ? <p className="text-xs text-danger">Last error: {form.last_error}</p> : null}
                {ok ? <p className="text-success text-sm">{ok}</p> : null}
                <button className="btn bg-gradient-info mb-0 me-2" type="submit" disabled={busy}>{busy ? "Saving…" : "Save schedule"}</button>
                <button className="btn btn-outline-info mb-0" type="button" disabled={busy} onClick={backupNow}>Backup now</button>
              </form>
            )}
          </Card>
        </div>
        <div className="col-lg-5">
          <Card title="What is sent">
            <p className="text-sm">Backup now builds a dump of products, orders, enquiries, visits, reviews, and settings, then emails:</p>
            <ul className="text-sm mb-3 ps-3">
              <li>gzipped JSON dump</li>
              <li>SQL insert script</li>
            </ul>
            <p className="text-sm mb-0">SMTP must be set on the server. The scheduler checks every minute against the cron in IST.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
