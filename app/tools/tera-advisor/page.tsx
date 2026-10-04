"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TYPES, effectiveness } from "@/lib/typechart";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { SpeciesPicker, TypePill } from "../_components/species-picker";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Defensive multiplier of each attacking type against a typing. */
function defensiveProfile(types: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const atk of TYPES) out[atk] = effectiveness(atk, types);
  return out;
}

interface TeraEval {
  tera: string;
  score: number;
  removed4x: string[];
  removed2x: string[];
  added4x: string[];
  added2x: string[];
  gainedResist: string[];
  lostResist: string[];
  gainedImmune: string[];
  lostImmune: string[];
  /** Tera type matches one of the Pokémon's natural types: STAB jumps to 2x. */
  keepsStab: boolean;
}

function evaluateTera(natural: string[], tera: string): TeraEval {
  const nat = defensiveProfile(natural);
  const tr = defensiveProfile([tera]);
  const ev: TeraEval = {
    tera,
    score: 0,
    removed4x: [],
    removed2x: [],
    added4x: [],
    added2x: [],
    gainedResist: [],
    lostResist: [],
    gainedImmune: [],
    lostImmune: [],
    keepsStab: natural.includes(tera),
  };
  for (const atk of TYPES) {
    const n = nat[atk];
    const t = tr[atk];
    if (n === t) continue;
    // Immunity changes first — they dominate the story of a type.
    if (n === 0 && t !== 0) {
      ev.lostImmune.push(atk);
      ev.score -= 2;
      continue;
    }
    if (t === 0 && n !== 0) {
      ev.gainedImmune.push(atk);
      ev.score += 2;
      continue;
    }
    if (n > 1 && t <= 1) {
      (n >= 4 ? ev.removed4x : ev.removed2x).push(atk);
      ev.score += n >= 4 ? 3 : 1.5;
      continue;
    }
    if (n <= 1 && t > 1) {
      (t >= 4 ? ev.added4x : ev.added2x).push(atk);
      ev.score -= t >= 4 ? 3 : 1.5;
      continue;
    }
    if (t < n) {
      ev.gainedResist.push(atk);
      ev.score += n === 0.5 && t === 0.25 ? 0.5 : 1;
      continue;
    }
    if (t > n) {
      ev.lostResist.push(atk);
      ev.score -= n === 0.25 && t === 0.5 ? 0.5 : 1;
    }
  }
  if (ev.keepsStab) ev.score += 1;
  ev.score = Math.round(ev.score * 10) / 10;
  return ev;
}

function summaryLine(ev: TeraEval): string {
  const bits: string[] = [];
  if (ev.removed4x.length > 0)
    bits.push(`removes 4x ${ev.removed4x.join(", ")} weak`);
  if (ev.removed2x.length > 0)
    bits.push(`removes ${ev.removed2x.join(", ")} weak`);
  if (ev.gainedImmune.length > 0)
    bits.push(`immune to ${ev.gainedImmune.join(", ")}`);
  if (ev.added4x.length > 0) bits.push(`adds 4x ${ev.added4x.join(", ")} weak ⚠️`);
  if (ev.added2x.length > 0) bits.push(`adds ${ev.added2x.join(", ")} weak ⚠️`);
  if (ev.lostImmune.length > 0)
    bits.push(`loses ${ev.lostImmune.join(", ")} immunity ⚠️`);
  if (bits.length === 0) bits.push("defensively near-identical");
  if (ev.keepsStab) bits.push("keeps STAB boosted");
  else bits.push(`STAB on ${ev.tera}-type moves`);
  return bits.join(" · ");
}

export default function TeraAdvisorPage() {
  const [mon, setMon] = useState<SpeciesIndex | null>(null);
  const [formName, setFormName] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const forms = useMemo(() => (mon ? getFormsForSpecies(mon.id) : []), [mon]);
  const activeForm = forms.find((f) => f.formName === formName) ?? null;
  const naturalTypes = useMemo(
    () => activeForm?.types?.map(cap) ?? mon?.types ?? [],
    [activeForm, mon],
  );
  const label = activeForm?.formName ?? mon?.name ?? "";
  const sprite = activeForm?.sprite ?? mon?.sprites.regular;

  const pickMon = (s: SpeciesIndex) => {
    setMon(s);
    setFormName(null);
    setExpanded(null);
  };

  const naturalWeak = useMemo(() => {
    if (naturalTypes.length === 0) return [];
    const p = defensiveProfile(naturalTypes);
    return TYPES.filter((t) => p[t] > 1).map((t) => ({ type: t, mult: p[t] }));
  }, [naturalTypes]);

  const ranked: TeraEval[] = useMemo(() => {
    if (naturalTypes.length === 0) return [];
    return TYPES.map((t) => evaluateTera(naturalTypes, t)).sort(
      (a, b) => b.score - a.score,
    );
  }, [naturalTypes]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Tera Type Advisor
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick a Pokémon — every Tera type ranked by what it fixes and what it
        costs, straight from the type chart.
      </p>

      <div className="mt-6 max-w-md">
        <SpeciesPicker
          onPick={pickMon}
          placeholder="Search for your Pokémon…"
          label="Pokémon"
        />
      </div>

      {forms.length > 0 && (
        <div className="mt-3">
          <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
            Form
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFormName(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
                formName === null
                  ? "bg-emerald-500 text-white ring-emerald-500"
                  : "bg-white text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
              }`}
            >
              Base
            </button>
            {forms.map((f) => (
              <button
                key={f.formName}
                onClick={() => setFormName(f.formName)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition ${
                  formName === f.formName
                    ? "bg-emerald-500 text-white ring-emerald-500"
                    : "bg-white text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                }`}
              >
                {f.formName}
              </button>
            ))}
          </div>
        </div>
      )}

      {!mon ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">💎</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Pick a Pokémon above — try{" "}
            <span className="font-semibold">Garchomp</span> or{" "}
            <span className="font-semibold">Gholdengo</span>.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            {sprite && (
              <img
                src={sprite}
                alt={label}
                className="h-16 w-16 object-contain"
              />
            )}
            <div>
              <Link
                href={`/pokedex/${mon.slug}`}
                className="text-xl font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-100"
              >
                {label}
              </Link>
              <div className="mt-1 flex gap-1">
                {naturalTypes.map((t) => (
                  <TypePill key={t} type={t} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {naturalWeak.length > 0 ? (
                  <>
                    Weak to:{" "}
                    {naturalWeak
                      .map((w) => `${w.type}${w.mult >= 4 ? " (4x)" : ""}`)
                      .join(", ")}
                  </>
                ) : (
                  "No weaknesses — nice."
                )}
              </p>
            </div>
          </div>

          {/* Stellar gets its own card: it plays by different rules. */}
          <div className="mt-6 rounded-2xl bg-violet-50/70 p-4 shadow-sm ring-1 ring-violet-200 dark:bg-violet-950/30 dark:ring-violet-800">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-violet-500 px-2.5 py-0.5 text-xs font-bold text-white">
                Stellar
              </span>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No defensive change — you keep your natural typing. Offensively
                it boosts each of your STAB types once (2x the first hit, then
                a smaller boost). Purely an offensive pick.
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100">
            Ranked Tera types
          </h2>
          <div className="mt-4 space-y-3">
            {ranked.map((ev, i) => {
              const isOpen = expanded === ev.tera;
              return (
                <div
                  key={ev.tera}
                  className={`rounded-2xl shadow-sm ring-1 ${
                    i < 3
                      ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-800"
                      : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                  }`}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : ev.tera)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    {i < 3 && (
                      <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                        #{i + 1}
                      </span>
                    )}
                    <TypePill type={ev.tera} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {summaryLine(ev)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold ${
                        ev.score > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ev.score < 0
                            ? "text-red-500 dark:text-red-400"
                            : "text-slate-400"
                      }`}
                    >
                      {ev.score > 0 ? "+" : ""}
                      {ev.score}
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
                      {ev.removed4x.length + ev.removed2x.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Weaknesses removed:
                          </span>{" "}
                          {[
                            ...ev.removed4x.map((t) => `${t} (was 4x)`),
                            ...ev.removed2x,
                          ].join(", ")}
                        </p>
                      )}
                      {ev.gainedImmune.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Immunities gained:
                          </span>{" "}
                          {ev.gainedImmune.join(", ")}
                        </p>
                      )}
                      {ev.gainedResist.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Resists gained:
                          </span>{" "}
                          {ev.gainedResist.join(", ")}
                        </p>
                      )}
                      {ev.added4x.length + ev.added2x.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-red-500 dark:text-red-400">
                            New weaknesses:
                          </span>{" "}
                          {[
                            ...ev.added4x.map((t) => `${t} (4x!)`),
                            ...ev.added2x,
                          ].join(", ")}
                        </p>
                      )}
                      {ev.lostImmune.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-red-500 dark:text-red-400">
                            Immunities lost:
                          </span>{" "}
                          {ev.lostImmune.join(", ")}
                        </p>
                      )}
                      {ev.lostResist.length > 0 && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-red-500 dark:text-red-400">
                            Resists lost:
                          </span>{" "}
                          {ev.lostResist.join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {ev.keepsStab
                          ? `Tera ${ev.tera} matches your natural typing — your ${ev.tera} STAB jumps to 2x.`
                          : `Tera ${ev.tera} gives you STAB on ${ev.tera}-type moves.`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
        <span className="font-bold">Honest limitations:</span> type chart only.
        This doesn&apos;t know the opponent&apos;s moves, sets, abilities, or
        their own Tera — a great Tera on paper still needs a game plan. Score
        weights removing 4x weaknesses and gaining immunities highest; treat
        the ranking as a starting point, not a verdict.
      </div>
    </main>
  );
}
