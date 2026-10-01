"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth, type Profile } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies } from "@/lib/pokedex";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

function usernameError(value: string): string | null {
  if (!USERNAME_RE.test(value)) {
    return "Usernames are 3–24 characters: letters, numbers, and underscores only.";
  }
  return null;
}

/** First-run form: pick the trainer name that becomes the public profile. */
function ProfileSetupForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = usernameError(username.trim());
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").insert({
        id: userId,
        username: username.trim(),
      });
      if (error) {
        setError(
          error.code === "23505"
            ? "That username is taken — try another one."
            : error.message,
        );
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Set up your trainer profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick the name other trainers will see. You can change everything later.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className={labelClass}>
              Trainer name
            </label>
            <input
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="e.g. minty_fresh"
              maxLength={24}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-mint px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Create profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Sprite preview for the favorite-Pokémon field (pure derivation, no effect). */
function FavoritePreview({ name }: { name: string }) {
  const q = name.trim().toLowerCase();
  const exact =
    q.length >= 2
      ? searchSpecies(q).find((s) => s.name.toLowerCase() === q)
      : undefined;
  if (!exact) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={exact.sprites.regular}
      alt={exact.name}
      width={64}
      height={64}
      className="mt-2 h-16 w-16"
    />
  );
}

function ProfileEditor({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [favorite, setFavorite] = useState(profile.favorite_pokemon ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = usernameError(username.trim());
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          avatar_url: avatarUrl.trim() === "" ? null : avatarUrl.trim(),
          bio: bio.trim() === "" ? null : bio.trim().slice(0, 500),
          favorite_pokemon: favorite.trim() === "" ? null : favorite.trim(),
        })
        .eq("id", profile.id);
      if (error) {
        setError(
          error.code === "23505"
            ? "That username is taken — try another one."
            : error.message,
        );
        return;
      }
      setSaved(true);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your trainer profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              This is how other trainers see you.
            </p>
          </div>
          <Link
            href={`/trainers/${encodeURIComponent(profile.username)}`}
            className="shrink-0 rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-mint hover:text-slate-900"
          >
            View public page
          </Link>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className={labelClass}>
              Trainer name
            </label>
            <input
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              maxLength={24}
            />
          </div>
          <div>
            <label htmlFor="avatar" className={labelClass}>
              Avatar image URL
            </label>
            <input
              id="avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className={inputClass}
              placeholder="https://…"
            />
          </div>
          <div>
            <label htmlFor="bio" className={labelClass}>
              Bio <span className="font-normal text-slate-400">(max 500 characters)</span>
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={inputClass}
              maxLength={500}
              placeholder="Shiny hunter, Nuzlocke survivor, Grass-type enthusiast…"
            />
          </div>
          <div>
            <label htmlFor="favorite" className={labelClass}>
              Favorite Pokémon
            </label>
            <input
              id="favorite"
              value={favorite}
              onChange={(e) => setFavorite(e.target.value)}
              className={inputClass}
              placeholder="e.g. Pikachu"
            />
            <FavoritePreview name={favorite} />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Profile saved!
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { configured, loading, user, profile, refreshProfile } = useAuth();

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500">
        Loading your profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Sign in to view your profile</h1>
          <p className="mt-2 text-sm text-slate-600">
            Trainer profiles are for members of the community.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <ProfileSetupForm userId={user.id} onDone={() => void refreshProfile()} />;
  }

  return <ProfileEditor profile={profile} onSaved={() => void refreshProfile()} />;
}
