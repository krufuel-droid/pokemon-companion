import Link from "next/link";
import { GAME_EVENTS, KIND_LABEL, KIND_COLOR, type GameEvent } from "@/lib/data/events";

export const metadata = {
  title: "Event Calendar | Poke Companion",
  description: "Active Tera Raids, Mystery Gifts, and distributions with end dates — never miss one.",
};

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

export default function EventCalendarPage() {
  const sorted = [...GAME_EVENTS].sort((a, b) => {
    // Ended last, then by end date soonest-first, then no-expiry.
    const da = a.endDate ? daysUntil(a.endDate) : Infinity;
    const db = b.endDate ? daysUntil(b.endDate) : Infinity;
    const aEnded = da < 0 ? 1 : 0;
    const bEnded = db < 0 ? 1 : 0;
    if (aEnded !== bEnded) return aEnded - bEnded;
    return da - db;
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Event Calendar</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Every active raid, gift, and distribution in one place — with end dates so nothing slips by.
      </p>
      <p className="mt-1 text-xs text-slate-400">Last checked: October 3, 2026.</p>

      <div className="mt-6 space-y-3">
        {sorted.map((event) => (
          <Link
            key={event.id}
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
        ))}
      </div>
    </main>
  );
}
