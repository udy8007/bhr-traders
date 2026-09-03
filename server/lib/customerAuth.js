import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getToken, signToken, verifyToken } from "./auth.js";

const SALT_LEN = 16;
const KEY_LEN = 64;
const MIN_PASSWORD_LEN = 6;

function customerSecret() {
  return process.env.CUSTOMER_JWT_SECRET || process.env.ADMIN_JWT_SECRET || "bhr-traders-customer-dev-secret";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashPassword(password) {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(String(password), salt, KEY_LEN);
  return salt.toString("hex") + ":" + hash.toString("hex");
}

export function verifyPassword(password, stored) {
  const parts = String(stored || "").split(":");
  if (parts.length !== 2) return false;
  const salt = Buffer.from(parts[0], "hex");
  const expected = Buffer.from(parts[1], "hex");
  if (!salt.length || expected.length !== KEY_LEN) return false;
  const actual = scryptSync(String(password), salt, KEY_LEN);
  return timingSafeEqual(expected, actual);
}

export function signCustomerToken(customer) {
  return signToken({
    sub: customer.id,
    email: customer.email,
    role: "customer",
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  }, customerSecret());
}

export function verifyCustomerToken(token) {
  const payload = verifyToken(token, customerSecret());
  if (!payload || payload.role !== "customer" || !payload.sub) return null;
  return payload;
}

export function requireCustomer(req) {
  const payload = verifyCustomerToken(getToken(req));
  if (!payload?.sub) {
    const err = new Error("Please log in to continue.");
    err.status = 401;
    throw err;
  }
  return payload;
}

export function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name || "",
    phone: row.phone || "",
    address: row.address || "",
    city: row.city || "",
    pincode: row.pincode || ""
  };
}

function normalizePhone(phone) {
  const raw = String(phone || "").replace(/\s/g, "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return "+91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return "+" + digits;
  return raw;
}

function mapDbError(error, fallback) {
  const msg = String(error?.message || error || "");
  const code = error?.code;
  if (code === "23505" || /duplicate key|unique constraint/i.test(msg)) {
    if (/email/i.test(msg)) {
      return Object.assign(new Error("This email is already registered. Sign in or use a different email."), { status: 409, field: "email" });
    }
    if (/phone/i.test(msg)) {
      return Object.assign(new Error("This phone number is already registered with another account."), { status: 409, field: "phone" });
    }
    return Object.assign(new Error("An account with these details already exists."), { status: 409 });
  }
  if (/password_hash|schema cache|column.*does not exist/i.test(msg)) {
    console.error("[BHR register] schema:", msg);
    return Object.assign(new Error("Server database needs an update. Please try again later or contact support."), { status: 503 });
  }
  console.error("[BHR register]", msg);
  return Object.assign(new Error(fallback || "Registration failed. Please try again."), { status: 500 });
}

export async function registerCustomer(supabase, body = {}) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const phone = normalizePhone(body.phone);

  if (!validEmail(email)) {
    throw Object.assign(new Error("Enter a valid email address."), { status: 400, field: "email" });
  }
  if (password.length < MIN_PASSWORD_LEN) {
    throw Object.assign(new Error("Password must be at least " + MIN_PASSWORD_LEN + " characters."), { status: 400, field: "password" });
  }
  if (!name || !phone) {
    throw Object.assign(new Error("Name and phone are required."), { status: 400 });
  }

  if (!supabase) {
    const customer = {
      id: "dev-" + email.replace(/[^a-z0-9]/g, ""),
      email,
      name,
      phone,
      address: "",
      city: "",
      pincode: ""
    };
    return { token: signCustomerToken(customer), customer };
  }

  const { data: existing, error: emailErr } = await supabase
    .from("customers")
    .select("id, email, phone, password_hash")
    .eq("email", email)
    .maybeSingle();
  if (emailErr) throw mapDbError(emailErr, "Could not verify email.");

  if (existing?.password_hash) {
    throw Object.assign(new Error("This email is already registered. Sign in instead."), { status: 409, field: "email" });
  }

  const { data: phoneRows, error: phoneErr } = await supabase.from("customers").select("id, email, phone").not("phone", "is", null);
  if (phoneErr) throw mapDbError(phoneErr, "Could not verify phone number.");

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneConflict = (phoneRows || []).find((row) => {
    if (row.email === email) return false;
    const rowDigits = String(row.phone || "").replace(/\D/g, "");
    return rowDigits === phoneDigits && phoneDigits.length >= 10;
  });
  if (phoneConflict) {
    throw Object.assign(new Error("This phone number is already registered with another account."), { status: 409, field: "phone" });
  }

  const row = {
    email,
    name,
    phone,
    password_hash: hashPassword(password),
    updated_at: new Date().toISOString()
  };

  let customer = null;
  if (existing) {
    const { data, error } = await supabase.from("customers").update(row).eq("id", existing.id).select().single();
    if (error) throw mapDbError(error, "Registration failed.");
    customer = data;
  } else {
    const { data, error } = await supabase.from("customers").insert(row).select().single();
    if (error) throw mapDbError(error, "Registration failed.");
    customer = data;
  }

  return { token: signCustomerToken(customer), customer: mapCustomer(customer) };
}

export async function loginCustomer(supabase, body = {}) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!validEmail(email)) {
    throw Object.assign(new Error("Enter a valid email address."), { status: 400 });
  }
  if (!password) {
    throw Object.assign(new Error("Enter your password."), { status: 400 });
  }

  if (!supabase) {
    const customer = {
      id: "dev-" + email.replace(/[^a-z0-9]/g, ""),
      email,
      name: "Guest",
      phone: "",
      address: "",
      city: "",
      pincode: ""
    };
    return { token: signCustomerToken(customer), customer };
  }

  const { data: row, error } = await supabase.from("customers").select("*").eq("email", email).maybeSingle();
  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  if (!row || !row.password_hash) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }
  if (!verifyPassword(password, row.password_hash)) {
    throw Object.assign(new Error("Invalid email or password."), { status: 401 });
  }

  return { token: signCustomerToken(row), customer: mapCustomer(row) };
}

export async function changeCustomerPassword(supabase, customerId, currentPassword, newPassword) {
  const current = String(currentPassword || "");
  const next = String(newPassword || "");
  if (current.length < MIN_PASSWORD_LEN) {
    throw Object.assign(new Error("Enter your current password."), { status: 400, field: "currentPassword" });
  }
  if (next.length < MIN_PASSWORD_LEN) {
    throw Object.assign(new Error("New password must be at least " + MIN_PASSWORD_LEN + " characters."), { status: 400, field: "newPassword" });
  }
  if (current === next) {
    throw Object.assign(new Error("Choose a different new password."), { status: 400, field: "newPassword" });
  }
  if (!supabase) return { ok: true };

  const { data: row, error } = await supabase.from("customers").select("id, password_hash").eq("id", customerId).maybeSingle();
  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  if (!row?.password_hash || !verifyPassword(current, row.password_hash)) {
    throw Object.assign(new Error("Current password is incorrect."), { status: 401, field: "currentPassword" });
  }

  const { error: updateErr } = await supabase
    .from("customers")
    .update({ password_hash: hashPassword(next), updated_at: new Date().toISOString() })
    .eq("id", customerId);
  if (updateErr) throw Object.assign(new Error(updateErr.message), { status: 500 });
  return { ok: true };
}
