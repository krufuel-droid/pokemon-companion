"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TrackedPokemon {
  dex: number;
  species: string;
  nature: string;
  ability: string;
  item: string;
  moves: string[];
  sprite: string | null;
}

interface TrackedRun {
  placement: number;
  player: string;
  country: string;
  record: string;
  pokemon: TrackedPokemon[];
}

interface TrackedTournament {
  id: string;
  name: string;
  dates: string | null;
  runs: TrackedRun[];
}

interface PlayerResult {
  query: string;
  players: string[];
  totalRuns: number;
  tournaments: TrackedTournament[];
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function PokemonCard({ p }: { p: TrackedPokemon }) {
  return (
    <details className="group rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-2 marker:hidden [&::-webkit-details-marker]:hidden">
        {p.sprite ? (
          <img
            src={p.sprite}
            alt={p.species}
            loading="lazy"
            className="h-10 w-10 shrink-0"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-lg">
            ❓
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Link
            href={`/pokedex/${p.dex}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
          >
            {p.species}
          </Link>
        </span>
        <span className="mr-1 shrink-0 text-slate-400 transition-transform group-open:rotate-90 dark:text-slate-500">
          ▸
        </span>
      </summary>
      <dl className="space-y-1 px-3 pb-3 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-semibold text-slate-400 dark:text-slate-500">
            Item
          </dt>
          <dd className="truncate">{p.item || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-semibold text-slate-400 dark:text-slate-500">
            Ability
          </dt>
          <dd className="truncate">{p.ability || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 font-semibold text-slate-400 dark:text-slate-500">
            Nature
          </dt>
          <dd>{p.nature || "—"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-400 dark:text-slate-500">
            Moves
          </dt>
          <dd className="mt-0.5 flex flex-wrap gap-1">
            {p.moves.map((m) => (
              <span
                key={m}
                className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                {m}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </details>
  );
}

function RunCard({ run }: { run: TrackedRun }) {
  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          {run.player}
          <span className="ml-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            {run.country}
          </span>
        </h3>
        <p className="text-sm">
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            {ordinal(run.placement)}
          </span>
          <span className="ml-2 tabular-nums text-slate-500 dark:text-slate-400">
            {run.record}
          </span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {run.pokemon.map((p, i) => (
          <PokemonCard key={`${p.dex}-${i}`} p={p} />
        ))}
      </div>
    </article>
  );
}

export default function PlayerTrackerPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PlayerResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(name: string) {
    const q = name.trim();
    if (!q) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/player?player=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        const r = data as PlayerResult;
        setResult(r);
        setSearched(true);
        if (r.totalRuns === 0) {
          setNotice(
            `No archived runs found for "${q}" — check spelling. Only players with a full 6-Pokémon team list appear in the archive.`,
          );
        }
      } else {
        setResult(null);
        setSearched(true);
        setNotice(
          data.error ?? `Couldn't search for "${q}" — try again.`,
        );
      }
    } catch {
      setResult(null);
      setSearched(true);
      setNotice("Couldn't reach the player API — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show an example on first load so the page isn't empty.
  useEffect(() => {
    search("Takuma Yamazaki");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Player Tracker
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Search a player to see every archived tournament run we have for
        them — placements, records, and the full teams they brought.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search(query);
        }}
      >
        <label htmlFor="player-tracker-search" className="sr-only">
          Search for a player
        </label>
        <input
          id="player-tracker-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a player… (e.g. Yamazaki)"
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
        </div>
      )}

      {result && result.totalRuns > 0 && (
        <section className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {result.players.length === 1
                ? result.players[0]
                : `${result.totalRuns} runs`}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {result.totalRuns} archived run
              {result.totalRuns === 1 ? "" : "s"} ·{" "}
              {result.tournaments.length} event
              {result.tournaments.length === 1 ? "" : "s"}
            </p>
          </div>

          {result.players.length > 1 && (
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700">
              <span className="font-semibold">Matched players: </span>
              <span className="mt-1 flex flex-wrap gap-2">
                {result.players.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setQuery(name);
                      search(name);
                    }}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800"
                  >
                    {name}
                  </button>
                ))}
              </span>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {result.tournaments.map((t, ti) => {
              const best = Math.min(...t.runs.map((r) => r.placement));
              return (
                <details
                  key={t.id}
                  open={ti === 0 || undefined}
                  className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">
                          ▸
                        </span>
                        {t.name}
                        {t.dates && (
                          <span className="ml-2 font-medium text-slate-400 dark:text-slate-500">
                            {t.dates}
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t.runs.length} run{t.runs.length === 1 ? "" : "s"} ·
                        best {ordinal(best)}
                      </span>
                    </span>
                  </summary>
                  <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
                    {t.runs.map((run, ri) => (
                      <RunCard key={`${run.placement}-${ri}`} run={run} />
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      {searched && !loading && result && result.totalRuns === 0 && !notice && (
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No archived runs found — check spelling.
        </p>
      )}

      <p className="mt-6 text-xs leading-5 text-slate-400 dark:text-slate-500">
        Archive-derived from fan-run tournament data (pokedata.ovh); Masters
        division only. Only players with a full 6-Pokémon team list appear in
        the archive.
      </p>
    </main>
  );
}
