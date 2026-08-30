import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AREAS = ["Dashboard", "Orders", "Enquiries", "Products", "Customers", "Analytics", "Notifications", "Other"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

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
    <form className="gform-shell bug-shell" onSubmit={send}>
      <div className="bug-banner">
        <img src={import.meta.env.BASE_URL + "assets/img/logo.png"} alt="BHR Traders" className="bug-report-logo" />
        <div>
          <p className="bug-banner-kicker">Developer channel</p>
          <h4>Report a Bug</h4>
          <p>Tell us what went wrong. Sent instantly via <strong>ntfy</strong>.</p>
        </div>
        <span className="gform-badge bug-banner-badge">
          <i className="material-symbols-rounded">campaign</i>
          ntfy
        </span>
      </div>

      <div className="gform-block">
        <p className="gform-label">Area</p>
        <div className="bug-chips">
          {AREAS.map((a) => (
            <button type="button" key={a} className={"bug-chip" + (area === a ? " on" : "")} onClick={() => setArea(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="gform-block">
        <p className="gform-label">Severity</p>
        <div className="bug-chips">
          {SEVERITIES.map((s) => (
            <button
              type="button"
              key={s}
              className={"bug-chip" + (severity === s ? " on sev-" + s.toLowerCase() : "")}
              onClick={() => setSeverity(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <label className="gform-field">
        <span>Page URL (optional)</span>
        <input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://" />
      </label>
      <label className="gform-field">
        <span>What went wrong?</span>
        <textarea
          rows={4}
          required
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="Example: On the Orders page, the status filter does not update the list after I select a status."
        />
      </label>
      <label className="gform-field">
        <span>Steps to reproduce (optional)</span>
        <textarea
          rows={3}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder={"1. Open Orders\n2. Change status\n3. List stays unchanged"}
        />
      </label>

      {error ? <p className="gform-err">{error}</p> : null}
      {ok ? <p className="gform-ok">{ok}</p> : null}

      <div className="gform-actions">
        <button type="submit" className="gform-btn-danger" disabled={busy}>
          <i className="material-symbols-rounded">send</i>
          {busy ? "Sending…" : "Send bug report"}
        </button>
      </div>
    </form>
  );
}
