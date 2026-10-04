"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { effectiveness } from "@/lib/typechart";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { META_PICKS } from "@/lib/data/champions";
import {
  abilityDefenseMult,
  abilityNote,
  getAbilityTypeEffect,
} from "@/lib/data/ability-effects";
import { SpeciesPicker, TypePill } from "../_components/species-picker";
import { AbilitySelect } from "../_components/battle-selectors";

interface Candidate {
  species: SpeciesIndex;
  metaNote?: string;
}

/** Curated VGC candidate pool — every name verified against the Pokédex data. */
const POOL_NAMES = [
  "Rillaboom",
  "Sneasler",
  "Incineroar",
  "Kingambit",
  "Gholdengo",
  "Raichu",
  "Garchomp",
  "Salamence",
  "Arcanine", // Hisuian Arcanine in the meta picks
  "Floette", // Eternal Flower Floette in the meta picks
  "Archaludon",
  "Charizard",
  "Amoonguss",
  "Pelipper",
  "Tornadus",
  "Iron Hands",
  "Flutter Mane",
  "Chien Pao",
  "Ogerpon",
  "Dragonite",
  "Tyranitar",
  "Excadrill",
  "Indeedee",
  "Volcarona",
];

function buildPool(): Candidate[] {
  const metaNoteByBase = new Map<string, string>();
  for (const p of META_PICKS) {
    metaNoteByBase.set((p.speciesName ?? p.name).toLowerCase(), p.note);
  }
  const out: Candidate[] = [];
  for (const n of POOL_NAMES) {
    const hits = searchSpecies(n);
    const exact =
      hits.find((h) => h.name.toLowerCase() === n.toLowerCase()) ?? hits[0];
    if (exact) out.push({ species: exact, metaNote: metaNoteByBase.get(n.toLowerCase()) });
  }
  return out;
}

const POOL: Candidate[] = buildPool();

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface Scored {
  candidate: Candidate;
  total: number;
  defNotes: string[];
  bestOffense: { type: string; mult: number } | null;
  /** Ability explanation when the threat's ability changed the best answer. */
  offenseAbilityNote: string | null;
}

function scoreCandidate(
  c: Candidate,
  threatTypes: string[],
  threatAbility: string | null,
): Scored {
  const defNotes: string[] = [];
  let def = 0;
  for (const t of threatTypes) {
    const m = effectiveness(t, c.species.types);
    if (m === 0) {
      def += 3;
      defNotes.push(`Immune to ${t}`);
    } else if (m <= 0.25) {
      def += 2;
      defNotes.push(`4x resists ${t}`);
    } else if (m < 1) {
      def += 1;
      defNotes.push(`Resists ${t}`);
    } else if (m >= 4) {
      def -= 4;
      defNotes.push(`4x weak to ${t} ⚠️`);
    } else if (m > 1) {
      def -= 2;
      defNotes.push(`Weak to ${t} ⚠️`);
    }
  }
  let best: { type: string; mult: number } | null = null;
  let bestAbilityNote: string | null = null;
  for (const s of c.species.types) {
    const base = effectiveness(s, threatTypes);
    // The threat's defensive ability can blunt the answer's STAB —
    // e.g. Levitate turns a Ground answer into a 0x.
    const m = abilityDefenseMult(threatAbility, s, base);
    if (!best || m > best.mult) {
      best = { type: s, mult: m };
      bestAbilityNote = abilityNote(threatAbility, s, base);
    }
  }
  let off = 0;
  if (best) {
    if (best.mult >= 4) off = 3;
    else if (best.mult === 2) off = 2;
    else if (best.mult === 1) off = 0;
    else if (best.mult === 0.5) off = -1;
    else off = -2;
  }
  return { candidate: c, total: def + off, defNotes, bestOffense: best, offenseAbilityNote: bestAbilityNote };
}

export default function CounterFinderPage() {
  const [threat, setThreat] = useState<SpeciesIndex | null>(null);
  const [formName, setFormName] = useState<string | null>(null);
  const [threatAbility, setThreatAbility] = useState("None");

  const threatForms = useMemo(
    () => (threat ? getFormsForSpecies(threat.id) : []),
    [threat],
  );
  const activeForm = threatForms.find((f) => f.formName === formName) ?? null;
  const threatTypes = useMemo(
    () =>
      activeForm?.types?.map(cap) ?? threat?.types ?? [],
    [activeForm, threat],
  );
  const threatLabel = activeForm?.formName ?? threat?.name ?? "";
  const threatSprite = activeForm?.sprite ?? threat?.sprites.regular;

  const pickThreat = (s: SpeciesIndex) => {
    setThreat(s);
    setFormName(null);
  };

  const ranked: Scored[] = useMemo(() => {
    if (!threat || threatTypes.length === 0) return [];
    return POOL.filter((c) => c.species.id !== threat.id)
      .map((c) => scoreCandidate(c, threatTypes, threatAbility))
      .sort((a, b) => b.total - a.total);
  }, [threat, threatTypes, threatAbility]);

  const threatAbilityDesc = getAbilityTypeEffect(threatAbility)?.desc ?? null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Counter Finder
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick a threat — get ranked type-based answers from the current meta.
        Who resists it, and who hits back super-effectively.
      </p>

      <div className="mt-6 max-w-md">
        <SpeciesPicker
          onPick={pickThreat}
          placeholder="Search for the threat…"
          label="Threat Pokémon"
        />
      </div>

      {threatForms.length > 0 && (
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
            {threatForms.map((f) => (
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

      {threat && (
        <div className="mt-3 max-w-xs">
          <AbilitySelect
            label="Threat's ability (blunts answers' STAB)"
            value={threatAbility}
            onChange={setThreatAbility}
          />
        </div>
      )}

      {!threat ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">🎯</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Pick a threat above — try <span className="font-semibold">Garchomp</span> with
            its <span className="font-semibold">Mega Garchomp Z</span> form.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            {threatSprite && (
              <img src={threatSprite} alt={threatLabel} className="h-16 w-16 object-contain" />
            )}
            <div>
              <Link
                href={`/pokedex/${threat.slug}`}
                className="text-xl font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-100"
              >
                {threatLabel}
              </Link>
              <div className="mt-1 flex gap-1">
                {threatTypes.map((t) => (
                  <TypePill key={t} type={t} />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                STAB types evaluated: {threatTypes.join(" / ")}
                {threatAbilityDesc && (
                  <>
                    {" · "}🛡️ {threatAbility}: {threatAbilityDesc}
                  </>
                )}
              </p>
            </div>
          </div>

          <h2 className="mt-8 text-xl font-bold text-slate-800 dark:text-slate-100">
            Best answers
          </h2>
          <div className="mt-4 space-y-3">
            {ranked.map((s, i) => (
              <div
                key={s.candidate.species.id}
                className={`rounded-2xl p-4 shadow-sm ring-1 ${
                  i < 3
                    ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-800"
                    : "bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {i < 3 && (
                    <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      #{i + 1}
                    </span>
                  )}
                  {s.candidate.species.sprites.regular && (
                    <img
                      src={s.candidate.species.sprites.regular}
                      alt={s.candidate.species.name}
                      className="h-12 w-12 object-contain"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/pokedex/${s.candidate.species.slug}`}
                        className="font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-100"
                      >
                        {s.candidate.species.name}
                      </Link>
                      {s.candidate.species.types.map((t) => (
                        <TypePill key={t} type={t} />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {s.defNotes.length > 0 ? s.defNotes.join(" · ") : "Neutral defensively"}
                      {s.bestOffense && s.bestOffense.mult > 1 && (
                        <>
                          {" · "}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Hits back SE with {s.bestOffense.type}
                            {s.bestOffense.mult >= 4 ? " (4x!)" : ""}
                          </span>
                          {s.offenseAbilityNote && (
                            <span className="text-slate-400"> ({s.offenseAbilityNote})</span>
                          )}
                        </>
                      )}
                      {s.bestOffense && s.bestOffense.mult <= 1 && (
                        <span className="text-slate-400">
                          {" "}· no SE STAB answer
                          {s.offenseAbilityNote ? ` (${s.offenseAbilityNote})` : ""}
                        </span>
                      )}
                    </p>
                    {s.candidate.metaNote && (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        📊 {s.candidate.metaNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
        <span className="font-bold">Honest limitations:</span> type matchups
        only, plus the threat&apos;s selected defensive ability (18 modeled:
        Levitate, Flash Fire, Thick Fat, Filter family, Wonder Guard, and
        more). This doesn&apos;t account for movesets, items, Tera types,
        stats, or speed — a great answer on paper can still lose to the wrong
        set. Category-based abilities (Fluffy, Ice Scales, Fur Coat) and
        one-time ones (Sturdy, Disguise) aren&apos;t modeled. Use it as a
        starting point, then check the damage calc.
      </div>
    </main>
  );
}
