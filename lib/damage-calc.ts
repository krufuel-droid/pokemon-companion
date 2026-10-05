/**
 * Shared Pokémon damage calculator — the same Gen 7+ math behind the
 * Advanced damage calculator UI (`app/tools/damage-calc/advanced.tsx`).
 *
 * This module is UI-free so it can run on the server (API routes, scripts).
 * If you change the formula here, the UI picks it up automatically since it
 * calls `calculateDamage` too — keep the two in sync by keeping the logic here.
 *
 * Mega Evolutions: combatant species accept Mega form names
 * ("Mega Lucario", case-insensitive) via `resolveCombatant`. Mega base
 * stats come from `FORM_STATS` (`@/lib/data/form-stats`) and Mega type
 * changes from `@/lib/data/forms`. Mega abilities are NOT modeled —
 * pass the ability explicitly (e.g. "Adaptability" for Mega Lucario).
 */

import { effectiveness } from "@/lib/typechart";
import { getSpeciesById, searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { NATURES } from "@/lib/data/natures";
import { PINCH_ABILITY_TYPE } from "@/lib/data/damage-mods";
import { FORM_STATS } from "@/lib/data/form-stats";
import { getFormsForSpecies } from "@/lib/data/forms";

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export const STAT_KEYS: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"];

const BASE_KEYS: Record<StatKey, string> = {
  hp: "hp",
  atk: "attack",
  def: "defense",
  spa: "special-attack",
  spd: "special-defense",
  spe: "speed",
};

// lib/data/natures.ts uses display names like "Attack", "Sp. Atk".
const NATURE_TO_KEY: Record<string, StatKey> = {
  Attack: "atk",
  Defense: "def",
  "Sp. Atk": "spa",
  "Sp. Def": "spd",
  Speed: "spe",
};

export interface CombatantInput {
  /** Pokédex number, species name (case-insensitive), or null for "no Pokémon picked". */
  species: string | number | null;
  level?: number;
  nature?: string;
  ability?: string;
  item?: string;
  /** e.g. "Healthy", "Burned", "Paralyzed", "Poisoned", "Asleep", "Frozen" */
  status?: string;
  evs?: Partial<Record<StatKey, number>>;
  ivs?: Partial<Record<StatKey, number>>;
  /**
   * Stat stages -6..+6 (default 0 each). Applied to the attacking /
   * defending stat in damage (atk/def for physical, spa/spd for special);
   * spe stages are consumed by speed tools. Stages compose
   * multiplicatively with ability/item/status stat modifiers, as in-game.
   */
  boosts?: Partial<Record<"atk" | "def" | "spa" | "spd" | "spe", number>>;
  /**
   * Attacker: Tera type. A move matching it gets ×2 STAB instead of ×1.5.
   * Stellar is not modeled (falls back to natural STAB) — noted in API docs.
   */
  teraType?: string;
  /** Attacker: is its pinch ability (Overgrow etc.) active? */
  pinchActive?: boolean;
  /** Defender: not fully evolved (Eviolite check). */
  notFullyEvolved?: boolean;
  /** Defender: current HP for KO math (defaults to full). */
  currentHp?: number | null;
}

export interface MoveInput {
  power: number;
  /** e.g. "Fire" */
  type: string;
  category: "physical" | "special";
}

export interface FieldInput {
  weather?: string;
  terrain?: string;
  reflect?: boolean;
  lightScreen?: boolean;
  crit?: boolean;
  stab?: "auto" | "on" | "off";
  /** "auto" or an explicit multiplier (0, 0.25, 0.5, 1, 2, 4). */
  effectiveness?: "auto" | number;
  /**
   * Doubles spread modifier (Targets, Gen 7+: ×0.75 per target when a move
   * hits multiple targets). Set automatically by `calculateDoublesTurn`;
   * never on by default, so existing singles callers are unaffected.
   */
  spread?: boolean;
}

export interface DamageCalcInput {
  attacker: CombatantInput;
  defender: CombatantInput;
  move: MoveInput;
  field?: FieldInput;
}

export interface DamageCalcResult {
  attacker: string;
  defender: string;
  attackStat: number;
  defenseStat: number;
  baseDamage: number;
  effectiveness: number;
  /** Effectiveness before any manual override — shown next to "Auto". */
  autoEffectiveness: number;
  stab: boolean;
  rolls: number[];
  minRoll: number;
  maxRoll: number;
  minPct: string;
  maxPct: string;
  targetHp: number;
  maxHp: number;
  koSummary: string;
  modifiers: string[];
  echo: string;
}

export function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

/** Gen 7+ stat formula. */
export function calcStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureMult: number,
  isHp: boolean,
): number {
  const ev4 = Math.floor(clamp(ev, 0, 252) / 4);
  const ivc = clamp(iv, 0, 31);
  if (isHp) {
    return Math.floor(((2 * base + ivc + ev4) * level) / 100) + level + 10;
  }
  return Math.floor(
    (Math.floor(((2 * base + ivc + ev4) * level) / 100) + 5) * natureMult,
  );
}

export function natureMultFor(natureName: string, key: StatKey): number {
  const n = NATURES.find((x) => x.name === natureName);
  if (!n || !n.raises || !n.lowers) return 1;
  if (NATURE_TO_KEY[n.raises] === key) return 1.1;
  if (NATURE_TO_KEY[n.lowers] === key) return 0.9;
  return 1;
}

export function baseOf(
  species: SpeciesIndex | null,
  key: StatKey,
  formName?: string | null,
): number {
  if (formName) {
    const mega = FORM_STATS[formName];
    // FORM_STATS order: [HP, Attack, Defense, Sp. Atk, Sp. Def, Speed].
    if (mega) return mega[STAT_KEYS.indexOf(key)];
  }
  const full = species ? getSpeciesById(species.id) : undefined;
  return full?.baseStats.find((s) => s.key === BASE_KEYS[key])?.value ?? 100;
}

function fullStats(
  species: SpeciesIndex | null,
  level: number,
  nature: string,
  evs: Partial<Record<StatKey, number>>,
  ivs: Partial<Record<StatKey, number>>,
  formName?: string | null,
): Record<StatKey, number> {
  const out = {} as Record<StatKey, number>;
  for (const k of STAT_KEYS) {
    out[k] = calcStat(
      baseOf(species, k, formName),
      ivs[k] ?? 31,
      evs[k] ?? 0,
      clamp(level, 1, 100),
      natureMultFor(nature, k),
      k === "hp",
    );
  }
  return out;
}

/** Full 6-stat spread for a combatant (UI stat displays). */
export function combatantStats(
  species: SpeciesIndex | null,
  level: number,
  nature: string,
  evs: Partial<Record<StatKey, number>>,
  ivs: Partial<Record<StatKey, number>>,
  formName?: string | null,
): Record<StatKey, number> {
  return fullStats(species, level, nature, evs, ivs, formName);
}

/** Stat-stage multiplier for stages -6..+6 (Gen 7+). */
export function stageMult(stage: number): number {
  const s = clamp(Math.round(stage), -6, 6);
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
}

/** Probability that `hits` rolls (each equally likely) KO a target with `hp`. */
function koChance(rolls: number[], hp: number, hits: number): number {
  let dist = new Map<number, number>([[0, 1]]);
  for (let h = 0; h < hits; h++) {
    const next = new Map<number, number>();
    for (const [total, count] of dist) {
      for (const r of rolls) {
        const t = total + r;
        next.set(t, (next.get(t) ?? 0) + count);
      }
    }
    dist = next;
  }
  const combos = Math.pow(rolls.length, hits);
  let ko = 0;
  for (const [total, count] of dist) {
    if (total >= hp) ko += count;
  }
  return ko / combos;
}

const fmtPct = (p: number) =>
  `${(p * 100).toFixed(p * 100 < 10 && p > 0 ? 1 : 0)}%`;

/** Resolve a species id or name to a SpeciesIndex; null/blank → null; throws on no match. */
export function resolveSpecies(ref: string | number | null | undefined): SpeciesIndex | null {
  if (ref === null || ref === undefined) return null;
  if (typeof ref === "number" || /^\d+$/.test(String(ref).trim())) {
    const s = getSpeciesById(Number(ref));
    if (s) return s;
    throw new Error(`Unknown species id: ${ref}`);
  }
  const q = String(ref).trim().toLowerCase();
  if (!q) return null;
  const hits = searchSpecies(q);
  const exact =
    hits.find((h) => h.name.toLowerCase() === q) ?? hits[0];
  if (!exact) throw new Error(`Unknown species: ${ref}`);
  const full = getSpeciesById(exact.id);
  if (!full) throw new Error(`Unknown species: ${ref}`);
  return full;
}

/**
 * Mega form names ("Mega Lucario", case-insensitive) mapped to their base
 * species id. Only forms with real stats in FORM_STATS resolve — currently
 * the 47 classic Mega Evolutions (Champions-original Megas have no modeled
 * stats yet).
 */
const MEGA_FORM_TO_ID = new Map<string, number>();
for (let id = 1; id <= 1025; id++) {
  for (const form of getFormsForSpecies(id)) {
    if (form.kind === "mega" && FORM_STATS[form.formName] !== undefined) {
      MEGA_FORM_TO_ID.set(form.formName.toLowerCase(), id);
    }
  }
}

export interface ResolvedCombatant {
  /** Base species (e.g. Lucario for "Mega Lucario"). */
  species: SpeciesIndex;
  /** Canonical Mega form name (e.g. "Mega Lucario"), or null for base form. */
  formName: string | null;
}

/**
 * Like `resolveSpecies`, but also accepts Mega form names ("Mega Lucario",
 * case-insensitive). Null/blank → null; throws on no match.
 */
export function resolveCombatant(
  ref: string | number | null | undefined,
): ResolvedCombatant | null {
  if (ref === null || ref === undefined) return null;
  if (typeof ref !== "number") {
    const q = String(ref).trim().toLowerCase();
    if (q) {
      const megaId = MEGA_FORM_TO_ID.get(q);
      if (megaId !== undefined) {
        const species = getSpeciesById(megaId);
        if (!species) throw new Error(`Unknown species: ${ref}`);
        const form = getFormsForSpecies(megaId).find(
          (f) => f.kind === "mega" && f.formName.toLowerCase() === q,
        );
        return { species, formName: form?.formName ?? String(ref).trim() };
      }
    }
  }
  const species = resolveSpecies(ref);
  return species ? { species, formName: null } : null;
}

/** Capitalize a lowercase type name ("fire" → "Fire"). */
const capType = (t: string) =>
  t.length > 0 ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;

/**
 * A combatant's types, with Mega type changes applied
 * (e.g. Mega Charizard X → Fire/Dragon). Falls back to base species types.
 */
export function combatantTypes(combatant: ResolvedCombatant | null): string[] {
  if (!combatant) return [];
  if (combatant.formName) {
    const form = getFormsForSpecies(combatant.species.id).find(
      (f) => f.formName === combatant.formName,
    );
    if (form?.types) return form.types.map(capType);
  }
  return combatant.species.types ?? [];
}

export function calculateDamage(input: DamageCalcInput): DamageCalcResult {
  const atk = resolveCombatant(input.attacker.species);
  const def = resolveCombatant(input.defender.species);
  const attacker = atk?.species ?? null;
  const defender = def?.species ?? null;
  const atkTypes = combatantTypes(atk);
  const defTypesAll = combatantTypes(def);
  const atkName = atk?.formName ?? attacker?.name ?? "Attacker";
  const defName = def?.formName ?? defender?.name ?? "Defender";

  const atkLevel = clamp(input.attacker.level ?? 50, 1, 100);
  const defLevel = clamp(input.defender.level ?? 50, 1, 100);
  const atkNature = input.attacker.nature ?? "Hardy";
  const defNature = input.defender.nature ?? "Hardy";
  const atkAbility = input.attacker.ability ?? "None";
  const defAbility = input.defender.ability ?? "None";
  const atkItem = input.attacker.item ?? "None";
  const defItem = input.defender.item ?? "None";
  const atkStatus = input.attacker.status ?? "Healthy";
  const defStatus = input.defender.status ?? "Healthy";
  const pinchActive = input.attacker.pinchActive ?? false;
  const nfu = input.defender.notFullyEvolved ?? false;

  const field = input.field ?? {};
  const weather = field.weather ?? "None";
  const terrain = field.terrain ?? "None";
  const reflect = field.reflect ?? false;
  const lightScreen = field.lightScreen ?? false;
  const crit = field.crit ?? false;
  const stabMode = field.stab ?? "auto";
  const effOverride = field.effectiveness ?? "auto";

  const pwr = Math.max(0, Math.round(Number(input.move.power) || 0));
  const moveType = input.move.type;
  const physical = input.move.category === "physical";

  const atkStats = fullStats(
    attacker,
    atkLevel,
    atkNature,
    input.attacker.evs ?? {},
    input.attacker.ivs ?? {},
    atk?.formName,
  );
  const defStats = fullStats(
    defender,
    defLevel,
    defNature,
    input.defender.evs ?? {},
    input.defender.ivs ?? {},
    def?.formName,
  );
  const maxHp = defStats.hp;
  const targetHp = Math.max(1, input.defender.currentHp ?? maxHp);

  // --- Attack stat: stages first, then ability/item/status modifiers ---
  // (in-game order — stages modify the stat, the rest chain-multiply).
  const atkBoost = clamp(Math.round(input.attacker.boosts?.[physical ? "atk" : "spa"] ?? 0), -6, 6);
  const defBoost = clamp(Math.round(input.defender.boosts?.[physical ? "def" : "spd"] ?? 0), -6, 6);
  const fmtStageMult = (m: number) =>
    Number.isInteger(m) ? String(m) : String(Math.round(m * 1000) / 1000);
  let A = Math.floor(atkStats[physical ? "atk" : "spa"] * stageMult(atkBoost));
  const statMods: string[] = [];
  if (atkBoost !== 0) {
    statMods.push(
      `${physical ? "Atk" : "SpA"} ${atkBoost > 0 ? "+" : ""}${atkBoost} ×${fmtStageMult(stageMult(atkBoost))}`,
    );
  }
  if ((atkAbility === "Huge Power" || atkAbility === "Pure Power") && physical) {
    A = Math.floor(A * 2);
    statMods.push(`${atkAbility} ×2`);
  }
  if (atkAbility === "Hustle" && physical) {
    A = Math.floor(A * 1.5);
    statMods.push("Hustle ×1.5");
  }
  if (atkAbility === "Guts" && atkStatus !== "Healthy" && physical) {
    A = Math.floor(A * 1.5);
    statMods.push("Guts ×1.5");
  }
  if (atkItem === "Choice Band" && physical) {
    A = Math.floor(A * 1.5);
    statMods.push("Choice Band ×1.5");
  }
  if (atkItem === "Choice Specs" && !physical) {
    A = Math.floor(A * 1.5);
    statMods.push("Choice Specs ×1.5");
  }
  if (physical && atkStatus === "Burned" && atkAbility !== "Guts") {
    A = Math.floor(A * 0.5);
    statMods.push("Burn ×0.5");
  }

  // --- Defense stat: stages first, then ability/item/weather modifiers ---
  let D = Math.floor(defStats[physical ? "def" : "spd"] * stageMult(defBoost));
  if (defBoost !== 0) {
    statMods.push(
      `${physical ? "Def" : "SpD"} ${defBoost > 0 ? "+" : ""}${defBoost} ×${fmtStageMult(stageMult(defBoost))}`,
    );
  }
  if (defItem === "Eviolite" && nfu) {
    D = Math.floor(D * 1.5);
    statMods.push("Eviolite ×1.5");
  }
  if (defItem === "Assault Vest" && !physical) {
    D = Math.floor(D * 1.5);
    statMods.push("Assault Vest ×1.5");
  }
  if (defAbility === "Fur Coat" && physical) {
    D = D * 2;
    statMods.push("Fur Coat ×2");
  }
  if (defAbility === "Marvel Scale" && defStatus !== "Healthy" && physical) {
    D = Math.floor(D * 1.5);
    statMods.push("Marvel Scale ×1.5");
  }
  if (weather === "Sandstorm" && !physical && defTypesAll.includes("Rock")) {
    D = Math.floor(D * 1.5);
    statMods.push("Sandstorm SpD ×1.5");
  }
  if (weather === "Snow" && physical && defTypesAll.includes("Ice")) {
    D = Math.floor(D * 1.5);
    statMods.push("Snow Def ×1.5");
  }
  A = Math.max(1, A);
  D = Math.max(1, D);

  // --- Base damage (Gen 5+ formula) ---
  let dmg = Math.floor((2 * atkLevel) / 5 + 2);
  dmg = Math.floor((dmg * pwr * A) / D);
  dmg = Math.floor(dmg / 50) + 2;

  const mods: string[] = [...statMods];

  // Doubles spread (Targets modifier — Gen 7+: ×0.75 per target when a move
  // hits multiple targets). Only set via calculateDoublesTurn.
  if (field.spread) {
    dmg = Math.floor(dmg * 0.75);
    mods.push("Spread ×0.75");
  }

  // Weather
  if (weather === "Harsh Sunlight") {
    if (moveType === "Fire") {
      dmg = Math.floor(dmg * 1.5);
      mods.push("Sun ×1.5");
    } else if (moveType === "Water") {
      dmg = Math.floor(dmg * 0.5);
      mods.push("Sun ×0.5");
    }
  } else if (weather === "Rain") {
    if (moveType === "Water") {
      dmg = Math.floor(dmg * 1.5);
      mods.push("Rain ×1.5");
    } else if (moveType === "Fire") {
      dmg = Math.floor(dmg * 0.5);
      mods.push("Rain ×0.5");
    }
  }
  // Crit (Gen 6+: ×1.5)
  if (crit) {
    dmg = Math.floor(dmg * 1.5);
    mods.push("Crit ×1.5");
  }
  // STAB. Tera rule: a move matching the attacker's Tera type gets ×2
  // instead of ×1.5. Stellar is explicitly not modeled (falls back to
  // natural STAB). field.stab "off" forces no STAB; "on" forces ×1.5 as
  // before — the Tera ×2 needs attacker.teraType set, not stab:"on".
  const teraNorm = (input.attacker.teraType ?? "").trim();
  const teraActive =
    teraNorm !== "" && teraNorm.toLowerCase() !== "stellar";
  const teraMatch =
    teraActive && teraNorm.toLowerCase() === moveType.toLowerCase();
  let stab = false;
  let stabMult = 1;
  let teraStab = false;
  if (stabMode === "off") {
    stab = false;
  } else if (stabMode === "on") {
    stab = true;
    stabMult = atkAbility === "Adaptability" ? 2 : 1.5;
  } else if (teraMatch) {
    stab = true;
    stabMult = 2;
    teraStab = true;
  } else if (atkTypes.includes(moveType)) {
    stab = true;
    stabMult = atkAbility === "Adaptability" ? 2 : 1.5;
  }
  if (stab) {
    dmg = Math.floor(dmg * stabMult);
    mods.push(`STAB ×${stabMult}${teraStab ? " (Tera)" : ""}`);
  }
  // Type effectiveness
  const defTypes = [defTypesAll[0], defTypesAll[1]].filter(
    (t): t is string => !!t,
  );
  const autoEff = defTypes.length > 0 ? effectiveness(moveType, defTypes) : 1;
  const eff = effOverride === "auto" ? autoEff : Number(effOverride);
  dmg = Math.floor(dmg * eff);
  if (eff !== 1) mods.push(`Effectiveness ×${eff}`);

  // Attacker ability damage modifiers
  const pinchType = PINCH_ABILITY_TYPE[atkAbility];
  if (pinchType && pinchActive && moveType === pinchType) {
    dmg = Math.floor(dmg * 1.5);
    mods.push(`${atkAbility} ×1.5`);
  }
  if (atkAbility === "Technician" && pwr <= 60) {
    dmg = Math.floor(dmg * 1.5);
    mods.push("Technician ×1.5");
  }
  if (atkAbility === "Sheer Force") {
    dmg = Math.floor(dmg * 1.3);
    mods.push("Sheer Force ×1.3");
  }
  if (atkAbility === "Tough Claws") {
    dmg = Math.floor(dmg * 1.3);
    mods.push("Tough Claws ×1.3");
  }
  // Attacker item damage modifiers
  if (atkItem === "Life Orb") {
    dmg = Math.floor(dmg * 1.3);
    mods.push("Life Orb ×1.3");
  }
  if (atkItem === "Expert Belt" && eff > 1) {
    dmg = Math.floor(dmg * 1.2);
    mods.push("Expert Belt ×1.2");
  }
  if (atkItem === "Muscle Band" && physical) {
    dmg = Math.floor(dmg * 1.1);
    mods.push("Muscle Band ×1.1");
  }
  if (atkItem === "Wise Glasses" && !physical) {
    dmg = Math.floor(dmg * 1.1);
    mods.push("Wise Glasses ×1.1");
  }
  if (atkItem === "Type-boosting item" && atkTypes.includes(moveType)) {
    dmg = Math.floor(dmg * 1.2);
    mods.push("Type item ×1.2");
  }
  // Terrain (grounded = defender isn't Flying-type; simplification noted)
  const grounded = !defTypesAll.includes("Flying");
  if (grounded) {
    if (terrain === "Electric" && moveType === "Electric") {
      dmg = Math.floor(dmg * 1.3);
      mods.push("Electric Terrain ×1.3");
    } else if (terrain === "Grassy" && moveType === "Grass") {
      dmg = Math.floor(dmg * 1.3);
      mods.push("Grassy Terrain ×1.3");
    } else if (terrain === "Psychic" && moveType === "Psychic") {
      dmg = Math.floor(dmg * 1.3);
      mods.push("Psychic Terrain ×1.3");
    } else if (terrain === "Misty" && moveType === "Dragon") {
      dmg = Math.floor(dmg * 0.5);
      mods.push("Misty Terrain ×0.5");
    }
  }
  // Screens
  if (physical && reflect) {
    dmg = Math.floor(dmg * 0.5);
    mods.push("Reflect ×0.5");
  }
  if (!physical && lightScreen) {
    dmg = Math.floor(dmg * 0.5);
    mods.push("Light Screen ×0.5");
  }
  // Defender abilities
  const atFullHp = targetHp >= maxHp;
  if ((defAbility === "Multiscale" || defAbility === "Shadow Shield") && atFullHp) {
    dmg = Math.floor(dmg * 0.5);
    mods.push(`${defAbility} ×0.5`);
  }
  if (
    (defAbility === "Filter" ||
      defAbility === "Solid Rock" ||
      defAbility === "Prism Armor") &&
    eff > 1
  ) {
    dmg = Math.floor(dmg * 0.75);
    mods.push(`${defAbility} ×0.75`);
  }
  if (defAbility === "Thick Fat" && (moveType === "Fire" || moveType === "Ice")) {
    dmg = Math.floor(dmg * 0.5);
    mods.push("Thick Fat ×0.5");
  }

  // 16 random rolls: 85%–100%.
  const rolls: number[] = [];
  for (let r = 85; r <= 100; r++) {
    rolls.push(Math.floor((dmg * r) / 100));
  }
  const min = Math.min(...rolls);
  const max = Math.max(...rolls);
  const toPct = (d: number) => ((d / targetHp) * 100).toFixed(1);

  // KO summary (Showdown-style).
  const sash = defItem === "Focus Sash" && atFullHp;
  let koSummary: string;
  if (max <= 0) {
    koSummary = `No effect — ${moveType} can't damage ${defName}.`;
  } else if (sash && max >= targetHp) {
    koSummary = `Focus Sash blocks the OHKO — best roll ${max} (${toPct(max)}%) leaves 1 HP.`;
  } else {
    const p1 = koChance(rolls, targetHp, 1);
    if (p1 === 1) {
      koSummary = "Guaranteed OHKO 🎯";
    } else if (p1 > 0) {
      koSummary = `${fmtPct(p1)} chance to OHKO`;
    } else {
      const p2 = koChance(rolls, targetHp, 2);
      if (p2 === 1) koSummary = "Guaranteed 2HKO";
      else if (p2 > 0) koSummary = `${fmtPct(p2)} chance to 2HKO`;
      else {
        const p3 = koChance(rolls, targetHp, 3);
        if (p3 === 1) koSummary = "Guaranteed 3HKO";
        else if (p3 > 0) koSummary = `${fmtPct(p3)} chance to 3HKO`;
        else koSummary = `${Math.ceil(targetHp / max)} hits to KO at max rolls`;
      }
    }
  }

  return {
    attacker: atkName,
    defender: defName,
    attackStat: A,
    defenseStat: D,
    baseDamage: dmg,
    effectiveness: eff,
    autoEffectiveness: autoEff,
    stab,
    rolls,
    minRoll: min,
    maxRoll: max,
    minPct: toPct(min),
    maxPct: toPct(max),
    targetHp,
    maxHp,
    koSummary,
    modifiers: mods,
    echo: `${atkName} Lv ${atkLevel} (${atkNature}) → ${defName} Lv ${defLevel} (${defNature}) · ${pwr} power ${moveType} (${input.move.category}) · Atk ${A} / Def ${D}`,
  };
}

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

/** Which slot(s) a doubles move hits. "both-foes" applies the ×0.75 spread modifier. */
export type DoublesTarget = "foe1" | "foe2" | "both-foes" | "ally";

export interface DoublesCalcInput {
  attacker: CombatantInput;
  /**
   * Optional ally next to the attacker. Accepted for targeting context
   * (target: "ally"); ally abilities such as Friend Guard are NOT modeled.
   */
  ally?: CombatantInput | null;
  /** Exactly two defenders: [foe1, foe2]. */
  defenders: CombatantInput[];
  move: MoveInput;
  /** Which slot(s) the move hits. */
  target: DoublesTarget;
  /** Weather/terrain/screens apply battle-wide, exactly as in singles. */
  field?: FieldInput;
}

export interface DoublesTargetResult {
  slot: "foe1" | "foe2" | "ally";
  /** Full single-target result (rolls, percentages, KO summary) for this slot. */
  result: DamageCalcResult;
  spreadApplied: boolean;
}

export interface DoublesCalcResult {
  format: "doubles";
  attacker: string;
  move: MoveInput;
  target: DoublesTarget;
  spreadApplied: boolean;
  targets: DoublesTargetResult[];
  notes: string[];
}

/**
 * Doubles turn damage: runs the standard singles math once per targeted
 * slot (reusing `calculateDamage` — the formula is never reimplemented),
 * applying the Gen 7+ ×0.75 spread modifier when the move hits both foes.
 *
 * Honest limitations: no redirect moves (Follow Me / Rage Powder always
 * send every hit to one target in-game), no ally abilities (Friend Guard),
 * no spread onto the ally's slot.
 */
export function calculateDoublesTurn(input: DoublesCalcInput): DoublesCalcResult {
  const defs = input.defenders;
  if (!Array.isArray(defs) || defs.length !== 2) {
    throw new Error("Doubles calc needs exactly two defenders: [foe1, foe2].");
  }
  const target = input.target;
  if (
    target !== "foe1" &&
    target !== "foe2" &&
    target !== "both-foes" &&
    target !== "ally"
  ) {
    throw new Error(
      `Doubles target must be "foe1", "foe2", "both-foes", or "ally". Got: ${String(target)}`,
    );
  }
  if (target === "ally" && !input.ally?.species) {
    throw new Error('Target "ally" needs an ally Pokémon.');
  }

  const spreadApplied = target === "both-foes";
  const field: FieldInput = { ...(input.field ?? {}), spread: spreadApplied };

  const slots: Array<{ slot: "foe1" | "foe2" | "ally"; combatant: CombatantInput }> = [];
  if (target === "foe1") slots.push({ slot: "foe1", combatant: defs[0] });
  else if (target === "foe2") slots.push({ slot: "foe2", combatant: defs[1] });
  else if (target === "both-foes") {
    slots.push({ slot: "foe1", combatant: defs[0] });
    slots.push({ slot: "foe2", combatant: defs[1] });
  } else {
    slots.push({ slot: "ally", combatant: input.ally as CombatantInput });
  }

  const targets: DoublesTargetResult[] = slots.map(({ slot, combatant }) => ({
    slot,
    spreadApplied,
    result: calculateDamage({
      attacker: input.attacker,
      defender: combatant,
      move: input.move,
      field,
    }),
  }));

  const notes: string[] = [];
  if (spreadApplied) {
    notes.push("Spread move: ×0.75 damage to each target (Gen 7+).");
  }
  notes.push(
    "No redirect moves modeled — in-game, Follow Me / Rage Powder send every hit to one target.",
  );

  const doublesAttacker = resolveCombatant(input.attacker.species);

  return {
    format: "doubles",
    attacker:
      doublesAttacker?.formName ?? doublesAttacker?.species.name ?? "Attacker",
    move: input.move,
    target,
    spreadApplied,
    targets,
    notes,
  };
}
