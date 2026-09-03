import { createHmac, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { json } from "./supabase.js";

const adminFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "admin.json");

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

function secret() {
  return process.env.ADMIN_JWT_SECRET || "bhr-traders-admin-dev-secret";
}

export function adminEmail() {
  return process.env.ADMIN_EMAIL || "admin@bhrtraders.com";
}

export function adminPassword() {
  try {
    if (existsSync(adminFile)) {
      const saved = JSON.parse(readFileSync(adminFile, "utf8"));
      if (saved?.password) return String(saved.password);
    }
  } catch {
    /* use env */
  }
  return process.env.ADMIN_PASSWORD || "BhrAdmin@123";
}

export function setAdminPassword(next) {
  mkdirSync(path.dirname(adminFile), { recursive: true });
  writeFileSync(
    adminFile,
    JSON.stringify({ password: String(next), updated_at: new Date().toISOString() }, null, 2)
  );
}

export function passwordsMatch(a, b) {
  return same(a, b);
}

export function signToken(payload, secretKey) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secretKey || secret()).update(data).digest("base64url");
  return data + "." + sig;
}

export function verifyToken(token, secretKey) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = createHmac("sha256", secretKey || secret()).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getToken(req) {
  const h = req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

export function requireAdmin(req) {
  const payload = verifyToken(getToken(req));
  if (!payload?.email) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return payload;
}

export function unauthorized() {
  return json({ error: "Please log in to continue." }, 401);
}
