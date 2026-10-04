"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once the page loads.
 *
 * Safety rules:
 * - Production only: never registers in dev (a stale dev service worker is
 *   a classic footgun) and never on localhost.
 * - Registration failure is swallowed: offline support is a progressive
 *   enhancement and must never break the app.
 *
 * Usage: render <PwaRegister /> once inside app/layout.tsx (e.g. in <body>).
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline-first is optional; never break the app */
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
