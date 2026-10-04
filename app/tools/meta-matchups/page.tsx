"use client";

import { useMemo, useState } from "react";
import { effectiveness } from "@/lib/typechart";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { META_PICKS } from "@/lib/data/champions";
import { TYPE_COLORS } from "@/lib/theme";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface MatrixMon {
  label: string;
  types: string[];
  sprite: string;
  id: number;
}

/** Resolve the 12 meta picks to typing + sprite, preferring form data. */
function buildMatrix(): MatrixMon[] {
  const out: MatrixMon[] = [];
  for (const pick of META_PICKS.slice(0, 12)) {
    const baseName = pick.speciesName ?? pick.name;
    const hits = searchSpecies(baseName);
    const base =
      hits.find((h) => h.name.toLowerCase() === baseName.toLowerCase()) ??
      hits[0];
    if (!base) continue;
    const form = getFormsForSpecies(base.id).find(
      (f) => f.formName.toLowerCase() === pick.name.toLowerCase(),
    );
    out.push({
      label: pick.name,
      types: (form?.types?.map(cap) ?? base.types) as string[],
      sprite: form?.sprite ?? base.sprites.regular,
      id: base.id,
    });
  }
  return out;
}

type Verdict = "mirror" | "favorable" | "even" | "unfavorable";

interface CellInfo {
  verdict: Verdict;
  /** Best STAB multiplier the row mon lands on the column mon. */
  off: number;
  offType: string;
  /** Best STAB multiplier the column mon lands back. */
  back: number;
  backType: string;
}

function cellInfo(a: MatrixMon, d: MatrixMon): CellInfo {
  let off = 0;
  let offType = a.types[0] ?? "Normal";
  for (const t of a.types) {
    const m = effectiveness(t, d.types);
    if (m > off) {
      off = m;
      offType = t;
    }
  }
  let back = 0;
  let backType = d.types[0] ?? "Normal";
  for (const t of d.types) {
    const m = effectiveness(t, a.types);
    if (m > back) {
      back = m;
      backType = t;
    }
  }
  let verdict: Verdict = "even";
  if (off > 1 && back <= 1) verdict = "favorable";
  else if (back > 1 && off <= 1) verdict = "unfavorable";
  return { verdict, off, offType, back, backType };
}

const CELL_STYLE: Record<Verdict, string> = {
  mirror: "bg-slate-200 dark:bg-slate-700",
  favorable: "bg-emerald-100 dark:bg-emerald-900",
  even: "bg-amber-50 dark:bg-amber-950",
  unfavorable: "bg-red-100 dark:bg-red-900",
};

const CELL_DOT: Record<Verdict, string> = {
  mirror: "bg-slate-400",
  favorable: "bg-emerald-500",
  even: "bg-amber-400",
  unfavorable: "bg-red-500",
};

export default function MetaMatchupsPage() {
  const mons = useMemo(buildMatrix, []);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);

  const detail = useMemo(() => {
    if (!sel) return null;
    const a = mons[sel.r];
    const d = mons[sel.c];
    if (!a || !d) return null;
    return { a, d, info: cellInfo(a, d) };
  }, [sel, mons]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Meta Matchup Matrix
      </h1>
      <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">
        The 12 most-used Regulation M-C Pokémon, attacker rows × defender
        columns. Each cell compares STAB types both ways — tap any cell for the
        breakdown.
      </p>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        {(
          [
            ["favorable", "Favorable — my STAB hits SE, theirs doesn't"],
            ["even", "Even — neither side has the edge"],
            ["unfavorable", "Unfavorable — their STAB hits SE, mine doesn't"],
          ] as Array<[Verdict, string]>
        ).map(([v, label]) => (
          <span key={v} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${CELL_DOT[v]}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-28 bg-white p-2 dark:bg-slate-900" />
              {mons.map((d, c) => (
                <th key={d.label} className="p-1">
                  <div className="flex w-14 flex-col items-center">
                    <img
                      src={d.sprite}
                      alt={d.label}
                      loading="lazy"
                      className="h-10 w-10 object-contain"
                      title={d.label}
                    />
                    <span className="mt-0.5 line-clamp-2 text-center text-[9px] font-semibold leading-tight text-slate-600 dark:text-slate-400">
                      {d.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mons.map((a, r) => (
              <tr key={a.label}>
                <th className="sticky left-0 z-10 bg-white p-1 dark:bg-slate-900">
                  <div className="flex w-28 items-center gap-1.5">
                    <img
                      src={a.sprite}
                      alt={a.label}
                      loading="lazy"
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <span className="truncate text-left text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                      {a.label}
                    </span>
                  </div>
                </th>
                {mons.map((d, c) => {
                  const info =
                    r === c
                      ? { verdict: "mirror" as Verdict, off: 1, offType: "", back: 1, backType: "" }
                      : cellInfo(a, d);
                  const active = sel?.r === r && sel?.c === c;
                  return (
                    <td key={d.label} className="p-0.5">
                      <button
                        type="button"
                        onClick={() => setSel(active ? null : { r, c })}
                        aria-label={`${a.label} vs ${d.label}: ${info.verdict}`}
                        className={`flex h-12 w-14 items-center justify-center rounded-lg ring-2 transition ${CELL_STYLE[info.verdict]} ${
                          active
                            ? "ring-indigo-500"
                            : "ring-transparent hover:ring-indigo-300"
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${CELL_DOT[info.verdict]}`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && detail.info.verdict !== "mirror" && (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex items-center gap-3">
            <img src={detail.a.sprite} alt={detail.a.label} className="h-12 w-12 object-contain" />
            <span className="text-lg font-bold text-slate-400">vs</span>
            <img src={detail.d.sprite} alt={detail.d.label} className="h-12 w-12 object-contain" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {detail.a.label} vs {detail.d.label}
            </h2>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <span
                className="mr-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: TYPE_COLORS[detail.info.offType] ?? "#A8A77A" }}
              >
                {detail.info.offType}
              </span>
              {detail.a.label}'s best STAB hits {detail.d.label} for{" "}
              <strong>×{detail.info.off}</strong>.
            </li>
            <li>
              <span
                className="mr-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: TYPE_COLORS[detail.info.backType] ?? "#A8A77A" }}
              >
                {detail.info.backType}
              </span>
              {detail.d.label} hits back with {detail.info.backType} for{" "}
              <strong>×{detail.info.back}</strong>.
            </li>
          </ul>
          <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {detail.info.verdict === "favorable" &&
              `Favorable for ${detail.a.label} — it threatens super-effectively while resisting the return fire.`}
            {detail.info.verdict === "unfavorable" &&
              `Unfavorable for ${detail.a.label} — ${detail.d.label} lands the super-effective hits here.`}
            {detail.info.verdict === "even" &&
              "Even — neither side holds a clear type advantage."}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Type-based only — movesets, abilities, items, Tera types, and stats
        aren't factored in. Typing comes from Pokédex + form data
        {mons.some((m) => m.label === "Hisuian Arcanine")
          ? " (Hisuian Arcanine uses its Fire/Rock form typing)"
          : ""}
        ; Eternal Flower Floette falls back to base Fairy typing.
      </p>
    </div>
  );
}
