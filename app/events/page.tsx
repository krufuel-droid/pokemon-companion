"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GAME_EVENTS, KIND_LABEL, KIND_COLOR, type GameEvent } from "@/lib/data/events";

const KIND_DOT: Record<GameEvent["kind"], string> = {
  raid: "bg-violet-500",
  gift: "bg-emerald-500",
  distribution: "bg-amber-500",
  release: "bg-sky-500",
  tournament: "bg-rose-500",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Days an event touches (inclusive). Events with no dates are list-only. */
function eventDays(e: GameEvent): string[] {
  if (!e.startDate && !e.endDate) return [];
  const start = parseISO(e.startDate ?? e.endDate!);
  const end = parseISO(e.endDate ?? e.startDate!);
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(toISODate(d));
  }
  return days;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(dateStr + "T23:59:59");
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ event }: { event: GameEvent }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (event.endDate) {
    const days = daysUntil(event.endDate);
    if (days < 0)
      return (
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          Ended
        </span>
      );
    if (days <= 7)
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
          Ends in {days} {days === 1 ? "day" : "days"}!
        </span>
      );
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
        {days} days left
      </span>
    );
  }
  if (event.startDate) {
    const start = new Date(event.startDate + "T00:00:00");
    if (start > now) {
      const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          Starts in {days} {days === 1 ? "day" : "days"}
        </span>
      );
    }
  }
  return (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
      Active
    </span>
  );
}

function EventCard({ event }: { event: GameEvent }) {
  return (
    <Link
      href={event.href}
      className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${KIND_COLOR[event.kind]}`}>
          {KIND_LABEL[event.kind]}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {event.game}
        </span>
        <span className="ml-auto">
          <StatusBadge event={event} />
        </span>
      </div>
      <h2 className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">{event.title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{event.detail}</p>
      {(event.startDate || event.endDate) && (
        <p className="mt-2 text-xs text-slate-400">
          {event.startDate && <>From {formatDate(event.startDate)} </>}
          {event.endDate && <>· ends {formatDate(event.endDate)}</>}
        </p>
      )}
    </Link>
  );
}

type View = "calendar" | "upcoming";

export default function EventsPage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [view, setView] = useState<View>("calendar");
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toISODate(today));
  const [kindFilter, setKindFilter] = useState<"all" | GameEvent["kind"]>("all");

  const filtered = useMemo(
    () => (kindFilter === "all" ? GAME_EVENTS : GAME_EVENTS.filter((e) => e.kind === kindFilter)),
    [kindFilter],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, GameEvent[]>();
    for (const e of filtered) {
      for (const day of eventDays(e)) {
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(e);
      }
    }
    return map;
  }, [filtered]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const upcoming = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const da = a.endDate ? daysUntil(a.endDate) : Infinity;
      const db = b.endDate ? daysUntil(b.endDate) : Infinity;
      const aEnded = da < 0 ? 1 : 0;
      const bEnded = db < 0 ? 1 : 0;
      if (aEnded !== bEnded) return aEnded - bEnded;
      return da - db;
    });
    return sorted;
  }, [filtered]);

  const selectedEvents = byDay.get(selected) ?? [];
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayISO = toISODate(today);

  const kinds: ("all" | GameEvent["kind"])[] = ["all", "raid", "gift", "tournament", "distribution", "release"];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">📅 Events</h1>
        <div className="ml-auto flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
          {(["calendar", "upcoming"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                view === v
                  ? "bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {v === "calendar" ? "Calendar" : "Upcoming"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Tera raids, Mystery Gifts, distributions, and Championship Series tournaments — with end dates so nothing slips by.
      </p>
      <p className="mt-1 text-xs text-slate-400">Last checked: October 3, 2026.</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKindFilter(k)}
            aria-pressed={kindFilter === k}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              kindFilter === k
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {k === "all" ? "All" : KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ←
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{monthLabel}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelected(todayISO);
                }}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                aria-label="Next month"
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                →
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700">
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800">
              {WEEKDAYS.map((d) => (
                <div key={d} className="px-1 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="min-h-[64px] bg-slate-50/50 sm:min-h-[88px] dark:bg-slate-900/50" />;
                const iso = toISODate(date);
                const events = byDay.get(iso) ?? [];
                const isToday = iso === todayISO;
                const isSelected = iso === selected;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(iso)}
                    aria-pressed={isSelected}
                    className={`min-h-[64px] border-t border-slate-100 p-1 text-left align-top transition sm:min-h-[88px] sm:p-1.5 dark:border-slate-800 ${
                      isSelected ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-emerald-500 text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {events.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center gap-1 truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] font-semibold text-slate-700 sm:text-[11px] dark:bg-slate-800 dark:text-slate-200"
                          title={e.title}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[e.kind]}`} aria-hidden />
                          <span className="truncate">{e.title}</span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="px-1 text-[10px] font-bold text-slate-400">+{events.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <h3 className="mt-6 text-lg font-bold text-slate-800 dark:text-slate-100">
            {parseISO(selected).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Nothing scheduled this day.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {selectedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}
