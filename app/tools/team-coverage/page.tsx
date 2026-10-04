"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TYPES, effectiveness } from "@/lib/typechart";
import type { SpeciesIndex } from "@/lib/pokedex";
import { TYPE_COLORS } from "@/lib/theme";
import { SpeciesPicker, TypePill } from "../_components/species-picker";

interface DefRow {
  atk: string;
  quad: SpeciesIndex[];
  weak: SpeciesIndex[];
  resist: SpeciesIndex[];
  immune: SpeciesIndex[];
  threatened: number;
}

export default function TeamCoveragePage() {
  const [team, setTeam] = useState<SpeciesIndex[]>([]);
  const [tab, setTab] = useState<"defense" | "offense">("defense");

  const add = (p: SpeciesIndex) => {
    if (team.length >= 6 || team.some((m) => m.id === p.id)) return;
    setTeam([...team, p]);
  };
  const remove = (id: number) => setTeam(team.filter((m) => m.id !== id));

  const defensive: DefRow[] = useMemo(
    () =>
      TYPES.map((atk) => {
        const quad: SpeciesIndex[] = [];
        const weak: SpeciesIndex[] = [];
        const resist: SpeciesIndex[] = [];
        const immune: SpeciesIndex[] = [];
        for (const p of team) {
          const m = effectiveness(atk, p.types);
          if (m >= 4) quad.push(p);
          else if (m > 1) weak.push(p);
          else if (m === 0) immune.push(p);
          else if (m < 1) resist.push(p);
        }
        return { atk, quad, weak, immune, resist, threatened: quad.length + weak.length };
      }),
    [team],
  );

  const weaknesses = useMemo(
    () =>
      defensive
        .filter((d) => d.threatened >= 3)
        .sort((a, b) => b.threatened - a.threatened || b.quad.length - a.quad.length),
    [defensive],
  );

  const stabTypes = useMemo(
    () => [...new Set(team.flatMap((p) => p.types))],
    [team],
  );

  const offensive = useMemo(
    () =>
      TYPES.map((def) => {
        const hitters: { type: string; members: string[]; mult: number }[] = [];
        for (const stab of stabTypes) {
          const m = effectiveness(stab, [def]);
          if (m > 1)
            hitters.push({
              type: stab,
              members: team.filter((p) => p.types.includes(stab)).map((p) => p.name),
              mult: m,
            });
        }
        return { def, hitters };
      }),
    [team, stabTypes],
  );

  const gaps = useMemo(() => offensive.filter((o) => o.hitters.length === 0), [offensive]);
  const coveredCount = offensive.length - gaps.length;

  const tabCls = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      active
        ? "bg-emerald-500 text-white shadow-sm"
        : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
    }`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Team Coverage Checker
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick 6 Pokémon — see 4x/2x defensive breakdowns per attacking type, and
        which types your STABs can&apos;t touch.
      </p>

      <div className="mt-6">
        <SpeciesPicker
          onPick={add}
          excludeIds={team.map((m) => m.id)}
          placeholder={team.length >= 6 ? "Team is full (6/6)" : "Search for a Pokémon to add…"}
          label={`Your team (${team.length}/6)`}
        />
      </div>

      {team.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {team.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              {p.sprites.regular && (
                <img src={p.sprites.regular} alt={p.name} className="h-8 w-8 object-contain" />
              )}
              <Link
                href={`/pokedex/${p.slug}`}
                className="text-sm font-semibold text-slate-700 hover:text-emerald-600 dark:text-slate-200"
              >
                {p.name}
              </Link>
              <span className="flex gap-0.5">
                {p.types.map((t) => (
                  <TypePill key={t} type={t} />
                ))}
              </span>
              <button
                onClick={() => remove(p.id)}
                className="text-slate-400 hover:text-rose-500"
                aria-label={`Remove ${p.name}`}
              >
                ✕
              </button>
            </div>
          ))}
          {team.length < 6 && (
            <span className="self-center text-xs text-slate-400">
              Add {6 - team.length} more for a full picture
            </span>
          )}
        </div>
      )}

      {team.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">🛡️</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Add some Pokémon to check your team&apos;s coverage.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex gap-2">
            <button className={tabCls(tab === "defense")} onClick={() => setTab("defense")}>
              🛡️ Defensive
            </button>
            <button className={tabCls(tab === "offense")} onClick={() => setTab("offense")}>
              ⚔️ Offensive
            </button>
          </div>

          {tab === "defense" ? (
            <>
              {weaknesses.length > 0 && (
                <div className="mt-6 rounded-2xl bg-rose-50 p-6 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:ring-rose-900">
                  <h2 className="text-lg font-bold text-rose-700 dark:text-rose-300">
                    ⚠️ Team weaknesses
                  </h2>
                  <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                    These attack types hit 3+ of your team super-effectively:
                  </p>
                  <div className="mt-3 space-y-2">
                    {weaknesses.map((w) => (
                      <div key={w.atk} className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold text-white"
                          style={{ backgroundColor: TYPE_COLORS[w.atk] }}
                        >
                          {w.atk}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {w.threatened}/{team.length} threatened
                          {w.quad.length > 0 && (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {" "}
                              · {w.quad.map((p) => p.name).join(", ")} 4x weak!
                            </span>
                          )}
                          {w.weak.length > 0 && (
                            <span className="text-slate-500 dark:text-slate-400">
                              {" "}
                              · {w.weak.map((p) => p.name).join(", ")} 2x
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {defensive.map((d) => (
                  <div
                    key={d.atk}
                    className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: TYPE_COLORS[d.atk] }}
                      >
                        {d.atk}
                      </span>
                      <span className="text-xs text-slate-400">
                        {d.threatened > 0 ? `${d.threatened} weak` : "safe"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                      {d.quad.length > 0 && (
                        <p className="font-bold text-rose-600 dark:text-rose-400">
                          4x: {d.quad.map((p) => p.name).join(", ")}
                        </p>
                      )}
                      {d.weak.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          2x: {d.weak.map((p) => p.name).join(", ")}
                        </p>
                      )}
                      {d.resist.length > 0 && (
                        <p className="text-emerald-600 dark:text-emerald-400">
                          Resists: {d.resist.map((p) => p.name).join(", ")}
                        </p>
                      )}
                      {d.immune.length > 0 && (
                        <p className="text-slate-400">
                          Immune: {d.immune.map((p) => p.name).join(", ")}
                        </p>
                      )}
                      {d.threatened === 0 && d.resist.length === 0 && d.immune.length === 0 && (
                        <p className="text-slate-400">Neutral across the team</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Your team&apos;s STAB types
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stabTypes.map((t) => (
                    <TypePill key={t} type={t} className="px-3 py-1 text-xs" />
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Hitting <span className="font-bold text-emerald-600 dark:text-emerald-400">{coveredCount}/18</span> types
                  super-effectively
                  {gaps.length > 0 && (
                    <>
                      {" "}· <span className="font-bold text-rose-600 dark:text-rose-400">{gaps.length} gap{gaps.length === 1 ? "" : "s"}</span>
                    </>
                  )}
                </p>
              </div>

              {gaps.length > 0 && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900">
                  <h2 className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    🕳️ Coverage gaps
                  </h2>
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    No team member hits these super-effectively with STAB:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {gaps.map((g) => (
                      <TypePill key={g.def} type={g.def} className="px-3 py-1 text-xs" />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {offensive.map((o) => (
                  <div
                    key={o.def}
                    className={`rounded-xl p-3 shadow-sm ring-1 ${
                      o.hitters.length > 0
                        ? "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                        : "bg-slate-50 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: TYPE_COLORS[o.def] }}
                      >
                        {o.def}
                      </span>
                      {o.hitters.length > 0 ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ covered</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">gap</span>
                      )}
                    </div>
                    {o.hitters.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {o.hitters.map((h) => (
                          <p key={h.type} className="text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-semibold" style={{ color: TYPE_COLORS[h.type] }}>
                              {h.type} {h.mult}x
                            </span>{" "}
                            · {h.members.join(", ")}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        Pure type-chart math — doesn&apos;t account for abilities, items, Tera
        types, or specific movesets.
      </p>
    </main>
  );
}
