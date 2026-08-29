import { getToken, verifyToken } from "./auth.js";
import { getSupabase } from "./supabase.js";

function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return "";
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function dayLabel(d) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isToday(iso) {
  return dayKey(iso) === dayKey(new Date());
}

function nid(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function countMap(rows, keyFn) {
  const map = {};
  rows.forEach((r) => {
    const k = keyFn(r) || "Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function daySeries(days, rows) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({
      label: dayLabel(d),
      count: rows.filter((v) => dayKey(v.created_at) === key).length
    });
  }
  return out;
}

export function actorOf(req) {
  if (!req) return "system";
  try {
    return verifyToken(getToken(req))?.email || "storefront";
  } catch {
    return "storefront";
  }
}

const SNAP = {
  product: ["title", "short", "cat", "price", "price_label", "grain", "moisture", "pack", "origin", "moq", "broken", "aroma", "cook", "use_for", "active", "description"],
  category: ["name", "sort"],
  pack: ["size", "best_for", "typical_use", "buying_tip", "sort"],
  order: ["status", "name", "phone", "city", "total", "pay"],
  enquiry: ["status", "name", "phone", "product", "qty", "message"],
  auth: ["session"]
};

export function snap(entity, row) {
  if (!row) return null;
  const keys = SNAP[entity] || Object.keys(row).filter((k) => k !== "id" && k !== "created_at" && typeof row[k] !== "object");
  const out = {};
  keys.forEach((k) => {
    out[k] = row[k] == null ? "" : row[k];
  });
  return out;
}

export function fieldDiff(before, after) {
  const a = before || {};
  const b = after || {};
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  const removedOnly = Boolean(before) && !after;
  const addedOnly = !before && Boolean(after);
  return keys
    .map((field) => {
      const oldVal = a[field];
      const nextVal = b[field];
      if (String(oldVal ?? "") === String(nextVal ?? "")) return null;
      let kind = "changed";
      if (addedOnly || oldVal === undefined || oldVal === "" || oldVal === null) kind = "added";
      if (removedOnly || nextVal === undefined || nextVal === "" || nextVal === null) kind = "removed";
      if (!addedOnly && !removedOnly && String(oldVal ?? "") !== String(nextVal ?? "") && oldVal !== "" && oldVal != null && nextVal !== "" && nextVal != null) {
        kind = "changed";
      }
      return {
        field,
        old: oldVal == null ? "" : String(oldVal),
        next: nextVal == null ? "" : String(nextVal),
        kind
      };
    })
    .filter(Boolean);
}

function asJson(v) {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

function parseJson(v, fallback) {
  if (v == null || v === "") return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function parseAudit(row) {
  const before = parseJson(row.before_json, null);
  const after = parseJson(row.after_json, null);
  let changes = parseJson(row.changes, []);
  if (!Array.isArray(changes)) changes = [];
  if (!changes.length && (before || after)) changes = fieldDiff(before, after);
  return { ...row, before, after, changes, changeCount: changes.length };
}

export async function writeError(entry = {}) {
  try {
    const row = {
      id: nid("err"),
      level: entry.level || (Number(entry.status) >= 500 ? "error" : "warn"),
      source: String(entry.source || "api").slice(0, 40),
      message: String(entry.message || "Unknown error").slice(0, 500),
      stack: String(entry.stack || "").slice(0, 2000),
      path: String(entry.path || "").slice(0, 200),
      status: Number(entry.status || 0) || null,
      created_at: new Date().toISOString()
    };
    const supabase = getSupabase();
    await supabase.from("error_logs").insert(row);
  } catch {
    /* never throw from logger */
  }
}

export async function writeAudit(entry = {}) {
  try {
    const before = entry.before || null;
    const after = entry.after || null;
    const changes = Array.isArray(entry.changes) ? entry.changes : fieldDiff(before, after);
    const detail =
      entry.detail ||
      (changes[0] ? changes[0].field + ": " + (changes[0].old || "—") + " → " + (changes[0].next || "—") : "");
    const row = {
      id: nid("aud"),
      actor: String(entry.actor || (entry.req ? actorOf(entry.req) : "system")).slice(0, 120),
      action: String(entry.action || "update").slice(0, 40),
      entity: String(entry.entity || "system").slice(0, 40),
      entity_id: String(entry.entityId || entry.entity_id || "").slice(0, 80),
      detail: String(detail || "").slice(0, 400),
      before_json: asJson(before),
      after_json: asJson(after),
      changes: asJson(changes),
      created_at: new Date().toISOString()
    };
    const supabase = getSupabase();
    await supabase.from("audit_logs").insert(row);
  } catch {
    /* never throw from logger */
  }
}

export function summarizeErrors(rows, opts = {}) {
  const list = rows || [];
  const pageSize = Math.min(50, Math.max(5, Number(opts.pageSize || 10)));
  const level = opts.level || "all";
  const filtered = list.filter((r) => {
    if (level === "error") return r.level === "error" || Number(r.status) >= 500;
    if (level === "warn") return r.level !== "error" && Number(r.status) < 500;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const page = Math.min(Math.max(1, Number(opts.page || 1)), pages);
  const start = (page - 1) * pageSize;
  const fatal = list.filter((r) => r.level === "error" || Number(r.status) >= 500).length;
  return {
    total: list.length,
    filtered: filtered.length,
    page,
    pageSize,
    pages,
    start,
    today: list.filter((r) => isToday(r.created_at)).length,
    errors: fatal,
    warnings: list.length - fatal,
    series14: daySeries(14, list),
    byLevel: countMap(list, (r) => r.level || "warn"),
    bySource: countMap(list, (r) => r.source || "api"),
    rows: filtered.slice(start, start + pageSize)
  };
}

export function summarizeAudits(rows, opts = {}) {
  const list = rows || [];
  const pageSize = Math.min(50, Math.max(5, Number(opts.pageSize || 10)));
  const entity = opts.entity || "all";
  const filtered = entity === "all" || !entity ? list : list.filter((r) => r.entity === entity);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const page = Math.min(Math.max(1, Number(opts.page || 1)), pages);
  const start = (page - 1) * pageSize;
  return {
    total: list.length,
    filtered: filtered.length,
    page,
    pageSize,
    pages,
    start,
    today: list.filter((r) => isToday(r.created_at)).length,
    logins: list.filter((r) => r.action === "login" || r.action === "login_failed").length,
    catalog: list.filter((r) => ["product", "category", "pack"].includes(r.entity)).length,
    sales: list.filter((r) => ["order", "enquiry"].includes(r.entity)).length,
    series14: daySeries(14, list),
    byEntity: countMap(list, (r) => r.entity || "system"),
    byAction: countMap(list, (r) => r.action || "update"),
    rows: filtered.slice(start, start + pageSize).map(parseAudit)
  };
}
