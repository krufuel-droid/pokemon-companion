"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { searchSpecies, getSpeciesById } from "@/lib/pokedex";

interface CaughtEntry {
  id: string;
  speciesId: number;
  speciesName: string;
  caughtAt: string;
}

function localKey(slug: string): string {
  return `guide-caught-${slug}`;
}

/** Migrate any pre-sync localStorage entries into the database (one-time). */
async function migrateLocal(slug: string, userId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(localKey(slug));
    if (!raw) return;
    const parsed = JSON.parse(raw) as { speciesId: number; speciesName: string; caughtAt: string }[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    const supabase = createClient();
    const rows = parsed.map((p) => ({
      user_id: userId,
      guide_slug: slug,
      species_id: p.speciesId,
      species_name: p.speciesName,
    }));
    // Upsert ignores duplicates already in the DB.
    await supabase
      .from("guide_checklists")
      .upsert(rows, { onConflict: "user_id,guide_slug,species_id", ignoreDuplicates: true });
    localStorage.removeItem(localKey(slug));
  } catch {
    // best-effort; local entries stay put on failure
  }
}

/** Per-guide "caught" checklist, synced across devices via Supabase. */
export default function GuideCaughtChecklist({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<CaughtEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await migrateLocal(slug, user.id);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("guide_checklists")
          .select("id, species_id, species_name, caught_at")
          .eq("user_id", user.id)
          .eq("guide_slug", slug)
          .order("caught_at", { ascending: true });
        if (error) throw error;
        if (!cancelled) {
          setEntries(
            ((data as { id: string; species_id: number; species_name: string; caught_at: string }[] | null) ?? []).map(
              (r) => ({ id: r.id, speciesId: r.species_id, speciesName: r.species_name, caughtAt: r.caught_at }),
            ),
          );
        }
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, user]);

  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    const existing = new Set(entries.map((e) => e.speciesId));
    return searchSpecies(q)
      .filter((s) => !existing.has(s.id))
      .slice(0, 12);
  }, [query, entries]);

  async function add(speciesId: number, speciesName: string) {
    if (!user) return;
    setQuery("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("guide_checklists")
        .insert({
          user_id: user.id,
          guide_slug: slug,
          species_id: speciesId,
          species_name: speciesName,
        })
        .select("id, species_id, species_name, caught_at")
        .single();
      if (error) throw error;
      const r = data as { id: string; species_id: number; species_name: string; caught_at: string };
      setEntries((prev) => [
        ...prev,
        { id: r.id, speciesId: r.species_id, speciesName: r.species_name, caughtAt: r.caught_at },
      ]);
    } catch {
      // duplicate or RLS — ignore, list stays as-is
    }
  }

  async function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const supabase = createClient();
      await supabase.from("guide_checklists").delete().eq("id", id);
    } catch {
      // best-effort
    }
  }

  if (!user) {
    return (
      <section aria-label="Caught checklist" className="mt-10">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My caught checklist</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sign in to track what you&apos;ve caught — your list syncs across devices.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Caught checklist" className="mt-10">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        My caught checklist
        {entries.length > 0 && (
          <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            ({entries.length} caught)
          </span>
        )}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Track what you&apos;ve caught in this playthrough. Syncs across your devices.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading your list…</p>
      ) : missing ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Checklists need the latest database update — run the newest SQL in the Supabase SQL Editor
          to enable them.
        </p>
      ) : (
        <>
          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search to add a catch…"
              autoComplete="off"
              aria-label="Search Pokémon to add to caught list"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {matches.length > 0 && (
              <ul className="mt-1 grid max-h-48 grid-cols-6 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => void add(m.id, m.name)}
                      title={`Mark ${m.name} as caught`}
                      className="rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.sprites.regular}
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
          </div>

          {entries.length > 0 ? (
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {entries.map((e) => {
                const species = getSpeciesById(e.speciesId);
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-950"
                  >
                    {species && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={species.sprites.regular}
                        alt={e.speciesName}
                        width={40}
                        height={40}
                        className="h-10 w-10 shrink-0 object-contain"
                        loading="lazy"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {e.speciesName}
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                      ✓
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(e.id)}
                      aria-label={`Remove ${e.speciesName} from caught list`}
                      className="shrink-0 rounded px-1 text-xs font-bold text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Nothing caught yet — search above to start your list.
            </p>
          )}
        </>
      )}
    </section>
  );
}
