"use client";

import { useMemo, useState } from "react";
import {
  getDungeonsForGame,
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

interface MarkerInfo {
  kind: "item" | "trainer";
  x: number;
  y: number;
  text: string;
}

function FloorMap({ floor }: { floor: DungeonFloor }) {
  const [selected, setSelected] = useState<MarkerInfo | null>(null);

  const itemByCoord = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of floor.items) m.set(`${it.x},${it.y}`, it.name);
    return m;
  }, [floor.items]);

  const trainerByCoord = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of floor.trainers) m.set(`${t.x},${t.y}`, t.note);
    return m;
  }, [floor.trainers]);

  function handleCell(ch: string, x: number, y: number) {
    if (ch === "I") {
      setSelected({
        kind: "item",
        x,
        y,
        text: itemByCoord.get(`${x},${y}`) ?? "Item",
      });
    } else if (ch === "T") {
      setSelected({
        kind: "trainer",
        x,
        y,
        text: trainerByCoord.get(`${x},${y}`) ?? "Trainer",
      });
    } else {
      setSelected(null);
    }
  }

  return (
    <div>
      <div
        className="inline-block overflow-x-auto rounded-xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
        role="img"
        aria-label={`Schematic map of ${floor.name}`}
      >
        <div className="grid w-max gap-[2px]">
          {floor.grid.map((row, y) => (
            <div key={y} className="flex gap-[2px]">
              {row.split("").map((ch, x) => (
                <button
                  key={x}
                  type="button"
                  disabled={ch !== "I" && ch !== "T"}
                  onClick={() => handleCell(ch, x, y)}
                  onMouseEnter={() => {
                    if (ch === "I" || ch === "T") handleCell(ch, x, y);
                  }}
                  title={cellLabel(ch)}
                  aria-label={
                    ch === "I" || ch === "T"
                      ? `${cellLabel(ch)} at column ${x + 1}, row ${y + 1}`
                      : undefined
                  }
                  className={cellClass(ch)}
                >
                  {ch === "#" || ch === "." ? "" : ch}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        {[
          ["S", "Stairs", "bg-amber-200 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200"],
          ["I", "Item", "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/70 dark:text-emerald-200"],
          ["T", "Trainer", "bg-red-200 text-red-900 dark:bg-red-900/70 dark:text-red-200"],
          ["E", "Entrance", "bg-sky-200 text-sky-900 dark:bg-sky-900/70 dark:text-sky-200"],
          ["X", "Exit", "bg-violet-200 text-violet-900 dark:bg-violet-900/70 dark:text-violet-200"],
        ].map(([ch, label, cls]) => (
          <span key={ch} className="inline-flex items-center gap-1">
            <span className={`flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold ${cls}`}>
              {ch}
            </span>
            {label}
          </span>
        ))}
      </div>

      {/* Selected marker readout */}
      <div aria-live="polite" className="mt-2 min-h-6 text-sm">
        {selected ? (
          <p className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
            <span aria-hidden>{selected.kind === "item" ? "💎 " : "⚔️ "}</span>
            {selected.text}
            <span className="ml-2 text-xs text-slate-400">
              ({selected.x + 1}, {selected.y + 1})
            </span>
          </p>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Tap a highlighted tile to see what&apos;s there.
          </p>
        )}
      </div>

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
  const [floorIdx, setFloorIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const floor = dungeon.floors[floorIdx] ?? dungeon.floors[0];

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">
          🗺️ {dungeon.dungeon}
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
          {dungeon.floors.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Floors">
              {dungeon.floors.map((f, i) => (
                <button
                  key={f.name}
                  type="button"
                  role="tab"
                  aria-selected={i === floorIdx}
                  onClick={() => {
                    setFloorIdx(i);
                  }}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    i === floorIdx
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
          {dungeon.floors.length === 1 && (
            <p className="mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              {dungeon.floors[0].name}
            </p>
          )}
          {floor && <FloorMap key={floor.name} floor={floor} />}
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
