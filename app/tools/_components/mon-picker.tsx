"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { META_PICKS } from "@/lib/data/champions";
import { combatantStats } from "@/lib/damage-calc";
import { effectiveness } from "@/lib/typechart";
import {
  abilityDefenseMult,
  abilityNote,
} from "@/lib/data/ability-effects";
import { SpeciesPicker, TypePill } from "./species-picker";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export interface CandidateMon {
  /** Base species id — forms share the base id. */
  id: number;
  /** Display label, e.g. "Hisuian Arcanine". */
  label: string;
  formName: string | null;
  types: string[];
  sprite: string | undefined;
  slug: string;
}

function toCandidate(base: SpeciesIndex, formName: string | null): CandidateMon {
  const form = formName
    ? getFormsForSpecies(base.id).find(
        (f) => f.formName.toLowerCase() === formName.toLowerCase(),
      )
    : undefined;
  return {
    id: base.id,
    label: form?.formName ?? base.name,
    formName: form?.formName ?? null,
    types: form?.types?.map(cap) ?? base.types,
    sprite: form?.sprite ?? base.sprites.regular,
    slug: base.slug,
  };
}

/** The 24 verified species from the counter-finder's curated pool. */
const EXTRA_POOL_NAMES = [
  "Rillaboom",
  "Sneasler",
  "Incineroar",
  "Kingambit",
  "Gholdengo",
  "Raichu",
  "Garchomp",
  "Salamence",
  "Arcanine",
  "Floette",
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

/**
 * Shared VGC candidate pool: the 12 Regulation M-C meta picks (with form
 * typing where it differs, e.g. Hisuian Arcanine's Fire/Rock) plus the
 * counter-finder's 24 verified species, deduped by species id.
 */
export function buildCandidatePool(): CandidateMon[] {
  const out: CandidateMon[] = [];
  const seen = new Set<number>();
  const add = (c: CandidateMon | null) => {
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  };
  for (const pick of META_PICKS.slice(0, 12)) {
    const baseName = pick.speciesName ?? pick.name;
    const hits = searchSpecies(baseName);
    const base =
      hits.find((h) => h.name.toLowerCase() === baseName.toLowerCase()) ??
      hits[0];
    if (!base) continue;
    add(toCandidate(base, pick.speciesName ? pick.name : null));
  }
  for (const n of EXTRA_POOL_NAMES) {
    const hits = searchSpecies(n);
    const exact =
      hits.find((h) => h.name.toLowerCase() === n.toLowerCase()) ?? hits[0];
    if (exact) add(toCandidate(exact, null));
  }
  return out;
}

export type Verdict = "mirror" | "favorable" | "even" | "unfavorable";

export interface MatchupInfo {
  verdict: Verdict;
  /** Best STAB multiplier a lands on b. */
  off: number;
  offType: string;
  /** Best STAB multiplier b lands back on a. */
  back: number;
  backType: string;
  /** When b's ability changed the incoming hit, else null. */
  offAbilityNote?: string | null;
  /** When a's ability changed the return hit, else null. */
  backAbilityNote?: string | null;
}

export interface MatchupAbilityOpts {
  /** a's defensive ability — dampens b's return STAB. "None"/undefined = no-op. */
  aAbility?: string | null;
  /** b's defensive ability — dampens a's incoming STAB. "None"/undefined = no-op. */
  bAbility?: string | null;
}

/** Type-based verdict, same rule as the meta matchup matrix. */
export function matchupInfo(
  a: CandidateMon,
  b: CandidateMon,
  opts?: MatchupAbilityOpts,
): MatchupInfo {
  if (a.id === b.id && a.formName === b.formName) {
    return {
      verdict: "mirror",
      off: 1,
      offType: a.types[0] ?? "Normal",
      back: 1,
      backType: b.types[0] ?? "Normal",
      offAbilityNote: null,
      backAbilityNote: null,
    };
  }
  let off = 0;
  let offType = a.types[0] ?? "Normal";
  let offNote: string | null = null;
  for (const t of a.types) {
    const base = effectiveness(t, b.types);
    const m = abilityDefenseMult(opts?.bAbility, t, base);
    if (m > off) {
      off = m;
      offType = t;
      offNote = abilityNote(opts?.bAbility, t, base);
    }
  }
  let back = 0;
  let backType = b.types[0] ?? "Normal";
  let backNote: string | null = null;
  for (const t of b.types) {
    const base = effectiveness(t, a.types);
    const m = abilityDefenseMult(opts?.aAbility, t, base);
    if (m > back) {
      back = m;
      backType = t;
      backNote = abilityNote(opts?.aAbility, t, base);
    }
  }
  let verdict: Verdict = "even";
  if (off > 1 && back <= 1) verdict = "favorable";
  else if (back > 1 && off <= 1) verdict = "unfavorable";
  return {
    verdict,
    off,
    offType,
    back,
    backType,
    offAbilityNote: offNote,
    backAbilityNote: backNote,
  };
}

/**
 * Speed at level 50 with a neutral nature, 31 IVs, 0 EVs.
 * Mega/form base-stat changes are not modeled — noted in the UIs.
 */
export function speedAt50Neutral(mon: CandidateMon): number {
  const species: SpeciesIndex = {
    id: mon.id,
    slug: mon.slug,
    name: mon.label,
    types: mon.types,
    eggGroups: [],
    sprites: { regular: mon.sprite ?? "", shiny: mon.sprite ?? "" },
  };
  return combatantStats(species, 50, "Hardy", {}, {}).spe;
}

/**
 * Species picker with optional form chips (only forms whose typing differs
 * from the base species — the ones that matter for type math). Shows the
 * picked mon as a card with a remove button.
 */
export function MonPicker({
  label,
  value,
  onPick,
  onClear,
  excludeIds = [],
  placeholder = "Search for a Pokémon…",
}: {
  label: string;
  value: CandidateMon | null;
  onPick: (m: CandidateMon) => void;
  onClear: () => void;
  excludeIds?: number[];
  placeholder?: string;
}) {
  const [species, setSpecies] = useState<SpeciesIndex | null>(null);
  const [formName, setFormName] = useState<string | null>(null);

  const typedForms = useMemo(
    () =>
      species
        ? getFormsForSpecies(species.id).filter(
            (f) => f.types && f.types.length > 0,
          )
        : [],
    [species],
  );

  const pickSpecies = (s: SpeciesIndex) => {
    setSpecies(s);
    setFormName(null);
    onPick(toCandidate(s, null));
  };

  const pickForm = (fn: string | null) => {
    if (!species) return;
    setFormName(fn);
    onPick(toCandidate(species, fn));
  };

  const clear = () => {
    setSpecies(null);
    setFormName(null);
    onClear();
  };

  if (value) {
    return (
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-center gap-3">
          {value.sprite && (
            <img
              src={value.sprite}
              alt={value.label}
              className="h-12 w-12 shrink-0 object-contain"
            />
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/pokedex/${value.slug}`}
              className="truncate font-bold text-slate-800 hover:text-emerald-600 dark:text-slate-100"
            >
              {value.label}
            </Link>
            <div className="mt-1 flex flex-wrap gap-1">
              {value.types.map((t) => (
                <TypePill key={t} type={t} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${value.label}`}
            className="shrink-0 rounded-full px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            ×
          </button>
        </div>
        {typedForms.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => pickForm(null)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition ${
                formName === null
                  ? "bg-emerald-500 text-white ring-emerald-500"
                  : "bg-white text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
              }`}
            >
              Base
            </button>
            {typedForms.map((f) => (
              <button
                key={f.formName}
                type="button"
                onClick={() => pickForm(f.formName)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition ${
                  formName === f.formName
                    ? "bg-emerald-500 text-white ring-emerald-500"
                    : "bg-white text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700"
                }`}
              >
                {f.formName}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <SpeciesPicker
        label={label}
        placeholder={placeholder}
        excludeIds={excludeIds}
        onPick={pickSpecies}
      />
    </div>
  );
}
