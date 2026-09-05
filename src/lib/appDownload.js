import { APP_APK_FILENAME, APP_APK_URL } from "../data/site.js";

const DISMISS_KEY = "bhr-app-prompt-dismissed";

export function appApkHref() {
  return APP_APK_URL;
}

export function isInNativeApp() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/BHRTradersApp/i.test(ua)) return true;
  if (/;\s*wv\)/.test(ua)) return true;
  if (window.matchMedia("(display-mode: standalone)").matches && /Android|iPhone|iPad/i.test(ua)) {
    return true;
  }
  return false;
}

export function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

export function shouldShowAppPrompt() {
  if (typeof window === "undefined") return false;
  if (isInNativeApp()) return false;
  if (!isMobileViewport()) return false;
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export function dismissAppPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function triggerApkDownload() {
  const link = document.createElement("a");
  link.href = appApkHref();
  link.download = APP_APK_FILENAME;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
