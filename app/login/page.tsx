"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";
import SupabaseNeeded from "@/components/SupabaseNeeded";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      // Clear any stale local session first (cookies left over from earlier
      // attempts). A stale/expired session here can make the client try a
      // doomed token refresh right after login, which signs the user straight
      // back out. We wipe the cookies directly AND via the library, belt and
      // suspenders. Scope "local" only clears this browser's cookies — it
      // never touches sessions on Amanda's other devices.
      for (const c of document.cookie.split(";")) {
        const name = c.split("=")[0].trim();
        if (name.startsWith("sb-") && name.includes("-auth-token")) {
          document.cookie = `${name}=; Max-Age=0; path=/;`;
        }
      }
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      // Full page load (not client-side navigation) so AuthProvider remounts
      // and picks up the new session from cookies. router.push() alone
      // leaves the header showing "Sign in" because the provider never
      // re-reads the session. Preserve ?debug=auth so diagnostics continue
      // on the homepage.
      const debug = new URLSearchParams(window.location.search).get("debug");
      window.location.href = debug ? `/?debug=${debug}` : "/";
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back, Trainer</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sign in to your Pokémon Companion account.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-mint px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-slate-900 underline underline-offset-2 dark:text-slate-100">
            Create an account
          </Link>
        </p>
        <AuthDebugPanel />
      </div>
    </div>
  );
}

export default function LoginPage() {
  if (!isSupabaseConfigured()) return <SupabaseNeeded />;
  return <LoginForm />;
}
