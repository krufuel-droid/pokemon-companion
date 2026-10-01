"use client";

import { useState } from "react";
import type { DexEntry } from "@/lib/pokedex";

export function DexEntries({ entries }: { entries: DexEntry[] }) {
  const [selected, setSelected] = useState(0);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No Pokédex entries recorded for this Pokémon yet.
      </p>
    );
  }

  const current: DexEntry = entries[selected] ?? entries[0];

  return (
    <div>
      <label className="block">
        <span className="sr-only">Choose a game</span>
        <select
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-700"
        >
          {entries.map((entry, index) => (
            <option key={entry.game} value={index}>
              {entry.gameLabel}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 max-w-2xl text-slate-700 dark:text-slate-300">{current.text}</p>
    </div>
  );
}
