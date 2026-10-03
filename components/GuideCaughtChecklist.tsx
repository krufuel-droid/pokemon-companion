"use client";

import { useEffect, useMemo, useState } from "react";
import { searchSpecies, getSpeciesById } from "@/lib/pokedex";

interface CaughtEntry {
  speciesId: number;
  speciesName: string;
  caughtAt: string;
}

function storageKey(slug: string): string {
  return `guide-caught-${slug}`;
}

function load(slug: string): CaughtEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CaughtEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Per-guide "caught" checklist, stored locally per device. */
export default function GuideCaughtChecklist({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<CaughtEntry[]>([]);
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(load(slug));
    setHydrated(true);
  }, [slug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(entries));
    } catch {
      // storage full or unavailable — checklist just won't persist
    }
  }, [entries, slug, hydrated]);

  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    const existing = new Set(entries.map((e) => e.speciesId));
    return searchSpecies(q)
      .filter((s) => !existing.has(s.id))
      .slice(0, 12);
  }, [query, entries]);

  function add(speciesId: number, speciesName: string) {
    setEntries((prev) => [
      ...prev,
      { speciesId, speciesName, caughtAt: new Date().toISOString() },
    ]);
    setQuery("");
  }

  function remove(speciesId: number) {
    setEntries((prev) => prev.filter((e) => e.speciesId !== speciesId));
  }

  if (!hydrated) return null;

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
        Track what you&apos;ve caught in this playthrough. Saved on this device.
      </p>

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
                  onClick={() => add(m.id, m.name)}
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
                key={e.speciesId}
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
                  onClick={() => remove(e.speciesId)}
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
    </section>
  );
}
