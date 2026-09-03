import { mapCustomer, requireCustomer } from "../../../../server/lib/customerAuth.js";
import { getSupabase, json, options } from "../../../../server/lib/supabase.js";

export function OPTIONS() {
  return options();
}

export async function GET(req) {
  try {
    const auth = requireCustomer(req);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("customers").select("*").eq("id", auth.sub).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Account not found." }, 404);
    return json({ customer: mapCustomer(data) });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}

export async function PATCH(req) {
  try {
    const auth = requireCustomer(req);
    const body = await req.json().catch(() => ({}));
    const patch = { updated_at: new Date().toISOString() };
    ["name", "phone", "address", "city", "pincode"].forEach((k) => {
      if (body[k] !== undefined) patch[k] = String(body[k] || "").trim() || null;
    });
    const supabase = getSupabase();
    const { data, error } = await supabase.from("customers").update(patch).eq("id", auth.sub).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ customer: mapCustomer(data) });
  } catch (err) {
    return json({ error: err.message }, err.status || 500);
  }
}
