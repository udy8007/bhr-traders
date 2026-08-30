import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { startReportCron } from "../../../../server/lib/reportCron.js";
import { getBackupSchedule, saveBackupSchedule, sendDbBackup, tickScheduledBackup } from "../../../../server/lib/backup.js";
import { json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    startReportCron();
    const schedule = await getBackupSchedule();
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
    const schedule = await saveBackupSchedule(body);
    return json({ schedule });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status === 400 ? 400 : 500);
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    if (body.tick) {
      const result = await tickScheduledBackup();
      return json(result);
    }
    const schedule = await saveBackupSchedule(body.cron || body.email !== undefined ? body : await getBackupSchedule());
    if (!schedule.email_enabled) {
      const err = new Error("Turn on email backup to send the dump.");
      err.status = 400;
      throw err;
    }
    const sent = await sendDbBackup(schedule);
    const saved = await saveBackupSchedule({
      enabled: schedule.enabled,
      email_enabled: schedule.email_enabled,
      cron: schedule.cron,
      last_sent_at: new Date().toISOString(),
      last_error: ""
    });
    return json({ ok: true, sent, schedule: saved });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status === 400 ? 400 : 500);
  }
}
