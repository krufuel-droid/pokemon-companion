"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TYPES, effectiveness } from "@/lib/typechart";
import {
  getSpeciesById,
  type SpeciesIndex,
} from "@/lib/pokedex";
import { NATURES } from "@/lib/data/natures";
import {
  ATTACKER_ABILITIES,
  DEFENDER_ABILITIES,
  ATTACKER_ITEMS,
  DEFENDER_ITEMS,
  STATUSES,
  WEATHERS,
  TERRAINS,
  PINCH_ABILITY_TYPE,
  type DamageMod,
} from "@/lib/data/damage-mods";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";
import {
  inputCls,
  labelCls,
  sectionCls,
  NONE,
  TypePill,
  SpeciesPicker,
} from "./shared";

type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
const STAT_KEYS: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};
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

const EFF_OPTIONS = ["auto", "0", "0.25", "0.5", "1", "2", "4"] as const;

function clamp(v: number, lo: number, hi: number): number {
  if (Number.isNaN(v)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

/** Gen 7+ stat formula. */
function calcStat(
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

function natureMultFor(natureName: string, key: StatKey): number {
  const n = NATURES.find((x) => x.name === natureName);
  if (!n || !n.raises || !n.lowers) return 1;
  if (NATURE_TO_KEY[n.raises] === key) return 1.1;
  if (NATURE_TO_KEY[n.lowers] === key) return 0.9;
  return 1;
}

function baseOf(species: SpeciesIndex | null, key: StatKey): number {
  const full = species ? getSpeciesById(species.id) : undefined;
  return full?.baseStats.find((s) => s.key === BASE_KEYS[key])?.value ?? 100;
}

function emptyEvs(): Record<StatKey, number> {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
}
function fullIvs(): Record<StatKey, number> {
  return { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
}

function effLabel(eff: number): string {
  if (eff === 0) return "no effect";
  if (eff < 1) return "not very effective";
  if (eff > 1) return "super effective";
  return "neutral";
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

function EvIvGrid({
  evs,
  ivs,
  onEv,
  onIv,
}: {
  evs: Record<StatKey, number>;
  ivs: Record<StatKey, number>;
  onEv: (k: StatKey, v: number) => void;
  onIv: (k: StatKey, v: number) => void;
}) {
  const total = STAT_KEYS.reduce((s, k) => s + (evs[k] || 0), 0);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {STAT_KEYS.map((k) => (
          <div
            key={k}
            className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/60"
          >
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {STAT_LABELS[k]}
            </div>
            <label className="mt-1 flex items-center gap-1">
              <span className="w-4 text-[10px] font-semibold text-slate-400">
                EV
              </span>
              <input
                type="number"
                min={0}
                max={252}
                value={evs[k]}
                onChange={(e) => onEv(k, clamp(e.target.valueAsNumber, 0, 252))}
                className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="mt-1 flex items-center gap-1">
              <span className="w-4 text-[10px] font-semibold text-slate-400">
                IV
              </span>
              <input
                type="number"
                min={0}
                max={31}
                value={ivs[k]}
                onChange={(e) => onIv(k, clamp(e.target.valueAsNumber, 0, 31))}
                className="w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
          </div>
        ))}
      </div>
      <p
        className={`mt-1.5 text-xs font-semibold ${total > 510 ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}
      >
        {total}/510 EVs{total > 510 ? " — over the cap!" : ""}
      </p>
    </div>
  );
}

function ModSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly (DamageMod | string)[];
  onChange: (v: string) => void;
}) {
  const desc = (() => {
    const o = options.find((x) =>
      typeof x === "string" ? x === value : x.name === value,
    );
    return typeof o === "object" ? o?.desc : null;
  })();
  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => {
          const name = typeof o === "string" ? o : o.name;
          return (
            <option key={name} value={name}>
              {name}
            </option>
          );
        })}
      </select>
      {desc && (
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
          {desc}
        </p>
      )}
    </div>
  );
}

function Check({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded accent-emerald-600"
      />
      {label}
    </label>
  );
}

export default function AdvancedCalc() {
  const defaultAttacker = getSpeciesById(6) ?? null;
  const defaultDefender = getSpeciesById(3) ?? null;

  // --- Attacker ---
  const [attacker, setAttacker] = useState<SpeciesIndex | null>(defaultAttacker);
  const [atkLevel, setAtkLevel] = useState(50);
  const [atkNature, setAtkNature] = useState("Modest");
  const [atkAbility, setAtkAbility] = useState("None");
  const [atkItem, setAtkItem] = useState("None");
  const [atkStatus, setAtkStatus] = useState<string>("Healthy");
  const [atkEvs, setAtkEvs] = useState<Record<StatKey, number>>(emptyEvs);
  const [atkIvs, setAtkIvs] = useState<Record<StatKey, number>>(fullIvs);
  const [pinchActive, setPinchActive] = useState(false);

  // --- Defender ---
  const [defender, setDefender] = useState<SpeciesIndex | null>(defaultDefender);
  const [defLevel, setDefLevel] = useState(50);
  const [defNature, setDefNature] = useState("Calm");
  const [defAbility, setDefAbility] = useState("None");
  const [defItem, setDefItem] = useState("None");
  const [defStatus, setDefStatus] = useState<string>("Healthy");
  const [defEvs, setDefEvs] = useState<Record<StatKey, number>>(emptyEvs);
  const [defIvs, setDefIvs] = useState<Record<StatKey, number>>(fullIvs);
  const [nfu, setNfu] = useState(false); // not fully evolved (Eviolite)
  const [currentHp, setCurrentHp] = useState<number | null>(null);

  // --- Move ---
  const [power, setPower] = useState(90);
  const [moveType, setMoveType] = useState("Fire");
  const [category, setCategory] = useState<"physical" | "special">("special");
  const [stabMode, setStabMode] = useState<"auto" | "on" | "off">("auto");
  const [crit, setCrit] = useState(false);
  const [effOverride, setEffOverride] = useState<(typeof EFF_OPTIONS)[number]>(
    "auto",
  );

  // --- Field ---
  const [weather, setWeather] = useState<string>("None");
  const [terrain, setTerrain] = useState<string>("None");
  const [reflect, setReflect] = useState(false);
  const [lightScreen, setLightScreen] = useState(false);

  const [hasCalculated, setHasCalculated] = useState(false);
  const firedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(
      ({ data }: { data: { user?: { id?: string } | null } }) => {
        userIdRef.current = data.user?.id ?? null;
      },
    );
  }, []);

  // Derived stats (Gen 7+ formula).
  const atkStats = useMemo(() => {
    const out = {} as Record<StatKey, number>;
    for (const k of STAT_KEYS) {
      out[k] = calcStat(
        baseOf(attacker, k),
        atkIvs[k],
        atkEvs[k],
        clamp(atkLevel, 1, 100),
        natureMultFor(atkNature, k),
        k === "hp",
      );
    }
    return out;
  }, [attacker, atkLevel, atkNature, atkEvs, atkIvs]);

  const defStats = useMemo(() => {
    const out = {} as Record<StatKey, number>;
    for (const k of STAT_KEYS) {
      out[k] = calcStat(
        baseOf(defender, k),
        defIvs[k],
        defEvs[k],
        clamp(defLevel, 1, 100),
        natureMultFor(defNature, k),
        k === "hp",
      );
    }
    return out;
  }, [defender, defLevel, defNature, defEvs, defIvs]);

  const maxHp = defStats.hp;
  const targetHp = Math.max(1, currentHp ?? maxHp);

  function pickDefender(s: SpeciesIndex | null) {
    setDefender(s);
    setCurrentHp(null); // reset to full for the new defender
  }

  const setEv = (
    which: "atk" | "def",
    k: StatKey,
    v: number,
  ) => {
    const set = which === "atk" ? setAtkEvs : setDefEvs;
    set((prev) => ({ ...prev, [k]: v }));
  };
  const setIv = (
    which: "atk" | "def",
    k: StatKey,
    v: number,
  ) => {
    const set = which === "atk" ? setAtkIvs : setDefIvs;
    set((prev) => ({ ...prev, [k]: v }));
  };

  const calc = useMemo(() => {
    const lvl = clamp(atkLevel, 1, 100);
    const pwr = Math.max(0, Math.round(Number(power) || 0));
    const physical = category === "physical";

    // --- Attack stat with ability/item/status modifiers ---
    let A = atkStats[physical ? "atk" : "spa"];
    const statMods: string[] = [];
    if (
      (atkAbility === "Huge Power" || atkAbility === "Pure Power") &&
      physical
    ) {
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

    // --- Defense stat with ability/item/weather modifiers ---
    let D = defStats[physical ? "def" : "spd"];
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
    if (
      weather === "Sandstorm" &&
      !physical &&
      defender?.types.includes("Rock")
    ) {
      D = Math.floor(D * 1.5);
      statMods.push("Sandstorm SpD ×1.5");
    }
    if (weather === "Snow" && physical && defender?.types.includes("Ice")) {
      D = Math.floor(D * 1.5);
      statMods.push("Snow Def ×1.5");
    }
    A = Math.max(1, A);
    D = Math.max(1, D);

    // --- Base damage (Gen 5+ formula) ---
    let dmg = Math.floor((2 * lvl) / 5 + 2);
    dmg = Math.floor((dmg * pwr * A) / D);
    dmg = Math.floor(dmg / 50) + 2;

    const mods: string[] = [...statMods];

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
    // STAB
    const stab =
      stabMode === "on" ||
      (stabMode === "auto" && (attacker?.types.includes(moveType) ?? false));
    if (stab) {
      const mult = atkAbility === "Adaptability" ? 2 : 1.5;
      dmg = Math.floor(dmg * mult);
      mods.push(`STAB ×${mult}`);
    }
    // Type effectiveness
    const defTypes = [defender?.types[0], defender?.types[1]].filter(
      (t): t is string => !!t,
    );
    const autoEff = defTypes.length > 0 ? effectiveness(moveType, defTypes) : 1;
    const eff = effOverride === "auto" ? autoEff : Number(effOverride);
    dmg = Math.floor(dmg * eff);
    if (eff !== 1) mods.push(`Effectiveness ×${eff}`);
    // Burn (already applied to the stat above; listed here for clarity is
    // handled via statMods — no double application.)

    // Ability damage modifiers
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
    // Item damage modifiers
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
    if (atkItem === "Type-boosting item" && attacker?.types.includes(moveType)) {
      dmg = Math.floor(dmg * 1.2);
      mods.push("Type item ×1.2");
    }
    // Terrain (grounded = defender isn't Flying-type; simplification noted)
    const grounded = !(defender?.types.includes("Flying") ?? false);
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
    if (
      (defAbility === "Multiscale" || defAbility === "Shadow Shield") &&
      atFullHp
    ) {
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
    if (
      defAbility === "Thick Fat" &&
      (moveType === "Fire" || moveType === "Ice")
    ) {
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
      koSummary = `No effect — ${moveType} can't damage ${defender?.name ?? "the defender"}.`;
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
      A,
      D,
      base: dmg,
      autoEff,
      eff,
      rolls,
      min,
      max,
      minPct: toPct(min),
      maxPct: toPct(max),
      targetHp,
      maxHp,
      koSummary,
      mods,
      stab,
      echo: `${attacker?.name ?? "Attacker"} Lv ${lvl} (${atkNature}) → ${defender?.name ?? "Defender"} Lv ${clamp(defLevel, 1, 100)} (${defNature}) · ${pwr} power ${moveType} (${category}) · Atk ${A} / Def ${D}`,
    };
  }, [
    atkLevel,
    power,
    category,
    moveType,
    stabMode,
    crit,
    effOverride,
    weather,
    terrain,
    reflect,
    lightScreen,
    atkAbility,
    atkItem,
    atkStatus,
    pinchActive,
    defAbility,
    defItem,
    defStatus,
    nfu,
    atkStats,
    defStats,
    targetHp,
    maxHp,
    attacker,
    defender,
  ]);

  function handleCalculate() {
    setHasCalculated(true);
    if (!firedRef.current) {
      firedRef.current = true;
      const uid = userIdRef.current;
      if (uid) {
        try {
          void unlockAchievement(uid, "first-calc").catch(() => {});
        } catch {
          // Best-effort; never block the calc.
        }
      }
    }
  }

  const showPinchToggle = !!PINCH_ABILITY_TYPE[atkAbility];

  return (
    <div>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Showdown-style: natures, EVs/IVs, abilities, items, status, weather,
        terrain, and screens — all wired into the Gen 7+ damage formula.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Attacker */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            ⚔️ Attacker
          </h2>
          <div className="mt-4 space-y-4">
            <SpeciesPicker
              label="Attacking Pokémon"
              species={attacker}
              onPick={setAttacker}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="adv-atk-level">
                  Level
                </label>
                <input
                  id="adv-atk-level"
                  type="number"
                  min={1}
                  max={100}
                  className={inputCls}
                  value={atkLevel}
                  onChange={(e) =>
                    setAtkLevel(clamp(e.target.valueAsNumber, 1, 100))
                  }
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="adv-atk-nature">
                  Nature
                </label>
                <select
                  id="adv-atk-nature"
                  className={inputCls}
                  value={atkNature}
                  onChange={(e) => setAtkNature(e.target.value)}
                >
                  {NATURES.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ModSelect
                id="adv-atk-ability"
                label="Ability"
                value={atkAbility}
                options={ATTACKER_ABILITIES}
                onChange={setAtkAbility}
              />
              <ModSelect
                id="adv-atk-item"
                label="Item"
                value={atkItem}
                options={ATTACKER_ITEMS}
                onChange={setAtkItem}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="adv-atk-status">
                Status
              </label>
              <select
                id="adv-atk-status"
                className={inputCls}
                value={atkStatus}
                onChange={(e) => setAtkStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {showPinchToggle && (
              <Check
                id="adv-pinch"
                label={`${atkAbility} active (HP at 1/3 or less)`}
                checked={pinchActive}
                onChange={setPinchActive}
              />
            )}
            <div>
              <span className={labelCls}>EVs / IVs</span>
              <div className="mt-1">
                <EvIvGrid
                  evs={atkEvs}
                  ivs={atkIvs}
                  onEv={(k, v) => setEv("atk", k, v)}
                  onIv={(k, v) => setIv("atk", k, v)}
                />
              </div>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              HP {atkStats.hp} · Atk {atkStats.atk} · Def {atkStats.def} · SpA{" "}
              {atkStats.spa} · SpD {atkStats.spd} · Spe {atkStats.spe}
            </p>
          </div>
        </div>

        {/* Defender */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            🛡️ Defender
          </h2>
          <div className="mt-4 space-y-4">
            <SpeciesPicker
              label="Defending Pokémon"
              species={defender}
              onPick={pickDefender}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="adv-def-level">
                  Level
                </label>
                <input
                  id="adv-def-level"
                  type="number"
                  min={1}
                  max={100}
                  className={inputCls}
                  value={defLevel}
                  onChange={(e) =>
                    setDefLevel(clamp(e.target.valueAsNumber, 1, 100))
                  }
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="adv-def-nature">
                  Nature
                </label>
                <select
                  id="adv-def-nature"
                  className={inputCls}
                  value={defNature}
                  onChange={(e) => setDefNature(e.target.value)}
                >
                  {NATURES.map((n) => (
                    <option key={n.name} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ModSelect
                id="adv-def-ability"
                label="Ability"
                value={defAbility}
                options={DEFENDER_ABILITIES}
                onChange={setDefAbility}
              />
              <ModSelect
                id="adv-def-item"
                label="Item"
                value={defItem}
                options={DEFENDER_ITEMS}
                onChange={setDefItem}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="adv-def-status">
                  Status
                </label>
                <select
                  id="adv-def-status"
                  className={inputCls}
                  value={defStatus}
                  onChange={(e) => setDefStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="adv-def-hp">
                  Current HP
                </label>
                <div className="flex gap-2">
                  <input
                    id="adv-def-hp"
                    type="number"
                    min={1}
                    max={maxHp}
                    className={inputCls}
                    value={currentHp ?? maxHp}
                    onChange={(e) =>
                      setCurrentHp(clamp(e.target.valueAsNumber, 1, maxHp))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentHp(null)}
                    title="Reset to full HP"
                    className="shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    ↺
                  </button>
                </div>
              </div>
            </div>
            {defItem === "Eviolite" && (
              <Check
                id="adv-nfu"
                label="Not fully evolved (Eviolite applies)"
                checked={nfu}
                onChange={setNfu}
              />
            )}
            <div>
              <span className={labelCls}>EVs / IVs</span>
              <div className="mt-1">
                <EvIvGrid
                  evs={defEvs}
                  ivs={defIvs}
                  onEv={(k, v) => setEv("def", k, v)}
                  onIv={(k, v) => setIv("def", k, v)}
                />
              </div>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              HP {defStats.hp} · Atk {defStats.atk} · Def {defStats.def} · SpA{" "}
              {defStats.spa} · SpD {defStats.spd} · Spe {defStats.spe}
            </p>
          </div>
        </div>

        {/* Move */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            💥 Move
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="adv-power">
                Power
              </label>
              <input
                id="adv-power"
                type="number"
                min={0}
                className={inputCls}
                value={power}
                onChange={(e) => setPower(e.target.valueAsNumber)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="adv-mtype">
                Move type
              </label>
              <select
                id="adv-mtype"
                className={inputCls}
                value={moveType}
                onChange={(e) => setMoveType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <span className={labelCls}>Category</span>
            <div className="mt-1 flex rounded-xl border border-slate-300 p-1 dark:border-slate-600">
              {(["physical", "special"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium capitalize transition ${
                    category === c
                      ? "bg-emerald-300 text-slate-800 dark:bg-emerald-600 dark:text-slate-100"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <span className={labelCls}>STAB</span>
            <div className="mt-1 flex rounded-xl border border-slate-300 p-1 dark:border-slate-600">
              {(
                [
                  { v: "auto", label: "Auto" },
                  { v: "on", label: "On" },
                  { v: "off", label: "Off" },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setStabMode(o.v)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
                    stabMode === o.v
                      ? "bg-emerald-300 text-slate-800 dark:bg-emerald-600 dark:text-slate-100"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Check
              id="adv-crit"
              label="Critical hit (×1.5)"
              checked={crit}
              onChange={setCrit}
            />
          </div>
        </div>

        {/* Field */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            🌤️ Field
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="adv-weather">
                Weather
              </label>
              <select
                id="adv-weather"
                className={inputCls}
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
              >
                {WEATHERS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="adv-terrain">
                Terrain
              </label>
              <select
                id="adv-terrain"
                className={inputCls}
                value={terrain}
                onChange={(e) => setTerrain(e.target.value)}
              >
                {TERRAINS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Check
              id="adv-reflect"
              label="Reflect (physical ×0.5)"
              checked={reflect}
              onChange={setReflect}
            />
            <Check
              id="adv-lightscreen"
              label="Light Screen (special ×0.5)"
              checked={lightScreen}
              onChange={setLightScreen}
            />
          </div>
          <div className="mt-4">
            <span className={labelCls}>Effectiveness</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <TypePill type={moveType} />
              <span className="text-slate-400">vs</span>
              {(defender?.types ?? []).map((t) => (
                <TypePill key={t} type={t} />
              ))}
              <span className="ml-auto text-lg font-bold text-slate-800 dark:text-slate-100">
                {hasCalculated ? `${calc.eff}×` : "—"}
              </span>
            </div>
            <select
              aria-label="Effectiveness override"
              className={`${inputCls} mt-2`}
              value={effOverride}
              onChange={(e) =>
                setEffOverride(e.target.value as (typeof EFF_OPTIONS)[number])
              }
            >
              {EFF_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === "auto"
                    ? `Auto${hasCalculated ? ` (×${calc.autoEff})` : ""}`
                    : `×${o}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCalculate}
        className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-sm transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        Calculate damage 🧮
      </button>

      {/* Results */}
      <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          📊 Results
        </h2>
        {!hasCalculated ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Set up both sides, then hit{" "}
            <span className="font-semibold">Calculate damage</span> to see all
            16 rolls and KO odds.
          </p>
        ) : (
          <div className="mt-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {calc.echo}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div>
                <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {calc.min} – {calc.max}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  damage
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {calc.minPct}% – {calc.maxPct}%
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  of {calc.targetHp} HP
                </div>
              </div>
            </div>

            {/* All 16 rolls */}
            <div className="mt-4">
              <span className={labelCls}>All 16 rolls</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {calc.rolls.map((r, i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${
                      r >= calc.targetHp
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                    title={`Roll ${85 + i}%`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Range bar */}
            <div className="mt-4">
              <div className="relative h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500 dark:from-emerald-700 dark:to-emerald-500"
                  style={{
                    width: `${Math.min(100, (calc.max / calc.targetHp) * 100)}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-slate-400 dark:bg-slate-300"
                  style={{
                    left: `${Math.min(100, (calc.min / calc.targetHp) * 100)}%`,
                  }}
                  title={`Min: ${calc.min}`}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Min {calc.min}</span>
                <span>Max {calc.max}</span>
                <span>KO at {calc.targetHp}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-lg font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {calc.koSummary}
            </div>

            {calc.mods.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {calc.mods.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Gen 7+ stat &amp; damage formulas. Simplifications vs Pokémon
              Showdown&apos;s calc: no stat stages, no spread moves, no
              accuracy, terrain assumes a grounded defender (non-Flying),
              pinch abilities need the toggle, and move effects like Sheer
              Force / Tough Claws are assumed to apply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
