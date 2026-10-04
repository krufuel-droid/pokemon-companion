"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { effectiveness } from "@/lib/typechart";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { META_PICKS } from "@/lib/data/champions";
import { MOVES, type MoveEntry } from "@/lib/data/moves";
import { SpeciesPicker, TypePill } from "../_components/species-picker";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface MetaMon {
  label: string;
  types: string[];
  sprite: string;
}

/** Resolve the 12 meta picks to typing + sprite, preferring form data. */
function buildMetaMons(): MetaMon[] {
  const out: MetaMon[] = [];
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
    });
  }
  return out;
}

const META_MONS: MetaMon[] = buildMetaMons();

interface Hit {
  label: string;
  mult: number;
}

interface ScoredMove {
  move: MoveEntry;
  score: number;
  hits: Hit[];
}

function scoreMoves(speciesId: number): ScoredMove[] {
  const learnable = MOVES.filter(
    (m) =>
      m.category !== "Status" && m.power !== null && m.learnedBy.includes(speciesId),
  );
  const scored: ScoredMove[] = learnable.map((move) => {
    const hits: Hit[] = [];
    let score = 0;
    for (const mm of META_MONS) {
      const mult = effectiveness(move.type, mm.types);
      if (mult >= 4) {
        score += 2;
        hits.push({ label: mm.label, mult });
      } else if (mult === 2) {
        score += 1;
        hits.push({ label: mm.label, mult });
      }
    }
    return { move, score, hits };
  });
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.move.power ?? 0) - (a.move.power ?? 0) ||
      a.move.name.localeCompare(b.move.name),
  );
  return scored;
}

/** Greedy set cover: iteratively add the move hitting the most new SE targets. */
function bestCombo(scored: ScoredMove[], k = 4): { moves: ScoredMove[]; covered: number } {
  const covered = new Set<string>();
  const chosen: ScoredMove[] = [];
  const remaining = [...scored];
  for (let i = 0; i < k && remaining.length > 0; i++) {
    let best: ScoredMove | null = null;
    let bestNew = -1;
    for (const s of remaining) {
      const fresh = s.hits.filter((h) => !covered.has(h.label)).length;
      if (fresh > bestNew) {
        bestNew = fresh;
        best = s;
      }
    }
    if (!best || bestNew === 0) break;
    chosen.push(best);
    for (const h of best.hits) covered.add(h.label);
    remaining.splice(remaining.indexOf(best), 1);
  }
  return { moves: chosen, covered: covered.size };
}

const CATEGORY_STYLES: Record<string, string> = {
  Physical: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  Special: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
};

export default function MoveCoveragePage() {
  const [mon, setMon] = useState<SpeciesIndex | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const pickMon = (s: SpeciesIndex) => {
    setMon(s);
    setExpanded(null);
  };

  const scored = useMemo(() => (mon ? scoreMoves(mon.id) : []), [mon]);
  const combo = useMemo(() => bestCombo(scored), [scored]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Move Coverage Ranker
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick a Pokémon — every damaging move it learns, ranked by
        super-effective coverage against the 12 meta staples.
      </p>

      <div className="mt-6 max-w-md">
        <SpeciesPicker
          onPick={pickMon}
          placeholder="Search for your Pokémon…"
          label="Pokémon"
        />
      </div>

      {!mon ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">🥊</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Pick a Pokémon above — try{" "}
            <span className="font-semibold">Gholdengo</span> or{" "}
            <span className="font-semibold">Sneasler</span>.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            {mon.sprites.regular && (
              <img
                src={mon.sprites.regular}
                alt={mon.name}
                className="h-16 w-16 object-contain"
              />
            )}
            <div>
              <Link
                href={`/pokedex/${mon.slug}`}
                className="text-xl font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-100"
              >
                {mon.name}
              </Link>
              <div className="mt-1 flex gap-1">
                {mon.types.map((t) => (
                  <TypePill key={t} type={t} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {scored.length} damaging moves in its learnset
              </p>
            </div>
          </div>

          {combo.moves.length > 0 && (
            <div className="mt-6 rounded-2xl bg-emerald-50/70 p-4 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-800">
              <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Best {combo.moves.length}-move combo
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {combo.moves.map((s) => (
                  <span
                    key={s.move.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700"
                  >
                    <TypePill type={s.move.type} />
                    {s.move.name}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Hits{" "}
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {combo.covered}/{META_MONS.length}
                </span>{" "}
                meta staples super-effectively.
              </p>
            </div>
          )}

          <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100">
            Ranked moves
          </h2>
          {scored.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              No damaging moves found in this Pokémon&apos;s learnset data.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {scored.map((s, i) => {
                const isOpen = expanded === s.move.name;
                return (
                  <div
                    key={s.move.id}
                    className={`rounded-2xl shadow-sm ring-1 ${
                      i < 5
                        ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-800"
                        : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.move.name)}
                      className="flex w-full items-center gap-3 p-4 text-left"
                    >
                      {i < 5 && (
                        <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                          #{i + 1}
                        </span>
                      )}
                      <TypePill type={s.move.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {s.move.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_STYLES[s.move.category] ?? ""}`}
                          >
                            {s.move.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {s.move.power} power
                            {s.move.accuracy !== null &&
                              ` · ${s.move.accuracy}% acc`}
                            {s.move.priority > 0 &&
                              ` · +${s.move.priority} priority`}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          {s.hits.length > 0 ? (
                            <>
                              SE vs{" "}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {s.hits.length}/{META_MONS.length}
                              </span>{" "}
                              — {s.hits.map((h) => h.label).join(", ")}
                            </>
                          ) : (
                            "No super-effective hits on the meta 12"
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-slate-500 dark:text-slate-400">
                        {s.score} pts
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {isOpen ? "▾" : "▸"}
                      </span>
                    </button>
                    {isOpen && s.hits.length > 0 && (
                      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                        <div className="flex flex-wrap gap-2">
                          {s.hits.map((h) => (
                            <span
                              key={h.label}
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                h.mult >= 4
                                  ? "bg-emerald-100 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-700"
                                  : "bg-white text-slate-600 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                              }`}
                            >
                              {h.label}
                              {h.mult >= 4 && " (4x!)"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
        <span className="font-bold">Honest limitations:</span> coverage only —
        2x counts 1 point, 4x counts 2. This doesn&apos;t account for accuracy,
        priority, secondary effects, or whether the move fits the set (a
        special attacker won&apos;t want a physical move). Status and
        variable-power moves are excluded. Meta typings from the current
        Regulation M-C snapshot.
      </div>
    </main>
  );
}
