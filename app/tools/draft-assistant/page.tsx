"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllSpecies, searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { TYPES, effectiveness } from "@/lib/typechart";
import { TYPE_COLORS } from "@/lib/theme";

const MY_KEY = "draft_my_picks_v1";
const TAKEN_KEY = "draft_taken_v1";
const POOL_LIMIT = 200;
const PAGE_SIZE = 24;

interface UsageEntry {
  species: string;
  dex: number;
  teams: number;
  pct: number;
}

function loadIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function TypePills({ types }: { types: string[] }) {
  return (
    <span className="inline-flex gap-1">
      {types.map((t) => (
        <span
          key={t}
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ backgroundColor: TYPE_COLORS[t] ?? "#A8A77A" }}
        >
          {t}
        </span>
      ))}
    </span>
  );
}

function PickRow({
  sp,
  onRemove,
  extra,
}: {
  sp: SpeciesIndex;
  onRemove: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700/60">
      <img src={sp.sprites.regular} alt={sp.name} loading="lazy" className="h-8 w-8 shrink-0" />
      <Link
        href={`/pokedex/${sp.slug}`}
        className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
      >
        {sp.name}
      </Link>
      <TypePills types={sp.types} />
      {extra}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${sp.name}`}
        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        ✕
      </button>
    </li>
  );
}

export default function DraftAssistantPage() {
  const [myIds, setMyIds] = useState<number[]>(() =>
    typeof window === "undefined" ? [] : loadIds(MY_KEY),
  );
  const [takenIds, setTakenIds] = useState<number[]>(() =>
    typeof window === "undefined" ? [] : loadIds(TAKEN_KEY),
  );
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState<UsageEntry[] | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [availQuery, setAvailQuery] = useState("");
  const [availPage, setAvailPage] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(MY_KEY, JSON.stringify(myIds));
    } catch {
      /* ignore */
    }
  }, [myIds]);
  useEffect(() => {
    try {
      localStorage.setItem(TAKEN_KEY, JSON.stringify(takenIds));
    } catch {
      /* ignore */
    }
  }, [takenIds]);

  useEffect(() => {
    fetch("/api/usage?limit=200")
      .then((r) => {
        if (!r.ok) throw new Error("usage fetch failed");
        return r.json();
      })
      .then((d) => setUsage(Array.isArray(d.usage) ? d.usage : []))
      .catch(() => setUsageError(true));
  }, []);

  const speciesByDex = useMemo(() => {
    const m = new Map<number, SpeciesIndex>();
    for (const s of getAllSpecies()) m.set(s.id, s);
    return m;
  }, []);

  const myPicks = useMemo(
    () => myIds.map((id) => speciesByDex.get(id)).filter((s): s is SpeciesIndex => !!s),
    [myIds, speciesByDex],
  );
  const taken = useMemo(
    () => takenIds.map((id) => speciesByDex.get(id)).filter((s): s is SpeciesIndex => !!s),
    [takenIds, speciesByDex],
  );

  const results = useMemo(
    () => (query.trim() ? searchSpecies(query.trim()).slice(0, 8) : []),
    [query],
  );

  const addMine = (id: number) => {
    setMyIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setTakenIds((ids) => ids.filter((x) => x !== id));
    setQuery("");
  };
  const addTaken = (id: number) => {
    setTakenIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    setMyIds((ids) => ids.filter((x) => x !== id));
    setQuery("");
  };

  // Draft pool: top-200 by tournament usage, minus taken and mine.
  const pool = useMemo(() => {
    if (!usage) return [];
    const mine = new Set(myIds);
    const gone = new Set(takenIds);
    return usage.filter((u) => !mine.has(u.dex) && !gone.has(u.dex) && speciesByDex.has(u.dex));
  }, [usage, myIds, takenIds, speciesByDex]);

  // Defensive profile of my picks: how many are weak to each attacking type.
  const weakCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of TYPES) m[t] = 0;
    for (const p of myPicks) {
      for (const t of TYPES) {
        if (effectiveness(t, p.types) > 1) m[t] += 1;
      }
    }
    return m;
  }, [myPicks]);

  const topWeaknesses = useMemo(
    () =>
      TYPES.map((t) => ({ type: t, n: weakCount[t] ?? 0 }))
        .filter((w) => w.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 3),
    [weakCount],
  );

  const suggestions = useMemo(() => {
    const mine = new Set(myIds);
    const gone = new Set(takenIds);
    const scored: {
      entry: UsageEntry;
      sp: SpeciesIndex;
      reason: string;
      score: number;
    }[] = [];
    for (const u of usage ?? []) {
      if (mine.has(u.dex) || gone.has(u.dex)) continue;
      const sp = speciesByDex.get(u.dex);
      if (!sp) continue;
      let patch = 0;
      const verbs: string[] = [];
      for (const t of TYPES) {
        const w = weakCount[t] ?? 0;
        if (w === 0) continue;
        const mult = effectiveness(t, sp.types);
        if (mult === 0) {
          patch += w * 2;
          verbs.push(`walls ${t}`);
        } else if (mult < 1) {
          patch += w;
          verbs.push(`resists ${t}`);
        }
      }
      const score = patch * 10 + u.pct;
      const reason =
        verbs.length > 0
          ? `${verbs.slice(0, 2).join(", ")} · ${u.pct}% tournament usage`
          : `top meta pick · ${u.pct}% tournament usage`;
      scored.push({ entry: u, sp, reason, score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [usage, myIds, takenIds, weakCount, speciesByDex]);

  const available = useMemo(() => {
    const q = availQuery.trim().toLowerCase();
    const list = q
      ? pool.filter((u) => {
          const sp = speciesByDex.get(u.dex);
          return sp && sp.name.toLowerCase().includes(q);
        })
      : pool;
    return list;
  }, [pool, availQuery, speciesByDex]);

  const pageCount = Math.max(1, Math.ceil(available.length / PAGE_SIZE));
  const page = Math.min(availPage, pageCount - 1);
  const pageRows = available.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setAvailPage(0);
  }, [availQuery]);

  const clearDraft = () => {
    setMyIds([]);
    setTakenIds([]);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Draft League Assistant
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Track your picks, mark what&apos;s taken, and get next-pick suggestions that patch
        your weaknesses. Your draft is saved in this browser.
      </p>

      {/* Search */}
      <div className="relative mt-6">
        <label htmlFor="draft-search" className="sr-only">
          Search for a Pokémon
        </label>
        <input
          id="draft-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a Pokémon…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            {results.map((sp) => {
              const inMine = myIds.includes(sp.id);
              const inTaken = takenIds.includes(sp.id);
              return (
                <li
                  key={sp.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <img
                    src={sp.sprites.regular}
                    alt={sp.name}
                    loading="lazy"
                    className="h-8 w-8 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                    {sp.name}
                  </span>
                  <TypePills types={sp.types} />
                  <button
                    type="button"
                    disabled={inMine}
                    onClick={() => addMine(sp.id)}
                    className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-40 dark:text-emerald-300"
                  >
                    {inMine ? "Picked ✓" : "+ Mine"}
                  </button>
                  <button
                    type="button"
                    disabled={inTaken}
                    onClick={() => addTaken(sp.id)}
                    className="shrink-0 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-500/25 disabled:opacity-40 dark:text-slate-300"
                  >
                    {inTaken ? "Taken ✓" : "Taken"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Draft board summary */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
          My picks: {myPicks.length}
        </span>
        <span className="rounded-full bg-slate-500/15 px-3 py-1 font-semibold text-slate-600 dark:text-slate-300">
          Taken: {taken.length}
        </span>
        <span className="rounded-full bg-sky-500/15 px-3 py-1 font-semibold text-sky-700 dark:text-sky-300">
          Available: {pool.length}
        </span>
        {(myIds.length > 0 || takenIds.length > 0) && (
          <button
            type="button"
            onClick={clearDraft}
            className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            Clear draft
          </button>
        )}
      </div>
      {topWeaknesses.length > 0 && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Watch out — your team is weak to{" "}
          {topWeaknesses.map((w) => `${w.type} ×${w.n}`).join(", ")}.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* My picks */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            My picks
          </h2>
          {myPicks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              Nothing drafted yet — search above to add your picks.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {myPicks.map((sp) => (
                <PickRow
                  key={sp.id}
                  sp={sp}
                  onRemove={() => setMyIds((ids) => ids.filter((x) => x !== sp.id))}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Taken */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            Taken by others
          </h2>
          {taken.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              Mark Pokémon other drafters pick so they leave your suggestion pool.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {taken.map((sp) => (
                <PickRow
                  key={sp.id}
                  sp={sp}
                  onRemove={() => setTakenIds((ids) => ids.filter((x) => x !== sp.id))}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Suggestions */}
      <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
          Suggested next picks
        </h2>
        {usageError ? (
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            Couldn&apos;t load tournament usage data — suggestions need it. Check your
            connection and refresh.
          </p>
        ) : !usage ? (
          <div className="mt-3 space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            The whole pool is drafted! Clear some picks or reset the draft to get
            suggestions.
          </p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {suggestions.map(({ entry, sp, reason }, i) => (
              <li
                key={entry.dex}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700/60"
              >
                <span className="w-6 shrink-0 text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {i + 1}
                </span>
                <img
                  src={sp.sprites.regular}
                  alt={sp.name}
                  loading="lazy"
                  className="h-9 w-9 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/pokedex/${sp.slug}`}
                    className="block truncate text-sm font-semibold text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
                  >
                    {sp.name}
                  </Link>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {reason}
                  </p>
                </div>
                <TypePills types={sp.types} />
                <button
                  type="button"
                  onClick={() => addMine(sp.id)}
                  className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                >
                  Draft
                </button>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Ranked by how well each pick patches your team&apos;s defensive weaknesses,
          blended with real tournament usage. Archive-derived from fan-run tournament
          data — not official usage.
        </p>
      </section>

      {/* Available pool */}
      <details
        open
        className="mt-4 rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
      >
        <summary className="cursor-pointer list-none px-4 py-3 text-lg font-bold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
          <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">
            ▸
          </span>
          Available draft pool
          <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
            top {POOL_LIMIT} by usage · {available.length} left
          </span>
        </summary>
        <div className="px-4 pb-4">
          <input
            value={availQuery}
            onChange={(e) => setAvailQuery(e.target.value)}
            placeholder="Filter the pool…"
            aria-label="Filter the available pool"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          {!usage && !usageError ? (
            <div className="mt-3 space-y-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : (
            <>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {pageRows.map((u) => {
                  const sp = speciesByDex.get(u.dex);
                  if (!sp) return null;
                  return (
                    <li
                      key={u.dex}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700/60"
                    >
                      <img
                        src={sp.sprites.regular}
                        alt={sp.name}
                        loading="lazy"
                        className="h-8 w-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/pokedex/${sp.slug}`}
                          className="block truncate text-sm font-medium text-slate-700 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
                        >
                          {sp.name}
                        </Link>
                        <p className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                          {u.pct}% usage
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addMine(sp.id)}
                        className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                      >
                        + Mine
                      </button>
                      <button
                        type="button"
                        onClick={() => addTaken(sp.id)}
                        className="shrink-0 rounded-full bg-slate-500/15 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-500/25 dark:text-slate-300"
                      >
                        Taken
                      </button>
                    </li>
                  );
                })}
              </ul>
              {pageCount > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setAvailPage((p) => Math.max(0, p - 1))}
                    className="rounded-full px-3 py-1 font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                    Page {page + 1} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pageCount - 1}
                    onClick={() => setAvailPage((p) => Math.min(pageCount - 1, p + 1))}
                    className="rounded-full px-3 py-1 font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </details>
    </main>
  );
}
