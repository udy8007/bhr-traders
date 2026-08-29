import { PageHead } from "../components/Template.jsx";
import { ReportBugForm } from "../components/ReportBugForm.jsx";

export function ReportBug() {
  return (
    <>
      <PageHead title="Report a bug" small="Sent only to the developer ntfy topic." />
      <div className="row">
        <div className="col-lg-8 col-xl-7">
          <ReportBugForm />
        </div>
      </div>
    </>
  );
}
