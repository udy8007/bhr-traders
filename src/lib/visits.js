const API = import.meta.env.VITE_API_URL || "";

function pagePath() {
  const h = String(location.hash || "#home").replace(/^#\/?/, "").split("?")[0];
  return h || "home";
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
    path: kind === "page" ? "home" : path
  };
  fetch(API + "/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
