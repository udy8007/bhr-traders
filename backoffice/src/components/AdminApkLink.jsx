import { ADMIN_APK_FILENAME, ADMIN_APK_URL, ADMIN_APP_NAME } from "../data/site.js";

export function AdminApkLink({ variant = "sidebar", className = "" }) {
  const isLogin = variant === "login";
  const label = isLogin ? "Download admin Android app" : "Admin app";

  return (
    <a
      className={
        (isLogin ? "bhr-admin-apk-login" : "nav-link bhr-nav-link bhr-admin-apk-nav") +
        (className ? " " + className : "")
      }
      href={ADMIN_APK_URL}
      download={ADMIN_APK_FILENAME}
      title={"Download " + ADMIN_APP_NAME + " APK"}
    >
      <i className="material-symbols-rounded">{isLogin ? "android" : "download"}</i>
      <span className={isLogin ? "" : "nav-link-text ms-1"}>{label}</span>
      {isLogin ? <span className="bhr-admin-apk-badge">APK</span> : null}
    </a>
  );
}
