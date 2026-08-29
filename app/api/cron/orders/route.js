import { tickScheduledBackup } from "../../../../server/lib/backup.js";
import { tickPendingOrderAlerts } from "../../../../server/lib/orderAlerts.js";
import { tickScheduledReports } from "../../../../server/lib/reports.js";
import { json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

function cronAllowed(req) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  const auth = String(req.headers.get("authorization") || "");
  if (secret) return auth === "Bearer " + secret;
  return process.env.NODE_ENV !== "production";
}

export async function GET(req) {
  try {
    if (!cronAllowed(req)) return json({ error: "Unauthorized." }, 401);
    const [orders, reports, backup] = await Promise.all([
      tickPendingOrderAlerts(),
      tickScheduledReports(),
      tickScheduledBackup()
    ]);
    return json({ ok: true, orders, reports, backup });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}

export async function POST(req) {
  return GET(req);
}
