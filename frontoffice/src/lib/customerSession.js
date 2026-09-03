const TOKEN_KEY = "bhr-customer-token";
const PROFILE_KEY = "bhr-customer-profile";

export function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, customer) {
  try {
    localStorage.setItem(TOKEN_KEY, token || "");
    localStorage.setItem(PROFILE_KEY, JSON.stringify(customer || null));
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}
