"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TYPES, effectiveness } from "@/lib/typechart";
import {
  ABILITY_TYPE_EFFECTS,
  abilityDefenseMult,
  abilityNote,
  getAbilityTypeEffect,
} from "@/lib/data/ability-effects";
import {
  buildCandidatePool,
  MonPicker,
  type CandidateMon,
} from "../_components/mon-picker";
import { TypePill } from "../_components/species-picker";
import {
  TeamSavePicker,
  savedMemberToCandidate,
  type SavedTeam,
} from "../_components/team-save-picker";
import { inputCls, labelCls } from "../damage-calc/shared";

const POOL: CandidateMon[] = buildCandidatePool();

interface Hole {
  type: string;
  weakMembers: CandidateMon[];
  has4x: boolean;
  /** Ability notes for members the ability shielded from this type. */
  shielded: string[];
}

interface ScoredPartner {
  candidate: CandidateMon;
  total: number;
  patched: { type: string; how: string }[];
  filled: { gap: string; stab: string; mult: number }[];
  newWeak: string[];
}

function fmtMult(m: number): string {
  return m >= 4 ? "4×" : "2×";
}

export default function CompleteMyCorePage() {
  const [slots, setSlots] = useState<(CandidateMon | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // Defensive ability per core slot ("None" = no-op). Applied to the
  // hole analysis via abilityDefenseMult from lib/data/ability-effects.
  const [abilities, setAbilities] = useState<string[]>([
    "None",
    "None",
    "None",
    "None",
  ]);

  const setSlot = (i: number, m: CandidateMon | null) =>
    setSlots((prev) => prev.map((s, j) => (j === i ? m : s)));
  const setAbility = (i: number, a: string) =>
    setAbilities((prev) => prev.map((x, j) => (j === i ? a : x)));
  const clearSlot = (i: number) => {
    setSlot(i, null);
    setAbility(i, "None");
  };

  /** Fill the core from a Team Builder save (abilities mapped honestly — unmodeled ones become "None"). */
  const importTeam = (team: SavedTeam | null) => {
    if (!team) return;
    const picked = team.members.slice(0, 4).map(savedMemberToCandidate);
    setSlots([
      picked[0] ?? null,
      picked[1] ?? null,
      picked[2] ?? null,
      picked[3] ?? null,
    ]);
    const mapped = team.members
      .slice(0, 4)
      .map((m) => getAbilityTypeEffect(m.ability)?.name ?? "None");
    setAbilities([
      mapped[0] ?? "None",
      mapped[1] ?? "None",
      mapped[2] ?? "None",
      mapped[3] ?? "None",
    ]);
  };
  const excludeIds = useMemo(
    () => slots.filter((s): s is CandidateMon => s !== null).map((s) => s.id),
    [slots],
  );
  const filled = useMemo(
    () => slots.filter((s): s is CandidateMon => s !== null),
    [slots],
  );

  const holes: Hole[] = useMemo(() => {
    const core = slots
      .map((s, i) => (s ? { m: s, ability: abilities[i] ?? "None" } : null))
      .filter((x): x is { m: CandidateMon; ability: string } => x !== null);
    if (core.length < 2) return [];
    return TYPES.map((atk) => {
      const effOf = (c: { m: CandidateMon; ability: string }) =>
        abilityDefenseMult(c.ability, atk, effectiveness(atk, c.m.types));
      const weak = core.filter((c) => effOf(c) > 1);
      // Members whose ability shielded them from what would be a weakness.
      const shielded = core
        .filter((c) => effectiveness(atk, c.m.types) > 1 && effOf(c) <= 1)
        .map((c) =>
          abilityNote(c.ability, atk, effectiveness(atk, c.m.types)),
        )
        .filter((n): n is string => n !== null);
      return {
        type: atk,
        weakMembers: weak.map((w) => w.m),
        has4x: weak.some((w) => effOf(w) >= 4),
        shielded,
      };
    })
      .filter((h) => h.weakMembers.length >= 2)
      .sort((a, b) => b.weakMembers.length - a.weakMembers.length);
  }, [slots, abilities]);

  const shieldNotes: string[] = useMemo(
    () => Array.from(new Set(holes.flatMap((h) => h.shielded))),
    [holes],
  );

  const stabUnion = useMemo(
    () => Array.from(new Set(filled.flatMap((m) => m.types))),
    [filled],
  );

  const gaps: string[] = useMemo(() => {
    if (filled.length < 2) return [];
    return TYPES.filter(
      (def) => !stabUnion.some((stab) => effectiveness(stab, [def]) > 1),
    );
  }, [stabUnion, filled]);

  const suggestions: ScoredPartner[] = useMemo(() => {
    if (filled.length < 2) return [];
    const holeTypes = holes.map((h) => h.type);
    return POOL.filter((c) => !excludeIds.includes(c.id))
      .map((c) => {
        const patched: ScoredPartner["patched"] = [];
        const newWeak: string[] = [];
        let def = 0;
        for (const h of holeTypes) {
          const m = effectiveness(h, c.types);
          if (m === 0) {
            def += 3;
            patched.push({ type: h, how: "Immune to" });
          } else if (m < 1) {
            def += 2;
            patched.push({
              type: h,
              how: m <= 0.25 ? "4× resists" : "Resists",
            });
          } else if (m > 1) {
            def -= 2;
            newWeak.push(h);
          }
        }
        const filledGaps: ScoredPartner["filled"] = [];
        let off = 0;
        for (const g of gaps) {
          let best = 0;
          let bestStab = c.types[0] ?? "Normal";
          for (const t of c.types) {
            const m = effectiveness(t, [g]);
            if (m > best) {
              best = m;
              bestStab = t;
            }
          }
          if (best > 1) {
            off += 2;
            filledGaps.push({ gap: g, stab: bestStab, mult: best });
          }
        }
        return {
          candidate: c,
          total: def + off,
          patched,
          filled: filledGaps,
          newWeak,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filled, holes, gaps, excludeIds]);

  const reasonLine = (s: ScoredPartner): string => {
    const bits: string[] = [];
    if (s.patched.length > 0) {
      bits.push(
        `${s.patched.map((p) => `${p.how} ${p.type}`).join(", ")} — patching ${s.patched.length === 1 ? "a hole" : "holes"} that threaten 2+ of your ${filled.length}`,
      );
    }
    if (s.filled.length > 0) {
      const byStab = new Map<string, string[]>();
      for (const f of s.filled) {
        const arr = byStab.get(f.stab) ?? [];
        arr.push(f.gap);
        byStab.set(f.stab, arr);
      }
      const parts = Array.from(byStab.entries()).map(
        ([stab, gs]) => `${stab} STAB hits ${gs.join("/")} SE`,
      );
      bits.push(`${parts.join("; ")} — types your core can't touch`);
    }
    if (bits.length === 0) return "Solid meta pick — your core already covers the holes and gaps.";
    return bits.join(" · ");
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Complete My Core
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Give it 2–4 Pokémon you love. It finds the attacking types that
        threaten your core, the types your STABs can&apos;t hit — then ranks
        partners that patch both.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
          📥 Import from Team Builder
        </p>
        <div className="mt-2">
          <TeamSavePicker onSelect={importTeam} actionLabel="Fill core" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slots.map((s, i) => (
          <div key={i}>
            <MonPicker
              label={`Core Pokémon ${i + 1}${i < 2 ? " *" : ""}`}
              value={s}
              excludeIds={excludeIds.filter((id) => s?.id !== id)}
              onPick={(m) => setSlot(i, m)}
              onClear={() => clearSlot(i)}
              placeholder={
                i < 2 ? "Required — search…" : "Optional — search…"
              }
            />
            {s && (
              <div className="mt-2">
                <span className={labelCls}>Defensive ability</span>
                <select
                  value={abilities[i]}
                  onChange={(e) => setAbility(i, e.target.value)}
                  className={`${inputCls} mt-1`}
                  aria-label={`Defensive ability for core Pokémon ${i + 1}`}
                >
                  <option value="None">None</option>
                  {ABILITY_TYPE_EFFECTS.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name} — {a.desc}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {filled.length < 2 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">🧩</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Pick at least <span className="font-semibold">2 Pokémon</span>{" "}
            above — try <span className="font-semibold">Incineroar</span> and{" "}
            <span className="font-semibold">Rillaboom</span>.
          </p>
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100">
            Defensive holes
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Attacking types that hit 2+ of your core super-effectively.
          </p>
          {holes.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
              ✅ No shared weaknesses — nothing threatens 2+ of your{" "}
              {filled.length}.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {holes.map((h) => (
                <span
                  key={h.type}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-50 py-1 pl-1 pr-3 ring-1 ring-red-200 dark:bg-red-950/40 dark:ring-red-800"
                >
                  <TypePill type={h.type} />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                    threatens {h.weakMembers.length}
                    {h.has4x ? " (4×!)" : ""}
                  </span>
                </span>
              ))}
            </div>
          )}
          {shieldNotes.length > 0 && (
            <p className="mt-3 text-sm text-sky-700 dark:text-sky-300">
              🛡️ {shieldNotes.join(" · ")}
            </p>
          )}

          <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100">
            Coverage gaps
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Defending types none of your core&apos;s STABs hit
            super-effectively.
          </p>
          {gaps.length === 0 ? (
            <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
              ✅ Your STABs hit every type for SE — no gaps.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {gaps.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 py-1 pl-1 pr-3 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-800"
                >
                  <TypePill type={g} />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    no SE STAB
                  </span>
                </span>
              ))}
            </div>
          )}

          <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100">
            Suggested partners
          </h2>
          <div className="mt-4 space-y-3">
            {suggestions.map((s, i) => {
              const c = s.candidate;
              const expanded = expandedId === c.id;
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl shadow-sm ring-1 ${
                    i < 3
                      ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-800"
                      : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : c.id)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {i < 3 && (
                      <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                        #{i + 1}
                      </span>
                    )}
                    {c.sprite && (
                      <img
                        src={c.sprite}
                        alt={c.label}
                        className="h-12 w-12 shrink-0 object-contain"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/pokedex/${c.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-100"
                        >
                          {c.label}
                        </Link>
                        {c.types.map((t) => (
                          <TypePill key={t} type={t} />
                        ))}
                      </span>
                      <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                        {reasonLine(s)}
                      </span>
                      {s.newWeak.length > 0 && (
                        <span className="mt-1 block text-xs font-medium text-red-600 dark:text-red-400">
                          ⚠️ Weak to {s.newWeak.join(", ")} — also holes in
                          your core
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {expanded ? "▲" : "▼"}
                    </span>
                  </button>
                  {expanded && (
                    <div className="border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-700">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        Defensive vs your holes
                      </p>
                      {holes.length === 0 ? (
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                          Your core has no holes to patch.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                          {holes.map((h) => {
                            const m = effectiveness(h.type, c.types);
                            const label =
                              m === 0
                                ? "immune"
                                : m < 1
                                  ? `resists (${fmtMult(1 / m)} reduction)`
                                  : m > 1
                                    ? `weak (${fmtMult(m)})`
                                    : "neutral";
                            return (
                              <li key={h.type}>
                                <TypePill type={h.type} /> takes {label} —{" "}
                                {h.weakMembers.map((wm) => wm.label).join(", ")}{" "}
                                threatened
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                        Offensive vs your gaps
                      </p>
                      {gaps.length === 0 ? (
                        <p className="mt-1 text-slate-500 dark:text-slate-400">
                          Your core has no coverage gaps.
                        </p>
                      ) : (
                        <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                          {gaps.map((g) => {
                            const best = c.types.reduce(
                              (acc, t) => {
                                const m = effectiveness(t, [g]);
                                return m > acc.mult
                                  ? { mult: m, type: t }
                                  : acc;
                              },
                              { mult: 0, type: c.types[0] ?? "Normal" },
                            );
                            return (
                              <li key={g}>
                                <TypePill type={g} />{" "}
                                {best.mult > 1 ? (
                                  <>
                                    hit SE by {best.type} STAB (
                                    {fmtMult(best.mult)})
                                  </>
                                ) : (
                                  <>not hit SE by {c.label}&apos;s STABs</>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
        <span className="font-bold">Honest limitations:</span> type matchups
        only, plus the defensive abilities you select for your core (partner
        suggestions assume no ability, since we won&apos;t guess their
        sets). This doesn&apos;t account for movesets, items, Tera types,
        stats, or speed. A partner that patches your holes on paper still
        needs the right set. Use it as a starting point, then check the
        damage calc.
      </div>
    </main>
  );
}
