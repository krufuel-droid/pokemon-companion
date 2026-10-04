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
import {
  calculateDamage,
  calculateDoublesTurn,
  combatantStats,
  clamp,
  STAT_KEYS,
  type StatKey,
  type CombatantInput,
  type DamageCalcResult,
  type DoublesTarget,
} from "@/lib/damage-calc";
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

const STAT_LABELS: Record<StatKey, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};
const EFF_OPTIONS = ["auto", "0", "0.25", "0.5", "1", "2", "4"] as const;

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

/** All editable state for one defending Pokémon (singles defender or a doubles foe). */
export interface DefenderConfig {
  species: SpeciesIndex | null;
  pickSpecies: (s: SpeciesIndex | null) => void;
  level: number;
  setLevel: (n: number) => void;
  nature: string;
  setNature: (n: string) => void;
  ability: string;
  setAbility: (n: string) => void;
  item: string;
  setItem: (n: string) => void;
  status: string;
  setStatus: (s: string) => void;
  evs: Record<StatKey, number>;
  setEv: (k: StatKey, v: number) => void;
  ivs: Record<StatKey, number>;
  setIv: (k: StatKey, v: number) => void;
  nfu: boolean;
  setNfu: (b: boolean) => void;
  currentHp: number | null;
  setCurrentHp: (n: number | null) => void;
  stats: Record<StatKey, number>;
  maxHp: number;
  targetHp: number;
}

function useDefenderConfig(
  defaultSpecies: SpeciesIndex | null,
  defaultNature = "Hardy",
): DefenderConfig {
  const [species, setSpecies] = useState<SpeciesIndex | null>(defaultSpecies);
  const [level, setLevel] = useState(50);
  const [nature, setNature] = useState(defaultNature);
  const [ability, setAbility] = useState("None");
  const [item, setItem] = useState("None");
  const [status, setStatus] = useState<string>("Healthy");
  const [evs, setEvs] = useState<Record<StatKey, number>>(emptyEvs);
  const [ivs, setIvs] = useState<Record<StatKey, number>>(fullIvs);
  const [nfu, setNfu] = useState(false);
  const [currentHp, setCurrentHp] = useState<number | null>(null);

  const stats = useMemo(
    () => combatantStats(species, level, nature, evs, ivs),
    [species, level, nature, evs, ivs],
  );
  const maxHp = stats.hp;
  const targetHp = Math.max(1, currentHp ?? maxHp);

  function pickSpecies(s: SpeciesIndex | null) {
    setSpecies(s);
    setCurrentHp(null); // reset to full for the new defender
  }

  return useMemo(
    () => ({
      species,
      pickSpecies,
      level,
      setLevel: (n: number) => setLevel(clamp(n, 1, 100)),
      nature,
      setNature,
      ability,
      setAbility,
      item,
      setItem,
      status,
      setStatus,
      evs,
      setEv: (k: StatKey, v: number) =>
        setEvs((prev) => ({ ...prev, [k]: v })),
      ivs,
      setIv: (k: StatKey, v: number) =>
        setIvs((prev) => ({ ...prev, [k]: v })),
      nfu,
      setNfu,
      currentHp,
      setCurrentHp,
      stats,
      maxHp,
      targetHp,
    }),
    [
      species,
      level,
      nature,
      ability,
      item,
      status,
      evs,
      ivs,
      nfu,
      currentHp,
      stats,
      maxHp,
      targetHp,
    ],
  );
}

function defenderCombatant(cfg: DefenderConfig): CombatantInput {
  return {
    species: cfg.species?.id ?? null,
    level: cfg.level,
    nature: cfg.nature,
    ability: cfg.ability,
    item: cfg.item,
    status: cfg.status,
    evs: cfg.evs,
    ivs: cfg.ivs,
    notFullyEvolved: cfg.nfu,
    currentHp: cfg.currentHp,
  };
}

/** Full defender card (level, nature, ability, item, status, HP, EVs/IVs). */
function DefenderPanel({
  cfg,
  title,
  idPrefix,
}: {
  cfg: DefenderConfig;
  title: string;
  idPrefix: string;
}) {
  return (
    <div className={sectionCls}>
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h2>
      <div className="mt-4 space-y-4">
        <SpeciesPicker
          label="Defending Pokémon"
          species={cfg.species}
          onPick={cfg.pickSpecies}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor={`${idPrefix}-level`}>
              Level
            </label>
            <input
              id={`${idPrefix}-level`}
              type="number"
              min={1}
              max={100}
              className={inputCls}
              value={cfg.level}
              onChange={(e) => cfg.setLevel(e.target.valueAsNumber)}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor={`${idPrefix}-nature`}>
              Nature
            </label>
            <select
              id={`${idPrefix}-nature`}
              className={inputCls}
              value={cfg.nature}
              onChange={(e) => cfg.setNature(e.target.value)}
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
            id={`${idPrefix}-ability`}
            label="Ability"
            value={cfg.ability}
            options={DEFENDER_ABILITIES}
            onChange={cfg.setAbility}
          />
          <ModSelect
            id={`${idPrefix}-item`}
            label="Item"
            value={cfg.item}
            options={DEFENDER_ITEMS}
            onChange={cfg.setItem}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor={`${idPrefix}-status`}>
              Status
            </label>
            <select
              id={`${idPrefix}-status`}
              className={inputCls}
              value={cfg.status}
              onChange={(e) => cfg.setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor={`${idPrefix}-hp`}>
              Current HP
            </label>
            <div className="flex gap-2">
              <input
                id={`${idPrefix}-hp`}
                type="number"
                min={1}
                max={cfg.maxHp}
                className={inputCls}
                value={cfg.currentHp ?? cfg.maxHp}
                onChange={(e) =>
                  cfg.setCurrentHp(clamp(e.target.valueAsNumber, 1, cfg.maxHp))
                }
              />
              <button
                type="button"
                onClick={() => cfg.setCurrentHp(null)}
                title="Reset to full HP"
                className="shrink-0 rounded-xl border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
        {cfg.item === "Eviolite" && (
          <Check
            id={`${idPrefix}-nfu`}
            label="Not fully evolved (Eviolite applies)"
            checked={cfg.nfu}
            onChange={cfg.setNfu}
          />
        )}
        <div>
          <span className={labelCls}>EVs / IVs</span>
          <div className="mt-1">
            <EvIvGrid
              evs={cfg.evs}
              ivs={cfg.ivs}
              onEv={cfg.setEv}
              onIv={cfg.setIv}
            />
          </div>
        </div>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          HP {cfg.stats.hp} · Atk {cfg.stats.atk} · Def {cfg.stats.def} · SpA{" "}
          {cfg.stats.spa} · SpD {cfg.stats.spd} · Spe {cfg.stats.spe}
        </p>
      </div>
    </div>
  );
}

/** Rolls, range bar, KO summary, and modifiers for one calc result. */
function ResultBlock({ result }: { result: DamageCalcResult }) {
  return (
    <div className="mt-3">
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {result.echo}
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <div>
          <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
            {result.minRoll} – {result.maxRoll}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            damage
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {result.minPct}% – {result.maxPct}%
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            of {result.targetHp} HP
          </div>
        </div>
      </div>

      {/* All 16 rolls */}
      <div className="mt-4">
        <span className={labelCls}>All 16 rolls</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {result.rolls.map((r, i) => (
            <span
              key={i}
              className={`rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${
                r >= result.targetHp
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
              width: `${Math.min(100, (result.maxRoll / result.targetHp) * 100)}%`,
            }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-slate-400 dark:bg-slate-300"
            style={{
              left: `${Math.min(100, (result.minRoll / result.targetHp) * 100)}%`,
            }}
            title={`Min: ${result.minRoll}`}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>Min {result.minRoll}</span>
          <span>Max {result.maxRoll}</span>
          <span>KO at {result.targetHp}</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-lg font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        {result.koSummary}
      </div>

      {result.modifiers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {result.modifiers.map((m) => (
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
        Showdown&apos;s calc: no stat stages, no accuracy, terrain assumes a
        grounded defender (non-Flying), pinch abilities need the toggle, and
        move effects like Sheer Force / Tough Claws are assumed to apply. In
        doubles, spread moves deal ×0.75 per target; redirect moves (Follow Me,
        Rage Powder) and ally abilities (Friend Guard) aren&apos;t modeled.
      </p>
    </div>
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

  // --- Format ---
  const [format, setFormat] = useState<"singles" | "doubles">("singles");

  // --- Defender (singles) / foes (doubles) ---
  const def = useDefenderConfig(defaultDefender, "Calm");
  const foe1 = useDefenderConfig(null);
  const foe2 = useDefenderConfig(null);
  const [ally, setAlly] = useState<SpeciesIndex | null>(null);
  const [dblTarget, setDblTarget] = useState<DoublesTarget>("both-foes");

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

  // Derived stats (Gen 7+ formula) — shared with the API.
  const atkStats = useMemo(
    () => combatantStats(attacker, atkLevel, atkNature, atkEvs, atkIvs),
    [attacker, atkLevel, atkNature, atkEvs, atkIvs],
  );

  const setAtkEv = (k: StatKey, v: number) =>
    setAtkEvs((prev) => ({ ...prev, [k]: v }));
  const setAtkIv = (k: StatKey, v: number) =>
    setAtkIvs((prev) => ({ ...prev, [k]: v }));

  function attackerCombatant(): CombatantInput {
    return {
      species: attacker?.id ?? null,
      level: atkLevel,
      nature: atkNature,
      ability: atkAbility,
      item: atkItem,
      status: atkStatus,
      evs: atkEvs,
      ivs: atkIvs,
      pinchActive,
    };
  }

  function fieldInput(): {
    weather: string;
    terrain: string;
    reflect: boolean;
    lightScreen: boolean;
    crit: boolean;
    stab: "auto" | "on" | "off";
    effectiveness: "auto" | number;
  } {
    return {
      weather,
      terrain,
      reflect,
      lightScreen,
      crit,
      stab: stabMode,
      effectiveness: effOverride === "auto" ? "auto" : Number(effOverride),
    };
  }

  const calc = useMemo(
    () =>
      calculateDamage({
        attacker: attackerCombatant(),
        defender: defenderCombatant(def),
        move: { power, type: moveType, category },
        field: { ...fieldInput() },
      }),
    [
      attacker,
      def,
      atkLevel,
      atkNature,
      atkAbility,
      atkItem,
      atkStatus,
      atkEvs,
      atkIvs,
      pinchActive,
      power,
      moveType,
      category,
      weather,
      terrain,
      reflect,
      lightScreen,
      crit,
      stabMode,
      effOverride,
    ],
  );

  const dblCalc = useMemo(() => {
    try {
      return calculateDoublesTurn({
        attacker: attackerCombatant(),
        ally: ally ? { species: ally.id, level: 50 } : null,
        defenders: [defenderCombatant(foe1), defenderCombatant(foe2)],
        move: { power, type: moveType, category },
        target: dblTarget,
        field: { ...fieldInput() },
      });
    } catch {
      return null;
    }
  }, [
    attacker,
    ally,
    foe1,
    foe2,
    dblTarget,
    atkLevel,
    atkNature,
    atkAbility,
    atkItem,
    atkStatus,
    atkEvs,
    atkIvs,
    pinchActive,
    power,
    moveType,
    category,
    weather,
    terrain,
    reflect,
    lightScreen,
    crit,
    stabMode,
    effOverride,
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
        Doubles mode adds an ally, two foes, and the ×0.75 spread modifier.
      </p>

      {/* Singles / Doubles toggle */}
      <div className="mt-4 inline-flex rounded-xl border border-slate-300 p-1 dark:border-slate-600">
        {(
          [
            { v: "singles", label: "Singles" },
            { v: "doubles", label: "Doubles 👥" },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setFormat(o.v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              format === o.v
                ? "bg-emerald-300 text-slate-800 dark:bg-emerald-600 dark:text-slate-100"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {format === "doubles" && (
        <div className="mt-3">
          <span className={labelCls}>Target</span>
          <div className="mt-1 inline-flex flex-wrap gap-1 rounded-xl border border-slate-300 p-1 dark:border-slate-600">
            {(
              [
                { v: "foe1", label: "Foe 1" },
                { v: "foe2", label: "Foe 2" },
                { v: "both-foes", label: "Both foes (spread ×0.75)" },
                { v: "ally", label: "Ally", disabled: !ally },
              ] as Array<{ v: DoublesTarget; label: string; disabled?: boolean }>
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                disabled={o.disabled}
                title={o.disabled ? "Pick an ally first" : undefined}
                onClick={() => setDblTarget(o.v)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  dblTarget === o.v
                    ? "bg-emerald-300 text-slate-800 dark:bg-emerald-600 dark:text-slate-100"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
                  onEv={setAtkEv}
                  onIv={setAtkIv}
                />
              </div>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs tabular-nums text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              HP {atkStats.hp} · Atk {atkStats.atk} · Def {atkStats.def} · SpA{" "}
              {atkStats.spa} · SpD {atkStats.spd} · Spe {atkStats.spe}
            </p>
          </div>
        </div>

        {format === "singles" ? (
          <DefenderPanel cfg={def} title="🛡️ Defender" idPrefix="adv-def" />
        ) : (
          <>
            <div className={sectionCls}>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                🤝 Ally{" "}
                <span className="text-sm font-normal text-slate-400 dark:text-slate-500">
                  (optional)
                </span>
              </h2>
              <div className="mt-4">
                <SpeciesPicker
                  label="Attacker's ally"
                  species={ally}
                  onPick={setAlly}
                />
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Targeting context only — ally abilities like Friend Guard
                  aren&apos;t modeled.
                </p>
              </div>
            </div>
            <DefenderPanel cfg={foe1} title="🛡️ Foe 1" idPrefix="dbl-foe1" />
            <DefenderPanel cfg={foe2} title="🛡️ Foe 2" idPrefix="dbl-foe2" />
          </>
        )}

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
            {format === "singles" ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <TypePill type={moveType} />
                <span className="text-slate-400">vs</span>
                {(def.species?.types ?? []).map((t) => (
                  <TypePill key={t} type={t} />
                ))}
                <span className="ml-auto text-lg font-bold text-slate-800 dark:text-slate-100">
                  {hasCalculated ? `${calc.effectiveness}×` : "—"}
                </span>
              </div>
            ) : (
              <div className="mt-1 space-y-1.5">
                {[foe1, foe2].map((f, i) => {
                  const slot: "foe1" | "foe2" = i === 0 ? "foe1" : "foe2";
                  const t = dblCalc?.targets.find((x) => x.slot === slot);
                  return (
                    <div
                      key={slot}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="w-10 text-xs font-bold text-slate-500 dark:text-slate-400">
                        Foe {i + 1}
                      </span>
                      <TypePill type={moveType} />
                      <span className="text-slate-400">vs</span>
                      {(f.species?.types ?? []).map((ty) => (
                        <TypePill key={ty} type={ty} />
                      ))}
                      <span className="ml-auto text-lg font-bold text-slate-800 dark:text-slate-100">
                        {hasCalculated && t ? `${t.result.effectiveness}×` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                    ? `Auto${hasCalculated ? ` (×${calc.autoEffectiveness})` : ""}`
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
        ) : format === "singles" ? (
          <ResultBlock result={calc} />
        ) : dblCalc ? (
          <div className="mt-3 space-y-8">
            {dblCalc.targets.map((t) => (
              <div key={t.slot}>
                <h3 className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                  <span>
                    {t.slot === "ally"
                      ? "🤝 Ally"
                      : t.slot === "foe1"
                        ? "🛡️ Foe 1"
                        : "🛡️ Foe 2"}
                    : {t.result.defender}
                  </span>
                  {t.spreadApplied && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      spread ×0.75
                    </span>
                  )}
                </h3>
                <ResultBlock result={t.result} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {dblCalc.notes.map((n) => (
                <span
                  key={n}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Pick an ally Pokémon to target it.
          </p>
        )}
      </div>
    </div>
  );
}
