import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, PageHead } from "../components/Template.jsx";

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

export function AppAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.customerAccounts();
      setAccounts(res.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function unlock(id) {
    setBusyId(id);
    setMsg("");
    setError("");
    try {
      await api.unlockCustomerAccount(id);
      setMsg("Account unlocked.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  const locked = accounts.filter((a) => a.locked);
  const pending = accounts.filter((a) => a.unlockRequestedAt && a.locked);

  return (
    <>
      <PageHead title="App accounts" small="Registered customer logins — unlock after failed password lockouts." />
      {error ? <div className="alert alert-danger text-white">{error}</div> : null}
      {msg ? <div className="alert alert-success text-white">{msg}</div> : null}

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body p-3">
              <p className="text-xs text-uppercase text-secondary mb-1">Registered</p>
              <h4 className="mb-0">{accounts.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body p-3">
              <p className="text-xs text-uppercase text-secondary mb-1">Locked</p>
              <h4 className="mb-0">{locked.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card">
            <div className="card-body p-3">
              <p className="text-xs text-uppercase text-secondary mb-1">Unlock requested</p>
              <h4 className="mb-0">{pending.length}</h4>
            </div>
          </div>
        </div>
      </div>

      <Card title="Login accounts">
        {loading ? (
          <p className="text-sm text-secondary mb-0">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-secondary mb-0">No registered customer accounts yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-items-center mb-0">
              <thead>
                <tr>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Customer</th>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Failed tries</th>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Status</th>
                  <th className="text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">Unlock request</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="text-sm font-weight-bold mb-0">{a.name || "—"}</p>
                      <p className="text-xs text-secondary mb-0">{a.email}</p>
                      <p className="text-xs text-secondary mb-0">{a.phone || "—"}</p>
                    </td>
                    <td className="text-sm">{a.failedLoginAttempts}</td>
                    <td>
                      {a.locked ? (
                        <span className="badge badge-sm bg-gradient-danger">Locked</span>
                      ) : (
                        <span className="badge badge-sm bg-gradient-success">Active</span>
                      )}
                    </td>
                    <td className="text-xs text-secondary">{fmtDate(a.unlockRequestedAt)}</td>
                    <td className="text-end">
                      {a.locked ? (
                        <button type="button" className="btn btn-sm bg-gradient-success mb-0" disabled={busyId === a.id} onClick={() => unlock(a.id)}>
                          {busyId === a.id ? "Unlocking…" : "Unlock"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
