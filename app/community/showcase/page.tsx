"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import CommunityTabs from "@/components/CommunityTabs";
import { searchSpecies, getSpeciesById, type SpeciesIndex } from "@/lib/pokedex";
import { SHINY_METHODS, methodLabel } from "@/lib/shiny-odds";
import { unlockAchievement } from "@/lib/achievements";
import { timeAgo } from "@/lib/community";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

const MAX_STORY_LENGTH = 2000;

interface ShowcasePost {
  id: string;
  user_id: string;
  species_id: number;
  species_name: string;
  story: string;
  method: string | null;
  encounters: number | null;
  hunt_id: string | null;
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
}

interface HuntOption {
  id: string;
  species_id: number;
  species_name: string;
  method: string;
  encounters: number;
  status: string;
}

/** A signed-out visitor sees an invitation to join instead of the gallery. */
function SignInPrompt() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className={`${cardClass} text-center`}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          ✨ Shiny Showcase
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to share your shinies and browse the community brag wall.
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

function ShareComposer({
  hunts,
  onPosted,
}: {
  hunts: HuntOption[];
  onPosted: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<SpeciesIndex | null>(null);
  const [huntId, setHuntId] = useState("");
  const [methodText, setMethodText] = useState("");
  const [encounters, setEncounters] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || species) return [];
    return searchSpecies(q).slice(0, 8);
  }, [query, species]);

  function pickHunt(id: string) {
    setHuntId(id);
    const hunt = hunts.find((h) => h.id === id);
    if (!hunt) return;
    // Snapshot the hunt's details into the post fields.
    const sp = getSpeciesById(hunt.species_id);
    if (sp) {
      setSpecies(sp);
      setQuery("");
    }
    setMethodText(methodLabel(hunt.method));
    setEncounters(hunt.encounters > 0 ? String(hunt.encounters) : "");
  }

  function reset() {
    setQuery("");
    setSpecies(null);
    setHuntId("");
    setMethodText("");
    setEncounters("");
    setStory("");
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !species || !story.trim() || busy) return;
    const encounterCount = encounters.trim() === "" ? null : parseInt(encounters.trim(), 10);
    if (encounterCount !== null && (!Number.isFinite(encounterCount) || encounterCount < 0)) {
      setError("Encounters must be a non-negative number.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("shiny_showcase").insert({
        user_id: user.id,
        species_id: species.id,
        species_name: species.name,
        story: story.trim(),
        method: methodText.trim() || null,
        encounters: encounterCount,
        hunt_id: huntId || null,
      });
      if (error) throw error;
      // Fire-and-forget: never let achievement tracking break posting.
      void unlockAchievement(user.id, "first-showcase").catch(() => {});
      reset();
      setOpen(false);
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share your shiny.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-6 text-center font-semibold text-amber-800 transition hover:border-amber-400 hover:text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:text-amber-200"
      >
        ✨ Share your shiny
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cardClass}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
        ✨ Brag about your shiny
      </h2>

      {hunts.length > 0 && (
        <div className="mt-4">
          <label htmlFor="showcase-hunt" className={labelClass}>
            Link a hunt (optional) — fills in the details
          </label>
          <select
            id="showcase-hunt"
            value={huntId}
            onChange={(e) => pickHunt(e.target.value)}
            className={inputClass}
          >
            <option value="">No hunt link</option>
            {hunts.map((h) => (
              <option key={h.id} value={h.id}>
                {h.species_name} · {methodLabel(h.method)} · {h.encounters.toLocaleString()} enc.
                {h.status === "completed" ? " ✨" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4">
        <label className={labelClass}>Pokémon</label>
        {species ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={species.sprites.shiny}
              alt={species.name}
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{species.name}</span>
            <button
              type="button"
              onClick={() => {
                setSpecies(null);
                setQuery("");
              }}
              className="text-sm text-slate-500 underline"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Pokémon…"
              autoComplete="off"
              className={inputClass}
            />
            {matches.length > 0 && (
              <ul className="mt-1 grid max-h-48 grid-cols-4 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSpecies(m)}
                      title={m.name}
                      className="rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.sprites.shiny}
                        alt={m.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-contain"
                        loading="lazy"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="showcase-method" className={labelClass}>
            Method
          </label>
          <input
            id="showcase-method"
            list="showcase-methods"
            value={methodText}
            onChange={(e) => setMethodText(e.target.value)}
            placeholder="e.g. Masuda Method (breeding)"
            autoComplete="off"
            className={inputClass}
          />
          <datalist id="showcase-methods">
            {SHINY_METHODS.map((m) => (
              <option key={m.id} value={m.label} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="showcase-encounters" className={labelClass}>
            Encounters (optional)
          </label>
          <input
            id="showcase-encounters"
            type="number"
            min={0}
            value={encounters}
            onChange={(e) => setEncounters(e.target.value)}
            placeholder="How many did it take?"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="showcase-story" className={labelClass}>
          The story behind the hunt
        </label>
        <textarea
          id="showcase-story"
          rows={4}
          value={story}
          onChange={(e) => setStory(e.target.value)}
          className={inputClass}
          maxLength={MAX_STORY_LENGTH}
          placeholder="Three weeks of sandwiches, a full moon, and then it just… appeared. Tell the tale! ✨"
        />
        <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
          {story.length}/{MAX_STORY_LENGTH}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy || !species || story.trim() === ""}
          className="rounded-lg bg-amber-400 px-6 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-950"
        >
          {busy ? "Sharing…" : "✨ Post it!"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ShowcaseCard({
  post,
  userId,
  isAdmin,
  onDeleted,
}: {
  post: ShowcasePost;
  userId: string;
  isAdmin: boolean;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const mine = post.user_id === userId;
  const canDelete = mine || isAdmin;
  const species = getSpeciesById(post.species_id);

  async function remove() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("shiny_showcase").delete().eq("id", post.id);
      if (!error) onDeleted();
      else console.error("Delete failed:", error.message);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Sparkle accents */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 select-none text-4xl opacity-20">
        ✨
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-2 left-3 select-none text-lg opacity-15">
        ✦
      </div>

      <div className="flex items-start gap-4">
        <Link href={`/pokedex/${post.species_id}`} className="relative shrink-0">
          {/* Soft golden glow behind the sprite */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-amber-200 to-amber-300 opacity-50 blur-md dark:from-amber-700 dark:via-amber-800 dark:to-amber-900 dark:opacity-40"
          />
          {species ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={species.sprites.shiny}
              alt={post.species_name}
              width={88}
              height={88}
              className="relative h-22 w-22 object-contain"
              loading="lazy"
            />
          ) : (
            <div className="relative flex h-22 w-22 items-center justify-center text-3xl">
              ✨
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
            <Link href={`/pokedex/${post.species_id}`} className="hover:underline">
              ✨ {post.species_name}
            </Link>
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {post.method && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {post.method}
              </span>
            )}
            {post.encounters !== null && (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {post.encounters.toLocaleString()} encounter{post.encounters === 1 ? "" : "s"}
              </span>
            )}
            {post.hunt_id && (
              <span
                title="Details were linked from the trainer's shiny hunt log"
                className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-900 dark:text-violet-200"
              >
                🔗 hunt log
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">
        {post.story}
      </p>

      <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3 dark:border-slate-800">
        <Avatar username={post.author?.username ?? "?"} avatarUrl={post.author?.avatar_url} />
        <div className="min-w-0 flex-1">
          {post.author ? (
            <Link
              href={`/trainer/${encodeURIComponent(post.author.username)}`}
              className="block truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
            >
              {post.author.username}
            </Link>
          ) : (
            <span className="block text-sm font-bold text-slate-400 dark:text-slate-500">
              Unknown trainer
            </span>
          )}
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {timeAgo(post.created_at)}
          </span>
        </div>
        {canDelete && (
          <div className="shrink-0">
            {confirming ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
                >
                  {deleting ? "…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ShinyShowcasePage() {
  const { configured, loading, user } = useAuth();
  const [posts, setPosts] = useState<ShowcasePost[]>([]);
  const [hunts, setHunts] = useState<HuntOption[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // isAdmin starts false; it is only ever set while signed in, and the
    // signed-out branch below never renders it.
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) setIsAdmin((data as { is_admin: boolean } | null)?.is_admin ?? false);
      } catch {
        // column may not exist yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Pure fetch: newest showcase posts with their authors. Throws on failure. */
  const fetchPosts = useCallback(async (): Promise<ShowcasePost[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("shiny_showcase")
      .select("id, user_id, species_id, species_name, story, method, encounters, hunt_id, created_at, author:profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<{
      id: string;
      user_id: string;
      species_id: number;
      species_name: string;
      story: string;
      method: string | null;
      encounters: number | null;
      hunt_id: string | null;
      created_at: string;
      author:
        | { username: string; avatar_url: string | null }
        | Array<{ username: string; avatar_url: string | null }>
        | null;
    }>).map((row): ShowcasePost => ({
      id: row.id,
      user_id: row.user_id,
      species_id: row.species_id,
      species_name: row.species_name,
      story: row.story,
      method: row.method,
      encounters: row.encounters,
      hunt_id: row.hunt_id,
      created_at: row.created_at,
      author: Array.isArray(row.author) ? (row.author[0] ?? null) : row.author,
    }));
  }, []);

  /** The user's hunts, offered as linkable options in the composer. */
  const fetchHunts = useCallback(async (): Promise<HuntOption[]> => {
    if (!user) return [];
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shiny_hunts")
        .select("id, species_id, species_name, method, encounters, status")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return ((data as HuntOption[] | null) ?? []);
    } catch {
      return [];
    }
  }, [user]);

  const reload = useCallback(() => {
    setLoadingFeed(true);
    void fetchPosts()
      .then((rows) => {
        setPosts(rows);
        setLoadingFeed(false);
        setTableMissing(false);
      })
      .catch((e: unknown) => {
        console.error("Failed to load showcase:", e instanceof Error ? e.message : e);
        setTableMissing(true);
        setLoadingFeed(false);
      });
  }, [fetchPosts]);

  // Initial load once auth is ready.
  useEffect(() => {
    if (!configured || loading || !user) return;
    let cancelled = false;
    void fetchPosts()
      .then((rows) => {
        if (cancelled) return;
        setPosts(rows);
        setLoadingFeed(false);
        setTableMissing(false);
      })
      .catch((e: unknown) => {
        console.error("Failed to load showcase:", e instanceof Error ? e.message : e);
        if (!cancelled) {
          setTableMissing(true);
          setLoadingFeed(false);
        }
      });
    void fetchHunts().then((rows) => {
      if (!cancelled) setHunts(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, fetchPosts, fetchHunts]);

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }
  if (!user) return <SignInPrompt />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
        ✨ Shiny Showcase
      </h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        The community brag wall — show off your shinies and tell the tale of the hunt.
      </p>
      <CommunityTabs />

      {tableMissing ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          The Shiny Showcase needs the latest database update — run{" "}
          <code className="font-mono text-xs">supabase/migration-shiny-showcase.sql</code>{" "}
          in the Supabase SQL Editor to enable it.
        </p>
      ) : (
        <>
          <ShareComposer hunts={hunts} onPosted={reload} />
          <div className="mt-6">
            {loadingFeed ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading showcase…
              </p>
            ) : posts.length === 0 ? (
              <div className={`${cardClass} text-center`}>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No shinies on the wall yet — be the first to brag! ✨
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <ShowcaseCard
                    key={post.id}
                    post={post}
                    userId={user.id}
                    isAdmin={isAdmin}
                    onDeleted={reload}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
