"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { typeColor } from "@/lib/theme";

interface LearnsetMove {
  level: number;
  /** PokéAPI move id — null for entries predating the id backfill. */
  id: number | null;
  move: string;
  type: string | null;
  category: string | null;
  power: number | null;
  accuracy: number | null;
}

interface LearnsetGame {
  vg: string;
  label: string;
  order: number;
  moves: LearnsetMove[];
}

interface LearnsetFile {
  id: number;
  name: string;
  games: LearnsetGame[];
}

const CATEGORY_BADGE: Record<string, string> = {
  Physical: "bg-orange-100 text-orange-800",
  Special: "bg-indigo-100 text-indigo-800",
  Status: "bg-slate-200 text-slate-700",
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-slate-400">—</span>;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: typeColor(type) }}
    >
      {type}
    </span>
  );
}

function LevelCell({ level }: { level: number }) {
  if (level === 0) {
    return (
      <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">
        Evo
      </span>
    );
  }
  return <span className="font-bold text-slate-700">{level}</span>;
}

type Status =
  | { state: "loading" }
  | { state: "error" }
  | { state: "empty" }
  | { state: "ready"; games: LearnsetGame[] };

export function LearnsetSection({ speciesId }: { speciesId: number }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [gameIdx, setGameIdx] = useState(0);

  useEffect(() => {
    if (!open || status.state !== "loading") return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    fetch(`/learnsets/${speciesId}.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<LearnsetFile>;
      })
      .then((file) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setStatus(
          file.games.length === 0
            ? { state: "empty" }
            : { state: "ready", games: file.games }
        );
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timeout);
        setStatus({ state: "error" });
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [speciesId, open, status]);

  const games = status.state === "ready" ? status.games : [];
  const active = games[gameIdx] ?? games[0];

  return (
    <section
      aria-label="Level-up moves"
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <span>
          <span className="text-lg font-bold">
            Level-up moves
            {status.state === "ready" && (
              <span className="ml-2 text-sm font-medium text-slate-400">
                · {games.length} {games.length === 1 ? "game" : "games"}
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm font-normal text-slate-500">
            Moves learned by leveling up, per game — newest first.
          </span>
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5 7l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {status.state === "loading" && (
            <p className="mt-3 text-sm text-slate-500">
              Looking up level-up learnsets…
            </p>
          )}

          {status.state === "error" && (
            <p className="mt-3 text-sm text-slate-500">
              Couldn&apos;t load learnset data right now — the rest of the page
              is unaffected.
            </p>
          )}

          {status.state === "empty" && (
            <p className="mt-3 text-sm text-slate-500">
              No level-up moves recorded for this Pokémon.
            </p>
          )}

          {status.state === "ready" && active && (
            <div className="mt-4">
              <label className="flex items-center gap-3 text-sm">
                <span className="font-semibold text-slate-600">Game</span>
                <select
                  value={gameIdx}
                  onChange={(e) => setGameIdx(Number(e.target.value))}
                  className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {games.map((g, i) => (
                    <option key={g.vg} value={i}>
                      {g.label} ({g.moves.length} moves)
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-slate-200">
                <table className="w-full min-w-[520px] border-collapse bg-white text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2 font-semibold">Lv</th>
                      <th className="px-4 py-2 font-semibold">Move</th>
                      <th className="px-4 py-2 font-semibold">Type</th>
                      <th className="px-4 py-2 font-semibold">Cat.</th>
                      <th className="px-4 py-2 text-right font-semibold">Pow</th>
                      <th className="px-4 py-2 text-right font-semibold">Acc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {active.moves.map((m) => (
                      <tr key={`${m.level}-${m.move}`} className="hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <LevelCell level={m.level} />
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {m.id ? (
                            <Link
                              href={`/moves/${m.id}`}
                              className="text-slate-800 hover:text-emerald-700 hover:underline"
                            >
                              {m.move}
                            </Link>
                          ) : (
                            <span className="text-slate-800">{m.move}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <TypeBadge type={m.type} />
                        </td>
                        <td className="px-4 py-2">
                          {m.category ? (
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                                CATEGORY_BADGE[m.category] ??
                                "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {m.category}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                          {m.power ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-600">
                          {m.accuracy ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                “Evo” moves are learned automatically when the Pokémon evolves.
                Data via PokéAPI.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
