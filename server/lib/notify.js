import { getSupabase } from "./supabase.js";
import { sendMail, wrapHtml } from "./mail.js";

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
    inbox_cleared_at: Number(base.inbox_cleared_at || 0) || 0
  };
}

export async function getNotifyConfig() {
  const supabase = getSupabase();
  const { data } = await supabase.from("notification_config").select("*").eq("id", CONFIG_ID).maybeSingle();
  return normalizeConfig(data);
}

export async function saveNotifyConfig(input) {
  const next = normalizeConfig(input);
  const supabase = getSupabase();
  const { data, error } = await supabase.from("notification_config").upsert(next).select().single();
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

async function writeInbox({ title, body, href, entity, entity_id, created_at }) {
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
  const ext = String(msg.id || "");
  const stamp = Number(msg.time || 0);
  const config = await getNotifyConfig();
  if (config.inbox_cleared_at && stamp && stamp <= Number(config.inbox_cleared_at)) return null;
  const supabase = getSupabase();
  if (ext) {
    const found = await supabase.from("admin_inbox").select("id").eq("entity_id", ext).maybeSingle();
    if (found.data) return found.data;
  }
  const when = stamp ? new Date(stamp * 1000).toISOString() : new Date().toISOString();
  const blob = title + " " + body;
  const orderMatch = blob.match(/BHR-\d+/i);
  let href = String(msg.click || "");
  if (!href.startsWith("/")) {
    href = orderMatch ? "/sales/orders/" + orderMatch[0].toUpperCase() : "/notifications/log";
  }
  await writeInbox({
    title: title || "Push notification",
    body,
    href,
    entity: "ntfy",
    entity_id: ext,
    created_at: when
  });
  return { ok: true };
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

export async function markAdminInboxRead() {
  const supabase = getSupabase();
  const { data } = await supabase.from("admin_inbox").select("id");
  const rows = data || [];
  for (const row of rows) {
    await supabase.from("admin_inbox").update({ read: true }).eq("id", row.id);
  }
}

export async function syncNtfyInbox() {
  const config = await getNotifyConfig();
  const url = config.ntfy_url + "/" + encodeURIComponent(config.ntfy_topic) + "/json?poll=1&since=all";
  const res = await fetch(url);
  if (!res.ok) return;
  const text = await res.text();
  const chunks = text.trim() ? text.trim().split(/\n+/) : [];
  for (const chunk of chunks) {
    try {
      await ingestNtfyMessage(JSON.parse(chunk));
    } catch {
      /* skip bad line */
    }
  }
}

async function sendPush(config, { title, body, tags }) {
  const topic = encodeURIComponent(config.ntfy_topic || "bhr-traders");
  const url = (config.ntfy_url || "https://ntfy.sh") + "/" + topic;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Title: title,
      Tags: tags || "rice_bowl",
      Priority: "default"
    },
    body: body
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "ntfy request failed (" + res.status + ")");
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
  tags
}) {
  try {
    const config = await getNotifyConfig();
    const adminTitle = title;
    const adminBody = body;

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
        await sendPush(config, { title: adminTitle, body: adminBody, tags });
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
          text: adminBody,
          html: wrapHtml(adminTitle, "<p>" + adminBody.replace(/\n/g, "<br/>") + "</p>")
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

    if (customerEmail) {
      if (config.email_enabled) {
        try {
          await sendMail({
            to: customerEmail,
            subject: "BHR Traders — " + title,
            text: customerText || body,
            html: customerHtml || wrapHtml(title, "<p>" + (customerText || body).replace(/\n/g, "<br/>") + "</p>")
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
