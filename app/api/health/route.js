import { json, options, supabaseConfigured } from "../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET() {
  return json({
    ok: supabaseConfigured(),
    mode: supabaseConfigured() ? "supabase" : "unconfigured",
    url: process.env.SUPABASE_URL || "",
    fileStore: process.env.USE_FILE_STORE === "1"
  });
}
