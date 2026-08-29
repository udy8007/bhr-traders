import { requireAdmin, unauthorized } from "../../../../lib/auth.js";
import { mailConfigured, sendMail, wrapHtml } from "../../../../lib/mail.js";
import { json, options } from "../../../../lib/supabase.js";

const TOPIC = "udyilangovan";
const AREAS = ["Dashboard", "Orders", "Enquiries", "Products", "Customers", "Analytics", "Notifications", "Other"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];

function priority(severity) {
  if (severity === "Critical") return "5";
  if (severity === "High") return "4";
  if (severity === "Low") return "2";
  return "3";
}

function networkHint(err) {
  const cause = err && err.cause;
  const code = cause?.code || err?.code || "";
  const name = err?.name || "";
  if (name === "AbortError" || code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || /timeout|fetch failed|aborted/i.test(String(err?.message || ""))) {
    return "ntfy.sh is blocked or unreachable from this network.";
  }
  return String(err?.message || "Could not send bug report.");
}

async function postNtfy(message, extra) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://ntfy.sh/" + encodeURIComponent(TOPIC), {
      method: "PUT",
      headers: {
        accept: "*/*",
        "content-type": "text/plain;charset=UTF-8",
        Title: extra.title,
        Priority: String(extra.priority || 3),
        Tags: Array.isArray(extra.tags) ? extra.tags.join(",") : String(extra.tags || "bug,bhr")
      },
      body: message,
      signal: controller.signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "ntfy request failed (" + res.status + ")");
    }
  } finally {
    clearTimeout(timer);
  }
}

function bugEmail(to, { reporter, area, severity, pageUrl, what, steps }) {
  const lines = [
    "<p><strong>Reporter:</strong> " + reporter + "</p>",
    "<p><strong>Area:</strong> " + area + " &nbsp; <strong>Severity:</strong> " + severity + "</p>",
    pageUrl ? "<p><strong>Page:</strong> " + pageUrl + "</p>" : "",
    "<p><strong>What went wrong</strong></p><p>" + what.replace(/</g, "&lt;").replace(/\n/g, "<br/>") + "</p>",
    steps ? "<p><strong>Steps</strong></p><p>" + steps.replace(/</g, "&lt;").replace(/\n/g, "<br/>") + "</p>" : ""
  ].join("");
  return sendMail({
    to,
    subject: "BHR bug · " + area + " · " + severity,
    text: what,
    html: wrapHtml("Bug report (ntfy unreachable)", lines)
  });
}

export function OPTIONS() {
  return options();
}

export async function POST(req) {
  try {
    const user = requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const area = AREAS.includes(body.area) ? body.area : "Other";
    const severity = SEVERITIES.includes(body.severity) ? body.severity : "Medium";
    const pageUrl = String(body.pageUrl || "").trim().slice(0, 500);
    const what = String(body.what || "").trim().slice(0, 4000);
    const steps = String(body.steps || "").trim().slice(0, 4000);
    if (!what) return json({ error: "Describe what went wrong." }, 400);

    const message = [
      "BHR Traders bug report",
      "Reporter: " + (user.email || "admin"),
      "Area: " + area,
      "Severity: " + severity,
      pageUrl ? "Page: " + pageUrl : "",
      "",
      "What went wrong:",
      what,
      steps ? "\nSteps to reproduce:\n" + steps : ""
    ]
      .filter((line) => line !== "")
      .join("\n");

    const headers = {
      title: "Bug · " + area + " · " + severity,
      priority: priority(severity),
      tags: ["bug", "bhr", severity.toLowerCase()],
      click: pageUrl && /^https?:\/\//i.test(pageUrl) ? pageUrl : ""
    };

    try {
      await postNtfy(message, headers);
      return json({ ok: true, topic: TOPIC, via: "ntfy" });
    } catch (ntfyErr) {
      if (!mailConfigured()) {
        return json({ error: networkHint(ntfyErr) + " SMTP is not configured, so the report could not be sent." }, 502);
      }
      const to = process.env.BUG_REPORT_EMAIL || process.env.SMTP_USER;
      await bugEmail(to, {
        reporter: user.email || "admin",
        area,
        severity,
        pageUrl,
        what,
        steps
      });
      return json({ ok: true, via: "email", to, ntfyError: networkHint(ntfyErr) });
    }
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
