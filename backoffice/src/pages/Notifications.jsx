import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead, Pager } from "../components/Template.jsx";

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

export function NotificationConfig() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <>
      <PageHead title="Notification configure" small="Enable email and push, and set the admin inbox address." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
      <div className="row">
        <div className="col-lg-6">
          <Card title="Channels">
            {!form ? <p className="text-sm text-secondary mb-0">Loading…</p> : (
              <form onSubmit={save}>
                <Switch
                  on={form.email_enabled}
                  onChange={(v) => setForm({ ...form, email_enabled: v })}
                  label="Email notification"
                  hint="Sends to the admin email and to the customer for shop events."
                />
                <div className={"input-group input-group-outline mb-4" + (form.admin_email ? " is-filled" : "")}>
                  <label className="form-label">Admin notification email</label>
                  <input className="form-control" type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} required />
                </div>
                <Switch
                  on={form.push_enabled}
                  onChange={(v) => setForm({ ...form, push_enabled: v })}
                  label="Push notification"
                  hint="Sends to ntfy.sh topic bhr-traders. Subscribe on your phone at ntfy.sh."
                />
                <div className={"input-group input-group-outline mb-3" + (form.ntfy_topic ? " is-filled" : "")}>
                  <label className="form-label">ntfy topic</label>
                  <input className="form-control" value={form.ntfy_topic} onChange={(e) => setForm({ ...form, ntfy_topic: e.target.value })} />
                </div>
                <p className="text-xs text-secondary mb-4">Open the ntfy app and subscribe to <strong>{form.ntfy_topic || "bhr-traders"}</strong>.</p>
                {ok ? <p className="text-success text-sm">{ok}</p> : null}
                <button className="btn bg-gradient-info mb-0" type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
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

  function load(p, ch, quiet) {
    api.notificationLogs({ page: p, pageSize: 10, channel: ch, quiet }).then(setData).catch((e) => setError(e.message));
  }
  useEffect(() => { load(page, channel, false); }, [page, channel]);

  const pager = data
    ? { page: data.page, setPage, pages: data.pages, pageSize: data.pageSize, total: data.total, start: data.start }
    : null;

  return (
    <>
      <PageHead title="Notification log" small="Email, push, and skipped sends for shop events." />
      {error ? <div className="alert alert-warning text-white">{error}</div> : null}
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
