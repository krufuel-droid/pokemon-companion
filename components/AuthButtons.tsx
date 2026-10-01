"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

/**
 * Sign-in state widget for the nav bar. Renders nothing when Supabase
 * isn't configured, so the rest of the site works untouched.
 */
export default function AuthButtons() {
  const { configured, loading, user, profile, signOut } = useAuth();

  if (!configured) return null;

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-8 w-20 animate-pulse rounded-full bg-stone-200"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-mint px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-95"
      >
        Sign in
      </Link>
    );
  }

  const label = profile?.username ?? "Trainer";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/profile"
        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
        title="Your trainer profile"
      >
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-2 ring-mint"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-sm font-bold text-slate-900">
            {initial}
          </span>
        )}
        <span className="hidden sm:inline">{label}</span>
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
