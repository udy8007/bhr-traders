function safeEqual(a, b) {
  const x = String(a || "");
  const y = String(b || "");
  if (x.length !== y.length) return false;
  let ok = 0;
  for (let i = 0; i < x.length; i++) ok |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return ok === 0;
}

export function apiKeySecret() {
  const key = String(process.env.API_KEY || "").trim();
  if (key) return key;
  if (process.env.NODE_ENV === "production") return "";
  return "bhr-traders-dev-api-key";
}

export function readApiKey(req) {
  return String(req.headers.get("x-api-key") || req.headers.get("X-API-Key") || "").trim();
}

export function isValidApiKey(key) {
  const expected = apiKeySecret();
  if (!expected || !key) return false;
  return safeEqual(key, expected);
}

export function isApiKeyExempt(pathname, method) {
  if (method === "OPTIONS") return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname === "/api/auth/login" && method === "POST") return true;
  return false;
}

export function requireApiKey(req) {
  if (isApiKeyExempt(new URL(req.url).pathname, req.method)) return;
  if (isValidApiKey(readApiKey(req))) return;
  const err = new Error("Invalid or missing API key.");
  err.status = 401;
  throw err;
}

export function apiKeyUnauthorized() {
  return Response.json({ error: "Invalid or missing API key." }, { status: 401 });
}
