"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { TYPES, effectiveness } from "@/lib/typechart";
import { TYPE_COLORS } from "@/lib/theme";
import { MOVES, type MoveEntry } from "@/lib/data/moves";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";

interface TeamMember {
  species: SpeciesIndex;
  moves: MoveEntry[];
}

interface CoverageSource {
  pokemon: string;
  move: MoveEntry;
}

function TypePill({ type, dimmed = false }: { type: string; dimmed?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-center text-xs font-bold text-white ${dimmed ? "opacity-30 grayscale" : ""}`}
      style={{ backgroundColor: TYPE_COLORS[type] ?? "#A8A77A" }}
    >
      {type}
    </span>
  );
}

function SpeciesPicker({ excludeIds, onPick }: { excludeIds: number[]; onPick: (p: SpeciesIndex) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => (query.trim() ? searchSpecies(query.trim()).slice(0, 8) : []),
    [query]
  );
  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a Pokémon to add…"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          {results.map((p) => {
            const already = excludeIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  onPick(p);
                  setQuery("");
                }}
                disabled={already}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 disabled:opacity-40 dark:hover:bg-slate-800"
              >
                {p.sprites.regular && <img src={p.sprites.regular} alt={p.name} className="h-10 w-10" />}
                <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                <span className="ml-auto flex gap-1">
                  {p.types.map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[t] ?? "#A8A77A" }}>
                      {t}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MoveSlotPicker({ excludeIds, onPick }: { excludeIds: number[]; onPick: (m: MoveEntry) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOVES.filter((m) => m.name.toLowerCase().includes(q) && !excludeIds.includes(m.id)).slice(0, 8);
  }, [query, excludeIds]);
  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search moves…"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {results.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-600">
          {results.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onPick(m);
                setQuery("");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.name}</span>
              <span className="ml-auto flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{m.category}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: TYPE_COLORS[m.type] ?? "#A8A77A" }}
                >
                  {m.type}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Attack types that hit `def` super-effectively — used for gap suggestions. */
function suggestedAttackers(def: string): string[] {
  return TYPES.filter((atk) => effectiveness(atk, [def]) > 1);
}

function resultCardClass(best: number): string {
  const base =
    "rounded-xl bg-white p-3 shadow-sm ring-1 dark:bg-slate-900 ";
  if (best >= 2) return base + "ring-emerald-300 dark:ring-emerald-800";
  if (best === 0.5) return base + "ring-amber-300 dark:ring-amber-800";
  if (best === 0) return base + "ring-slate-200 dark:ring-slate-700 opacity-70";
  return base + "ring-slate-200 dark:ring-slate-700";
}

function bestLabel(best: number): string {
  if (best >= 2) return "2× best";
  if (best === 1) return "1× best";
  if (best === 0.5) return "½× best";
  return "No effect";
}

export default function CoveragePage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const achievementFiredRef = useRef(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user?: { id?: string } | null } }) => {
        userIdRef.current = data.user?.id ?? null;
      });
  }, []);

  const coverage = useMemo(() => {
    return TYPES.map((def) => {
      let best = 0;
      const sources: CoverageSource[] = [];
      for (const member of team) {
        for (const mv of member.moves) {
          const mult = effectiveness(mv.type, [def]);
          if (mult > best) {
            best = mult;
            sources.length = 0;
            sources.push({ pokemon: member.species.name, move: mv });
          } else if (mult === best && best > 0 && sources.length < 3) {
            sources.push({ pokemon: member.species.name, move: mv });
          }
        }
      }
      return { def, best, sources };
    });
  }, [team]);

  const score = coverage.filter((c) => c.best >= 2).length;
  const gaps = coverage.filter((c) => c.best < 2);
  const hasMoves = team.some((m) => m.moves.length > 0);

  // Fire "coverage-pro" once a full 6-Pokémon team with ≥1 move each is analyzed.
  useEffect(() => {
    const full = team.length === 6 && team.every((m) => m.moves.length >= 1);
    const uid = userIdRef.current;
    if (full && uid && !achievementFiredRef.current) {
      achievementFiredRef.current = true;
      unlockAchievement(uid, "coverage-pro")
        .then((unlocked) => {
          if (unlocked) setNotice("⚔️ Achievement unlocked: Coverage Pro");
        })
        .catch(() => {});
    }
  }, [team]);

  const addPokemon = (p: SpeciesIndex) => {
    if (team.length >= 6 || team.some((m) => m.species.id === p.id)) return;
    setTeam([...team, { species: p, moves: [] }]);
  };

  const removePokemon = (id: number) => setTeam(team.filter((m) => m.species.id !== id));

  const addMove = (speciesId: number, move: MoveEntry) => {
    setTeam(
      team.map((m) =>
        m.species.id === speciesId && m.moves.length < 4 && !m.moves.some((x) => x.id === move.id)
          ? { ...m, moves: [...m.moves, move] }
          : m
      )
    );
  };

  const removeMove = (speciesId: number, moveId: number) => {
    setTeam(
      team.map((m) =>
        m.species.id === speciesId ? { ...m, moves: m.moves.filter((x) => x.id !== moveId) } : m
      )
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Team Coverage Analyzer</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Build a team of up to 6 Pokémon, give each one moves, and see which of the 18 types
        your team can hit hard — the offensive mirror of the{" "}
        <Link href="/tools/team-weakness" className="text-emerald-600 underline dark:text-emerald-400">
          Team Weakness Analyzer
        </Link>
        .
      </p>

      {notice && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
          {notice}
        </div>
      )}

      <div className="mt-6">
        <SpeciesPicker excludeIds={team.map((m) => m.species.id)} onPick={addPokemon} />
      </div>

      {team.length > 0 && (
        <div className="mt-6 space-y-3">
          {team.map((member, i) => (
            <details
              key={member.species.id}
              open={i === 0}
              className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="mr-1 inline-block text-slate-400 transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
                {member.species.sprites.regular && (
                  <img src={member.species.sprites.regular} alt={member.species.name} className="h-10 w-10" />
                )}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{member.species.name}</span>
                <span className="hidden gap-1 sm:flex">
                  {member.species.types.map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[t] ?? "#A8A77A" }}>
                      {t}
                    </span>
                  ))}
                </span>
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {member.moves.length}/4 moves
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removePokemon(member.species.id);
                  }}
                  className="shrink-0 text-slate-400 hover:text-rose-500"
                  aria-label={`Remove ${member.species.name}`}
                >
                  ✕
                </button>
              </summary>
              <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
                <div className="grid gap-2 sm:grid-cols-2">
                  {member.moves.map((mv) => (
                    <div key={mv.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{mv.name}</span>
                      <span className="ml-auto flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">{mv.category}</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: TYPE_COLORS[mv.type] ?? "#A8A77A" }}
                        >
                          {mv.type}
                        </span>
                      </span>
                      <button
                        onClick={() => removeMove(member.species.id, mv.id)}
                        className="text-slate-400 hover:text-rose-500"
                        aria-label={`Remove ${mv.name}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {member.moves.length < 4 && (
                    <MoveSlotPicker
                      excludeIds={member.moves.map((m) => m.id)}
                      onPick={(mv) => addMove(member.species.id, mv)}
                    />
                  )}
                </div>
                {member.moves.length === 0 && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    Add at least one move — its type is what counts for coverage.
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {team.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">⚔️</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Add some Pokémon, give them moves, and we&apos;ll grade your team&apos;s offensive coverage.
          </p>
        </div>
      ) : !hasMoves ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">📝</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Open a Pokémon above and add at least one move to see your coverage.
          </p>
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200">Coverage score</h2>
          <div className="mt-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {score}
              <span className="text-base font-medium text-slate-400">/18</span>{" "}
              <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                types hit super-effectively
              </span>
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{ width: `${(score / 18) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Super-effective</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />Neutral</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Resisted</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-500" />No effect</span>
            </div>
          </div>

          {gaps.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900">
              <h2 className="text-lg font-bold text-amber-700 dark:text-amber-300">🔍 Coverage gaps</h2>
              <div className="mt-3 space-y-3">
                {gaps.map(({ def, best }) => (
                  <div key={def} className="flex flex-wrap items-center gap-2">
                    <TypePill type={def} />
                    <span className="text-sm text-amber-800 dark:text-amber-200">
                      {best === 0
                        ? "Nothing on your team can hit this type at all."
                        : "Nothing hits this type super-effectively."}
                    </span>
                    <span className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      Try adding:
                      {suggestedAttackers(def).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                          style={{ backgroundColor: TYPE_COLORS[t] ?? "#A8A77A" }}
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                🏆 Full coverage! Your team hits all 18 types super-effectively.
              </p>
            </div>
          )}

          <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200">Type-by-type breakdown</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your best offensive matchup against each defending type, across every move on your team.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {coverage.map(({ def, best, sources }) => (
              <div key={def} className={resultCardClass(best)}>
                <div className="flex items-center justify-between gap-2">
                  <TypePill type={def} dimmed={best === 0} />
                  <span
                    className={`text-sm font-bold ${
                      best >= 2
                        ? "text-emerald-600 dark:text-emerald-400"
                        : best === 0.5
                          ? "text-amber-600 dark:text-amber-400"
                          : best === 0
                            ? "text-slate-400"
                            : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {bestLabel(best)}
                  </span>
                </div>
                {best >= 2 && (
                  <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    {sources.map((s, i) => (
                      <span key={i}>
                        {i > 0 && " · "}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{s.pokemon}</span>
                        {" — "}
                        {s.move.name}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            Based on type matchups only — abilities, stats, and dual-type defenders aren&apos;t factored in.
          </p>
        </>
      )}
    </main>
  );
}
