"use client";

import { useMemo, useState } from "react";
import { TYPE_COLORS } from "@/lib/theme";
import {
  searchSpecies,
  type SpeciesIndex,
} from "@/lib/pokedex";

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800";
export const labelCls =
  "block text-sm font-medium text-slate-600 dark:text-slate-400";
export const sectionCls =
  "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700";
export const NONE = "—";

export function TypePill({ type }: { type: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: TYPE_COLORS[type] ?? "#A8A77A" }}
    >
      {type}
    </span>
  );
}

export function SpeciesPicker({
  label,
  species,
  onPick,
}: {
  label: string;
  species: SpeciesIndex | null;
  onPick: (s: SpeciesIndex | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchSpecies(query), [query]);

  return (
    <div className="relative">
      <span className={labelCls}>{label}</span>
      {species ? (
        <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600">
          <img
            src={species.sprites.regular}
            alt={species.name}
            className="h-10 w-10 object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {species.name}
            </div>
            <div className="flex gap-1">
              {species.types.map((t) => (
                <TypePill key={t} type={t} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
              onPick(null);
            }}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label={`Clear ${label}`}
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          className={`${inputCls} mt-1`}
          placeholder="Search a Pokémon…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      )}
      {open && !species && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onPick(s);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <img
                  src={s.sprites.regular}
                  alt=""
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm text-slate-800 dark:text-slate-100">
                  {s.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
