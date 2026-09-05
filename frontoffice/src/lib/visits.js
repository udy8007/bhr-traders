const API = import.meta.env.VITE_API_URL || "";

import { withApiKey } from "./apiKey.js";

function send(kind, extra = {}) {
  const body = {
    kind,
    title: document.title,
    referrer: document.referrer || "",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    lang: navigator.language || "",
    screen: (window.screen && window.screen.width + "x" + window.screen.height) || "",
    device: "Mobile",
    path: extra.path || "app",
    ...extra
  };
  fetch(API + "/api/visits", {
    method: "POST",
    headers: withApiKey({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    keepalive: true
  }).catch(() => {});
}

export async function logPageVisit() {
  try {
    if (sessionStorage.getItem("bhr-app-visit")) return;
    sessionStorage.setItem("bhr-app-visit", "1");
  } catch {
    /* ignore */
  }
  send("page", { path: "app" });
}

export function logCheckoutStart() {
  if (sessionStorage.getItem("bhr-app-chk-start")) return;
  sessionStorage.setItem("bhr-app-chk-start", "1");
  send("checkout_start", { path: "app/checkout" });
}

export function logCheckoutComplete() {
  send("checkout_complete", { path: "app/order-placed" });
}
