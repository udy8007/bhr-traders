import { classifyDevice } from "../../../server/lib/device.js";
import { startReportCron } from "../../../server/lib/reportCron.js";
import { getSupabase, json, options } from "../../../server/lib/supabase.js";
import { isAdminPath, isAdminRequest, shopPath } from "../../../server/lib/shopVisits.js";

export function OPTIONS() {
  return options();
}

function clean(v) {
  try {
    return decodeURIComponent(String(v || "").trim()).slice(0, 120);
  } catch {
    return String(v || "").trim().slice(0, 120);
  }
}

export async function POST(req) {
  try {
    startReportCron();
    const body = await req.json().catch(() => ({}));
    if (isAdminRequest(req) || isAdminPath(body.path) || String(body.source || "").toLowerCase() === "admin") {
      return json({ ok: true, ignored: true });
    }
    const kind = ["page", "checkout_start", "checkout_complete"].includes(body.kind) ? body.kind : "page";
    const screen = clean(body.screen);
    const device = classifyDevice({
      device: body.device,
      screen,
      userAgent: req.headers.get("user-agent")
    });
    const row = {
      id: "v-" + Date.now() + "-" + Math.floor(Math.random() * 9999),
      kind,
      path: kind === "page" ? "home" : clean(shopPath(body.path) || "home"),
      title: "",
      referrer: clean(body.referrer),
      city: clean(body.city),
      region: clean(body.region),
      country: clean(body.country),
      tz: "",
      lang: "",
      screen,
      device,
      created_at: new Date().toISOString()
    };
    const supabase = getSupabase();
    let { error } = await supabase.from("visits").insert(row);
    if (error && /device/i.test(error.message || "")) {
      const fallback = { ...row };
      delete fallback.device;
      fallback.screen = [device, screen].filter(Boolean).join(" ").slice(0, 120);
      ({ error } = await supabase.from("visits").insert(fallback));
    }
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true }, 201);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
