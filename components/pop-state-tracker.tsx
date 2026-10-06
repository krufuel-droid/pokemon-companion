"use client";

import { useEffect } from "react";

export const LAST_POPSTATE_KEY = "nav:last-popstate";

// Mounted once in the root layout (which never unmounts on route changes),
// so it can observe history back/forward navigations that page-level
// components can't — a page's own popstate listener is removed when the
// page unmounts, i.e. exactly when you'd need it for the way back.
export default function PopStateTracker() {
  useEffect(() => {
    const onPopState = () => {
      try {
        sessionStorage.setItem(LAST_POPSTATE_KEY, String(Date.now()));
      } catch {
        // storage unavailable — non-fatal
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return null;
}

// True when a history back/forward happened in the last few seconds.
// Consumes the marker so a later unrelated mount doesn't misread it.
export function consumeRecentPopState(windowMs = 3000): boolean {
  try {
    const at = Number(sessionStorage.getItem(LAST_POPSTATE_KEY) ?? 0);
    sessionStorage.removeItem(LAST_POPSTATE_KEY);
    return Date.now() - at < windowMs;
  } catch {
    return false;
  }
}
