import { classifyDevice } from "./device.js";
import { applySchema, isMissingTableError } from "./applySchema.js";

export const APP_DEVICE_STATUSES = ["Active", "Inactive", "Blocked"];

function normalizeStatus(value) {
  const v = String(value || "Active").trim();
  return APP_DEVICE_STATUSES.includes(v) ? v : "Active";
}

function isBlocked(row) {
  return normalizeStatus(row?.status) === "Blocked";
}

function isInactive(row) {
  return normalizeStatus(row?.status) === "Inactive";
}

function assertAppDeviceActive(row) {
  if (isBlocked(row)) throw Object.assign(new Error("This device is blocked."), { status: 403 });
  if (isInactive(row)) {
    throw Object.assign(new Error("Device is deregistered. Call /api/app/register to activate again."), { status: 403 });
  }
}

const ONLINE_MS = 5 * 60 * 1000;

function clean(v, max = 120) {
  return String(v || "").trim().slice(0, max);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function nowIso() {
  return new Date().toISOString();
}

function mapDevice(row) {
  if (!row) return null;
  const lastHeartbeat = row.last_heartbeat_at || row.registered_at;
  const online = lastHeartbeat ? Date.now() - new Date(lastHeartbeat).getTime() <= ONLINE_MS : false;
  return {
    id: row.id,
    platform: row.platform || "",
    model: row.model || "",
    osVersion: row.os_version || "",
    appVersion: row.app_version || "",
    pushToken: row.push_token || "",
    customerId: row.customer_id || null,
    screen: row.screen || "",
    device: row.device || "",
    ua: row.ua || "",
    battery: row.battery,
    network: row.network || "",
    appState: row.app_state || "",
    status: normalizeStatus(row.status),
    lastHeartbeatAt: row.last_heartbeat_at || null,
    lastLocation: row.last_lat != null && row.last_lng != null
      ? {
          lat: Number(row.last_lat),
          lng: Number(row.last_lng),
          accuracy: row.last_location_accuracy != null ? Number(row.last_location_accuracy) : null,
          city: row.last_city || "",
          region: row.last_region || "",
          country: row.last_country || "",
          at: row.last_location_at || null
        }
      : null,
    registeredAt: row.registered_at,
    updatedAt: row.updated_at,
    online
  };
}

function mapLocation(row) {
  return {
    id: row.id,
    deviceId: row.device_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    accuracy: row.accuracy != null ? Number(row.accuracy) : null,
    city: row.city || "",
    region: row.region || "",
    country: row.country || "",
    createdAt: row.created_at
  };
}

async function ensureTables(supabase, fn) {
  let result = await fn();
  if (result.error && isMissingTableError(result.error)) {
    await applySchema();
    await new Promise((r) => setTimeout(r, 1200));
    result = await fn();
  }
  return result;
}

export async function registerAppDevice(supabase, body = {}, req) {
  const id = clean(body.deviceId || body.device_id || body.id, 80);
  if (!id) throw Object.assign(new Error("deviceId is required"), { status: 400 });

  const screen = clean(body.screen, 80);
  const ua = clean(req?.headers?.get?.("user-agent") || body.ua, 240);
  const device = classifyDevice({ device: body.device, screen, userAgent: ua });
  const now = nowIso();
  const row = {
    id,
    platform: clean(body.platform, 40),
    model: clean(body.model, 80),
    os_version: clean(body.osVersion || body.os_version, 40),
    app_version: clean(body.appVersion || body.app_version, 40),
    push_token: clean(body.pushToken || body.push_token, 240),
    customer_id: clean(body.customerId || body.customer_id, 80) || null,
    ua,
    screen,
    device,
    status: "Active",
    last_heartbeat_at: now,
    updated_at: now
  };

  const existing = await ensureTables(supabase, () => supabase.from("app_devices").select("*").eq("id", id).maybeSingle());
  if (existing.error) throw new Error(existing.error.message);

  if (existing.data) {
    if (isBlocked(existing.data)) {
      throw Object.assign(new Error("This device is blocked. Contact support."), { status: 403 });
    }
    const patch = { ...row };
    delete patch.status;
    patch.status = normalizeStatus(existing.data.status) === "Inactive" ? "Active" : normalizeStatus(existing.data.status);
    const updated = await supabase.from("app_devices").update(patch).eq("id", id).select("*").single();
    if (updated.error) throw new Error(updated.error.message);
    return { device: mapDevice(updated.data), created: false };
  }

  row.registered_at = now;
  const inserted = await supabase.from("app_devices").insert(row).select("*").single();
  if (inserted.error) throw new Error(inserted.error.message);
  return { device: mapDevice(inserted.data), created: true };
}

export async function deregisterAppDevice(supabase, body = {}) {
  const id = clean(body.deviceId || body.device_id || body.id, 80);
  if (!id) throw Object.assign(new Error("deviceId is required"), { status: 400 });

  const existing = await ensureTables(supabase, () => supabase.from("app_devices").select("*").eq("id", id).maybeSingle());
  if (existing.error) throw new Error(existing.error.message);
  if (!existing.data) throw Object.assign(new Error("Device not registered."), { status: 404 });
  if (isBlocked(existing.data)) {
    throw Object.assign(new Error("This device is blocked. Contact support."), { status: 403 });
  }
  if (isInactive(existing.data)) {
    return { ok: true, deregistered: false, device: mapDevice(existing.data) };
  }

  const now = nowIso();
  const updated = await supabase
    .from("app_devices")
    .update({
      status: "Inactive",
      push_token: "",
      app_state: "deregistered",
      updated_at: now
    })
    .eq("id", id)
    .select("*")
    .single();
  if (updated.error) throw new Error(updated.error.message);
  return { ok: true, deregistered: true, device: mapDevice(updated.data) };
}

export async function heartbeatAppDevice(supabase, body = {}) {
  const id = clean(body.deviceId || body.device_id || body.id, 80);
  if (!id) throw Object.assign(new Error("deviceId is required"), { status: 400 });

  const now = nowIso();
  const patch = {
    last_heartbeat_at: now,
    updated_at: now
  };
  const battery = num(body.battery);
  if (battery != null) patch.battery = battery;
  const network = clean(body.network, 40);
  if (network) patch.network = network;
  const appState = clean(body.appState || body.app_state, 40);
  if (appState) patch.app_state = appState;

  const existing = await ensureTables(supabase, () => supabase.from("app_devices").select("*").eq("id", id).maybeSingle());
  if (existing.error) throw new Error(existing.error.message);
  if (!existing.data) throw Object.assign(new Error("Device not registered. Call /api/app/register first."), { status: 404 });
  assertAppDeviceActive(existing.data);

  const result = await supabase.from("app_devices").update(patch).eq("id", id).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return { device: mapDevice(result.data) };
}

export async function reportAppLocation(supabase, body = {}) {
  const id = clean(body.deviceId || body.device_id || body.id, 80);
  const lat = num(body.lat ?? body.latitude);
  const lng = num(body.lng ?? body.longitude);
  if (!id) throw Object.assign(new Error("deviceId is required"), { status: 400 });
  if (lat == null || lng == null) throw Object.assign(new Error("lat and lng are required"), { status: 400 });

  const existing = await ensureTables(supabase, () => supabase.from("app_devices").select("*").eq("id", id).maybeSingle());
  if (existing.error) throw new Error(existing.error.message);
  if (!existing.data) throw Object.assign(new Error("Device not registered. Call /api/app/register first."), { status: 404 });
  assertAppDeviceActive(existing.data);

  const accuracy = num(body.accuracy);
  const city = clean(body.city, 80);
  const region = clean(body.region, 80);
  const country = clean(body.country, 80);
  const now = nowIso();
  const locationRow = {
    id: "loc-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
    device_id: id,
    lat,
    lng,
    accuracy,
    city,
    region,
    country,
    created_at: now
  };

  const inserted = await supabase.from("app_locations").insert(locationRow);
  if (inserted.error) throw new Error(inserted.error.message);

  const patch = {
    last_lat: lat,
    last_lng: lng,
    last_location_accuracy: accuracy,
    last_city: city,
    last_region: region,
    last_country: country,
    last_location_at: now,
    updated_at: now
  };
  const updated = await supabase.from("app_devices").update(patch).eq("id", id).select("*").single();
  if (updated.error) throw new Error(updated.error.message);
  return { device: mapDevice(updated.data), location: mapLocation(locationRow) };
}

export async function listAppDevices(supabase) {
  const result = await ensureTables(supabase, () =>
    supabase.from("app_devices").select("*").order("last_heartbeat_at", { ascending: false, nullsFirst: false })
  );
  if (result.error) throw new Error(result.error.message);
  const devices = (result.data || []).map(mapDevice);
  return {
    devices,
    stats: {
      total: devices.length,
      online: devices.filter((d) => d.online).length,
      withLocation: devices.filter((d) => d.lastLocation).length,
      active: devices.filter((d) => d.status === "Active").length,
      inactive: devices.filter((d) => d.status === "Inactive").length,
      blocked: devices.filter((d) => d.status === "Blocked").length
    }
  };
}

export async function getAppDevice(supabase, id, { locationLimit = 50 } = {}) {
  const deviceRes = await ensureTables(supabase, () => supabase.from("app_devices").select("*").eq("id", id).maybeSingle());
  if (deviceRes.error) throw new Error(deviceRes.error.message);
  if (!deviceRes.data) throw Object.assign(new Error("Device not found"), { status: 404 });

  const locRes = await supabase
    .from("app_locations")
    .select("*")
    .eq("device_id", id)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(Number(locationLimit) || 50, 1), 200));

  return {
    device: mapDevice(deviceRes.data),
    locations: (locRes.error ? [] : locRes.data || []).map(mapLocation)
  };
}

export async function updateAppDeviceStatus(supabase, id, status) {
  const next = normalizeStatus(status);
  const result = await ensureTables(supabase, () =>
    supabase
      .from("app_devices")
      .update({ status: next, updated_at: nowIso() })
      .eq("id", id)
      .select("*")
      .maybeSingle()
  );
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw Object.assign(new Error("Device not found"), { status: 404 });
  return { device: mapDevice(result.data) };
}
