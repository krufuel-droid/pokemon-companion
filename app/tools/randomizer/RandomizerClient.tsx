"use client";

import { useState } from "react";
import Link from "next/link";
import {
  randomizeTeam,
  type RandomTeamMember,
} from "./actions";
import { RANDOMIZER_GAMES } from "./games";

const TYPE_COLORS: Record<string, string> = {
  Normal: "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200",
  Fire: "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Water: "bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  Electric: "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Grass: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
  Ice: "bg-cyan-200 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Fighting: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
  Poison: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Ground: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Flying: "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Psychic: "bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  Bug: "bg-lime-200 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  Rock: "bg-stone-300 text-stone-800 dark:bg-stone-600 dark:text-stone-100",
  Ghost: "bg-violet-200 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  Dragon: "bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-200",
  Dark: "bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100",
  Steel: "bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100",
  Fairy: "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
};

function MemberCard({ mon }: { mon: RandomTeamMember }) {
  return (
    <Link
      href={`/pokedex/${mon.id}`}
      className="group relative flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
    >
      {mon.isStarter && (
        <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white dark:bg-emerald-600">
          Starter
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mon.sprite}
        alt={mon.name}
        width={96}
        height={96}
        loading="lazy"
        className="h-24 w-24 object-contain"
      />
      <span className="mt-2 text-center text-sm font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
        {mon.name}
      </span>
      <span className="mt-2 flex flex-wrap justify-center gap-1">
        {mon.types.map((t) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[t] ?? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"}`}
          >
            {t}
          </span>
        ))}
      </span>
    </Link>
  );
}

export default function RandomizerClient() {
  const [version, setVersion] = useState(RANDOMIZER_GAMES[0].version);
  const [team, setTeam] = useState<RandomTeamMember[] | null>(null);
  const [gameLabel, setGameLabel] = useState("");
  const [poolSize, setPoolSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roll = async (v: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await randomizeTeam(v);
      if (result.error) {
        setError(result.error);
        setTeam(null);
      } else {
        setTeam(result.team);
        setGameLabel(result.gameLabel);
        setPoolSize(result.poolSize);
      }
    } catch {
      setError("Something went wrong. Try again in a moment.");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  const distinctTypes = team ? new Set(team.flatMap((m) => m.types)).size : 0;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Game
          </span>
          <select
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              setTeam(null);
              setError(null);
            }}
            className="w-full rounded-xl bg-white px-4 py-2.5 text-slate-800 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
          >
            {RANDOMIZER_GAMES.map((g) => (
              <option key={g.version} value={g.version}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => roll(version)}
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {loading ? "Rolling…" : team ? "Shuffle again" : "Randomize team"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800">
          {error}
        </p>
      )}

      {team && (
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Your {gameLabel} team
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {team.length} Pokémon · {distinctTypes} distinct types · 1 starter
              + 5 from {poolSize} early-game candidates
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {team.map((mon) => (
              <MemberCard key={mon.id} mon={mon} />
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your starter plus five Pokémon you can catch early in {gameLabel},
            each one able to grow into a capable battler — and the team is
            spread across types so you won&apos;t get walled by the first gym.
            Tap a Pokémon to open its page.
          </p>
        </div>
      )}

      {!team && !error && !loading && (
        <p className="mt-8 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Pick a game and hit <strong>Randomize team</strong>. You&apos;ll get
          one starter plus five early-route Pokémon with balanced types — a
          fresh party for your next playthrough.
        </p>
      )}
    </div>
  );
}
