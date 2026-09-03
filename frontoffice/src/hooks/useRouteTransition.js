import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const TAB_ORDER = {
  "/": 0,
  "/shop": 1,
  "/cart": 2,
  "/profile": 3,
  "/contact": 4
};

function tabIndex(pathname) {
  const base = pathname.split("?")[0] || "/";
  return TAB_ORDER[base] ?? -1;
}

function transitionClass(from, to) {
  const fromIdx = tabIndex(from);
  const toIdx = tabIndex(to);

  if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
    return toIdx > fromIdx ? "route-slide-from-right" : "route-slide-from-left";
  }
  if (/^\/product\//.test(to) || to === "/checkout") return "route-slide-up";
  if (/^\/product\//.test(from) || from === "/checkout") return "route-slide-down";
  return "route-fade";
}

export function useRouteTransition() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const animClass = useRef("route-fade");

  if (location.pathname !== prevPath.current) {
    animClass.current = transitionClass(prevPath.current, location.pathname);
  }

  useEffect(() => {
    prevPath.current = location.pathname;
  }, [location.pathname]);

  return animClass.current;
}
