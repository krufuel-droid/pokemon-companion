"use client";

import { useMemo, useState } from "react";
import { MOVES, MOVE_CATEGORIES, MOVE_TYPES, type MoveEntry } from "@/lib/data/moves";
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
  Physical: "bg-orange-100 text-orange-800",
  Special: "bg-indigo-100 text-indigo-800",
  Status: "bg-slate-200 text-slate-700",
};

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

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs">
      <span className="font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-bold text-slate-800">{value}</span>
    </span>
  );
}

function MoveRow({ move }: { move: MoveEntry }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900">{move.name}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={move.type} />
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[move.category]}`}
            >
              {move.category}
            </span>
          </span>
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <StatChip label="Pow" value={move.power === null ? "—" : String(move.power)} />
          <StatChip label="Acc" value={move.accuracy === null ? "—" : String(move.accuracy)} />
          <StatChip label="PP" value={String(move.pp)} />
        </span>
        <span aria-hidden="true" className="text-lg font-bold text-slate-400">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <div className="flex flex-wrap gap-1.5 sm:hidden">
            <StatChip label="Power" value={move.power === null ? "—" : String(move.power)} />
            <StatChip label="Accuracy" value={move.accuracy === null ? "—" : String(move.accuracy)} />
            <StatChip label="PP" value={String(move.pp)} />
            <StatChip label="Priority" value={String(move.priority)} />
          </div>
          <div className="mt-3 hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {move.priority > 0 ? `+${move.priority}` : String(move.priority)}
            </p>
          </div>
          {move.shortEffect && (
            <p className="mt-3 text-sm text-slate-600">{move.shortEffect}</p>
          )}
          {move.effect && move.effect !== move.shortEffect && (
            <p className="mt-2 text-sm text-slate-500">{move.effect}</p>
          )}
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

export default function MovesPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("name");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = MOVES.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => compareMoves(a, b, sort));
  }, [query, typeFilter, categoryFilter, sort]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Move Database</h1>
      <p className="mt-2 text-sm text-slate-500">
        {MOVES.length} standard moves. Z-Moves and Max / G-Max moves aren&apos;t listed.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search moves…"
          aria-label="Search moves"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none"
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Type
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none"
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Category
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none"
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sort by
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-mint focus:outline-none"
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

      <p className="mt-4 text-sm text-slate-500" role="status">
        {results.length} {results.length === 1 ? "move" : "moves"}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">No moves match your filters.</p>
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {results.map((m) => (
            <MoveRow key={m.id} move={m} />
          ))}
        </ul>
      )}
    </main>
  );
}
