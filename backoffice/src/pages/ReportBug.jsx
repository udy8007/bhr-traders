import { PageHead } from "../components/Template.jsx";
import { ReportBugForm } from "../components/ReportBugForm.jsx";

export function ReportBug() {
  return (
    <div className="gform is-wide">
      <PageHead title="Report a bug" small="Sent only to the developer ntfy topic." />
      <div className="gform-layout">
        <ReportBugForm />
        <aside className="gform-aside">
          <div className="gform-aside-art" aria-hidden="true" style={{ background: "linear-gradient(195deg, #ef5350, #c62828)" }}>
            <i className="material-symbols-rounded">bug_report</i>
          </div>
          <p className="gform-kicker">How it is sent</p>
          <ol className="gform-steps">
            <li>
              <strong>Pick area and severity</strong>
              <span>Helps the developer find the right screen.</span>
            </li>
            <li>
              <strong>Describe what broke</strong>
              <span>Include the page URL if it is not this one.</span>
            </li>
            <li>
              <strong>ntfy push</strong>
              <span>The report goes to the developer topic instantly. If ntfy is blocked, it falls back to email.</span>
            </li>
          </ol>
        </aside>
      </div>
    </div>
  );
}
