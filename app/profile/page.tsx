"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth, generateTrainerCode, type Profile } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies, getSpeciesById } from "@/lib/pokedex";
import { fetchTradeLists, type TradeEntry, type TradeTable } from "@/lib/trades";
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
      let { error } = await supabase.from("profiles").insert({
        id: userId,
        username: username.trim(),
        trainer_code: generateTrainerCode(),
      });
      if (error && error.code === "42703") {
        // trainer_code column not migrated yet — retry without it.
        ({ error } = await supabase.from("profiles").insert({
          id: userId,
          username: username.trim(),
        }));
      }
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

/** Trainer's own shareable friend code + QR, shown at the top of the profile editor. */
function TrainerCodeCard({ trainerCode }: { trainerCode: string | null }) {
  const [copied, setCopied] = useState(false);
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  async function copyCode() {
    if (!trainerCode) return;
    try {
      await navigator.clipboard.writeText(trainerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the code is still selectable by hand
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-5">
        {trainerCode ? (
          <QRCodeSVG
            value={`${origin}/friends?add=${trainerCode}`}
            size={104}
            level="M"
            className="h-[104px] w-[104px] shrink-0 rounded-lg bg-white p-1.5"
            aria-label="QR code linking to your friend invite"
          />
        ) : (
          <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xl dark:bg-slate-800">
            <span role="img" aria-hidden="true">🎫</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your trainer code
          </p>
          {trainerCode ? (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-widest text-slate-900 dark:text-slate-100">
                  {trainerCode}
                </span>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-stone-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Share this code or QR with other trainers — they can add you from the Friends page.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Run the latest database update in the Supabase SQL Editor to get your trainer code.
            </p>
          )}
        </div>
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

/** Buddy Pokémon picker — search and tap a Pokémon, like the avatar picker. */
function BuddyPicker({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => searchSpecies(query).slice(0, 12), [query]);
  const current = value != null ? getSpeciesById(value) : undefined;

  return (
    <div>
      {current && (
        <div className="mb-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.sprites.regular} alt={current.name} width={56} height={56} className="h-14 w-14 object-contain" />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{current.name}</span>
          <button
            type="button"
            onClick={() => { onChange(null); setQuery(""); }}
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
        aria-label="Search Pokémon for buddy"
      />
      {matches.length > 0 && (
        <ul className="mt-1 grid max-h-48 grid-cols-6 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => { onChange(m.id); setQuery(""); }}
                title={m.name}
                className={`rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800 ${value === m.id ? "ring-2 ring-mint" : ""}`}
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

/** One trade list on the profile editor: "Looking For" or "For Trade". */
function TradeListEditor({
  userId,
  table,
  title,
  icon,
  hint,
  addLabel,
}: {
  userId: string;
  table: TradeTable;
  title: string;
  icon: string;
  hint: string;
  addLabel: string;
}) {
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ id: number; name: string } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => searchSpecies(query).slice(0, 12), [query]);
  const pickedSpecies = picked ? getSpeciesById(picked.id) : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pair = await fetchTradeLists(createClient(), userId);
        if (!cancelled) {
          setEntries(table === "trade_wishlist" ? pair.wishlist : pair.forTrade);
          setLoading(false);
        }
      } catch {
        // The trade tables don't exist yet (SQL not run) — show a hint.
        if (!cancelled) {
          setMissing(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, table]);

  async function add() {
    if (!picked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .insert({
          user_id: userId,
          species_id: picked.id,
          species_name: picked.name,
          note: note.trim() === "" ? null : note.trim().slice(0, 120),
        })
        .select("id, user_id, species_id, species_name, note")
        .single();
      if (error) {
        setError(
          error.code === "23505"
            ? `${picked.name} is already on this list.`
            : error.message,
        );
        return;
      }
      setEntries((prev) => [data as TradeEntry, ...prev]);
      setPicked(null);
      setNote("");
      setQuery("");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        <span role="img" aria-hidden="true" className="mr-2">{icon}</span>
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>

      {loading ? (
        <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : missing ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Trading lists need the latest database update — run the newest SQL in the Supabase SQL
          Editor to enable them.
        </p>
      ) : (
        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass}
            placeholder="Search Pokémon…"
            autoComplete="off"
            aria-label={`Search Pokémon to add to ${title}`}
          />
          {matches.length > 0 && (
            <ul className="mt-1 grid max-h-48 grid-cols-6 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => { setPicked({ id: m.id, name: m.name }); setQuery(""); }}
                    title={m.name}
                    className={`rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800 ${picked?.id === m.id ? "ring-2 ring-mint" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.sprites.regular} alt={m.name} width={48} height={48} className="h-12 w-12 object-contain" loading="lazy" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {picked && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {pickedSpecies && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pickedSpecies.sprites.regular}
                  alt={picked.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              )}
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{picked.name}</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`${inputClass} !w-auto flex-1`}
                placeholder="Note (optional) — e.g. 'shiny' or 'with hidden ability'"
                maxLength={120}
                aria-label="Optional note"
              />
              <button
                type="button"
                onClick={() => void add()}
                disabled={busy}
                className="rounded-lg bg-mint px-4 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
              >
                {busy ? "Adding…" : addLabel}
              </button>
              <button
                type="button"
                onClick={() => { setPicked(null); setNote(""); }}
                className="text-xs font-semibold text-slate-500 underline dark:text-slate-400"
              >
                Cancel
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <ul className="mt-4 space-y-2">
            {entries.map((e) => {
              const species = getSpeciesById(e.species_id);
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2 dark:bg-slate-950"
                >
                  {species && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={species.sprites.regular}
                      alt={e.species_name}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                      loading="lazy"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {e.species_name}
                    </p>
                    {e.note && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.note}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void remove(e.id)}
                    aria-label={`Remove ${e.species_name} from ${title}`}
                    className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          {entries.length === 0 && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Nothing here yet — search above to add one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** "Looking For" + "For Trade" sections on the own-profile page. */
function TradeLists({ userId }: { userId: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 sm:px-6">
      <TradeListEditor
        userId={userId}
        table="trade_wishlist"
        title="Looking For"
        icon="🔍"
        hint="Pokémon you want — friends with a match will see it in the Trading tab."
        addLabel="Add to wishlist"
      />
      <TradeListEditor
        userId={userId}
        table="trade_list"
        title="For Trade"
        icon="🔄"
        hint="Pokémon you're offering — friends who want them will get matched with you."
        addLabel="Add to trade list"
      />
    </div>
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
  const [buddySpeciesId, setBuddySpeciesId] = useState<number | null>(profile.buddy_species_id ?? null);
  const [buddyNickname, setBuddyNickname] = useState(profile.buddy_nickname ?? "");
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
          buddy_species_id: buddySpeciesId,
          buddy_nickname: buddyNickname.trim() === "" ? null : buddyNickname.trim().slice(0, 30),
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
      <div className="mb-6">
        <TrainerCodeCard trainerCode={profile.trainer_code ?? null} />
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your trainer profile</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              This is how other trainers see you.
            </p>
          </div>
          <Link
            href={`/trainer/${encodeURIComponent(profile.username)}`}
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
          <div>
            <label className={labelClass}>
              Buddy Pokémon <span className="font-normal text-slate-400 dark:text-slate-500">(travels with you on your profile)</span>
            </label>
            <BuddyPicker value={buddySpeciesId} onChange={setBuddySpeciesId} />
            <label htmlFor="buddy-nickname" className={`${labelClass} mt-3`}>
              Buddy nickname <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <input
              id="buddy-nickname"
              value={buddyNickname}
              onChange={(e) => setBuddyNickname(e.target.value)}
              className={inputClass}
              placeholder="e.g. Sparky"
              maxLength={30}
            />
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
      <TradeLists userId={profile.id} />
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
