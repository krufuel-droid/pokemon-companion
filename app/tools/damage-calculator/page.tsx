"use client";

import { useMemo, useState } from "react";
import { TYPES, effectiveness } from "@/lib/typechart";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800";
const labelCls = "block text-sm font-medium text-slate-600 dark:text-slate-400";
const NONE = "—";

const EFF_OPTIONS = ["auto", "0", "0.25", "0.5", "1", "2", "4"] as const;

function toNum(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}

/** Clamp a numeric input to a sane range so extreme values can't break the math. */
function clampNum(v: number, fallback: number, min: number, max: number): number {
  const n = toNum(v, fallback);
  return Math.min(max, Math.max(min, n));
}

function effLabel(eff: number): string {
  if (eff === 0) return "no effect";
  if (eff < 1) return "not very effective";
  if (eff > 1) return "super effective";
  return "neutral";
}

export default function DamageCalculator() {
  const [level, setLevel] = useState(50);
  const [moveType, setMoveType] = useState("Fire");
  const [category, setCategory] = useState<"physical" | "special">("physical");
  const [power, setPower] = useState(80);
  const [attack, setAttack] = useState(100);
  const [defense, setDefense] = useState(100);
  const [hp, setHp] = useState(200);
  const [stab, setStab] = useState(false);
  const [crit, setCrit] = useState(false);
  const [burn, setBurn] = useState(false);
  const [weather, setWeather] = useState<"none" | "sun" | "rain">("none");
  const [defType1, setDefType1] = useState("Grass");
  const [defType2, setDefType2] = useState(NONE);
  const [effOverride, setEffOverride] = useState<(typeof EFF_OPTIONS)[number]>("auto");

  const calc = useMemo(() => {
    const lvl = Math.min(100, Math.max(1, toNum(level, 50)));
    const pwr = Math.max(0, toNum(power, 80));
    const atkStat = Math.max(1, toNum(attack, 100));
    const defStat = Math.max(1, toNum(defense, 100));
    const maxHp = Math.max(1, toNum(hp, 200));

    // Burn halves physical attack only.
    const effAtk =
      burn && category === "physical" ? Math.floor(atkStat / 2) : atkStat;

    const base =
      Math.floor(
        Math.floor(
          (Math.floor((2 * lvl) / 5 + 2) * pwr * (effAtk / defStat)) / 50,
        ),
      ) + 2;

    const autoEff = effectiveness(
      moveType,
      [defType1, defType2].filter((t) => t !== NONE),
    );
    const eff = effOverride === "auto" ? autoEff : Number(effOverride);

    let weatherMult = 1;
    if (weather === "sun" && moveType === "Fire") weatherMult = 1.5;
    if (weather === "rain" && moveType === "Water") weatherMult = 1.5;

    const raw =
      base *
      (stab ? 1.5 : 1) *
      eff *
      (crit ? 1.5 : 1) *
      weatherMult;
    const max = Math.floor(raw);
    const min = Math.floor(max * 0.85);
    const hitsToKo = max <= 0 ? null : Math.max(1, Math.ceil(maxHp / max));

    const mods: string[] = [];
    if (stab) mods.push("STAB ×1.5");
    if (crit) mods.push("crit ×1.5");
    if (weatherMult > 1) mods.push("weather ×1.5");
    if (burn && category === "physical") mods.push("burn halves Atk");

    return {
      lvl,
      base,
      autoEff,
      eff,
      max,
      min,
      hitsToKo,
      maxHp,
      minPct: ((min / maxHp) * 100).toFixed(1),
      maxPct: ((max / maxHp) * 100).toFixed(1),
      mods,
      echo: `Lv ${lvl} ${moveType} (${category}) · power ${pwr} · Atk ${atkStat}${
        burn && category === "physical" ? " → " + effAtk + " (burn)" : ""
      } / Def ${defStat} · vs ${defType1}${defType2 !== NONE ? "/" + defType2 : ""}`,
    };
  }, [
    level,
    moveType,
    category,
    power,
    attack,
    defense,
    hp,
    stab,
    crit,
    burn,
    weather,
    defType1,
    defType2,
    effOverride,
  ]);

  function reset() {
    setLevel(50);
    setMoveType("Fire");
    setCategory("physical");
    setPower(80);
    setAttack(100);
    setDefense(100);
    setHp(200);
    setStab(false);
    setCrit(false);
    setBurn(false);
    setWeather("none");
    setDefType1("Grass");
    setDefType2(NONE);
    setEffOverride("auto");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Damage Calculator</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Gen V+ damage formula with 85–100% random rolls.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="dc-level">Level</label>
              <input
                id="dc-level"
                type="number"
                min={1}
                max={100}
                className={inputCls}
                value={level}
                onChange={(e) => setLevel(clampNum(e.target.valueAsNumber, 50, 1, 100))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-type">Move type</label>
              <select
                id="dc-type"
                className={inputCls}
                value={moveType}
                onChange={(e) => setMoveType(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
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
            <div>
              <label className={labelCls} htmlFor="dc-power">Power</label>
              <input
                id="dc-power"
                type="number"
                min={0}
                max={250}
                className={inputCls}
                value={power}
                onChange={(e) => setPower(clampNum(e.target.valueAsNumber, 80, 0, 250))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-atk">
                {category === "physical" ? "Attack" : "Sp. Atk"}
              </label>
              <input
                id="dc-atk"
                type="number"
                min={1}
                className={inputCls}
                value={attack}
                onChange={(e) => setAttack(clampNum(e.target.valueAsNumber, 100, 1, 999))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-def">
                {category === "physical" ? "Defense" : "Sp. Def"}
              </label>
              <input
                id="dc-def"
                type="number"
                min={1}
                className={inputCls}
                value={defense}
                onChange={(e) => setDefense(clampNum(e.target.valueAsNumber, 100, 1, 999))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-hp">Defender max HP</label>
              <input
                id="dc-hp"
                type="number"
                min={1}
                max={999}
                className={inputCls}
                value={hp}
                onChange={(e) => setHp(clampNum(e.target.valueAsNumber, 200, 1, 999))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-weather">Weather</label>
              <select
                id="dc-weather"
                className={inputCls}
                value={weather}
                onChange={(e) =>
                  setWeather(e.target.value as "none" | "sun" | "rain")
                }
              >
                <option value="none">None</option>
                <option value="sun">Harsh Sunlight</option>
                <option value="rain">Heavy Rain</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-dt1">Defender type 1</label>
              <select
                id="dc-dt1"
                className={inputCls}
                value={defType1}
                onChange={(e) => setDefType1(e.target.value)}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="dc-dt2">Defender type 2</label>
              <select
                id="dc-dt2"
                className={inputCls}
                value={defType2}
                onChange={(e) => setDefType2(e.target.value)}
              >
                <option value={NONE}>{NONE}</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls} htmlFor="dc-eff">
                Effectiveness override{" "}
                <span className="font-normal text-slate-400 dark:text-slate-500">
                  (auto: ×{calc.autoEff})
                </span>
              </label>
              <select
                id="dc-eff"
                className={inputCls}
                value={effOverride}
                onChange={(e) =>
                  setEffOverride(e.target.value as (typeof EFF_OPTIONS)[number])
                }
              >
                <option value="auto">Auto (×{calc.autoEff})</option>
                {EFF_OPTIONS.filter((o) => o !== "auto").map((o) => (
                  <option key={o} value={o}>×{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
            {(
              [
                ["stab", "STAB (1.5×)", stab, setStab],
                ["crit", "Critical hit (1.5×)", crit, setCrit],
                ["burn", "Burn (halves physical Atk)", burn, setBurn],
              ] as const
            ).map(([id, text, val, set]) => (
              <label key={id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  id={`dc-${id}`}
                  type="checkbox"
                  checked={val}
                  onChange={(e) => set(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                {text}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Reset
          </button>
        </div>

        {/* Results */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Result</h2>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{calc.echo}</p>

          <div className="mt-4 rounded-2xl bg-emerald-300/25 p-5 text-center dark:bg-emerald-600/25">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Damage roll range</div>
            <div className="mt-1 text-4xl font-bold text-slate-800 dark:text-slate-100">
              {calc.min} – {calc.max}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {calc.minPct}% – {calc.maxPct}% of defender HP
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {calc.hitsToKo === null ? (
                <span className="text-red-600 dark:text-red-400">
                  Immune — this move can&apos;t damage the defender.
                </span>
              ) : (
                <>Hits to KO: <span className="text-lg">{calc.hitsToKo}</span></>
              )}
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Effectiveness</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">
                ×{calc.eff} ({effLabel(calc.eff)})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Modifiers</dt>
              <dd className="font-semibold text-slate-800 dark:text-slate-100">
                {calc.mods.length > 0 ? calc.mods.join(" · ") : "none"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-5 text-slate-400 dark:text-slate-500">
            Formula: base = ⌊⌊⌊2×Lv/5+2⌋ × power × Atk/Def⌋ / 50⌋ + 2, then ×
            modifiers, max roll = ⌊that⌋, min roll = ⌊max × 0.85⌋.
          </p>
        </div>
      </div>
    </div>
  );
}
