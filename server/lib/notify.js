import { after } from "next/server";
import { getSupabase } from "./supabase.js";
import { escapeHtml, sendMail, wrapHtml } from "./mail.js";

const CONFIG_ID = "default";

export const DEFAULT_CONFIG = {
  id: CONFIG_ID,
  admin_email: "info@bhrtraders.com",
  email_enabled: true,
  push_enabled: true,
  ntfy_topic: "bhr-traders",
  ntfy_url: "https://ntfy.sh",
  inbox_cleared_at: 0
};

function nid(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function asBool(v, fallback = true) {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return fallback;
}

export function normalizeConfig(row) {
  const base = { ...DEFAULT_CONFIG, ...(row || {}) };
  return {
    id: CONFIG_ID,
    admin_email: String(base.admin_email || DEFAULT_CONFIG.admin_email).trim(),
    email_enabled: asBool(base.email_enabled, true),
    push_enabled: asBool(base.push_enabled, true),
    ntfy_topic: String(base.ntfy_topic || DEFAULT_CONFIG.ntfy_topic).trim() || "bhr-traders",
    ntfy_url: String(base.ntfy_url || DEFAULT_CONFIG.ntfy_url).replace(/\/$/, ""),
    inbox_cleared_at: Number(base.inbox_cleared_at || 0) || 0,
    pending_alert_at: Number(base.pending_alert_at || 0) || 0
  };
}

export async function getNotifyConfig() {
  const supabase = getSupabase();
  const { data } = await supabase.from("notification_config").select("*").eq("id", CONFIG_ID).maybeSingle();
  return normalizeConfig(data);
}

export async function adminNotifyEmail() {
  const cfg = await getNotifyConfig();
  return String(cfg.admin_email || DEFAULT_CONFIG.admin_email).trim();
}

export async function saveNotifyConfig(input) {
  const current = await getNotifyConfig();
  const next = normalizeConfig({
    ...current,
    ...(input || {}),
    pending_alert_at:
      input && input.pending_alert_at != null ? input.pending_alert_at : current.pending_alert_at
  });
  const supabase = getSupabase();
  let { data, error } = await supabase.from("notification_config").upsert(next).select().single();
  if (error && /inbox_cleared_at|pending_alert_at|schema cache/i.test(error.message || "")) {
    const { inbox_cleared_at: _cleared, pending_alert_at: _pending, ...row } = next;
    const retry = await supabase.from("notification_config").upsert(row).select().single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw new Error(error.message);
  return normalizeConfig(data || next);
}

async function writeLog(row) {
  const supabase = getSupabase();
  await supabase.from("notification_logs").insert({
    id: nid("nl"),
    created_at: new Date().toISOString(),
    ...row
  });
}

function inboxDedupeKey(row) {
  const blob = [row.title, row.body].filter(Boolean).join(" ");
  const order = blob.match(/BHR-\d+/i);
  if (order) return "order:" + order[0].toUpperCase();
  const entity = String(row.entity || "").trim();
  const entityId = String(row.entity_id || "").trim();
  if (entity && entity !== "ntfy" && entityId) return entity + ":" + entityId;
  const title = String(row.title || "").toLowerCase().replace(/\s+/g, " ").trim();
  const body = String(row.body || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120);
  return title + "|" + body;
}

async function findInboxByKey({ entity, entity_id, title, body }) {
  const supabase = getSupabase();
  const entityId = String(entity_id || "").trim();
  if (entity && entity !== "ntfy" && entityId) {
    const found = await supabase.from("admin_inbox").select("id").eq("entity", entity).eq("entity_id", entityId).limit(1);
    if (found.data?.[0]) return found.data[0];
  }
  if (entityId) {
    const found = await supabase.from("admin_inbox").select("id").eq("entity_id", entityId).limit(1);
    if (found.data?.[0]) return found.data[0];
  }
  const order = String(title + " " + body).match(/BHR-\d+/i);
  if (order) {
    const id = order[0].toUpperCase();
    const byEntity = await supabase.from("admin_inbox").select("id").eq("entity_id", id).limit(1);
    if (byEntity.data?.[0]) return byEntity.data[0];
    const byTitle = await supabase.from("admin_inbox").select("id").ilike("title", "%" + id + "%").limit(1);
    if (byTitle.data?.[0]) return byTitle.data[0];
  }
  return null;
}

async function writeInbox({ title, body, href, entity, entity_id, created_at }) {
  const existing = await findInboxByKey({ entity, entity_id, title, body });
  if (existing) return existing;
  const supabase = getSupabase();
  await supabase.from("admin_inbox").insert({
    id: nid("in"),
    title,
    body,
    href: href || "",
    entity: entity || "",
    entity_id: entity_id || "",
    read: false,
    created_at: created_at || new Date().toISOString()
  });
}

export async function ingestNtfyMessage(msg) {
  if (!msg || (msg.event && msg.event !== "message")) return null;
  const title = String(msg.title || "BHR Traders").trim();
  const body = String(msg.message || msg.body || "").trim();
  if (!title && !body) return null;
  const stamp = Number(msg.time || 0);
  const config = await getNotifyConfig();
  if (config.inbox_cleared_at && stamp && stamp <= Number(config.inbox_cleared_at)) return null;
  const existing = await findInboxByKey({
    entity: "ntfy",
    entity_id: String(msg.id || ""),
    title,
    body
  });
  if (existing) return existing;
  return null;
}

export async function clearAdminInbox() {
  const supabase = getSupabase();
  const { data } = await supabase.from("admin_inbox").select("id");
  const rows = data || [];
  for (const row of rows) {
    await supabase.from("admin_inbox").delete().eq("id", row.id);
  }
  const config = await getNotifyConfig();
  await saveNotifyConfig({ ...config, inbox_cleared_at: Math.floor(Date.now() / 1000) });
}

export async function clearNotificationLogs() {
  const supabase = getSupabase();
  const { data } = await supabase.from("notification_logs").select("id");
  const rows = data || [];
  for (const row of rows) {
    await supabase.from("notification_logs").delete().eq("id", row.id);
  }
}

export async function resetNotificationHistory() {
  await clearNotificationLogs();
  await clearAdminInbox();
}

export async function markAdminInboxRead() {
  const supabase = getSupabase();
  const { data } = await supabase.from("admin_inbox").select("id");
  const rows = data || [];
  for (const row of rows) {
    await supabase.from("admin_inbox").update({ read: true }).eq("id", row.id);
  }
}

export function dedupeInboxRows(rows) {
  const rank = (row) => (String(row.entity || "") === "ntfy" ? 1 : 0);
  const map = new Map();
  (rows || []).forEach((row) => {
    const key = inboxDedupeKey(row);
    const prev = map.get(key);
    if (!prev || rank(row) < rank(prev)) map.set(key, row);
  });
  return Array.from(map.values()).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
}

export async function pruneMirroredNtfyInbox() {
  const supabase = getSupabase();
  const { data } = await supabase.from("admin_inbox").select("id,entity,entity_id,title,body,created_at");
  const rows = data || [];
  const keep = new Set(dedupeInboxRows(rows).map((row) => row.id));
  const extra = rows.filter((row) => !keep.has(row.id) || String(row.entity || "") === "ntfy");
  for (const row of extra) {
    await supabase.from("admin_inbox").delete().eq("id", row.id);
  }
}

function publicSiteOrigin() {
  const explicit = String(process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://www.bhrtraders.com").trim().replace(/\/$/, "");
  return explicit || "https://www.bhrtraders.com";
}

function adminPath(href) {
  const raw = String(href || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("#/")) return raw.slice(1);
  try {
    const u = new URL(raw);
    const to = u.searchParams.get("to");
    if (to && to.startsWith("/")) return to;
    if (u.hash.startsWith("#/")) return u.hash.slice(1);
  } catch {
    /* keep as-is */
  }
  if (/^https?:\/\//i.test(raw)) return "";
  return "/" + raw.replace(/^#/, "");
}

export function adminDeepLink(href) {
  const path = adminPath(href) || "/";
  const hash = path.startsWith("/") ? path : "/" + path;
  return publicSiteOrigin() + "/admin#" + hash;
}

function adminMailHtml(title, body, clickUrl) {
  return wrapHtml(title, "<p style=\"margin:0 0 8px\">" + escapeHtml(body).replace(/\n/g, "<br/>") + "</p>", {
    kicker: "Admin alert",
    preheader: title,
    button: clickUrl ? { href: clickUrl, label: "Open in backoffice" } : null
  });
}

async function sendPush(config, { title, body, tags, click, priority }) {
  const topic = encodeURIComponent(config.ntfy_topic || "bhr-traders");
  const url = (config.ntfy_url || "https://ntfy.sh") + "/" + topic;
  const headers = {
    Title: title,
    Tags: tags || "rice_bowl",
    Priority: String(priority || "default")
  };
  if (click) {
    headers.Click = click;
    headers.Actions = "view, Open in backoffice, " + click + ", clear=true";
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body,
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

export async function notifyShopEvent({
  event,
  title,
  body,
  href,
  entity,
  entityId,
  customerEmail,
  customerHtml,
  customerText,
  adminHtml,
  skipAdmin,
  tags,
  priority
}) {
  try {
    const config = await getNotifyConfig();
    const adminTitle = title;
    const adminBody = body;
    const clickUrl = href ? adminDeepLink(href) : "";
    const adminText = clickUrl ? adminBody + "\n\nOpen in backoffice:\n" + clickUrl : adminBody;

    if (!skipAdmin) {
      try {
        await writeInbox({ title: adminTitle, body: adminBody, href, entity, entity_id: entityId });
      } catch (err) {
        await writeLog({
          channel: "inbox",
          audience: "admin",
          event,
          title: adminTitle,
          body: adminBody,
          to_addr: "admin",
          status: "failed",
          error: err.message,
          href: href || "",
          entity: entity || "",
          entity_id: entityId || ""
        });
      }

      if (config.push_enabled) {
        try {
          await sendPush(config, { title: adminTitle, body: adminBody, tags, click: clickUrl, priority });
          await writeLog({
            channel: "push",
            audience: "admin",
            event,
            title: adminTitle,
            body: adminBody,
            to_addr: config.ntfy_url + "/" + config.ntfy_topic,
            status: "sent",
            error: "",
            href: href || "",
            entity: entity || "",
            entity_id: entityId || ""
          });
        } catch (err) {
          await writeLog({
            channel: "push",
            audience: "admin",
            event,
            title: adminTitle,
            body: adminBody,
            to_addr: config.ntfy_url + "/" + config.ntfy_topic,
            status: "failed",
            error: err.message,
            href: href || "",
            entity: entity || "",
            entity_id: entityId || ""
          });
        }
      } else {
        await writeLog({
          channel: "push",
          audience: "admin",
          event,
          title: adminTitle,
          body: adminBody,
          to_addr: config.ntfy_topic,
          status: "skipped",
          error: "Push disabled",
          href: href || "",
          entity: entity || "",
          entity_id: entityId || ""
        });
      }

      if (config.email_enabled && config.admin_email) {
        try {
          await sendMail({
            to: config.admin_email,
            subject: "BHR Traders — " + adminTitle,
            text: adminText,
            html: adminHtml
              ? wrapHtml(adminTitle, adminHtml, {
                  kicker: "Admin alert",
                  preheader: adminTitle,
                  button: clickUrl ? { href: clickUrl, label: "Open in backoffice" } : null
                })
              : adminMailHtml(adminTitle, adminBody, clickUrl)
          });
          await writeLog({
            channel: "email",
            audience: "admin",
            event,
            title: adminTitle,
            body: adminBody,
            to_addr: config.admin_email,
            status: "sent",
            error: "",
            href: href || "",
            entity: entity || "",
            entity_id: entityId || ""
          });
        } catch (err) {
          await writeLog({
            channel: "email",
            audience: "admin",
            event,
            title: adminTitle,
            body: adminBody,
            to_addr: config.admin_email,
            status: "failed",
            error: err.message,
            href: href || "",
            entity: entity || "",
            entity_id: entityId || ""
          });
        }
      } else {
        await writeLog({
          channel: "email",
          audience: "admin",
          event,
          title: adminTitle,
          body: adminBody,
          to_addr: config.admin_email || "",
          status: "skipped",
          error: config.email_enabled ? "Admin email missing" : "Email disabled",
          href: href || "",
          entity: entity || "",
          entity_id: entityId || ""
        });
      }
    }

    if (customerEmail) {
      if (config.email_enabled) {
        try {
          await sendMail({
            to: customerEmail,
            subject: "BHR Traders — " + title,
            text: customerText || body,
            html:
              customerHtml ||
              wrapHtml(title, "<p style=\"margin:0\">" + escapeHtml(customerText || body).replace(/\n/g, "<br/>") + "</p>", {
                kicker: "Customer update",
                preheader: title
              })
          });
          await writeLog({
            channel: "email",
            audience: "customer",
            event,
            title,
            body: customerText || body,
            to_addr: customerEmail,
            status: "sent",
            error: "",
            href: href || "",
            entity: entity || "",
            entity_id: entityId || ""
          });
        } catch (err) {
          await writeLog({
            channel: "email",
            audience: "customer",
            event,
            title,
            body: customerText || body,
            to_addr: customerEmail,
            status: "failed",
            error: err.message,
            href: href || "",
            entity: entity || "",
            entity_id: entityId || ""
          });
        }
      } else {
        await writeLog({
          channel: "email",
          audience: "customer",
          event,
          title,
          body: customerText || body,
          to_addr: customerEmail,
          status: "skipped",
          error: "Email disabled",
          href: href || "",
          entity: entity || "",
          entity_id: entityId || ""
        });
      }
    }
  } catch (err) {
    console.error("notifyShopEvent", err);
  }
}

export function queueShopEvent(payload) {
  const run = () => notifyShopEvent(payload).catch((err) => console.error("notifyShopEvent", err));
  try {
    after(run);
  } catch {
    run();
  }
}
