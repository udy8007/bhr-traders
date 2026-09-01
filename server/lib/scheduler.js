import { tickScheduledBackup } from "./backup.js";
import { tickPendingEnquiryAlerts } from "./enquiryAlerts.js";
import { tickPendingOrderAlerts } from "./orderAlerts.js";
import { tickScheduledReports } from "./reports.js";
import { getSupabase } from "./supabase.js";

export const SCHEDULER_ID = "default";
const MIN_TICK_GAP_MS = 5 * 60 * 1000;

export const DEFAULT_SCHEDULER = {
  id: SCHEDULER_ID,
  enabled: true,
  tick_interval_minutes: 30,
  last_tick_at: null,
  last_reminder_at: null
};

function asBool(v, fallback = true) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

function normalize(row) {
  const base = { ...DEFAULT_SCHEDULER, ...(row || {}) };
  const minutes = Math.max(5, Math.min(1440, Number(base.tick_interval_minutes) || 30));
  return {
    id: SCHEDULER_ID,
    enabled: asBool(base.enabled, true),
    tick_interval_minutes: minutes,
    last_tick_at: base.last_tick_at || null,
    last_reminder_at: base.last_reminder_at || null
  };
}

function publicState(row) {
  const s = normalize(row);
  return {
    enabled: s.enabled,
    tick_interval_minutes: s.tick_interval_minutes,
    last_tick_at: s.last_tick_at,
    last_reminder_at: s.last_reminder_at
  };
}

async function persist(patch) {
  const supabase = getSupabase();
  const current = await getSchedulerSettings();
  const next = normalize({ ...current, ...patch, id: SCHEDULER_ID });
  const { data, error } = await supabase
    .from("scheduler_state")
    .upsert({
      id: SCHEDULER_ID,
      enabled: next.enabled,
      tick_interval_minutes: next.tick_interval_minutes,
      last_tick_at: next.last_tick_at,
      last_reminder_at: next.last_reminder_at,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .maybeSingle();
  if (error) return next;
  return normalize(data || next);
}

export async function getSchedulerSettings() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("scheduler_state").select("*").eq("id", SCHEDULER_ID).maybeSingle();
    if (error) return { ...DEFAULT_SCHEDULER };
    if (data) return normalize(data);
    const created = {
      id: SCHEDULER_ID,
      enabled: true,
      tick_interval_minutes: 30,
      last_tick_at: null,
      last_reminder_at: null,
      updated_at: new Date().toISOString()
    };
    await supabase.from("scheduler_state").insert(created);
    return normalize(created);
  } catch {
    return { ...DEFAULT_SCHEDULER };
  }
}

export async function updateSchedulerSettings(input = {}) {
  const patch = {};
  if (input.enabled !== undefined) patch.enabled = asBool(input.enabled, true);
  if (input.tick_interval_minutes != null || input.tickIntervalMinutes != null) {
    patch.tick_interval_minutes = Math.max(
      5,
      Math.min(1440, Number(input.tick_interval_minutes ?? input.tickIntervalMinutes) || 30)
    );
  }
  return persist(patch);
}

export async function runSchedulerTick(source = "cron") {
  const state = await getSchedulerSettings();
  if (!state.enabled) {
    return { skipped: true, source, ...publicState(state) };
  }

  const now = Date.now();
  const lastTick = state.last_tick_at ? new Date(state.last_tick_at).getTime() : 0;
  if (lastTick && now - lastTick < MIN_TICK_GAP_MS) {
    return { skipped: true, source, ...publicState(state) };
  }

  const [orders, enquiries, reports, backup] = await Promise.all([
    tickPendingOrderAlerts(),
    tickPendingEnquiryAlerts(),
    tickScheduledReports(),
    tickScheduledBackup()
  ]);

  const saved = await persist({
    last_tick_at: new Date().toISOString(),
    last_reminder_at: new Date().toISOString()
  });

  return {
    ok: true,
    source,
    skipped: false,
    orders,
    enquiries,
    reports,
    backup,
    ...publicState(saved)
  };
}

export function dispatchSchedulerTick(source) {
  void runSchedulerTick(source).catch((error) => {
    console.error("Scheduler tick [" + source + "] failed:", error);
  });
}
