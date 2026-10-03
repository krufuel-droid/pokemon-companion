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

const CATEGORY_ORDER: ItemCategory[] = [
  "mega-stone",
  "evolution-stone",
  "evolution-item",
  "battle-item",
  "mint",
  "ability-item",
];

const CATEGORY_BADGE: Record<ItemCategory, string> = {
  "mega-stone": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "evolution-stone": "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  "evolution-item": "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "battle-item": "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  "mint": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  "ability-item": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

function ItemRow({ item }: { item: ItemEntry }) {
  const [open, setOpen] = useState(false);
  const pokemonIds = useMemo(() => getItemPokemonIds(item), [item]);

  return (
    <li className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">
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
          className="text-lg font-bold text-slate-400 dark:text-slate-500"
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Where to find
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.obtain}</p>
          </div>

          {pokemonIds.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Works on
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {pokemonIds.map((id) => (
                  <Link
                    key={id}
                    href={`/pokedex/${id}`}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-emerald-200 dark:bg-emerald-900 dark:text-slate-300 dark:hover:bg-emerald-800"
                  >
                    #{id} {getSpeciesName(id)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Found in
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {item.games.join(" · ")}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

function CategorySection({
  category,
  items,
  forceOpen,
  defaultOpen,
}: {
  category: ItemCategory;
  items: ItemEntry[];
  forceOpen: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const expanded = forceOpen || open;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <span className="flex-1">
          <span className="block text-lg font-bold text-slate-900 dark:text-slate-100">
            {CATEGORY_LABEL[category]}
          </span>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[category]}`}
          >
            {items.length} item{items.length === 1 ? "" : "s"}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`text-xl font-bold text-slate-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <ul className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          {items.map((item) => (
            <ItemRow key={item.name} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ItemsPage() {
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_ORDER.map((category) => {
      const items = ITEMS.filter((item) => {
        if (item.category !== category) return false;
        if (q.length === 0) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.pokemon.some((p) => p.toLowerCase().includes(q))
        );
      });
      return { category, items };
    }).filter((g) => !searching || g.items.length > 0);
  }, [query, searching]);

  const total = grouped.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Items
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Mega Stones, evolution stones, evolution items, and battle-ready held
          items — with the Pokémon each one works on and where to find them.
        </p>

        <div className="mt-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or Pokémon…"
            aria-label="Search items"
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-900 dark:placeholder:text-slate-500"
          />
        </div>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {total} item{total === 1 ? "" : "s"}
          {searching ? " match your search" : " across 4 categories"}
        </p>

        <div className="mt-3 space-y-4">
          {grouped.map(({ category, items }) => (
            <CategorySection
              key={category}
              category={category}
              items={items}
              forceOpen={searching}
              defaultOpen={false}
            />
          ))}
        </div>

        {total === 0 && (
          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No items match your search.
          </p>
        )}
      </div>
    </main>
  );
}
