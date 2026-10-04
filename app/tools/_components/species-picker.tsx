"use client";

import { useMemo, useState } from "react";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { TYPE_COLORS } from "@/lib/theme";

export function TypePill({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${className}`}
      style={{ backgroundColor: TYPE_COLORS[type] ?? "#A8A77A" }}
    >
      {type}
    </span>
  );
}

/** Search-as-you-type species picker with sprite + type dropdown. */
export function SpeciesPicker({
  onPick,
  excludeIds = [],
  placeholder = "Search for a Pokémon…",
  label,
}: {
  onPick: (s: SpeciesIndex) => void;
  excludeIds?: number[];
  placeholder?: string;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return searchSpecies(q)
      .filter((s) => !excludeIds.includes(s.id))
      .slice(0, 8);
  }, [query, excludeIds]);

  return (
    <div className="relative">
      {label && (
        <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </span>
      )}
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(p);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {p.sprites.regular && (
                <img
                  src={p.sprites.regular}
                  alt={p.name}
                  className="h-10 w-10 object-contain"
                />
              )}
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {p.name}
              </span>
              <span className="ml-auto flex gap-1">
                {p.types.map((t) => (
                  <TypePill key={t} type={t} />
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
