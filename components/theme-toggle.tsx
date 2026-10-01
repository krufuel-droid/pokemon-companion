"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pc-theme";

/**
 * Inline script for <head> in app/layout.tsx. Runs synchronously during HTML
 * parsing (before first paint) so a returning visitor never sees the wrong
 * theme flash. Mirrors resolveTheme() below; keep the two in sync.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

function resolveTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage unavailable (e.g. private mode) — fall through to media query.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// Module-level store so the desktop and mobile toggle instances (and any
// future ones) always show the same state.
let currentTheme: Theme | null = null;
const listeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  if (currentTheme) return currentTheme;
  currentTheme = resolveTheme();
  return currentTheme;
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(next: Theme) {
  currentTheme = next;
  if (typeof window !== "undefined") {
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable — the class toggle above still applies.
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);
  return {
    theme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}

function SunIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Re-apply after React clears <html> attributes on the dev Strict Mode
  // remount. No-op in production (inline head script already ran).
  useLayoutEffect(() => {
    applyTheme(getThemeSnapshot());
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
