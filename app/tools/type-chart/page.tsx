"use client";

import { useState } from "react";
import { TYPES, TYPE_CHART, effectiveness } from "@/lib/typechart";
import { TYPE_COLORS } from "@/lib/theme";

function multLabel(m: number): string {
  if (m === 0) return "0";
  if (m === 0.25) return "¼";
  if (m === 0.5) return "½";
  if (m === 2) return "2";
  if (m === 4) return "4";
  return "";
}

function cellBg(m: number): string {
  if (m === 0) return "bg-slate-800 text-slate-100 dark:bg-black";
  if (m >= 2) return "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100";
  if (m <= 0.5) return "bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100";
  return "bg-white text-slate-400 dark:bg-slate-900 dark:text-slate-600";
}

function TypePill({ type, selected, onClick }: { type: string; selected: boolean; onClick: () => void }) {
  const bg = TYPE_COLORS[type] ?? "#A8A77A";
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-sm transition ${
        selected ? "ring-2 ring-offset-2 ring-slate-500 dark:ring-offset-slate-900 scale-105" : "opacity-80 hover:opacity-100"
      }`}
      style={{ backgroundColor: bg }}
    >
      {type}
    </button>
  );
}

export default function TypeChartPage() {
  const [mode, setMode] = useState<"grid" | "lookup">("lookup");
  const [atk, setAtk] = useState<string>("Fire");
  const [def1, setDef1] = useState<string>("Grass");
  const [def2, setDef2] = useState<string | null>(null);
  const [highlightAtk, setHighlightAtk] = useState<string | null>(null);
  const [highlightDef, setHighlightDef] = useState<string | null>(null);

  const defending = def2 ? [def1, def2] : [def1];
  const mult = effectiveness(atk, defending);

  const strongAgainst = TYPES.filter((t) => (TYPE_CHART[atk]?.[t] ?? 1) > 1);
  const weakAgainst = TYPES.filter((t) => { const m = TYPE_CHART[atk]?.[t] ?? 1; return m < 1; });
  const resistsDef = TYPES.filter((t) => { const m = TYPE_CHART[t]?.[def1] ?? 1; return m < 1; });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Type Chart</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Every matchup in the game — look one up or browse the full grid.
      </p>

      <div className="mt-4 inline-flex rounded-full bg-slate-200 p-1 dark:bg-slate-800">
        {(["lookup", "grid"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              mode === m ? "bg-white shadow dark:bg-slate-900 text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {m === "lookup" ? "Quick lookup" : "Full grid"}
          </button>
        ))}
      </div>

      {mode === "lookup" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Attacking type</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <TypePill key={t} type={t} selected={atk === t} onClick={() => setAtk(t)} />
              ))}
            </div>
            <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-400">Defending type(s)</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <TypePill
                  key={t}
                  type={t}
                  selected={def1 === t || def2 === t}
                  onClick={() => {
                    if (def1 === t) { setDef1(def2 ?? t); setDef2(null); }
                    else if (def2 === t) setDef2(null);
                    else if (!def2) setDef2(t);
                    else { setDef1(t); setDef2(null); }
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Tap a second type for dual-type matchups. Tap again to remove.</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <div className="flex items-center justify-center gap-3">
              <span className="rounded-full px-4 py-2 font-bold text-white" style={{ backgroundColor: TYPE_COLORS[atk] }}>{atk}</span>
              <span className="text-2xl">→</span>
              {defending.map((d) => (
                <span key={d} className="rounded-full px-4 py-2 font-bold text-white" style={{ backgroundColor: TYPE_COLORS[d] }}>{d}</span>
              ))}
            </div>
            <div className={`mt-6 rounded-2xl p-8 text-center ${cellBg(mult)}`}>
              <div className="text-5xl font-black">×{multLabel(mult) || "1"}</div>
              <div className="mt-2 text-sm font-semibold">
                {mult === 0 ? "No effect!" : mult >= 2 ? "Super effective!" : mult <= 0.5 ? "Not very effective…" : "Neutral damage"}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">{atk} hits hard vs</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {strongAgainst.map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: TYPE_COLORS[t] }}>{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-bold text-rose-600 dark:text-rose-400">{atk} struggles vs</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {weakAgainst.map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: TYPE_COLORS[t] }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="px-4 pt-4 text-sm text-slate-500 dark:text-slate-400">
            Rows = attacking, columns = defending. Tap a type header to highlight its row or column.
            {(highlightAtk || highlightDef) && (
              <button onClick={() => { setHighlightAtk(null); setHighlightDef(null); }} className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">
                Clear
              </button>
            )}
          </p>
          <table className="mt-2 w-full min-w-[900px] border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="p-1 text-[10px] uppercase text-slate-400">Atk ↓ · Def →</th>
                {TYPES.map((d) => (
                  <th key={d} className="p-1">
                    <button
                      onClick={() => setHighlightDef(highlightDef === d ? null : d)}
                      className={`w-full rounded px-1 py-1.5 font-bold text-white ${highlightDef === d ? "ring-2 ring-slate-500" : "opacity-85"}`}
                      style={{ backgroundColor: TYPE_COLORS[d] }}
                    >
                      {d.slice(0, 4)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPES.map((a) => (
                <tr key={a} className={highlightAtk === a ? "bg-amber-50 dark:bg-amber-950/30" : ""}>
                  <td className="p-1">
                    <button
                      onClick={() => setHighlightAtk(highlightAtk === a ? null : a)}
                      className={`w-full rounded px-2 py-1.5 font-bold text-white ${highlightAtk === a ? "ring-2 ring-slate-500" : "opacity-85"}`}
                      style={{ backgroundColor: TYPE_COLORS[a] }}
                    >
                      {a}
                    </button>
                  </td>
                  {TYPES.map((d) => {
                    const m = TYPE_CHART[a]?.[d] ?? 1;
                    const dim = (highlightAtk && highlightAtk !== a) || (highlightDef && highlightDef !== d);
                    return (
                      <td key={d} className={`border border-slate-100 p-1 font-bold dark:border-slate-800 ${cellBg(m)} ${dim ? "opacity-30" : ""} ${highlightDef === d ? "bg-amber-50 dark:bg-amber-950/30" : ""}`}>
                        {multLabel(m)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            <span><span className="inline-block h-3 w-3 rounded bg-emerald-200 dark:bg-emerald-800" /> Super effective (×2/×4)</span>
            <span><span className="inline-block h-3 w-3 rounded bg-rose-200 dark:bg-rose-900" /> Not very effective (×½/×¼)</span>
            <span><span className="inline-block h-3 w-3 rounded bg-slate-800" /> No effect (×0)</span>
          </div>
        </div>
      )}
    </main>
  );
}
