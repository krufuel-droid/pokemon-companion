"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  MOVES,
  MOVE_CATEGORIES,
  MOVE_TYPES,
  MOVE_GENS,
  MOVE_SPECIES,
  genLabel,
  type MoveEntry,
  type MoveSpecies,
} from "@/lib/data/moves";
import { typeColor } from "@/lib/theme";

type SortKey = "name" | "type" | "power" | "accuracy" | "pp";

const SORT_LABEL: Record<SortKey, string> = {
  name: "Name (A–Z)",
  type: "Type",
  power: "Power",
  accuracy: "Accuracy",
  pp: "PP",
};

const CATEGORY_BADGE: Record<string, string> = {
  Physical: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Special: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Status: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

const PAGE_SIZE = 50;
const LEARNSET_PREVIEW = 24;

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: typeColor(type) }}
    >
      {type}
    </span>
  );
}

function GenBadge({ gen }: { gen: number | null }) {
  const label = genLabel(gen);
  if (!label) return null;
  return (
    <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
      {label}
    </span>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
      <span className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""} dark:text-slate-500`}
    >
      <path
        d="M5 7l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LearnsetChips({
  move,
  speciesById,
}: {
  move: MoveEntry;
  speciesById: Map<number, MoveSpecies>;
}) {
  const [showAll, setShowAll] = useState(false);
  const species = useMemo(
    () =>
      move.learnedBy
        .map((id) => speciesById.get(id))
        .filter((s): s is MoveSpecies => s !== undefined),
    [move, speciesById]
  );

  if (species.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">No Pokémon listed as learners.</p>;
  }

  const visible = showAll ? species : species.slice(0, LEARNSET_PREVIEW);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((s) => (
          <Link
            key={s.id}
            href={`/pokedex/${s.id}`}
            className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs font-medium text-slate-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-900 dark:hover:text-emerald-100"
          >
            <img
              src={s.sprite}
              alt=""
              width={28}
              height={28}
              loading="lazy"
              className="h-7 w-7"
            />
            {s.name}
          </Link>
        ))}
      </div>
      {species.length > LEARNSET_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
        >
          {showAll ? "Show fewer" : `Show all ${species.length} Pokémon`}
        </button>
      )}
    </div>
  );
}

function MoveRow({
  move,
  speciesById,
}: {
  move: MoveEntry;
  speciesById: Map<number, MoveSpecies>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex w-full items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          <Link
            href={`/moves/${move.id}`}
            className="block truncate font-semibold text-slate-900 hover:text-emerald-700 hover:underline dark:text-slate-100 dark:hover:text-emerald-300"
          >
            {move.name}
          </Link>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={move.type} />
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[move.category]}`}
            >
              {move.category}
            </span>
            <GenBadge gen={move.gen} />
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <StatChip label="Pow" value={move.power === null ? "—" : String(move.power)} />
          <StatChip label="Acc" value={move.accuracy === null ? "—" : String(move.accuracy)} />
          <StatChip label="PP" value={String(move.pp)} />
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? `Collapse ${move.name} details` : `Expand ${move.name} details`}
          className="shrink-0 rounded-lg px-2 py-1 text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-400"
        >
          <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <div className="flex flex-wrap gap-1.5 sm:hidden">
            <StatChip label="Power" value={move.power === null ? "—" : String(move.power)} />
            <StatChip label="Accuracy" value={move.accuracy === null ? "—" : String(move.accuracy)} />
            <StatChip label="PP" value={String(move.pp)} />
            <StatChip label="Priority" value={String(move.priority)} />
          </div>
          <div className="mt-3 hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Priority</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {move.priority > 0 ? `+${move.priority}` : String(move.priority)}
            </p>
          </div>
          {move.shortEffect && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{move.shortEffect}</p>
          )}
          {move.effect && move.effect !== move.shortEffect && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{move.effect}</p>
          )}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Pokémon that learn it
              {move.learnedBy.length > 0 && ` (${move.learnedBy.length})`}
            </p>
            <div className="mt-2">
              <LearnsetChips move={move} speciesById={speciesById} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function compareMoves(a: MoveEntry, b: MoveEntry, sort: SortKey): number {
  switch (sort) {
    case "name":
      return a.name.localeCompare(b.name);
    case "type":
      return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
    case "pp":
      return b.pp - a.pp || a.name.localeCompare(b.name);
    case "power":
      return (b.power ?? -1) - (a.power ?? -1) || a.name.localeCompare(b.name);
    case "accuracy":
      return (b.accuracy ?? -1) - (a.accuracy ?? -1) || a.name.localeCompare(b.name);
  }
}

/** True on narrow (mobile) screens; false during SSR. */
function useIsNarrowScreen(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => window.innerWidth < 640,
    () => false
  );
}

export default function MovesPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [genFilter, setGenFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // null = follow the responsive default (open on desktop, collapsed on
  // mobile); boolean = the user's explicit toggle choice.
  const [filtersChoice, setFiltersChoice] = useState<boolean | null>(null);

  const isNarrow = useIsNarrowScreen();
  const filtersOpen = filtersChoice ?? !isNarrow;

  const speciesById = useMemo(
    () => new Map<number, MoveSpecies>(MOVE_SPECIES.map((s) => [s.id, s])),
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = MOVES.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (genFilter !== "all" && String(m.gen) !== genFilter) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => compareMoves(a, b, sort));
  }, [query, typeFilter, categoryFilter, genFilter, sort]);

  // Reset pagination whenever the result set changes (render-time
  // adjustment, not an effect, so no cascading renders).
  const filterSignature = `${query}|${typeFilter}|${categoryFilter}|${genFilter}|${sort}`;
  const [prevSignature, setPrevSignature] = useState(filterSignature);
  if (prevSignature !== filterSignature) {
    setPrevSignature(filterSignature);
    setVisibleCount(PAGE_SIZE);
  }

  const visible = results.slice(0, visibleCount);

  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (genFilter !== "all" ? 1 : 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Move Database</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {MOVES.length} standard moves. Z-Moves and Max / G-Max moves aren&apos;t listed.
      </p>

      <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <button
          type="button"
          onClick={() => setFiltersChoice((v) => !(v ?? !isNarrow))}
          aria-expanded={filtersOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Search &amp; filters
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                {activeFilterCount} active
              </span>
            )}
          </span>
          <Chevron open={filtersOpen} />
        </button>

        {filtersOpen && (
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search moves…"
              aria-label="Search moves"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Type
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">All types</option>
                  {MOVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Category
                </span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">All categories</option>
                  {MOVE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Generation
                </span>
                <select
                  value={genFilter}
                  onChange={(e) => setGenFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">All generations</option>
                  {MOVE_GENS.map((g) => (
                    <option key={g} value={String(g)}>
                      {genLabel(g)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Sort by
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400" role="status">
        Showing {visible.length} of {results.length}{" "}
        {results.length === 1 ? "move" : "moves"}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">No moves match your filters.</p>
        </div>
      ) : (
        <>
          <ul className="mt-2 space-y-2">
            {visible.map((m) => (
              <MoveRow key={m.id} move={m} speciesById={speciesById} />
            ))}
          </ul>
          {visibleCount < results.length && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-500"
              >
                Load more ({results.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
