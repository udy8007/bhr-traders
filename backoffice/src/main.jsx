import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { hideLoader } from "./lib/loader.js";

(function applyAdminDeepLink() {
  try {
    const u = new URL(window.location.href);
    const to = u.searchParams.get("to");
    if (!to || !to.startsWith("/")) return;
    u.searchParams.delete("to");
    const qs = u.searchParams.toString();
    window.history.replaceState(null, "", u.pathname + (qs ? "?" + qs : "") + "#" + to);
  } catch {
    /* keep the current URL */
  }
})();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

hideLoader();
