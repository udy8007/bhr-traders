import { requireAdmin, unauthorized } from "../../../../../lib/auth.js";
import { startReportCron } from "../../../../../lib/reportCron.js";
import { getReportSchedule, saveReportSchedule, sendScheduledReport, tickScheduledReports } from "../../../../../lib/reports.js";
import { json, options } from "../../../../../lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    startReportCron();
    const schedule = await getReportSchedule();
    return json({ schedule });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function PUT(req) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const schedule = await saveReportSchedule(body);
    return json({ schedule });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    if (body.tick) {
      const result = await tickScheduledReports();
      return json(result);
    }
    const schedule = body.kind ? await saveReportSchedule(body) : await getReportSchedule();
    const sent = await sendScheduledReport(schedule);
    const saved = await saveReportSchedule({
      ...schedule,
      last_sent_at: new Date().toISOString(),
      last_error: ""
    });
    return json({ ok: true, sent, schedule: saved });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status === 400 ? 400 : 500);
  }
}
