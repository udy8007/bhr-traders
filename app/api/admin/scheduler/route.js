import { requireAdmin, unauthorized } from "../../../../server/lib/auth.js";
import { writeAudit } from "../../../../server/lib/logs.js";
import {
  getSchedulerSettings,
  runSchedulerTick,
  updateSchedulerSettings
} from "../../../../server/lib/scheduler.js";
import { json, options } from "../../../../server/lib/supabase.js";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    requireAdmin(req);
    const state = await getSchedulerSettings();
    return json({
      enabled: state.enabled,
      tick_interval_minutes: state.tick_interval_minutes,
      last_tick_at: state.last_tick_at,
      last_reminder_at: state.last_reminder_at
    });
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function PATCH(req) {
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const updated = await updateSchedulerSettings(body);
    const payload = {
      enabled: updated.enabled,
      tick_interval_minutes: updated.tick_interval_minutes,
      last_tick_at: updated.last_tick_at,
      last_reminder_at: updated.last_reminder_at
    };
    writeAudit({
      req,
      action: "update",
      entity: "scheduler",
      entityId: "default",
      detail: "enabled=" + payload.enabled + ", interval=" + payload.tick_interval_minutes + "m",
      after: payload
    });
    return json(payload);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}

export async function POST(req) {
  try {
    requireAdmin(req);
    const result = await runSchedulerTick("admin");
    writeAudit({
      req,
      action: "update",
      entity: "scheduler",
      entityId: "default",
      detail: result.skipped ? "Tick skipped (ran recently)" : "Ran scheduler tick"
    });
    return json(result);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, 500);
  }
}
