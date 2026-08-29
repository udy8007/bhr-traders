import { useState } from "react";
import { api } from "../lib/api.js";
import { useStore } from "../context/StoreContext.jsx";

export function PriceListButton({ className = "btn btn-outline" }) {
  const { ping } = useStore();
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try {
      await api.downloadPriceList();
    } catch (err) {
      ping(err.message || "Price list download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={className} type="button" onClick={download} disabled={busy} style={{ fontFamily: "inherit" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="M7 11l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      {busy ? "Preparing…" : "Price List"}
    </button>
  );
}
