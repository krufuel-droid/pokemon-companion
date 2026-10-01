"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ITEMS,
  CATEGORY_LABEL,
  getItemPokemonIds,
  getSpeciesName,
  type ItemCategory,
  type ItemEntry,
} from "@/lib/data/items";

const CATEGORY_BADGE: Record<ItemCategory, string> = {
  "mega-stone": "bg-amber-100 text-amber-800",
  "evolution-stone": "bg-sky-100 text-sky-800",
  "evolution-item": "bg-violet-100 text-violet-800",
};

function ItemRow({ item }: { item: ItemEntry }) {
  const [open, setOpen] = useState(false);
  const pokemonIds = useMemo(() => getItemPokemonIds(item), [item]);

  return (
    <li className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900">
            {item.name}
          </span>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[item.category]}`}
          >
            {CATEGORY_LABEL[item.category]}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-lg font-bold text-slate-400"
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <p className="text-sm text-slate-600">{item.description}</p>

          {pokemonIds.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Works on
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pokemonIds.map((id) => (
                  <Link
                    key={id}
                    href={`/pokedex/${id}`}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-emerald-200"
                  >
                    #{id} {getSpeciesName(id)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Found in
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {item.games.join(" · ")}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

const FILTERS: Array<{ value: ItemCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "mega-stone", label: "Mega Stones" },
  { value: "evolution-stone", label: "Evolution Stones" },
  { value: "evolution-item", label: "Evolution Items" },
];

export default function ItemsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ItemCategory | "all">("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (q.length === 0) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.pokemon.some((p) => p.toLowerCase().includes(q))
      );
    });
  }, [query, filter]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Items
        </h1>
        <p className="mt-2 text-slate-600">
          Mega Stones, evolution stones, and other notable evolution items —
          with the Pokémon each one works on.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or Pokémon…"
            aria-label="Search items"
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-400"
          />
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by category"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  filter === f.value
                    ? "bg-emerald-300 text-slate-800"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {results.length} item{results.length === 1 ? "" : "s"}
        </p>

        <ul className="mt-3 space-y-3">
          {results.map((item) => (
            <ItemRow key={item.name} item={item} />
          ))}
        </ul>

        {results.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500">
            No items match your search.
          </p>
        )}
      </div>
    </main>
  );
}
