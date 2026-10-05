"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSpeciesById } from "@/lib/pokedex";

interface UsageEntry {
  species: string;
  dex: number;
  teams: number;
  pct: number;
}

interface TournamentResponse {
  id: string;
  name: string;
  dates: string;
  teams: number;
  usage: UsageEntry[];
}

interface TournamentMeta {
  id: string;
  shortName: string;
  dates: string;
  teamCount: number;
}

// Chronological, oldest → newest (from /api/usage docs response).
const TOURNAMENTS: TournamentMeta[] = [
  { id: "1000057", shortName: "LAIC", dates: "Nov 21–23, 2025", teamCount: 515 },
  { id: "1000050", shortName: "EUIC", dates: "Feb 13–15, 2026", teamCount: 1452 },
  { id: "1000038", shortName: "Indianapolis", dates: "May 29–31, 2026", teamCount: 1010 },
  { id: "1000036", shortName: "NAIC", dates: "Jun 12–14, 2026", teamCount: 1090 },
  { id: "1000035", shortName: "Worlds", dates: "Aug 28–30, 2026", teamCount: 395 },
  { id: "1000034", shortName: "Baltimore", dates: "Sep 18–20, 2026", teamCount: 1073 },
  { id: "1000068", shortName: "Brisbane", dates: "Sep 26–27, 2026", teamCount: 325 },
  { id: "1000070", shortName: "Frankfurt", dates: "Sep 26–27, 2026", teamCount: 1126 },
];

const TOTAL_TEAMS = TOURNAMENTS.reduce((s, t) => s + t.teamCount, 0);
// Species must appear on at least this many teams in the earliest or latest
// event to be ranked — filters out one-off small-sample noise.
const MIN_TEAMS = 5;

interface TrendRow {
  dex: number;
  species: string;
  firstPct: number;
  lastPct: number;
  firstTeams: number;
  lastTeams: number;
  delta: number;
  series: { pct: number; teams: number }[];
}

function formatDelta(d: number): string {
  const sign = d > 0 ? "+" : d < 0 ? "−" : "";
  return `${sign}${Math.abs(d).toFixed(1)} pts`;
}

function TrendCard({
  title,
  icon,
  rows,
  accent,
  expanded,
  onToggle,
}: {
  title: string;
  icon: string;
  rows: TrendRow[];
  accent: "emerald" | "rose";
  expanded: number | null;
  onToggle: (dex: number | null) => void;
}) {
  const barBg = accent === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  const deltaText =
    accent === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        {icon} {title}
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Change in usage from LAIC (Nov 2025) to Frankfurt (Sep 2026), in percentage points.
      </p>
      <ol className="mt-3 space-y-1">
        {rows.map((r, i) => {
          const slug = getSpeciesById(r.dex)?.slug;
          const isOpen = expanded === r.dex;
          const maxSeries = Math.max(...r.series.map((s) => s.pct), 0.1);
          return (
            <li key={r.dex}>
              <button
                onClick={() => onToggle(isOpen ? null : r.dex)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                aria-expanded={isOpen}
              >
                <span className="w-6 shrink-0 text-sm font-semibold text-slate-400 dark:text-slate-500">
                  {i + 1}
                </span>
                {slug ? (
                  <Link
                    href={`/pokedex/${slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 hover:text-emerald-600 dark:text-slate-200 dark:hover:text-emerald-400"
                  >
                    {r.species}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {r.species}
                  </span>
                )}
                <span className={`shrink-0 text-sm font-bold tabular-nums ${deltaText}`}>
                  {formatDelta(r.delta)}
                </span>
                <span className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {r.lastPct.toFixed(1)}%
                </span>
              </button>
              {isOpen && (
                <div className="mx-2 mb-2 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
                  <div className="flex h-20 items-end gap-1.5">
                    {r.series.map((s, idx) => (
                      <div key={TOURNAMENTS[idx].id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                        <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
                          {s.pct > 0 ? s.pct.toFixed(1) : "–"}
                        </span>
                        <div className="flex h-12 w-full items-end">
                          <div
                            className={`w-full rounded-sm ${barBg} opacity-80`}
                            style={{ height: `${Math.max((s.pct / maxSeries) * 100, s.pct > 0 ? 4 : 0)}%` }}
                            title={`${TOURNAMENTS[idx].shortName}: ${s.pct.toFixed(1)}% (${s.teams} teams)`}
                          />
                        </div>
                        <span className="truncate text-[9px] text-slate-400 dark:text-slate-500">
                          {TOURNAMENTS[idx].shortName}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {r.firstPct.toFixed(1)}% at LAIC ({r.firstTeams} teams) → {r.lastPct.toFixed(1)}% at
                    Frankfurt ({r.lastTeams} teams)
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default function MetaTrendsPage() {
  const [data, setData] = useState<TournamentResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRising, setExpandedRising] = useState<number | null>(null);
  const [expandedFalling, setExpandedFalling] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      TOURNAMENTS.map((t) =>
        fetch(`/api/usage?tournament=${t.id}&limit=231`).then((res) => {
          if (!res.ok) throw new Error(`Failed to load ${t.shortName}`);
          return res.json() as Promise<TournamentResponse>;
        })
      )
    )
      .then((results) => {
        if (!cancelled) setData(results);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load trend data.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { rising, falling } = useMemo(() => {
    if (!data) return { rising: [] as TrendRow[], falling: [] as TrendRow[] };
    const byId = new Map(data.map((d) => [d.id, d]));
    const speciesMap = new Map<number, { species: string; series: { pct: number; teams: number }[] }>();

    TOURNAMENTS.forEach((t, idx) => {
      const resp = byId.get(t.id);
      for (const u of resp?.usage ?? []) {
        let rec = speciesMap.get(u.dex);
        if (!rec) {
          rec = { species: u.species, series: TOURNAMENTS.map(() => ({ pct: 0, teams: 0 })) };
          speciesMap.set(u.dex, rec);
        }
        rec.series[idx] = { pct: u.pct, teams: u.teams };
      }
    });

    const rows: TrendRow[] = [];
    for (const [dex, rec] of speciesMap) {
      const first = rec.series[0];
      const last = rec.series[rec.series.length - 1];
      if (first.teams < MIN_TEAMS && last.teams < MIN_TEAMS) continue;
      rows.push({
        dex,
        species: rec.species,
        firstPct: first.pct,
        lastPct: last.pct,
        firstTeams: first.teams,
        lastTeams: last.teams,
        delta: last.pct - first.pct,
        series: rec.series,
      });
    }

    const rising = rows
      .filter((r) => r.delta > 0)
      .sort((a, b) => b.delta - a.delta || b.lastPct - a.lastPct)
      .slice(0, 10);
    const falling = rows
      .filter((r) => r.delta < 0)
      .sort((a, b) => a.delta - b.delta || a.lastPct - b.lastPct)
      .slice(0, 10);
    return { rising, falling };
  }, [data]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Meta Trends</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Who&apos;s climbing and who&apos;s fading across {TOTAL_TEAMS.toLocaleString()} archived tournament
        teams — from LAIC in November 2025 to Frankfurt in September 2026. Tap any Pokémon for its
        event-by-event breakdown.
      </p>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {!data && !error && (
        <div className="mt-6 space-y-3" aria-label="Loading">
          {[0, 1].map((c) => (
            <div
              key={c}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 space-y-2">
                {[0, 1, 2, 3].map((r) => (
                  <div key={r} className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TrendCard
            title="Rising"
            icon="📈"
            rows={rising}
            accent="emerald"
            expanded={expandedRising}
            onToggle={setExpandedRising}
          />
          <TrendCard
            title="Falling"
            icon="📉"
            rows={falling}
            accent="rose"
            expanded={expandedFalling}
            onToggle={setExpandedFalling}
          />
        </div>
      )}

      <details className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
          Events covered ({TOURNAMENTS.length})
        </summary>
        <ul className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400">
          {TOURNAMENTS.map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span>
                {t.shortName} <span className="text-xs">· {t.dates}</span>
              </span>
              <span className="tabular-nums">{t.teamCount.toLocaleString()} teams</span>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Archive-derived from fan-run tournament data (pokedata.ovh), not official usage. Species on
        fewer than {MIN_TEAMS} teams in both the earliest and latest events are excluded to reduce
        small-sample noise. Masters division only.
      </p>
    </main>
  );
}
