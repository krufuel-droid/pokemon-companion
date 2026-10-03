"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth, type Profile } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies } from "@/lib/pokedex";
import { useEffect, useMemo } from "react";
import { getAchievements, getUserAchievements, type AchievementDef } from "@/lib/achievements";

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

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
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Set up your trainer profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-mint px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
          >
            {busy ? "Saving…" : "Create profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Sprite picker for the avatar field — search and tap a Pokémon. */
function AvatarPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchSpecies(query).slice(0, 12), [query]);

  return (
    <div>
      {value && (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Selected avatar" width={56} height={56} className="h-14 w-14 rounded-full bg-stone-100 object-contain dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => { onChange(""); setQuery(""); }}
            className="text-xs font-semibold text-slate-500 underline dark:text-slate-400"
          >
            Remove
          </button>
        </div>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClass}
        placeholder="Search Pokémon…"
        autoComplete="off"
        aria-label="Search Pokémon for avatar"
      />
      {matches.length > 0 && (
        <ul className="mt-1 grid max-h-48 grid-cols-6 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => { onChange(m.sprites.regular); setQuery(""); }}
                title={m.name}
                className={`rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800 ${value === m.sprites.regular ? "ring-2 ring-mint" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.sprites.regular} alt={m.name} width={48} height={48} className="h-12 w-12 object-contain" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Upload a custom picture to Supabase Storage; the public URL becomes the avatar. */
function AvatarUploader({ userId, onUploaded }: { userId: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      input.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Keep it under 2MB.");
      input.value = "";
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `${userId}/${Date.now()}.${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onUploaded(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — try again.");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  return (
    <div className="mt-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-mint dark:border-slate-600 dark:text-slate-300">
        <span aria-hidden="true">📷</span>
        {busy ? "Uploading…" : "Upload a picture"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => void onFile(e.target)}
          aria-label="Upload a profile picture"
        />
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
      )}
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

type SupabaseFrom = ReturnType<ReturnType<typeof createClient>["from"]>;

/** Count rows on a table with a filter; any failure reads as 0. */
async function safeCount(table: string, apply: (q: SupabaseFrom) => unknown): Promise<number> {
  try {
    const supabase = createClient();
    const res = (await apply(supabase.from(table))) as { count: number | null; error: unknown };
    if (res.error) return 0;
    return res.count ?? 0;
  } catch {
    return 0;
  }
}

/** Achievements showcase + record chips shown above the profile editor. */
function ProfileHighlights({ userId }: { userId: string }) {
  const [latest, setLatest] = useState<{ id: string; icon: string; name: string }[]>([]);
  const [records, setRecords] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [defs, mine] = await Promise.all([
          getAchievements().catch(() => [] as AchievementDef[]),
          getUserAchievements(userId).catch(() => []),
        ]);
        const byId = new Map(defs.map((d) => [d.id, d]));
        const sorted = [...mine].sort((a, b) => b.unlocked_at.localeCompare(a.unlocked_at)).slice(0, 6);
        const shown = sorted
          .map((u) => {
            const def = byId.get(u.achievement_id);
            return def ? { id: def.id, icon: def.icon, name: def.name } : null;
          })
          .filter((x): x is { id: string; icon: string; name: string } => x !== null);

        const [favorites, hunts, runs, memorials, posts, friends] = await Promise.all([
          safeCount("favorites", (q) => q.select("id", { count: "exact", head: true }).eq("user_id", userId)),
          safeCount("shiny_hunts", (q) => q.select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("completed", true)),
          safeCount("nuzlockes", (q) => q.select("id", { count: "exact", head: true }).eq("owner_id", userId)),
          safeCount("memorials", (q) => q.select("id", { count: "exact", head: true }).eq("owner_id", userId)),
          safeCount("posts", (q) => q.select("id", { count: "exact", head: true }).eq("author_id", userId)),
          safeCount("friendships", (q) =>
            q.select("id", { count: "exact", head: true }).eq("status", "accepted").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
          ),
        ]);
        if (cancelled) return;
        setLatest(shown);
        setRecords({ Favorites: favorites, "Shiny hunts": hunts, "Nuzlocke runs": runs, Memorials: memorials, Posts: posts, Friends: friends });
      } catch {
        if (!cancelled) setRecords({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const chips = useMemo(() => Object.entries(records), [records]);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Achievements</h2>
          <Link
            href="/achievements"
            className="shrink-0 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            View all →
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            No achievements yet — <Link href="/achievements" className="font-semibold underline">start exploring</Link>!
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {latest.map((a) => (
              <div key={a.id} className="flex flex-col items-center gap-1 text-center" title={a.name}>
                <span className="text-3xl" aria-hidden="true">{a.icon}</span>
                <span className="line-clamp-2 text-xs font-medium text-slate-600 dark:text-slate-400">{a.name}</span>
              </div>
            ))}
          </div>
        )}
        {chips.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map(([label, value]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <span className="font-bold text-slate-900 dark:text-slate-100">{value}</span>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
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
    <>
      <ProfileHighlights userId={profile.id} />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your trainer profile</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              This is how other trainers see you.
            </p>
          </div>
          <Link
            href={`/trainers/${encodeURIComponent(profile.username)}`}
            className="shrink-0 rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-mint hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
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
            <label className={labelClass}>
              Avatar <span className="font-normal text-slate-400 dark:text-slate-500">(pick a Pokémon sprite or upload your own)</span>
            </label>
            <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} />
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span className="h-px flex-1 bg-stone-200 dark:bg-slate-700" />
              or
              <span className="h-px flex-1 bg-stone-200 dark:bg-slate-700" />
            </div>
            <AvatarUploader userId={profile.id} onUploaded={setAvatarUrl} />
          </div>
          <div>
            <label htmlFor="bio" className={labelClass}>
              Bio <span className="font-normal text-slate-400 dark:text-slate-500">(max 500 characters)</span>
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
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Profile saved!
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

export default function ProfilePage() {
  const { configured, loading, user, profile, refreshProfile } = useAuth();

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading your profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sign in to view your profile</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Trainer profiles are for members of the community.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
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
