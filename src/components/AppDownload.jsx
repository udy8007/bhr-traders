import { useEffect, useState } from "react";
import { APP_APK_FILENAME, APP_APK_LABEL, APP_NAME } from "../data/site.js";
import {
  appApkHref,
  dismissAppPrompt,
  isAndroidDevice,
  isInNativeApp,
  shouldShowAppPrompt
} from "../lib/appDownload.js";

function DownloadArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 4v10M12 14l-4-4M12 14l4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" strokeLinecap="round" />
    </svg>
  );
}

function AppPhoneGraphic({ size = "md" }) {
  return (
    <span className={"app-dl-phone app-dl-phone-" + size} aria-hidden="true">
      <span className="app-dl-phone-shell">
        <span className="app-dl-phone-notch" />
        <img src="/favicon.png" alt="" width="28" height="28" />
        <span className="app-dl-phone-android">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
            <path d="M17.6 9.5 19 7.1a.5.5 0 0 0-.9-.4l-1.5 2.5a7.9 7.9 0 0 0-8.2 0L6.9 6.7a.5.5 0 1 0-.9.4l1.4 2.4A6.9 6.9 0 0 0 4 14.8v2.2a1 1 0 0 0 1 1h1.1a2.4 2.4 0 0 0 4.8 0h2.2a2.4 2.4 0 0 0 4.8 0H19a1 1 0 0 0 1-1v-2.2a6.9 6.9 0 0 0-2.4-5.3z" />
          </svg>
        </span>
      </span>
    </span>
  );
}

export function AppDownloadButton({ variant = "default", className = "", onClick }) {
  if (isInNativeApp()) return null;

  const isNav = variant === "nav";
  const isToggle = variant === "toggle";
  const isHero = variant === "hero";
  const isFooter = variant === "footer";

  if (isToggle) {
    return (
      <a
        className={"app-dl app-dl--toggle" + (className ? " " + className : "")}
        href={appApkHref()}
        download={APP_APK_FILENAME}
        onClick={onClick}
        aria-label={"Download " + APP_NAME + " " + APP_APK_LABEL}
        title={"Download " + APP_NAME + " app"}
      >
        <AppPhoneGraphic size="sm" />
        <span className="app-dl-badge">APK</span>
      </a>
    );
  }

  return (
    <a
      className={
        "app-dl app-dl--" +
        variant +
        (className ? " " + className : "")
      }
      href={appApkHref()}
      download={APP_APK_FILENAME}
      onClick={onClick}
      aria-label={"Download " + APP_NAME + " " + APP_APK_LABEL}
      title={"Download " + APP_NAME + " app"}
    >
      <span className="app-dl-shine" aria-hidden="true" />
      <AppPhoneGraphic size={isHero ? "lg" : isFooter ? "md" : "sm"} />
      <span className="app-dl-copy">
        <small>{isNav ? "Mobile app" : isHero ? "Better on mobile" : "Android app"}</small>
        <strong>{isNav ? "Download free" : isHero ? "Get the app" : "Download APK"}</strong>
      </span>
      {!isNav ? (
        <span className="app-dl-arrow" aria-hidden="true">
          <DownloadArrowIcon />
        </span>
      ) : null}
      {isNav ? <span className="app-dl-badge">APK</span> : null}
    </a>
  );
}

export function AppDownloadPromo({ className = "" }) {
  if (isInNativeApp()) return null;

  return (
    <div className={"app-download-promo" + (className ? " " + className : "")}>
      <div className="app-download-promo-visual" aria-hidden="true">
        <AppPhoneGraphic size="lg" />
        <span className="app-download-promo-orbit app-download-promo-orbit-a" />
        <span className="app-download-promo-orbit app-download-promo-orbit-b" />
      </div>
      <div className="app-download-promo-copy">
        <strong>Better on the {APP_NAME} app</strong>
        <span>Browse products, track orders and download the price list — all from your phone.</span>
      </div>
      <AppDownloadButton variant="promo" />
    </div>
  );
}

export function MobileAppPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function sync() {
      setVisible(shouldShowAppPrompt());
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (!visible || isInNativeApp()) return null;

  const android = isAndroidDevice();

  function close() {
    dismissAppPrompt();
    setVisible(false);
  }

  return (
    <div className="mobile-app-prompt" role="dialog" aria-label="Download mobile app">
      <div className="mobile-app-prompt-card">
        <button type="button" className="mobile-app-prompt-close" onClick={close} aria-label="Dismiss">
          ×
        </button>
        <div className="mobile-app-prompt-visual" aria-hidden="true">
          <AppPhoneGraphic size="xl" />
          <span className="mobile-app-prompt-glow" />
        </div>
        <div className="mobile-app-prompt-body">
          <strong>Get the {APP_NAME} app</strong>
          <p>
            {android
              ? "For a smoother mobile experience, download our Android app — browse products, track orders and get the price list offline."
              : "You're viewing our website on mobile. For the best experience on Android, download our app."}
          </p>
          <div className="mobile-app-prompt-actions">
            <AppDownloadButton variant="hero" className="mobile-app-prompt-download" onClick={close} />
            <button type="button" className="link-btn mobile-app-prompt-skip" onClick={close}>
              Continue on website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
