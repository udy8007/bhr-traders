import { startReportCron } from "../../../../server/lib/reportCron.js";
import { tickPendingOrderAlerts } from "../../../../server/lib/orderAlerts.js";
import { json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

function cronAllowed(req) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  const auth = String(req.headers.get("authorization") || "");
  if (secret) return auth === "Bearer " + secret;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export async function GET(req) {
  try {
    if (!cronAllowed(req)) return json({ error: "Unauthorized." }, 401);
    startReportCron();
    const result = await tickPendingOrderAlerts();
    return json({ ok: true, result });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}

export async function POST(req) {
  return GET(req);
}
