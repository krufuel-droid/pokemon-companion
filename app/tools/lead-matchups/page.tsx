"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  matchupInfo,
  speedAt50Neutral,
  MonPicker,
  type CandidateMon,
  type Verdict,
} from "../_components/mon-picker";
import { TypePill } from "../_components/species-picker";
import { AbilitySelect, TeraSelect } from "../_components/battle-selectors";

const CELL_BG: Record<Verdict, string> = {
  mirror: "bg-slate-100 dark:bg-slate-800",
  favorable: "bg-emerald-100 dark:bg-emerald-900/60",
  even: "bg-amber-100 dark:bg-amber-900/50",
  unfavorable: "bg-red-100 dark:bg-red-900/60",
};

const CELL_DOT: Record<Verdict, string> = {
  mirror: "bg-slate-400",
  favorable: "bg-emerald-500",
  even: "bg-amber-500",
  unfavorable: "bg-red-500",
};

const VERDICT_LABEL: Record<Verdict, string> = {
  mirror: "Mirror",
  favorable: "Favorable",
  even: "Even",
  unfavorable: "Unfavorable",
};

const scoreOf = (v: Verdict): number =>
  v === "favorable" ? 1 : v === "unfavorable" ? -1 : 0;

function fmtMult(m: number): string {
  return m >= 4 ? "4×" : m >= 2 ? "2×" : m === 1 ? "1×" : m === 0 ? "0×" : "½×";
}

export default function LeadMatchupsPage() {
  const [myA, setMyA] = useState<CandidateMon | null>(null);
  const [myB, setMyB] = useState<CandidateMon | null>(null);
  const [oppX, setOppX] = useState<CandidateMon | null>(null);
  const [oppY, setOppY] = useState<CandidateMon | null>(null);
  const [openCell, setOpenCell] = useState<string | null>(null);
  /** Defensive abilities, keyed by slot ("myA" | "myB" | "oppX" | "oppY"). */
  const [abilities, setAbilities] = useState<Record<string, string>>({});
  /** Assumed Tera type for each opponent lead ("None" = no assumption). */
  const [oppTera, setOppTera] = useState<Record<string, string>>({});

  const getAbility = (k: string) => abilities[k] ?? "None";
  const teraOf = (k: string) => {
    const t = oppTera[k];
    return t && t !== "None" ? t : null;
  };
  const teraX = teraOf("oppX");
  const teraY = teraOf("oppY");

  // An assumed Tera recomputes the opponent's DEFENSIVE typing as the single
  // Tera type. Their offensive STAB stays their original types (×1.5) — the
  // new ×2 Tera STAB is a note, not verdict math.
  const effOppX = useMemo(
    () => (oppX && teraX ? { ...oppX, types: [teraX] } : oppX),
    [oppX, teraX],
  );
  const effOppY = useMemo(
    () => (oppY && teraY ? { ...oppY, types: [teraY] } : oppY),
    [oppY, teraY],
  );

  const excludeIds = useMemo(() => {
    const ids: number[] = [];
    for (const m of [myA, myB, oppX, oppY]) if (m) ids.push(m.id);
    return ids;
  }, [myA, myB, oppX, oppY]);

  const ready = myA && myB && oppX && oppY;

  const rows = useMemo(() => {
    if (!ready || !myA || !myB || !effOppX || !effOppY || !oppX || !oppY)
      return [];
    const mine = [
      { key: "myA", mon: myA },
      { key: "myB", mon: myB },
    ];
    const theirs = [
      { key: "oppX", mon: effOppX, orig: oppX, tera: teraX },
      { key: "oppY", mon: effOppY, orig: oppY, tera: teraY },
    ];
    return mine.map((m) => ({
      mine: m.mon,
      cells: theirs.map((o) => {
        const info = matchupInfo(m.mon, o.mon, {
          aAbility: getAbility(m.key),
          bAbility: getAbility(o.key),
        });
        const mySpe = speedAt50Neutral(m.mon);
        const oppSpe = speedAt50Neutral(o.mon);
        const speedNote =
          mySpe > oppSpe
            ? `${m.mon.label} moves first`
            : mySpe < oppSpe
              ? `${o.mon.label} moves first`
              : "Speed tie";
        const teraNote = o.tera
          ? `${o.orig.label} Terastallized into ${o.tera}: keeps ×1.5 STAB on ${o.orig.types.join(" / ")}, gains ×2 STAB on ${o.tera}-type moves.`
          : null;
        return {
          key: `${m.key}-${o.key}`,
          opp: o.mon,
          info,
          mySpe,
          oppSpe,
          speedNote,
          teraNote,
        };
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, myA, myB, effOppX, effOppY, oppX, oppY, teraX, teraY, abilities]);

  const positioning = useMemo(() => {
    if (!ready || rows.length === 0) return null;
    const avgs = rows.map((r) => ({
      mon: r.mine,
      avg:
        r.cells.reduce((sum, c) => sum + scoreOf(c.info.verdict), 0) /
        r.cells.length,
    }));
    const [a, b] = avgs;
    if (a.avg === b.avg) {
      return `Both leads average out even (${a.avg >= 0 ? "+" : ""}${a.avg.toFixed(1)}) — pick whichever fits your game plan.`;
    }
    const best = a.avg > b.avg ? a : b;
    const detail = rows
      .find((r) => r.mine.id === best.mon.id)!
      .cells.map(
        (c) =>
          `${VERDICT_LABEL[c.info.verdict].toLowerCase()} into ${c.opp.label}`,
      )
      .join(", ");
    return `Open with ${best.mon.label} — ${detail} (avg ${best.avg >= 0 ? "+" : ""}${best.avg.toFixed(1)}).`;
  }, [ready, rows]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Lead Matchup Advisor
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Your 2 leads vs their 2 leads — type verdicts for every pairing, a
        speed note, and which lead to open with.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <MonPicker
            label="Your lead A"
            value={myA}
            excludeIds={excludeIds.filter((id) => myA?.id !== id)}
            onPick={setMyA}
            onClear={() => setMyA(null)}
          />
          <div className="mt-2">
            <AbilitySelect
              label="Lead A ability"
              value={getAbility("myA")}
              onChange={(v) =>
                setAbilities((p) => ({ ...p, myA: v }))
              }
            />
          </div>
        </div>
        <div>
          <MonPicker
            label="Your lead B"
            value={myB}
            excludeIds={excludeIds.filter((id) => myB?.id !== id)}
            onPick={setMyB}
            onClear={() => setMyB(null)}
          />
          <div className="mt-2">
            <AbilitySelect
              label="Lead B ability"
              value={getAbility("myB")}
              onChange={(v) =>
                setAbilities((p) => ({ ...p, myB: v }))
              }
            />
          </div>
        </div>
        <div>
          <MonPicker
            label="Opponent lead X"
            value={oppX}
            excludeIds={excludeIds.filter((id) => oppX?.id !== id)}
            onPick={setOppX}
            onClear={() => setOppX(null)}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <AbilitySelect
              label="Lead X ability"
              value={getAbility("oppX")}
              onChange={(v) =>
                setAbilities((p) => ({ ...p, oppX: v }))
              }
            />
            <TeraSelect
              label="Assume Tera →"
              value={oppTera["oppX"] ?? "None"}
              onChange={(v) =>
                setOppTera((p) => ({ ...p, oppX: v }))
              }
            />
          </div>
        </div>
        <div>
          <MonPicker
            label="Opponent lead Y"
            value={oppY}
            excludeIds={excludeIds.filter((id) => oppY?.id !== id)}
            onPick={setOppY}
            onClear={() => setOppY(null)}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <AbilitySelect
              label="Lead Y ability"
              value={getAbility("oppY")}
              onChange={(v) =>
                setAbilities((p) => ({ ...p, oppY: v }))
              }
            />
            <TeraSelect
              label="Assume Tera →"
              value={oppTera["oppY"] ?? "None"}
              onChange={(v) =>
                setOppTera((p) => ({ ...p, oppY: v }))
              }
            />
          </div>
        </div>
      </div>

      {!ready ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">⚔️</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Pick all four leads above to see the 2×2 grid.
          </p>
        </div>
      ) : (
        <>
          {positioning && (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                💡 {positioning}
              </p>
            </div>
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-2">
              <thead>
                <tr>
                  <th className="w-32" />
                  {rows[0].cells.map((c) => (
                    <th key={c.opp.id} className="pb-1 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {c.opp.sprite && (
                          <img
                            src={c.opp.sprite}
                            alt={c.opp.label}
                            className="h-10 w-10 object-contain"
                          />
                        )}
                        <Link
                          href={`/pokedex/${c.opp.slug}`}
                          className="text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-200"
                        >
                          {c.opp.label}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.mine.id}>
                    <th className="pr-1">
                      <div className="flex items-center gap-2">
                        {r.mine.sprite && (
                          <img
                            src={r.mine.sprite}
                            alt={r.mine.label}
                            className="h-10 w-10 object-contain"
                          />
                        )}
                        <Link
                          href={`/pokedex/${r.mine.slug}`}
                          className="text-left text-xs font-bold text-slate-700 hover:text-emerald-600 dark:text-slate-200"
                        >
                          {r.mine.label}
                        </Link>
                      </div>
                    </th>
                    {r.cells.map((c) => {
                      const open = openCell === c.key;
                      return (
                        <td key={c.key}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenCell(open ? null : c.key)
                            }
                            className={`w-full rounded-xl p-3 text-left ring-1 ring-black/5 transition dark:ring-white/10 ${CELL_BG[c.info.verdict]}`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${CELL_DOT[c.info.verdict]}`}
                              />
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                {VERDICT_LABEL[c.info.verdict]}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs text-slate-600 dark:text-slate-300">
                              {c.speedNote}
                            </span>
                            <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                              {open ? "▲ details" : "▼ details"}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.flatMap((r) =>
            r.cells.map((c) => ({ r, c })),
          )
            .filter(({ c }) => openCell === c.key)
            .map(({ r, c }) => (
              <div
                key={c.key}
                className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  {r.mine.label} vs {c.opp.label}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.mine.types.map((t) => (
                    <TypePill key={t} type={t} />
                  ))}
                  <span className="px-1 text-slate-400">vs</span>
                  {c.opp.types.map((t) => (
                    <TypePill key={t} type={t} />
                  ))}
                </div>
                <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                  <li>
                    {r.mine.label}&apos;s {c.info.offType} STAB hits{" "}
                    {c.opp.label} for{" "}
                    <span className="font-semibold">
                      {fmtMult(c.info.off)}
                    </span>
                    .
                  </li>
                  <li>
                    {c.opp.label}&apos;s {c.info.backType} STAB hits back for{" "}
                    <span className="font-semibold">
                      {fmtMult(c.info.back)}
                    </span>
                    .
                  </li>
                  {c.info.offAbilityNote && (
                    <li>🛡️ {c.info.offAbilityNote}.</li>
                  )}
                  {c.info.backAbilityNote && (
                    <li>🛡️ {c.info.backAbilityNote}.</li>
                  )}
                  {c.teraNote && <li>💎 {c.teraNote}</li>}
                  <li>
                    Speed at level 50 (neutral, no investment): {c.mySpe} vs{" "}
                    {c.oppSpe} — {c.speedNote.toLowerCase()}.
                  </li>
                </ul>
              </div>
            ))}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Favorable
              — my STAB hits SE, theirs doesn&apos;t
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Even —
              neither side (or both sides) hold the edge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Unfavorable
              — their STAB hits SE, mine doesn&apos;t
            </span>
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
        <span className="font-bold">Honest limitations:</span> type matchups +
        neutral speed, plus each lead&apos;s selected defensive ability and
        the opponent&apos;s assumed Tera (defense recomputed as the single
        Tera type; their Tera STAB is noted, not mathed). Still ignored: Fake
        Out, Protect, priority moves, items, the opponent&apos;s real EVs and
        sets, speed investment, and Tailwind/Trick Room — the actual turn-one
        play still needs a human brain. Speeds are level 50, neutral nature,
        no EVs; Mega/form stat changes aren&apos;t modeled.
        Category-based abilities (Fluffy, Ice Scales) aren&apos;t modeled.
      </div>
    </main>
  );
}
