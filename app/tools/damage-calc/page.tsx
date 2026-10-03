"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TYPES, effectiveness } from "@/lib/typechart";
import { TYPE_COLORS } from "@/lib/theme";
import {
  searchSpecies,
  getSpeciesById,
  type SpeciesIndex,
  type SpeciesFull,
} from "@/lib/pokedex";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800";
const labelCls = "block text-sm font-medium text-slate-600 dark:text-slate-400";
const sectionCls =
  "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700";
const NONE = "—";

const EFF_OPTIONS = ["auto", "0", "0.25", "0.5", "1", "2", "4"] as const;

/** Actual stat at a level from a base stat (neutral nature, 31 IVs, 0 EVs). */
function statFromBase(base: number, level: number, isHp: boolean): number {
  const v = Math.floor(((2 * base + 31) * level) / 100);
  return isHp ? v + level + 10 : v + 5;
}

function baseOf(full: SpeciesFull | undefined, key: string): number {
  return full?.baseStats.find((s) => s.key === key)?.value ?? 100;
}

function effLabel(eff: number): string {
  if (eff === 0) return "no effect";
  if (eff < 1) return "not very effective";
  if (eff > 1) return "super effective";
  return "neutral";
}

function TypePill({ type }: { type: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: TYPE_COLORS[type] ?? "#A8A77A" }}
    >
      {type}
    </span>
  );
}

function SpeciesPicker({
  label,
  species,
  onPick,
}: {
  label: string;
  species: SpeciesIndex | null;
  onPick: (s: SpeciesIndex | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchSpecies(query), [query]);

  return (
    <div className="relative">
      <span className={labelCls}>{label}</span>
      {species ? (
        <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-600">
          <img
            src={species.sprites.regular}
            alt={species.name}
            className="h-10 w-10 object-contain"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {species.name}
            </div>
            <div className="flex gap-1">
              {species.types.map((t) => (
                <TypePill key={t} type={t} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
              onPick(null);
            }}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label={`Clear ${label}`}
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          className={`${inputCls} mt-1`}
          placeholder="Search a Pokémon…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      )}
      {open && !species && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={() => {
                  onPick(s);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <img
                  src={s.sprites.regular}
                  alt=""
                  className="h-8 w-8 object-contain"
                />
                <span className="text-sm text-slate-800 dark:text-slate-100">
                  {s.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DamageCalcPage() {
  // Default matchup: Charizard vs Venusaur.
  const defaultAttacker = getSpeciesById(6) ?? null;
  const defaultDefender = getSpeciesById(3) ?? null;

  // --- Attacker ---
  const [attacker, setAttacker] = useState<SpeciesIndex | null>(defaultAttacker);
  const [level, setLevel] = useState(50);
  const [attack, setAttack] = useState(
    defaultAttacker
      ? statFromBase(baseOf(defaultAttacker, "attack"), 50, false)
      : 100,
  );
  const [spAtk, setSpAtk] = useState(
    defaultAttacker
      ? statFromBase(baseOf(defaultAttacker, "special-attack"), 50, false)
      : 100,
  );

  // --- Defender ---
  const [defender, setDefender] = useState<SpeciesIndex | null>(defaultDefender);
  const [hp, setHp] = useState(
    defaultDefender ? statFromBase(baseOf(defaultDefender, "hp"), 50, true) : 200,
  );
  const [currentHp, setCurrentHp] = useState(
    defaultDefender ? statFromBase(baseOf(defaultDefender, "hp"), 50, true) : 200,
  );
  const [defense, setDefense] = useState(
    defaultDefender
      ? statFromBase(baseOf(defaultDefender, "defense"), 50, false)
      : 100,
  );
  const [spDef, setSpDef] = useState(
    defaultDefender
      ? statFromBase(baseOf(defaultDefender, "special-defense"), 50, false)
      : 100,
  );
  const [defType1, setDefType1] = useState(defaultDefender?.types[0] ?? "Grass");
  const [defType2, setDefType2] = useState(defaultDefender?.types[1] ?? NONE);

  // --- Move ---
  const [power, setPower] = useState(90);
  const [moveType, setMoveType] = useState("Fire");
  const [category, setCategory] = useState<"physical" | "special">("special");
  const [stabMode, setStabMode] = useState<"auto" | "on" | "off">("auto");

  // --- Effectiveness ---
  const [effOverride, setEffOverride] = useState<(typeof EFF_OPTIONS)[number]>(
    "auto",
  );

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

  function pickAttacker(s: SpeciesIndex | null) {
    setAttacker(s);
    const full = s ? getSpeciesById(s.id) : undefined;
    if (s && full) {
      setAttack(statFromBase(baseOf(full, "attack"), level, false));
      setSpAtk(statFromBase(baseOf(full, "special-attack"), level, false));
    }
  }

  function pickDefender(s: SpeciesIndex | null) {
    setDefender(s);
    const full = s ? getSpeciesById(s.id) : undefined;
    if (s && full) {
      const maxHp = statFromBase(baseOf(full, "hp"), level, true);
      setHp(maxHp);
      setCurrentHp(maxHp);
      setDefense(statFromBase(baseOf(full, "defense"), level, false));
      setSpDef(statFromBase(baseOf(full, "special-defense"), level, false));
      setDefType1(full.types[0] ?? "Grass");
      setDefType2(full.types[1] ?? NONE);
    }
  }

  const stabApplied =
    stabMode === "on" ||
    (stabMode === "auto" && (attacker?.types.includes(moveType) ?? false));

  const calc = useMemo(() => {
    const lvl = Math.min(100, Math.max(1, Math.round(Number(level) || 50)));
    const pwr = Math.max(0, Math.round(Number(power) || 0));
    const atkStat = Math.max(
      1,
      Math.round(Number(category === "physical" ? attack : spAtk) || 1),
    );
    const defStat = Math.max(
      1,
      Math.round(Number(category === "physical" ? defense : spDef) || 1),
    );
    const targetHp = Math.max(1, Math.round(Number(currentHp) || 1));

    const base =
      Math.floor(
        Math.floor(
          (Math.floor((2 * lvl) / 5 + 2) * pwr * (atkStat / defStat)) / 50,
        ),
      ) + 2;

    const defTypes = [defType1, defType2].filter(
      (t) => t && t !== NONE,
    ) as string[];
    const autoEff = effectiveness(moveType, defTypes);
    const eff = effOverride === "auto" ? autoEff : Number(effOverride);

    // 16 random rolls: 85%, 86%, …, 100%.
    const modified = base * (stabApplied ? 1.5 : 1) * eff;
    const rolls: number[] = [];
    for (let r = 85; r <= 100; r++) {
      rolls.push(Math.floor(modified * (r / 100)));
    }
    const min = Math.min(...rolls);
    const max = Math.max(...rolls);

    const toPct = (dmg: number) => ((dmg / targetHp) * 100).toFixed(1);

    let koSummary: string;
    if (max <= 0) {
      koSummary = `No effect — ${moveType} can't damage ${defender?.name ?? "the defender"}.`;
    } else {
      const ohkoRolls = rolls.filter((d) => d >= targetHp).length;
      if (ohkoRolls === rolls.length) {
        koSummary = "Guaranteed OHKO 🎯";
      } else if (ohkoRolls > 0) {
        koSummary = `${((ohkoRolls / rolls.length) * 100).toFixed(1)}% chance to OHKO`;
      } else {
        const hits = Math.ceil(targetHp / max);
        if (min * hits >= targetHp) {
          koSummary = `Guaranteed ${hits}HKO`;
        } else {
          koSummary = `${hits} hits to KO at max rolls`;
        }
      }
    }

    const mods: string[] = [];
    if (stabApplied) mods.push("STAB ×1.5");
    if (eff !== 1) mods.push(`effectiveness ×${eff}`);

    return {
      lvl,
      base,
      autoEff,
      eff,
      min,
      max,
      minPct: toPct(min),
      maxPct: toPct(max),
      targetHp,
      koSummary,
      mods,
      echo: `${attacker?.name ?? "Attacker"} Lv ${lvl} → ${defender?.name ?? "Defender"} · ${power} power ${moveType} (${category}) · Atk ${atkStat} / Def ${defStat}`,
    };
  }, [
    level,
    power,
    attack,
    spAtk,
    defense,
    spDef,
    currentHp,
    category,
    moveType,
    defType1,
    defType2,
    effOverride,
    stabApplied,
    attacker?.name,
    defender?.name,
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
          // Achievements are best-effort; never block the calc.
        }
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Damage Calculator
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick real Pokémon — stats, typing, and STAB auto-fill. Standard Gen V+
        formula with all 16 random rolls (85–100%).
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
              onPick={pickAttacker}
            />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls} htmlFor="dc-level">
                  Level
                </label>
                <input
                  id="dc-level"
                  type="number"
                  min={1}
                  max={100}
                  className={inputCls}
                  value={level}
                  onChange={(e) =>
                    setLevel(
                      Math.min(100, Math.max(1, e.target.valueAsNumber || 1)),
                    )
                  }
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="dc-atk">
                  Attack
                </label>
                <input
                  id="dc-atk"
                  type="number"
                  min={1}
                  className={inputCls}
                  value={attack}
                  onChange={(e) => setAttack(e.target.valueAsNumber)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="dc-spatk">
                  Sp. Atk
                </label>
                <input
                  id="dc-spatk"
                  type="number"
                  min={1}
                  className={inputCls}
                  value={spAtk}
                  onChange={(e) => setSpAtk(e.target.valueAsNumber)}
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Stats prefill from the base stats at the chosen level — tweak them
              freely.
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
                <label className={labelCls} htmlFor="dc-hp">
                  Max HP
                </label>
                <input
                  id="dc-hp"
                  type="number"
                  min={1}
                  className={inputCls}
                  value={hp}
                  onChange={(e) => {
                    const v = e.target.valueAsNumber;
                    setHp(v);
                    setCurrentHp(v);
                  }}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="dc-curhp">
                  Current HP
                </label>
                <input
                  id="dc-curhp"
                  type="number"
                  min={1}
                  className={inputCls}
                  value={currentHp}
                  onChange={(e) => setCurrentHp(e.target.valueAsNumber)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="dc-def">
                  Defense
                </label>
                <input
                  id="dc-def"
                  type="number"
                  min={1}
                  className={inputCls}
                  value={defense}
                  onChange={(e) => setDefense(e.target.valueAsNumber)}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="dc-spdef">
                  Sp. Def
                </label>
                <input
                  id="dc-spdef"
                  type="number"
                  min={1}
                  className={inputCls}
                  value={spDef}
                  onChange={(e) => setSpDef(e.target.valueAsNumber)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls} htmlFor="dc-deft1">
                  Type 1
                </label>
                <select
                  id="dc-deft1"
                  className={inputCls}
                  value={defType1}
                  onChange={(e) => setDefType1(e.target.value)}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="dc-deft2">
                  Type 2
                </label>
                <select
                  id="dc-deft2"
                  className={inputCls}
                  value={defType2}
                  onChange={(e) => setDefType2(e.target.value)}
                >
                  <option value={NONE}>{NONE} (none)</option>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Move */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            💥 Move
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="dc-power">
                Power
              </label>
              <input
                id="dc-power"
                type="number"
                min={0}
                className={inputCls}
                value={power}
                onChange={(e) => setPower(e.target.valueAsNumber)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-mtype">
                Move type
              </label>
              <select
                id="dc-mtype"
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
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              {stabMode === "auto" ? (
                attacker ? (
                  stabApplied ? (
                    <>
                      ✅ STAB applies — {attacker.name} is{" "}
                      {attacker.types.join("/")} so {moveType} moves get ×1.5.
                    </>
                  ) : (
                    <>
                      No STAB — {moveType} isn&apos;t one of {attacker.name}
                      &apos;s types ({attacker.types.join("/")}).
                    </>
                  )
                ) : (
                  "Pick an attacker to auto-detect STAB from its typing."
                )
              ) : stabMode === "on" ? (
                "STAB forced on (×1.5)."
              ) : (
                "STAB forced off."
              )}
            </p>
          </div>
        </div>

        {/* Effectiveness */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            🎯 Effectiveness
          </h2>
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <TypePill type={moveType} />
              <span className="text-slate-400">vs</span>
              {[defType1, defType2]
                .filter((t) => t && t !== NONE)
                .map((t) => (
                  <TypePill key={t} type={t} />
                ))}
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-slate-100">
              {calc.eff}×{" "}
              <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                — {effLabel(calc.eff)}
              </span>
            </p>
            <div className="mt-3">
              <label className={labelCls} htmlFor="dc-eff">
                Override
              </label>
              <select
                id="dc-eff"
                className={inputCls}
                value={effOverride}
                onChange={(e) =>
                  setEffOverride(
                    e.target.value as (typeof EFF_OPTIONS)[number],
                  )
                }
              >
                {EFF_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o === "auto" ? `Auto (×${calc.autoEff})` : `×${o}`}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              Computed from the shared type chart against the defender&apos;s
              types — override any time.
            </p>
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
            Fill in the sections above, then hit{" "}
            <span className="font-semibold">Calculate damage</span> to see the
            min–max rolls and KO odds.
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
          </div>
        )}
      </div>
    </div>
  );
}
