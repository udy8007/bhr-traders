import { useEffect } from "react";
import { logPageVisit } from "../lib/visits.js";

export function VisitTracker() {
  useEffect(() => {
    logPageVisit();
    function onHash() {
      logPageVisit();
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return null;
}
