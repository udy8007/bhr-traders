import { useEffect } from "react";
import { logPageVisit } from "../lib/visits.js";

export function VisitTracker() {
  useEffect(() => {
    logPageVisit();
  }, []);
  return null;
}
