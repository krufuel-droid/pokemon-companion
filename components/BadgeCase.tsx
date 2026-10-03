"use client";

/**
 * BadgeCase — a gym-style badge case for the profile page (Badge workstream).
 *
 * Self-contained: fetches its own data via evaluateBadges(userId), renders a
 * collapsible case, and fires badge-achievement checks fire-and-forget.
 *
 * The coordinator mounts this on the profile page; do NOT edit
 * app/profile/page.tsx for it. Usage:
 *
 *   import BadgeCase from "@/components/BadgeCase";
 *   ...
 *   <BadgeCase userId={userId} />
 */
import { useEffect, useState } from "react";
import {
  countEarned,
  evaluateBadges,
  type EvaluatedBadge,
} from "@/lib/data/badges";
import { checkBadgeAchievements } from "@/lib/achievements-badges";

function formatEarnedDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BadgeMedallion({ badge }: { badge: EvaluatedBadge }) {
  const { def, earned, progress, earnedAt } = badge;
  const pct = Math.min(100, Math.round((progress / def.target) * 100));
  return (
    <div
      className="flex flex-col items-center text-center"
      title={earned ? `${def.name} — ${def.flavor}` : def.hint}
    >
      <div
        className={
          earned
            ? "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 shadow-[0_0_18px_rgba(251,191,36,0.45)] ring-4 ring-amber-300 sm:h-20 sm:w-20"
            : "flex h-16 w-16 items-center justify-center rounded-full bg-black/30 ring-2 ring-slate-500/60 sm:h-20 sm:w-20"
        }
      >
        <span
          aria-hidden="true"
          className={
            "text-3xl sm:text-4xl " +
            (earned ? "drop-shadow" : "opacity-30 brightness-0")
          }
        >
          {def.icon}
        </span>
      </div>
      <span
        className={
          "mt-2 text-xs font-extrabold leading-tight " +
          (earned ? "text-amber-200" : "text-slate-400")
        }
      >
        {def.name}
      </span>
      {earned ? (
        <span className="mt-0.5 text-[11px] leading-tight text-slate-400">
          {formatEarnedDate(earnedAt) || def.flavor}
        </span>
      ) : (
        <span className="mt-0.5 max-w-[8rem] text-[11px] leading-tight text-slate-500">
          {def.target > 1 && progress > 0 ? (
            <>
              {progress}/{def.target} — {def.hint}
            </>
          ) : (
            def.hint
          )}
        </span>
      )}
      {!earned && def.target > 1 && progress > 0 && (
        <div
          className="mt-1.5 h-1 w-full max-w-[5rem] overflow-hidden rounded-full bg-slate-700/70"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-amber-400/80"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function BadgeCase({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<EvaluatedBadge[] | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await evaluateBadges(userId);
        if (cancelled) return;
        setBadges(results);
        // Default the case to open when there's something to show off.
        setOpen(countEarned(results) > 0);
        // Fire-and-forget: unlock badge achievements, never block the UI.
        void checkBadgeAchievements(userId, countEarned(results)).catch(() => {});
      } catch {
        if (!cancelled) setBadges([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const earned = badges ? countEarned(badges) : 0;
  const total = badges?.length ?? 10;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            🏟️
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100">
            Badge Case
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
            {earned}/{total}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={
            "text-slate-500 transition-transform dark:text-slate-400 " +
            (open ? "rotate-180" : "")
          }
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {/* The case itself: dark velvet in both themes, like the games. */}
          <div className="rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-4 shadow-inner sm:p-6">
            {badges === null ? (
              <div className="grid animate-pulse grid-cols-3 gap-4 sm:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-slate-700/70 sm:h-20 sm:w-20" />
                    <div className="mt-2 h-3 w-16 rounded bg-slate-700/70" />
                  </div>
                ))}
              </div>
            ) : badges.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Your badge case is empty — catch, hunt, battle, and trade to
                start filling it.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-x-2 gap-y-5 sm:grid-cols-5 sm:gap-4">
                {badges.map((b) => (
                  <BadgeMedallion key={b.def.id} badge={b} />
                ))}
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Earned badges glow gold. Locked badges show their unlock hint —
            hover or long-press for details.
          </p>
        </div>
      )}
    </div>
  );
}
