"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDungeonsForGame,
  dungeonAnchor,
  type DungeonFloor,
  type DungeonMap,
} from "@/lib/data/dungeon-maps";

/* ------------------------------------------------------------------ */
/* Cell styling                                                        */
/* ------------------------------------------------------------------ */

function cellClass(ch: string): string {
  const base =
    "flex h-5 w-5 items-center justify-center text-[10px] font-bold leading-none sm:h-6 sm:w-6";
  switch (ch) {
    case "#":
      return `${base} bg-slate-300 text-transparent dark:bg-slate-700`;
    case "S":
      return `${base} cursor-default bg-amber-200 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200`;
    case "I":
      return `${base} cursor-pointer bg-emerald-200 text-emerald-900 ring-1 ring-emerald-400 transition hover:scale-110 dark:bg-emerald-900/70 dark:text-emerald-200 dark:ring-emerald-600`;
    case "T":
      return `${base} cursor-pointer bg-red-200 text-red-900 ring-1 ring-red-400 transition hover:scale-110 dark:bg-red-900/70 dark:text-red-200 dark:ring-red-600`;
    case "E":
      return `${base} bg-sky-200 text-sky-900 dark:bg-sky-900/70 dark:text-sky-200`;
    case "X":
      return `${base} bg-violet-200 text-violet-900 dark:bg-violet-900/70 dark:text-violet-200`;
    default:
      return `${base} bg-slate-100 text-transparent dark:bg-slate-800/60`;
  }
}

function cellLabel(ch: string): string {
  switch (ch) {
    case "S":
      return "Stairs / ladder";
    case "I":
      return "Item pickup";
    case "T":
      return "Trainer battle";
    case "E":
      return "Entrance";
    case "X":
      return "Exit";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
/* Single floor map                                                    */
/* ------------------------------------------------------------------ */

/** A, B, … Z, AA, AB … for item letters. */
function letterFor(i: number): string {
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function FloorMap({ floor }: { floor: DungeonFloor }) {
  // GameFAQs style: items get letters (A, B, C…), trainers get numbers.
  const itemLetter = useMemo(() => {
    const m = new Map<string, string>();
    floor.items.forEach((it, i) => m.set(`${it.x},${it.y}`, letterFor(i)));
    return m;
  }, [floor.items]);

  const trainerNum = useMemo(() => {
    const m = new Map<string, string>();
    floor.trainers.forEach((t, i) => m.set(`${t.x},${t.y}`, String(i + 1)));
    return m;
  }, [floor.trainers]);

  function markerFor(ch: string, x: number, y: number): string {
    if (ch === "I") return itemLetter.get(`${x},${y}`) ?? "I";
    if (ch === "T") return trainerNum.get(`${x},${y}`) ?? "T";
    return ch;
  }

  return (
    <div className="min-w-0">
      <h4 className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {floor.name}
      </h4>
      <div
        className="inline-block max-w-full overflow-x-auto rounded-xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
        role="img"
        aria-label={`Schematic map of ${floor.name}`}
      >
        <div className="grid w-max gap-[2px]">
          {floor.grid.map((row, y) => (
            <div key={y} className="flex gap-[2px]">
              {row.split("").map((ch, x) => (
                <span
                  key={x}
                  title={
                    ch === "I"
                      ? floor.items.find((it) => it.x === x && it.y === y)?.name ?? "Item"
                      : ch === "T"
                        ? floor.trainers.find((t) => t.x === x && t.y === y)?.note ?? "Trainer"
                        : cellLabel(ch)
                  }
                  className={cellClass(ch)}
                >
                  {ch === "#" || ch === "." ? "" : markerFor(ch, x, y)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* GameFAQs-style legend: A = Item name */}
      {(floor.items.length > 0 || floor.trainers.length > 0) && (
        <div className="mt-2 rounded-xl bg-stone-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Legend
          </p>
          <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
            {floor.items.map((it, i) => (
              <p key={`i-${i}`} className="truncate text-xs text-slate-600 dark:text-slate-300" title={it.name}>
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-emerald-200 text-[9px] font-bold text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200">
                  {letterFor(i)}
                </span>
                {it.name}
              </p>
            ))}
            {floor.trainers.map((t, i) => (
              <p key={`t-${i}`} className="truncate text-xs text-slate-600 dark:text-slate-300" title={t.note}>
                <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-red-200 text-[9px] font-bold text-red-900 dark:bg-red-900/70 dark:text-red-200">
                  {i + 1}
                </span>
                ⚔️ {t.note}
              </p>
            ))}
          </div>
        </div>
      )}

      {floor.notes && (
        <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
          📝 {floor.notes}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Walkthrough panel (collapsed by default, gym-panel visual pattern)  */
/* ------------------------------------------------------------------ */

function WalkthroughPanel({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  if (steps.length === 0) return null;
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:ring-slate-600"
      >
        <span aria-hidden>🧭</span>
        {open ? "Hide walkthrough" : "Walkthrough"}
        <span aria-hidden className="text-slate-400 dark:text-slate-500">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <ol className="mt-2 space-y-1.5 rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One dungeon: floor tabs + map + walkthrough                         */
/* ------------------------------------------------------------------ */

function DungeonViewer({ dungeon }: { dungeon: DungeonMap }) {
  const [open, setOpen] = useState(false);
  const anchor = dungeonAnchor(dungeon.dungeon);

  // Expand automatically when a Path milestone's "View map" link targets us.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === `#${anchor}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [anchor]);

  return (
    <div
      id={anchor}
      className="scroll-mt-24 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          🗺️ {dungeon.dungeon}
          <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
            {dungeon.floors.length} {dungeon.floors.length === 1 ? "floor" : "floors"}
          </span>
        </h3>
        <span
          aria-hidden
          className="shrink-0 text-sm text-slate-400 dark:text-slate-500"
        >
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="mt-3">
          {/* GameFAQs style: all floors visible at once, side by side */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {dungeon.floors.map((f) => (
              <FloorMap key={f.name} floor={f} />
            ))}
          </div>
          <WalkthroughPanel steps={dungeon.walkthrough} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section for the guide page                                          */
/* ------------------------------------------------------------------ */

export default function DungeonMapSection({ game }: { game: string }) {
  const dungeons = useMemo(() => getDungeonsForGame(game), [game]);
  if (dungeons.length === 0) return null;

  return (
    <section className="mt-12" aria-label="Dungeon maps">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Dungeon Maps
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Schematic floor maps with item pickups, trainers, and step-by-step
        walkthroughs for the story dungeons.
      </p>
      <div className="mt-4 space-y-3">
        {dungeons.map((d) => (
          <DungeonViewer key={d.dungeon} dungeon={d} />
        ))}
      </div>
    </section>
  );
}
