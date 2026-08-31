import { gzipSync } from "zlib";
import { adminNotifyEmail } from "./notify.js";
import { sendMail, wrapHtml } from "./mail.js";
import { istParts } from "./reports.js";
import { getSupabase } from "./supabase.js";

const SCHEDULE_ID = "default";
const TABLES = [
  "categories",
  "pack_sizes",
  "products",
  "orders",
  "order_items",
  "enquiries",
  "product_reviews",
  "visits",
  "notification_config",
  "notification_logs",
  "admin_inbox",
  "report_schedules",
  "backup_schedules",
  "scheduler_state",
  "error_logs",
  "audit_logs"
];

export const DEFAULT_BACKUP = {
  id: SCHEDULE_ID,
  enabled: false,
  email_enabled: true,
  email: "",
  email_override: false,
  cron: "0 2 * * *",
  last_run_key: "",
  last_attempt_key: "",
  last_sent_at: "",
  last_error: ""
};

function asBool(v, fallback = false) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function validCron(expr) {
  const parts = String(expr || "").trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((p) => /^(\*|\d+|\d+-\d+|\*\/\d+|\d+\/\d+)(,(?:\*|\d+|\d+-\d+|\*\/\d+|\d+\/\d+))*$/.test(p));
}

export function normalizeBackup(row) {
  const base = { ...DEFAULT_BACKUP, ...(row || {}) };
  const cron = String(base.cron || DEFAULT_BACKUP.cron).trim();
  return {
    id: SCHEDULE_ID,
    enabled: asBool(base.enabled, false),
    email_enabled: asBool(base.email_enabled, true),
    email: String(base.email || "").trim(),
    email_override: asBool(base.email_override, false),
    cron: validCron(cron) ? cron : DEFAULT_BACKUP.cron,
    last_run_key: String(base.last_run_key || ""),
    last_attempt_key: String(base.last_attempt_key || ""),
    last_sent_at: String(base.last_sent_at || ""),
    last_error: String(base.last_error || "")
  };
}

function rowForDb(schedule) {
  const row = {
    id: schedule.id,
    enabled: schedule.enabled,
    email_enabled: schedule.email_enabled,
    email: schedule.email,
    email_override: schedule.email_override,
    cron: schedule.cron,
    last_run_key: schedule.last_run_key || "",
    last_attempt_key: schedule.last_attempt_key || "",
    last_error: schedule.last_error || ""
  };
  const stamp = String(schedule.last_sent_at || "").trim();
  if (stamp && !Number.isNaN(new Date(stamp).getTime())) row.last_sent_at = stamp;
  return row;
}

function backupRecipient(schedule, adminEmail) {
  const stored = String(schedule?.email || "").trim();
  if (asBool(schedule?.email_override, false) && isEmail(stored)) return stored;
  if (isEmail(stored) && stored.toLowerCase() !== "info@bhrtraders.com") return stored;
  return adminEmail;
}

async function resolveBackupTo(schedule) {
  return backupRecipient(schedule, await adminNotifyEmail());
}

async function presentBackup(schedule) {
  const adminEmail = await adminNotifyEmail();
  return { ...schedule, email: backupRecipient(schedule, adminEmail), admin_email: adminEmail };
}

export async function getBackupSchedule() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("backup_schedules").select("*").eq("id", SCHEDULE_ID).maybeSingle();
  if (error) {
    if (/does not exist|schema cache|Could not find/i.test(error.message || "")) return presentBackup(normalizeBackup(null));
    throw new Error(error.message);
  }
  return presentBackup(normalizeBackup(data));
}

export async function saveBackupSchedule(input) {
  const supabase = getSupabase();
  const loaded = await supabase.from("backup_schedules").select("*").eq("id", SCHEDULE_ID).maybeSingle();
  if (loaded.error && /does not exist|schema cache|Could not find/i.test(loaded.error.message || "")) {
    const err = new Error("Create the backup_schedules table in Supabase (server/supabase/schema.sql), then save again.");
    err.status = 400;
    throw err;
  }
  const prev = normalizeBackup(loaded.data);
  const rest = { ...(input || {}) };
  delete rest.admin_email;
  if (!Object.prototype.hasOwnProperty.call(input || {}, "email")) delete rest.email;
  if (!String(rest.last_sent_at || "").trim()) delete rest.last_sent_at;
  const next = normalizeBackup({ ...prev, ...rest, id: SCHEDULE_ID });
  if (Object.prototype.hasOwnProperty.call(input || {}, "email")) {
    const email = String(input.email || "").trim();
    if (!isEmail(email)) {
      const err = new Error("Enter a valid backup email address.");
      err.status = 400;
      throw err;
    }
    next.email = email;
    next.email_override = true;
  }
  if (!validCron(next.cron)) {
    const err = new Error("Enter a valid 5-field cron expression, e.g. 0 2 * * *");
    err.status = 400;
    throw err;
  }
  const row = rowForDb(next);
  let { error } = await supabase.from("backup_schedules").upsert(row);
  if (error && /email_override/i.test(error.message || "")) {
    const { email_override: _flag, ...withoutFlag } = row;
    ({ error } = await supabase.from("backup_schedules").upsert(withoutFlag));
  }
  if (error) {
    if (/does not exist|schema cache|Could not find/i.test(error.message || "")) {
      const err = new Error("Create the backup_schedules table in Supabase (server/supabase/schema.sql), then save again.");
      err.status = 400;
      throw err;
    }
    throw new Error(error.message);
  }
  return presentBackup(next);
}

async function allRows(supabase, table) {
  const page = 1000;
  let from = 0;
  const rows = [];
  while (true) {
    const { data, error } = await supabase.from(table).select("*").range(from, from + page - 1);
    if (error) {
      if (/schema cache|does not exist|Could not find the table/i.test(error.message || "")) return [];
      throw new Error(table + ": " + error.message);
    }
    const chunk = data || [];
    rows.push(...chunk);
    if (chunk.length < page) break;
    from += page;
  }
  return rows;
}

function sqlValue(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "object") return "'" + JSON.stringify(v).replace(/'/g, "''") + "'";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function toSql(dump) {
  const lines = ["-- BHR Traders database dump", "-- " + dump.created_at, "BEGIN;"];
  Object.entries(dump.tables).forEach(([table, rows]) => {
    lines.push("");
    lines.push("-- " + table + " (" + rows.length + ")");
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    rows.forEach((row) => {
      const vals = cols.map((c) => sqlValue(row[c]));
      lines.push("INSERT INTO public." + table + " (" + cols.join(", ") + ") VALUES (" + vals.join(", ") + ");");
    });
  });
  lines.push("COMMIT;");
  return lines.join("\n");
}

export async function buildDbDump() {
  const supabase = getSupabase();
  const tables = {};
  const counts = {};
  for (const table of TABLES) {
    const rows = await allRows(supabase, table);
    tables[table] = rows;
    counts[table] = rows.length;
  }
  const created = new Date().toISOString();
  const ist = istParts();
  const dump = {
    app: "bhr-traders",
    created_at: created,
    stamp: ist.stamp,
    tables
  };
  const jsonBuf = Buffer.from(JSON.stringify(dump), "utf8");
  const sqlBuf = Buffer.from(toSql(dump), "utf8");
  const gz = gzipSync(jsonBuf);
  const filename = "BHR-db-" + ist.dateKey + ".json.gz";
  return {
    filename,
    sqlName: "BHR-db-" + ist.dateKey + ".sql",
    gzip: gz,
    json: jsonBuf,
    sql: sqlBuf,
    counts,
    rows: Object.values(counts).reduce((n, c) => n + c, 0),
    stamp: ist.stamp
  };
}

export async function sendDbBackup(schedule) {
  const dump = await buildDbDump();
  const to = await resolveBackupTo(schedule || await getBackupSchedule());
  const summary = Object.entries(dump.counts)
    .map(([k, v]) => k + ": " + v)
    .join("\n");
  await sendMail({
    to,
    subject: "BHR Traders · DB backup " + dump.stamp,
    text: "Database dump attached.\n\n" + summary,
    html: wrapHtml(
      "Database backup",
      "<p style=\"margin:0 0 16px\">A gzipped JSON dump and SQL export of the BHR Traders database are attached.</p><pre style=\"margin:0;padding:14px;background:#f9f8f3;border:1px solid #eadfc8;font-size:12px;line-height:1.5;color:#1a2418\">" +
        summary.replace(/</g, "") +
        "</pre>",
      { kicker: "Admin backup", preheader: "Database dump " + dump.stamp }
    ),
    attachments: [
      { filename: dump.filename, content: dump.gzip, contentType: "application/gzip" },
      { filename: dump.sqlName, content: dump.sql, contentType: "application/sql" }
    ]
  });
  return { to, filename: dump.filename, sqlName: dump.sqlName, rows: dump.rows, counts: dump.counts };
}

function fieldMatch(field, value) {
  return String(field)
    .split(",")
    .some((part) => {
      if (part === "*") return true;
      if (part.includes("/")) {
        const [range, stepS] = part.split("/");
        const step = Number(stepS) || 1;
        const start = range === "*" ? 0 : Number(String(range).split("-")[0]);
        return value >= start && (value - start) % step === 0;
      }
      if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        return value >= a && value <= b;
      }
      return Number(part) === value;
    });
}

export function cronMatches(expr, ist, opts = {}) {
  const parts = String(expr || "").trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const day = Number(String(ist.dateKey).split("-")[2]);
  const month = Number(String(ist.dateKey).split("-")[1]);
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dowMap[ist.weekday];
  return (
    (opts.ignoreMinute || fieldMatch(parts[0], ist.minute)) &&
    fieldMatch(parts[1], ist.hour) &&
    fieldMatch(parts[2], day) &&
    fieldMatch(parts[3], month) &&
    fieldMatch(parts[4], dow)
  );
}

export async function tickScheduledBackup() {
  const cfg = await getBackupSchedule();
  if (!cfg.enabled) return { skipped: "disabled" };
  if (!cfg.email_enabled) return { skipped: "email-off" };
  const now = istParts();
  if (!cronMatches(cfg.cron, now, { ignoreMinute: true })) return { skipped: "cron" };
  const runKey = now.dateKey + "-" + String(now.hour).padStart(2, "0");
  if (cfg.last_attempt_key === runKey) return { skipped: "already" };
  const stamp = {
    enabled: cfg.enabled,
    email_enabled: cfg.email_enabled,
    cron: cfg.cron
  };
  await saveBackupSchedule({ ...stamp, last_attempt_key: runKey });
  try {
    await sendDbBackup(cfg);
    await saveBackupSchedule({
      ...stamp,
      last_attempt_key: runKey,
      last_run_key: runKey,
      last_sent_at: new Date().toISOString(),
      last_error: ""
    });
    return { ok: true, runKey };
  } catch (err) {
    await saveBackupSchedule({
      ...stamp,
      last_attempt_key: runKey,
      last_error: String(err.message || err)
    });
    return { ok: false, error: String(err.message || err) };
  }
}
