"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SANDWICH_POWERS, SANDWICH_GUIDE_TIPS } from "@/lib/data/sandwich-guide";

export default function SandwichesPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SANDWICH_POWERS;
    return SANDWICH_POWERS.map((cat) => ({
      ...cat,
      recipes: cat.recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.effect.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.toLowerCase().includes(q))
      ),
    })).filter((cat) => cat.recipes.length > 0);
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
        Sandwich Guide
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Every recipe sorted by what it does — shiny hunting, breeding, raids, and more.
      </p>

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search recipes… (try "dragon" or "egg")'
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-8 space-y-4">
        {filtered.map((cat) => (
          <details
            key={cat.power}
            className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
          >
            <summary className="cursor-pointer list-none px-6 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
              <span className="mr-2 text-2xl">{cat.icon}</span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                {cat.power}
              </span>
              <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                {cat.recipes.length} {cat.recipes.length === 1 ? "recipe" : "recipes"}
              </span>
            </summary>
            <div className="px-6 pb-6">
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                {cat.description}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {cat.recipes.map((r) => (
                  <div
                    key={r.name}
                    className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-100">{r.name}</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      {r.ingredients.map((ing, i) => (
                        <li key={i}>• {ing}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {r.effect}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
          No recipes match your search.
        </p>
      )}

      <section className="mt-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {SANDWICH_GUIDE_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
