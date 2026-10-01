"use client";

import { useMemo, useState } from "react";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200";
const labelCls = "block text-sm font-medium text-slate-600";

interface Ball {
  name: string;
  /** Best-case multiplier; null = guaranteed catch (Master Ball). */
  mult: number | null;
}

const BALLS: Ball[] = [
  { name: "Poké Ball", mult: 1 },
  { name: "Great Ball", mult: 1.5 },
  { name: "Ultra Ball", mult: 2 },
  { name: "Master Ball", mult: null },
  { name: "Safari Ball", mult: 1.5 },
  { name: "Net Ball", mult: 3 },
  { name: "Dive Ball", mult: 3.5 },
  { name: "Repeat Ball", mult: 3 },
  { name: "Dusk Ball", mult: 3 },
  { name: "Quick Ball", mult: 5 },
];

const STATUSES = [
  { name: "None", mult: 1 },
  { name: "Sleep / Freeze", mult: 2.5 },
  { name: "Paralyze / Poison / Burn", mult: 1.5 },
];

function toNum(v: number, fallback: number): number {
  return Number.isFinite(v) ? v : fallback;
}

export default function CatchRateCalculator() {
  const [maxHp, setMaxHp] = useState(100);
  const [curHp, setCurHp] = useState(20);
  const [catchRate, setCatchRate] = useState(45);
  const [ballName, setBallName] = useState("Ultra Ball");
  const [statusName, setStatusName] = useState("None");

  const calc = useMemo(() => {
    const hpMax = Math.max(1, Math.round(toNum(maxHp, 100)));
    const hpCur = Math.min(hpMax, Math.max(0, Math.round(toNum(curHp, 0))));
    const rate = Math.min(255, Math.max(3, Math.round(toNum(catchRate, 45))));

    const ball = BALLS.find((b) => b.name === ballName) ?? BALLS[0];
    const status = STATUSES.find((s) => s.name === statusName) ?? STATUSES[0];

    if (ball.mult === null) {
      return {
        hpMax,
        hpCur,
        rate,
        ball,
        status,
        a: 255,
        perShake: 1,
        overall: 1,
        guaranteed: true,
      };
    }

    // Gen V+ formula.
    const a =
      (((3 * hpMax - 2 * hpCur) * rate * ball.mult) / (3 * hpMax)) * status.mult;

    if (a >= 255) {
      return { hpMax, hpCur, rate, ball, status, a, perShake: 1, overall: 1, guaranteed: true };
    }

    const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
    const perShake = b / 65535;
    const overall = Math.pow(perShake, 4);
    return { hpMax, hpCur, rate, ball, status, a, perShake, overall, guaranteed: false };
  }, [maxHp, curHp, catchRate, ballName, statusName]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800">Catch Rate Calculator</h1>
      <p className="mt-2 text-slate-500">
        Gen V+ capture formula. Conditional balls (Net, Dive, Repeat, Dusk,
        Quick) use their best-case multiplier.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="cr-maxhp">Max HP</label>
              <input
                id="cr-maxhp"
                type="number"
                min={1}
                className={inputCls}
                value={maxHp}
                onChange={(e) => setMaxHp(toNum(e.target.valueAsNumber, 100))}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="cr-rate">
                Base catch rate (3–255)
              </label>
              <input
                id="cr-rate"
                type="number"
                min={3}
                max={255}
                className={inputCls}
                value={catchRate}
                onChange={(e) => setCatchRate(toNum(e.target.valueAsNumber, 45))}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls} htmlFor="cr-curhp">
                Current HP: {calc.hpCur} / {calc.hpMax}
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="cr-curhp"
                  type="range"
                  min={0}
                  max={calc.hpMax}
                  value={calc.hpCur}
                  onChange={(e) => setCurHp(toNum(e.target.valueAsNumber, 0))}
                  className="w-full accent-emerald-500"
                />
                <input
                  type="number"
                  min={0}
                  max={calc.hpMax}
                  aria-label="Current HP"
                  className={`${inputCls} w-24`}
                  value={curHp}
                  onChange={(e) => setCurHp(toNum(e.target.valueAsNumber, 0))}
                />
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-300 transition-all"
                  style={{ width: `${(calc.hpCur / calc.hpMax) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="cr-ball">Ball</label>
              <select
                id="cr-ball"
                className={inputCls}
                value={ballName}
                onChange={(e) => setBallName(e.target.value)}
              >
                {BALLS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                    {b.mult !== null ? ` (×${b.mult})` : " (always)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="cr-status">Status</label>
              <select
                id="cr-status"
                className={inputCls}
                value={statusName}
                onChange={(e) => setStatusName(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} (×{s.mult})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Result</h2>

          <div className="mt-4 rounded-2xl bg-emerald-300/25 p-6 text-center">
            <div className="text-sm font-medium text-slate-600">
              Overall catch chance
            </div>
            <div className="mt-1 text-5xl font-bold text-slate-800">
              {calc.guaranteed ? "100%" : `${(calc.overall * 100).toFixed(1)}%`}
            </div>
            {calc.guaranteed && (
              <div className="mt-1 text-sm font-semibold text-emerald-700">
                Guaranteed catch!
              </div>
            )}
            <div className="mt-3 text-sm text-slate-600">
              Per-shake chance:{" "}
              <span className="font-semibold">
                {(calc.perShake * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Capture value (a)</dt>
              <dd className="font-semibold text-slate-800">{calc.a.toFixed(1)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Ball</dt>
              <dd className="font-semibold text-slate-800">
                {calc.ball.name}
                {calc.ball.mult !== null ? ` ×${calc.ball.mult}` : " — always catches"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-semibold text-slate-800">
                {calc.status.name} ×{calc.status.mult}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-5 text-slate-400">
            a = ((3×maxHP − 2×currentHP) × catchRate × ball / (3×maxHP)) ×
            status. If a ≥ 255 the catch is guaranteed; otherwise shake value b =
            1048560 / √(√(16711680 / a)), and overall chance = (b/65535)⁴.
          </p>
        </div>
      </div>
    </div>
  );
}
