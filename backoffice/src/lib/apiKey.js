const API_KEY = import.meta.env.VITE_API_KEY || "";

export function withApiKey(headers = {}) {
  const next = { ...headers };
  if (API_KEY) next["X-API-Key"] = API_KEY;
  return next;
}
