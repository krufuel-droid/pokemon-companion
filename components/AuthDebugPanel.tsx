"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Temporary diagnostic panel. Visible only when the URL has ?debug=auth.
 * Shows the raw Supabase auth events so we can see exactly what fires
 * when the session flips.
 */
export function AuthDebugPanel() {
  const { authEvents } = useAuth();
  const [show] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "auth"
  );
  if (!show) return null;
  return (
    <div className="mx-auto mt-6 max-w-md rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
      <p className="mb-2 font-bold">Auth events (debug)</p>
      {authEvents.length === 0 ? (
        <p className="text-slate-400">No events yet.</p>
      ) : (
        <ul className="space-y-1 font-mono break-all">
          {authEvents.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
