"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getPokemonOfTheDay } from "@/lib/potd";
import type { SpeciesIndex } from "@/lib/pokedex";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

interface DayCell {
  day: number;
  mon: SpeciesIndex | null; // null = future day (no pick yet)
  isToday: boolean;
}

function utcToday() {
  const n = new Date();
  return { y: n.getUTCFullYear(), m: n.getUTCMonth() };
}

export default function PotdArchivePage() {
  const now = utcToday();
  const [view, setView] = useState(now);

  const monthLabel = useMemo(
    () =>
      new Date(Date.UTC(view.y, view.m, 1)).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [view],
  );

  const cells = useMemo<(DayCell | null)[]>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const startWeekday = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const out: (DayCell | null)[] = [];
    for (let i = 0; i < startWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(view.y, view.m, d));
      const key = date.toISOString().slice(0, 10);
      if (key > todayStr) {
        out.push({ day: d, mon: null, isToday: false });
      } else {
        out.push({ day: d, mon: getPokemonOfTheDay(date), isToday: key === todayStr });
      }
    }
    return out;
  }, [view]);

  const shiftMonth = (delta: number) =>
    setView((v) => {
      const d = new Date(Date.UTC(v.y, v.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const canNext = view.y < now.y || (view.y === now.y && view.m < now.m);
  const isCurrentMonth = view.y === now.y && view.m === now.m;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
        ⭐ Pokémon of the Day
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        Archive
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Every past pick, recomputed from the same daily draw. Picks change at
        midnight UTC — tap any Pokémon to visit its page.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-full px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ‹ Prev
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={!canNext}
            aria-label="Next month"
            className="rounded-full px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Next ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 p-3 sm:gap-2 sm:p-4">
          {WEEKDAYS.map((w, i) => (
            <div
              key={`${w}-${i}`}
              className="pb-1 text-center text-xs font-bold text-slate-400 dark:text-slate-500"
            >
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell === null) return <div key={`blank-${i}`} />;
            if (cell.mon === null) {
              return (
                <div
                  key={`future-${i}`}
                  className="flex flex-col items-center rounded-xl p-1 opacity-30 sm:p-2"
                  aria-hidden="true"
                >
                  <span className="text-xs font-semibold text-slate-400">{cell.day}</span>
                  <div className="h-10 w-10 sm:h-12 sm:w-12" />
                </div>
              );
            }
            const mon = cell.mon;
            return (
              <Link
                key={`${view.y}-${view.m}-${cell.day}`}
                href={`/pokedex/${mon.slug}`}
                aria-label={`${monthLabel} ${cell.day}: ${mon.name}`}
                title={mon.name}
                className={`flex flex-col items-center rounded-xl p-1 transition hover:bg-emerald-50 sm:p-2 dark:hover:bg-emerald-950 ${
                  cell.isToday ? "ring-2 ring-emerald-500" : "ring-1 ring-transparent"
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    cell.isToday
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {cell.day}
                </span>
                <img
                  src={mon.sprites.regular}
                  alt={mon.name}
                  className="h-10 w-10 object-contain sm:h-12 sm:w-12"
                  loading="lazy"
                />
                <span className="mt-0.5 hidden max-w-full truncate text-[11px] font-medium text-slate-600 sm:block dark:text-slate-300">
                  {mon.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {!isCurrentMonth && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setView(now)}
            className="rounded-full border-2 border-emerald-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-emerald-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-emerald-950"
          >
            Jump to this month
          </button>
        </div>
      )}
    </div>
  );
}
