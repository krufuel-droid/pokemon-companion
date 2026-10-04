"use client";

import { useMemo, useState } from "react";
import { calculateDamage, clamp, type StatKey } from "@/lib/damage-calc";
import { NATURES } from "@/lib/data/natures";
import { TYPES } from "@/lib/typechart";
import { getSpeciesById, type SpeciesIndex } from "@/lib/pokedex";
import { SpeciesPicker } from "../_components/species-picker";
import { inputCls, labelCls, sectionCls } from "../damage-calc/shared";
import {
  TeamSavePicker,
  savedMemberSpecies,
  type SavedTeam,
  type SavedTeamMember,
} from "../_components/team-save-picker";

const WEATHERS = ["None", "Harsh Sunlight", "Rain", "Sandstorm", "Snow"];
const TERRAINS = ["None", "Electric", "Grassy", "Psychic", "Mist"];

interface SpreadResult {
  hpEV: number;
  defEV: number;
  total: number;
  hp: number;
  minRoll: number;
  maxRoll: number;
  minPct: string;
  maxPct: string;
  koSummary: string;
}

interface SearchOutput {
  baseline: SpreadResult;
  oneHit: SpreadResult | null;
  twoHit: SpreadResult | null;
}

function toResult(
  hpEV: number,
  defEV: number,
  calc: { targetHp: number; minRoll: number; maxRoll: number; minPct: string; maxPct: string; koSummary: string },
): SpreadResult {
  return {
    hpEV,
    defEV,
    total: hpEV + defEV,
    hp: calc.targetHp,
    minRoll: calc.minRoll,
    maxRoll: calc.maxRoll,
    minPct: calc.minPct,
    maxPct: calc.maxPct,
    koSummary: calc.koSummary,
  };
}

export default function EVOptimizerPage() {
  // --- Defender (the one trying to survive) ---
  const [defender, setDefender] = useState<SpeciesIndex | null>(
    () => getSpeciesById(727) ?? null, // Incineroar
  );
  const [defLevel, setDefLevel] = useState(50);
  const [defNature, setDefNature] = useState("Bold");

  // --- Attacker ---
  const [attacker, setAttacker] = useState<SpeciesIndex | null>(
    () => getSpeciesById(445) ?? null, // Garchomp
  );
  const [atkLevel, setAtkLevel] = useState(50);
  const [atkNature, setAtkNature] = useState("Jolly");
  const [atkEVs, setAtkEVs] = useState(252);
  const [atkAbility, setAtkAbility] = useState("None");
  const [atkItem, setAtkItem] = useState("None");

  // --- Move ---
  const [power, setPower] = useState(100);
  const [moveType, setMoveType] = useState("Ground");
  const [category, setCategory] = useState<"physical" | "special">("physical");

  // --- Field ---
  const [weather, setWeather] = useState("None");
  const [terrain, setTerrain] = useState("None");
  const [reflect, setReflect] = useState(false);
  const [lightScreen, setLightScreen] = useState(false);
  const [crit, setCrit] = useState(false);

  const defKey: StatKey = category === "physical" ? "def" : "spd";
  const atkKey: StatKey = category === "physical" ? "atk" : "spa";
  const defLabel = category === "physical" ? "Def" : "SpD";

  // --- Team Builder import ---
  const [importTeam, setImportTeam] = useState<SavedTeam | null>(null);

  const validNature = (n: string | undefined): string | undefined =>
    n && NATURES.some((x) => x.name === n) ? n : undefined;

  const fillDefender = (m: SavedTeamMember) => {
    const s = savedMemberSpecies(m);
    if (!s) return;
    setDefender(s);
    if (m.level) setDefLevel(clamp(m.level, 1, 100));
    const nat = validNature(m.nature);
    if (nat) setDefNature(nat);
  };

  const fillAttacker = (m: SavedTeamMember) => {
    const s = savedMemberSpecies(m);
    if (!s) return;
    setAttacker(s);
    if (m.level) setAtkLevel(clamp(m.level, 1, 100));
    const nat = validNature(m.nature);
    if (nat) setAtkNature(nat);
    const offEV = category === "physical" ? m.evs?.atk : m.evs?.spa;
    if (offEV !== undefined) setAtkEVs(clamp(offEV, 0, 252));
    if (m.ability?.trim()) setAtkAbility(m.ability.trim());
    if (m.item?.trim()) setAtkItem(m.item.trim());
  };

  const search: SearchOutput | null = useMemo(() => {
    if (!attacker || !defender) return null;
    const atkEVNum = clamp(atkEVs, 0, 252);
    const pwr = Math.max(0, Math.round(Number(power) || 0));

    const run = (hpEV: number, defEV: number) =>
      calculateDamage({
        attacker: {
          species: attacker.id,
          level: atkLevel,
          nature: atkNature,
          evs: { [atkKey]: atkEVNum } as Partial<Record<StatKey, number>>,
          ability: atkAbility,
          item: atkItem,
        },
        defender: {
          species: defender.id,
          level: defLevel,
          nature: defNature,
          evs: { hp: hpEV, [defKey]: defEV } as Partial<Record<StatKey, number>>,
        },
        move: { power: pwr, type: moveType, category },
        field: { weather, terrain, reflect, lightScreen, crit },
      });

    const baseline = toResult(0, 0, run(0, 0));

    let oneHit: SpreadResult | null = null;
    let twoHit: SpreadResult | null = null;
    for (let hpEV = 0; hpEV <= 252; hpEV += 4) {
      for (let dEV = 0; dEV <= 252; dEV += 4) {
        if (hpEV + dEV > 508) continue;
        const r = run(hpEV, dEV);
        const total = hpEV + dEV;
        // Guaranteed survival: even the max roll doesn't KO.
        if (r.maxRoll < r.targetHp) {
          if (!oneHit || total < oneHit.total || (total === oneHit.total && hpEV > oneHit.hpEV)) {
            oneHit = toResult(hpEV, dEV, r);
          }
        }
        if (r.maxRoll * 2 < r.targetHp) {
          if (!twoHit || total < twoHit.total || (total === twoHit.total && hpEV > twoHit.hpEV)) {
            twoHit = toResult(hpEV, dEV, r);
          }
        }
      }
    }
    return { baseline, oneHit, twoHit };
  }, [
    attacker, defender, atkLevel, atkNature, atkEVs, atkAbility, atkItem,
    defLevel, defNature, power, moveType, category, weather, terrain,
    reflect, lightScreen, crit, atkKey, defKey,
  ]);

  const spreadLine = (r: SpreadResult) =>
    `${r.hpEV} HP / ${r.defEV} ${defLabel}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        EV Survival Optimizer
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        How much bulk does your Pokémon need to survive a hit? Same Gen 7+
        damage math as the calculator — searched over every HP / {defLabel} EV
        split to find the cheapest spread that lives. Assumes 31 IVs and no
        other EVs invested.
      </p>

      {/* Team Builder import */}
      <div className={`${sectionCls} mt-5`}>
        <h2 className="font-bold text-slate-800 dark:text-slate-100">
          📥 Import from Team Builder
        </h2>
        <div className="mt-2">
          <TeamSavePicker onSelect={setImportTeam} actionLabel="Show members" />
        </div>
        {importTeam && (
          <div className="mt-3 space-y-2">
            {importTeam.members.map((m, i) => {
              const s = savedMemberSpecies(m);
              const label = m.nickname?.trim()
                ? `${m.nickname.trim()} (${s?.name ?? "?"})`
                : (s?.name ?? "Unknown Pokémon");
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => fillDefender(m)}
                    className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-600"
                  >
                    → Defender
                  </button>
                  <button
                    type="button"
                    onClick={() => fillAttacker(m)}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600"
                  >
                    → Attacker
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Defender */}
        <div className={sectionCls}>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">
            🛡️ Defender <span className="font-normal text-slate-400">(survivor)</span>
          </h2>
          <div className="mt-3">
            <SpeciesPicker
              label="Pokémon"
              onPick={setDefender}
              placeholder="Search defender…"
            />
            {defender && (
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {defender.name}
              </p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Level</span>
              <input
                type="number"
                min={1}
                max={100}
                value={defLevel}
                onChange={(e) => setDefLevel(clamp(e.target.valueAsNumber, 1, 100))}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <span className={labelCls}>Nature</span>
              <select
                value={defNature}
                onChange={(e) => setDefNature(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                {NATURES.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Attacker */}
        <div className={sectionCls}>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">
            ⚔️ Attacker <span className="font-normal text-slate-400">(threat)</span>
          </h2>
          <div className="mt-3">
            <SpeciesPicker
              label="Pokémon"
              onPick={setAttacker}
              placeholder="Search attacker…"
            />
            {attacker && (
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {attacker.name}
              </p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <span className={labelCls}>Level</span>
              <input
                type="number"
                min={1}
                max={100}
                value={atkLevel}
                onChange={(e) => setAtkLevel(clamp(e.target.valueAsNumber, 1, 100))}
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <span className={labelCls}>Nature</span>
              <select
                value={atkNature}
                onChange={(e) => setAtkNature(e.target.value)}
                className={`${inputCls} mt-1`}
              >
                {NATURES.map((n) => (
                  <option key={n.name} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={labelCls}>
                {category === "physical" ? "Atk" : "SpA"} EVs
              </span>
              <input
                type="number"
                min={0}
                max={252}
                step={4}
                value={atkEVs}
                onChange={(e) => setAtkEVs(clamp(e.target.valueAsNumber, 0, 252))}
                className={`${inputCls} mt-1`}
              />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <span className={labelCls}>Ability</span>
              <input
                value={atkAbility}
                onChange={(e) => setAtkAbility(e.target.value)}
                placeholder="None"
                className={`${inputCls} mt-1`}
              />
            </div>
            <div>
              <span className={labelCls}>Item</span>
              <input
                value={atkItem}
                onChange={(e) => setAtkItem(e.target.value)}
                placeholder="None"
                className={`${inputCls} mt-1`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Move + field */}
      <div className={`${sectionCls} mt-5`}>
        <h2 className="font-bold text-slate-800 dark:text-slate-100">💥 Move & field</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <span className={labelCls}>Power</span>
            <input
              type="number"
              min={0}
              max={250}
              value={power}
              onChange={(e) => setPower(Math.max(0, Math.round(e.target.valueAsNumber || 0)))}
              className={`${inputCls} mt-1`}
            />
          </div>
          <div>
            <span className={labelCls}>Type</span>
            <select
              value={moveType}
              onChange={(e) => setMoveType(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={labelCls}>Category</span>
            <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-600">
              {(["physical", "special"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex-1 px-3 py-2 text-sm font-semibold capitalize ${
                    category === c
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={labelCls}>Weather</span>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {WEATHERS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={terrain !== "None"}
              onChange={(e) => setTerrain(e.target.checked ? "Grassy" : "None")}
              className="h-4 w-4 accent-emerald-500"
            />
            Relevant terrain
          </label>
          {terrain !== "None" && (
            <select
              value={terrain}
              onChange={(e) => setTerrain(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              {TERRAINS.filter((t) => t !== "None").map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={category === "physical" ? reflect : lightScreen}
              onChange={(e) =>
                category === "physical"
                  ? setReflect(e.target.checked)
                  : setLightScreen(e.target.checked)
              }
              className="h-4 w-4 accent-emerald-500"
            />
            {category === "physical" ? "Reflect" : "Light Screen"}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={crit}
              onChange={(e) => setCrit(e.target.checked)}
              className="h-4 w-4 accent-emerald-500"
            />
            Critical hit
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="mt-5">
        {!attacker || !defender ? (
          <div className={`${sectionCls} text-sm text-slate-500 dark:text-slate-400`}>
            Pick both an attacker and a defender to run the search.
          </div>
        ) : !search ? null : (
          <div className="grid gap-5 md:grid-cols-3">
            <div className={sectionCls}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                No investment
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {search.baseline.minRoll}–{search.baseline.maxRoll}{" "}
                <span className="text-slate-400">
                  ({search.baseline.minPct}%–{search.baseline.maxPct}%)
                </span>
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                {search.baseline.koSummary}
              </p>
            </div>

            <div className={`${sectionCls} ring-2 ring-emerald-400 dark:ring-emerald-600`}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Survive 1 hit ✅
              </h3>
              {search.oneHit ? (
                <>
                  <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {spreadLine(search.oneHit)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {search.oneHit.total} EVs used · {508 - search.oneHit.total} left over
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Takes {search.oneHit.minRoll}–{search.oneHit.maxRoll}{" "}
                    <span className="text-slate-400">
                      ({search.oneHit.minPct}%–{search.oneHit.maxPct}%)
                    </span>{" "}
                    of {search.oneHit.hp} HP — max roll lives.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Not survivable — it KOs through 252/252.
                </p>
              )}
            </div>

            <div className={sectionCls}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Survive 2 hits 🛡️🛡️
              </h3>
              {search.twoHit ? (
                <>
                  <p className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    {spreadLine(search.twoHit)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {search.twoHit.total} EVs used · {508 - search.twoHit.total} left over
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Two max rolls ({search.twoHit.maxRoll * 2}) still fall short of{" "}
                    {search.twoHit.hp} HP.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Not possible — even 252 HP / 252 {defLabel} falls to two hits.
                </p>
              )}
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Searched in 4-EV steps over HP and {defLabel}, capped at 508 total EVs
          and 252 per stat. “Survive” means the max damage roll doesn&apos;t KO.
        </p>
      </div>
    </div>
  );
}
