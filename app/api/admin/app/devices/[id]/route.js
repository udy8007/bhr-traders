import { requireAdmin, unauthorized } from "../../../../../../server/lib/auth.js";
import { getAppDevice, updateAppDeviceStatus } from "../../../../../../server/lib/appDevices.js";
import { writeAudit } from "../../../../../../server/lib/logs.js";
import { getSupabase, json, options } from "../../../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req, { params }) {
  try {
    requireAdmin(req);
    const url = new URL(req.url);
    const locationLimit = url.searchParams.get("locationLimit") || "50";
    const supabase = getSupabase();
    const payload = await getAppDevice(supabase, decodeURIComponent(params.id), { locationLimit });
    return json(payload);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status || 500);
  }
}

export async function PATCH(req, { params }) {
  try {
    requireAdmin(req);
    const id = decodeURIComponent(params.id);
    const body = await req.json().catch(() => ({}));
    const status = body.status;
    if (!status) return json({ error: "status is required" }, 400);
    const supabase = getSupabase();
    const result = await updateAppDeviceStatus(supabase, id, status);
    writeAudit({
      req,
      action: "update",
      entity: "app_device",
      entityId: id,
      detail: "Status → " + result.device.status
    });
    return json(result);
  } catch (err) {
    if (err.status === 401) return unauthorized();
    return json({ error: err.message }, err.status || 500);
  }
}
