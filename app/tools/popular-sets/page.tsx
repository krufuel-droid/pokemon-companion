"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SpreadRow {
  name: string;
  teams: number;
  pct: number;
}

interface Spread {
  species: string;
  dex: number;
  teams: number;
  pct: number;
  tournaments: number;
  items: SpreadRow[];
  moves: SpreadRow[];
  abilities: SpreadRow[];
  natures: SpreadRow[];
}

function SpreadSection({
  title,
  rows,
  defaultOpen = false,
}: {
  title: string;
  rows: SpreadRow[];
  defaultOpen?: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <details
      open={defaultOpen || undefined}
      className="rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">
          ▸
        </span>
        {title}
        <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          top {rows.length}
        </span>
      </summary>
      <ul className="px-4 pb-4">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3 py-1.5">
            <span className="w-36 shrink-0 truncate text-sm text-slate-700 dark:text-slate-200 sm:w-44">
              {row.name}
            </span>
            <div
              className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              role="img"
              aria-label={`${row.name}: ${row.pct}% of ${row.teams} teams`}
            >
              <div
                className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500"
                style={{ width: `${Math.min(100, Math.max(0, row.pct))}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {row.pct}%
            </span>
            <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-slate-400 sm:inline dark:text-slate-500">
              {row.teams.toLocaleString()} teams
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function PopularSetsPage() {
  const [query, setQuery] = useState("");
  const [spread, setSpread] = useState<Spread | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalTeams, setTotalTeams] = useState<number | null>(null);

  // Total archived team count for the header line (grows as the archive grows).
  useEffect(() => {
    fetch("/api/teams")
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: { tournaments?: { teamCount: number }[] } | null) => {
        if (doc?.tournaments) {
          setTotalTeams(doc.tournaments.reduce((sum, t) => sum + (t.teamCount || 0), 0));
        }
      })
      .catch(() => {});
  }, []);

  async function search(name: string) {
    const q = name.trim();
    if (!q) return;
    setLoading(true);
    setNotice(null);
    setSuggestions([]);
    try {
      const res = await fetch(`/api/usage?pokemon=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setSpread(data as Spread);
      } else {
        setSpread(null);
        const names: string[] = data.matches ?? data.suggestions ?? [];
        setSuggestions(names);
        setNotice(
          data.error ??
            `No results for "${q}". Try one of the suggestions below.`
        );
      }
    } catch {
      setSpread(null);
      setNotice("Couldn't reach the usage API — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show an example on first load so the page isn't empty.
  useEffect(() => {
    search("Rillaboom");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const standardSet =
    spread && spread.moves.length > 0
      ? [
          spread.items[0]?.name,
          spread.moves
            .slice(0, 4)
            .map((m) => m.name)
            .join(" / "),
          spread.abilities[0]?.name,
          spread.natures[0]?.name,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Popular Sets Explorer
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Search any Pokémon to see the items, moves, abilities, and natures real
        tournament teams are actually running.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
      >
        <label htmlFor="popular-sets-search" className="sr-only">
          Search for a Pokémon
        </label>
        <input
          id="popular-sets-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a Pokémon… (e.g. Metagross)"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {notice && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900">
          {notice}
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setQuery(s);
                    search(s);
                  }}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-300 transition hover:bg-amber-100 dark:bg-slate-900 dark:text-amber-200 dark:ring-amber-800 dark:hover:bg-slate-800"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {spread && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              <Link
                href={`/pokedex/${spread.dex}`}
                className="hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
              >
                {spread.species}
              </Link>
              <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                #{spread.dex}
              </span>
            </h2>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {spread.pct}% of{" "}
              {totalTeams !== null ? totalTeams.toLocaleString() : "archived"}{" "}
              teams
              <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
                ({spread.teams.toLocaleString()} teams)
              </span>
            </p>
          </div>

          {standardSet && (
            <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                The standard set:{" "}
              </span>
              {standardSet}
            </p>
          )}

          <div className="mt-4 space-y-3">
            <SpreadSection title="Items" rows={spread.items} defaultOpen />
            <SpreadSection title="Moves" rows={spread.moves} defaultOpen />
            <SpreadSection title="Abilities" rows={spread.abilities} />
            <SpreadSection title="Natures" rows={spread.natures} />
          </div>
        </section>
      )}

      <p className="mt-6 text-xs leading-5 text-slate-400 dark:text-slate-500">
        Archive-derived from fan-run tournament data — not official usage.
        Percentages for items, moves, abilities, and natures are out of the
        teams running this Pokémon.
      </p>
    </main>
  );
}
