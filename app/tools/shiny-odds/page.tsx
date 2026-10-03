"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const SHINY_METHODS = [
  { label: "Base odds (Gen 6+)", odds: 4096 },
  { label: "Base odds (Gen 2–5)", odds: 8192 },
  { label: "Shiny Charm (Gen 6+)", odds: 1365 },
  { label: "Masuda Method", odds: 683 },
  { label: "Masuda + Shiny Charm", odds: 512 },
  { label: "Outbreak 60+ KO (S/V)", odds: 2048 },
  { label: "Outbreak 60+ KO + Charm (S/V)", odds: 1024 },
  { label: "Outbreak + Sparkling sandwich (S/V)", odds: 1024 },
  { label: "Outbreak + Sandwich + Charm (S/V)", odds: 512 },
  { label: "SOS chain 30+ (S/M)", odds: 1024 },
  { label: "SOS chain 70+ + Charm (US/UM)", odds: 273 },
  { label: "Chain fishing 20+ (X/Y)", odds: 100 },
  { label: "Dynamax Adventures (legendary)", odds: 100 },
  { label: "Ultra Wormhole far (US/UM)", odds: 25 },
];

export default function ShinyOddsCalculator() {
  const [spawnRate, setSpawnRate] = useState("20");
  const [methodIdx, setMethodIdx] = useState(0);
  const [encounters, setEncounters] = useState("500");

  const calc = useMemo(() => {
    const spawn = Math.min(100, Math.max(0.01, parseFloat(spawnRate) || 0)) / 100;
    const shinyOdds = SHINY_METHODS[methodIdx].odds;
    const perEncounter = spawn * (1 / shinyOdds);
    const oneIn = perEncounter > 0 ? Math.round(1 / perEncounter) : 0;
    const n = Math.max(1, parseInt(encounters) || 1);
    const cumulative = 1 - Math.pow(1 - perEncounter, n);
    const expected = perEncounter > 0 ? Math.round(1 / perEncounter) : 0;
    return { spawn, shinyOdds, perEncounter, oneIn, cumulative, expected, n };
  }, [spawnRate, methodIdx, encounters]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/tools"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All tools
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Calculator
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Shiny Odds Calculator
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Combine a Pokémon&apos;s spawn rate with your shiny hunting method to get
        the real odds per encounter.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div>
          <label htmlFor="spawn" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Spawn rate (% of encounters)
          </label>
          <input
            id="spawn"
            type="number"
            min="0.01"
            max="100"
            step="any"
            value={spawnRate}
            onChange={(e) => setSpawnRate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-400">
            What % of wild encounters are this species? Check the encounter tables on its Pokédex page.
          </p>
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Shiny hunting method
          </label>
          <select
            id="method"
            value={methodIdx}
            onChange={(e) => setMethodIdx(parseInt(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {SHINY_METHODS.map((m, i) => (
              <option key={m.label} value={i}>
                {m.label} (1/{m.odds})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl bg-emerald-50 p-5 dark:bg-emerald-950">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Odds per encounter
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            1 in {calc.oneIn.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            That&apos;s a {(calc.spawn * 100).toFixed(1)}% spawn rate × 1/{calc.shinyOdds} shiny odds.
            On average you&apos;d need ~{calc.expected.toLocaleString()} encounters.
          </p>
        </div>

        <div>
          <label htmlFor="enc" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            After how many encounters?
          </label>
          <input
            id="enc"
            type="number"
            min="1"
            value={encounters}
            onChange={(e) => setEncounters(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="mt-3">
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
                style={{ width: `${Math.min(100, calc.cumulative * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(calc.cumulative * 100).toFixed(1)}%
              </span>{" "}
              chance of finding at least one shiny in {calc.n.toLocaleString()} encounters.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/shiny-hunts" className="font-semibold text-emerald-600 underline underline-offset-2 dark:text-emerald-400">
          Track your hunts →
        </Link>
      </p>
    </div>
  );
}
