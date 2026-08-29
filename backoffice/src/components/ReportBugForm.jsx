import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AREAS = ["Dashboard", "Orders", "Enquiries", "Products", "Customers", "Analytics", "Notifications", "Other"];
const SEVERITIES = [
  { id: "Low", color: "success" },
  { id: "Medium", color: "warning" },
  { id: "High", color: "danger" },
  { id: "Critical", color: "dark" }
];

export function ReportBugForm() {
  const [area, setArea] = useState("Orders");
  const [severity, setSeverity] = useState("Medium");
  const [pageUrl, setPageUrl] = useState("");
  const [what, setWhat] = useState("");
  const [steps, setSteps] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setOk("");
    setError("");
    try {
      const res = await api.reportBug({ area, severity, pageUrl, what, steps });
      setOk(res.via === "email"
        ? "Bug report emailed (ntfy.sh is blocked on this network)."
        : "Bug report sent to the developer.");
      setWhat("");
      setSteps("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bug-panel">
      <div className="bug-modal-head bug-panel-head">
        <img src="/assets/img/logo.png" alt="BHR" className="bug-report-logo" />
        <div>
          <h5 className="mb-0 text-white">Report a Bug</h5>
          <p className="mb-0 text-white text-sm opacity-8">Tell us what went wrong. Sent instantly to the developer via <strong>ntfy</strong>.</p>
        </div>
      </div>
      <form className="bug-modal-body" onSubmit={send}>
        <p className="text-xs text-secondary text-uppercase font-weight-bold mb-2">Area</p>
        <div className="bug-chips mb-3">
          {AREAS.map((a) => (
            <button type="button" key={a} className={"bug-chip" + (area === a ? " on" : "")} onClick={() => setArea(a)}>
              {a}
            </button>
          ))}
        </div>
        <p className="text-xs text-secondary text-uppercase font-weight-bold mb-2">Severity</p>
        <div className="bug-chips mb-3">
          {SEVERITIES.map((s) => (
            <button type="button" key={s.id} className={"bug-chip sev-" + s.color + (severity === s.id ? " on" : "")} onClick={() => setSeverity(s.id)}>
              {s.id}
            </button>
          ))}
        </div>
        <label className="form-label text-xs">Page URL (optional)</label>
        <input className="form-control mb-3" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://" />
        <label className="form-label text-xs">What went wrong?</label>
        <textarea className="form-control mb-3" rows={4} required value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Example: On the Orders page, the status filter does not update the list after I select a status." />
        <label className="form-label text-xs">Steps to reproduce (optional)</label>
        <textarea className="form-control mb-3" rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={"1. Open Orders\n2. Change status\n3. List stays unchanged"} />
        {error ? <p className="text-danger text-sm">{error}</p> : null}
        {ok ? <p className="text-success text-sm">{ok}</p> : null}
        <button type="submit" className="btn bg-gradient-danger mb-0" disabled={busy}>
          {busy ? "Sending…" : "Send bug report"}
        </button>
      </form>
    </div>
  );
}
