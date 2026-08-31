import { runSchedulerTick } from "../../../../server/lib/scheduler.js";
import { json, options } from "../../../../server/lib/supabase.js";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

function cronAllowed(req) {
  const secret = String(process.env.CRON_SECRET || "").trim();
  if (secret) {
    return String(req.headers.get("authorization") || "") === "Bearer " + secret;
  }
  return process.env.NODE_ENV !== "production";
}

/** Vercel Cron fallback (daily on Hobby) + optional external cron hit. */
export async function GET(req) {
  try {
    if (!cronAllowed(req)) return json({ error: "Unauthorized." }, 401);
    const result = await runSchedulerTick("cron");
    return json({ ok: true, ...result });
  } catch (err) {
    console.error("cron scheduler failed:", err);
    return json({ error: err.message || "Scheduler failed" }, err.status || 500);
  }
}

export async function POST(req) {
  return GET(req);
}
