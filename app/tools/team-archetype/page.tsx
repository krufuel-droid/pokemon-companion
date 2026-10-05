"use client";

import { useMemo, useState } from "react";
import {
  MonPicker,
  type CandidateMon,
} from "../_components/mon-picker";
import { TypePill } from "../_components/species-picker";
import {
  analyzeTeam,
  type ArchetypeHit,
  type Commitment,
} from "@/lib/team-archetype";

const LEVEL_META: Record<Commitment, { label: string; bars: number; barCls: string; textCls: string }> = {
  strong: {
    label: "Strong",
    bars: 3,
    barCls: "bg-emerald-500",
    textCls: "text-emerald-700 dark:text-emerald-300",
  },
  moderate: {
    label: "Moderate",
    bars: 2,
    barCls: "bg-amber-400",
    textCls: "text-amber-700 dark:text-amber-300",
  },
  hint: {
    label: "Hint",
    bars: 1,
    barCls: "bg-slate-300 dark:bg-slate-600",
    textCls: "text-slate-500 dark:text-slate-400",
  },
};

function CommitmentMeter({ level }: { level: Commitment }) {
  const meta = LEVEL_META[level];
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${meta.label} commitment`}>
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-2 w-6 rounded-full ${i < meta.bars ? meta.barCls : "bg-slate-200 dark:bg-slate-700"}`}
          />
        ))}
      </span>
      <span className={`text-xs font-bold uppercase tracking-wide ${meta.textCls}`}>
        {meta.label}
      </span>
    </span>
  );
}

function HitCard({ hit }: { hit: ArchetypeHit }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          <span className="mr-2" aria-hidden>{hit.emoji}</span>
          {hit.name}
        </h3>
        <CommitmentMeter level={hit.level} />
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{hit.detail}</p>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
          Why it thinks so
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
          {hit.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

const HEURISTICS: { title: string; body: string }[] = [
  {
    title: "Weather (sun / rain / sand / snow)",
    body: "Spots setters by ability — Drought, Drizzle, Sand Stream, Snow Warning — and abusers — Chlorophyll, Solar Power, Swift Swim, Sand Rush, Slush Rush and friends. Strong = a setter plus 2 or more abusers.",
  },
  {
    title: "Terrain",
    body: "Looks for the Surge abilities (Electric, Grassy, Psychic, Misty) and Surge Surfer abusers.",
  },
  {
    title: "Trick Room",
    body: "Counts Trick Room learners and slow teammates (60 base Speed or less). Strong = 2+ setters with 3+ slow Pokémon.",
  },
  {
    title: "Speed control",
    body: "Tailwind, Sticky Web and Thunder Wave users. Tailwind is weighted heaviest — Thunder Wave alone can only ever read as a hint or moderate lean.",
  },
  {
    title: "Stall / hyper offense / balance",
    body: "Compares hazard setters (Stealth Rock, Spikes, Toxic Spikes), recovery-move users and each Pokémon's offensive vs defensive stat lean. Only the strongest playstyle read is shown.",
  },
  {
    title: "Where the data comes from",
    body: "Abilities are the ones actually observed on ~7,000 archived tournament teams — not a guess list. Moves come from the app's learnset database. Pokémon with no observed abilities are skipped for ability checks and flagged above.",
  },
];

export default function TeamArchetypePage() {
  const [slots, setSlots] = useState<(CandidateMon | null)[]>(
    Array.from({ length: 6 }, () => null),
  );
  const [analyzed, setAnalyzed] = useState(false);

  const filled = useMemo(() => slots.filter((s): s is CandidateMon => s !== null), [slots]);
  const excludeIds = useMemo(() => filled.map((s) => s.id), [filled]);

  const result = useMemo(() => {
    if (!analyzed || filled.length < 2) return null;
    return analyzeTeam(filled.map((s) => ({ id: s.id, label: s.label })));
  }, [analyzed, filled]);

  const setSlot = (i: number, m: CandidateMon | null) => {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = m;
      return next;
    });
    setAnalyzed(false);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Team Archetype Analyzer
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Drop in up to 6 Pokémon and it reads the team&apos;s game plan —
        weather, terrain, Trick Room, speed control, stall or hyper offense —
        with a commitment meter for each.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {slots.map((s, i) => (
          <MonPicker
            key={i}
            label={`Pokémon ${i + 1}${i < 2 ? " *" : ""}`}
            value={s}
            excludeIds={excludeIds.filter((id) => s?.id !== id)}
            onPick={(m) => setSlot(i, m)}
            onClear={() => setSlot(i, null)}
            placeholder={i < 2 ? "Required — search…" : "Optional — search…"}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={filled.length < 2}
        onClick={() => setAnalyzed(true)}
        className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        Analyze team{filled.length > 0 ? ` (${filled.length})` : ""}
      </button>

      {analyzed && result && (
        <section aria-live="polite" className="mt-8">
          {result.headline ? (
            <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                The read
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
                This looks like a {result.headline.toLowerCase()} team.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                A little bit of everything 🤷
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                No dominant game plan detected — either a flexible good-stuff
                pile or a team still looking for its identity.
              </p>
            </div>
          )}

          {result.notes.length > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800">
              {result.notes.map((n, i) => (
                <p key={i}>⚠️ {n}</p>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.hits.map((h) => (
              <HitCard key={h.key} hit={h} />
            ))}
          </div>
        </section>
      )}

      {analyzed && filled.length < 2 && (
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Pick at least 2 Pokémon above to get a read.
        </p>
      )}

      <details className="mt-10 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <summary className="cursor-pointer text-lg font-bold text-slate-700 dark:text-slate-200">
          How it reads your team
        </summary>
        <div className="mt-3 space-y-3">
          {HEURISTICS.map((h) => (
            <div key={h.title}>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {h.title}
              </p>
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {h.body}
              </p>
            </div>
          ))}
        </div>
      </details>

      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        Reads are heuristic, not gospel — a clever pilot can make any six
        sing.
      </p>
    </main>
  );
}
