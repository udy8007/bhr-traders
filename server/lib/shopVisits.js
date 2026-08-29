const ADMIN_PATH = /^(login|dashboard|master|sales|reports|logs|catalog)(\/|$)/i;

export function shopPath(value) {
  return String(value || "")
    .replace(/^#\/?/, "")
    .replace(/^\//, "")
    .split("?")[0]
    .trim();
}

export function isAdminPath(value) {
  return ADMIN_PATH.test(shopPath(value));
}

export function isAdminRequest(req) {
  const origin = String(req.headers.get("origin") || "");
  const referer = String(req.headers.get("referer") || "");
  return /:5174\b|\/backoffice|\/admin(\/|$)/i.test(origin + " " + referer);
}

export function isShopVisit(row) {
  if (!row) return false;
  if (String(row.source || "").toLowerCase() === "admin") return false;
  return !isAdminPath(row.path);
}
