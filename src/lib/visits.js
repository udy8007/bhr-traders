const API = import.meta.env.VITE_API_URL || "";

import { withApiKey } from "./apiKey.js";

function pagePath() {
  const h = String(location.hash || "#home").replace(/^#\/?/, "").split("?")[0];
  return h || "home";
}

function detectDevice() {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "Tablet";
  if (/Mobi|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return "Mobile";
  try {
    if (navigator.userAgentData && navigator.userAgentData.mobile) return "Mobile";
  } catch {
    /* ignore */
  }
  try {
    if (window.matchMedia("(max-width: 768px)").matches) return "Mobile";
    if (window.matchMedia("(max-width: 1024px)").matches) return "Tablet";
  } catch {
    /* ignore */
  }
  return "Desktop";
}

function send(kind, extra = {}) {
  const path = extra.path || pagePath();
  if (/^(login|dashboard|master|sales|reports|logs|catalog)(\/|$)/i.test(path.replace(/^#\/?/, ""))) return;
  const body = {
    kind,
    title: document.title,
    referrer: document.referrer || "",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    lang: navigator.language || "",
    screen: (window.screen && window.screen.width + "x" + window.screen.height) || "",
    ...extra,
    device: extra.device || detectDevice(),
    path: kind === "page" ? "home" : path
  };
  fetch(API + "/api/visits", {
    method: "POST",
    headers: withApiKey({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    keepalive: true
  }).catch(() => {});
}

async function geo() {
  try {
    const cached = sessionStorage.getItem("bhr-geo");
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore */
  }
  try {
    const res = await fetch("https://ipapi.co/json/");
    const d = await res.json();
    const g = {
      city: d.city || "",
      region: d.region_code || d.region || "",
      country: d.country_code || d.country || ""
    };
    sessionStorage.setItem("bhr-geo", JSON.stringify(g));
    return g;
  } catch {
    return { city: "", region: "", country: "" };
  }
}

export async function logPageVisit() {
  try {
    if (sessionStorage.getItem("bhr-visit")) return;
    sessionStorage.setItem("bhr-visit", "1");
  } catch {
    /* ignore */
  }
  const g = await geo();
  send("page", g);
}

export async function logCheckoutStart() {
  if (sessionStorage.getItem("bhr-chk-start")) return;
  sessionStorage.setItem("bhr-chk-start", "1");
  const g = await geo();
  send("checkout_start", { ...g, path: "#checkout" });
}

export async function logCheckoutComplete() {
  const g = await geo();
  send("checkout_complete", { ...g, path: "#order-placed" });
}
