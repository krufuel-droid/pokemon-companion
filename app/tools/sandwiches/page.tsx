"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SANDWICH_RECIPES, SANDWICH_TIPS } from "@/lib/data/sandwiches";

const TYPE_COLORS: Record<string, string> = {
  Normal: "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-200",
  Fire: "bg-orange-200 text-orange-900 dark:bg-orange-900 dark:text-orange-200",
  Water: "bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200",
  Electric: "bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200",
  Grass: "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200",
  Ice: "bg-cyan-200 text-cyan-900 dark:bg-cyan-900 dark:text-cyan-200",
  Fighting: "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200",
  Poison: "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200",
  Ground: "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200",
  Flying: "bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-200",
  Psychic: "bg-pink-200 text-pink-900 dark:bg-pink-900 dark:text-pink-200",
  Bug: "bg-lime-200 text-lime-900 dark:bg-lime-900 dark:text-lime-200",
  Rock: "bg-yellow-700/20 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200",
  Ghost: "bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200",
  Dragon: "bg-violet-300 text-violet-900 dark:bg-violet-900 dark:text-violet-200",
  Dark: "bg-neutral-700 text-neutral-100 dark:bg-neutral-800 dark:text-neutral-200",
  Steel: "bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
  Fairy: "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200",
};

export default function SandwichesPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SANDWICH_RECIPES;
    return SANDWICH_RECIPES.filter((r) => r.type.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link
        href="/tools"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All tools
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Scarlet & Violet
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Shiny Sandwich Recipes
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Sparkling Power Lv. 3 sandwiches for every type — each also gives
        Encounter Power Lv. 3 and Title Power Lv. 3.
      </p>

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by type… (try &quot;dragon&quot;)"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <div
            key={r.type}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
          >
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${TYPE_COLORS[r.type] ?? "bg-slate-200"}`}
            >
              {r.type}
            </span>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
              <li>
                <span className="font-semibold">1×</span> {r.ingredient}
              </li>
              <li>
                <span className="font-semibold">1×</span> {r.herba1} Herba Mystica
              </li>
              <li>
                <span className="font-semibold">1×</span> {r.herba2} Herba Mystica
              </li>
            </ul>
            <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              ✨ Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3
            </p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {SANDWICH_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
