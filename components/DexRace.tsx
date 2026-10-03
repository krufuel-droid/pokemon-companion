"use client";

/**
 * Living Dex race — a friendly live leaderboard of Living Dex completion
 * among friends. Self-contained: the coordinator mounts it on a page
 * (recommended: the Living Dex page, app/collection/page.tsx, right under
 * the progress card).
 *
 * - Fire-and-forget: snapshots the viewer's weekly count on load and never
 *   blocks the UI.
 * - Opt-in by participation: only friends with at least 1 dex entry show up.
 * - Encouraging copy only — movement is celebrated, never shamed.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import {
  ensureWeekSnapshot,
  fetchLeaderboard,
  weekStart,
  type RaceEntry,
  type RaceMovement,
} from "@/lib/dex-race";

const MOVEMENT_STYLE: Record<RaceMovement, { icon: string; label: string; cls: string }> = {
  up: { icon: "▲", label: "climbing this week", cls: "text-emerald-600 dark:text-emerald-400" },
  down: { icon: "▼", label: "a little quieter this week", cls: "text-amber-500 dark:text-amber-400" },
  same: { icon: "–", label: "holding steady", cls: "text-slate-400 dark:text-slate-500" },
  none: { icon: "✦", label: "new to the race", cls: "text-sky-500 dark:text-sky-400" },
};

function movementText(entry: RaceEntry): string {
  switch (entry.movement) {
    case "up":
      return `+${entry.movementDelta} this week`;
    case "down":
      return `${entry.movementDelta} this week`;
    case "same":
      return "steady";
    case "none":
      return "new!";
  }
}

function rankMedal(rank: number): string {
  if (rank === 1) return "🏆 ";
  if (rank === 2) return "🥈 ";
  if (rank === 3) return "🥉 ";
  return "";
}

export default function DexRace() {
  const { user, configured, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(true);
  const [entries, setEntries] = useState<RaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionMissing, setCollectionMissing] = useState(false);

  useEffect(() => {
    if (authLoading || !configured || !user) {
      if (!authLoading) setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      // Fire-and-forget: record this week's snapshot (and settle last week's
      // race if we crossed a week boundary). Never blocks the UI.
      const count = await ensureWeekSnapshot(user.id).catch(() => null);
      if (cancelled) return;
      if (count === null) {
        // Couldn't read the collection — the SQL migrations aren't run yet.
        setCollectionMissing(true);
        setLoading(false);
        return;
      }
      const { entries: board, missingTable } = await fetchLeaderboard(user.id).catch(() => ({
        entries: [] as RaceEntry[],
        missingTable: true,
      }));
      if (cancelled) return;
      setCollectionMissing(missingTable);
      setEntries(board);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, configured, user]);

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (authLoading) return null;
  if (!user) {
    return (
      <section
        aria-label="Living Dex race"
        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          🏁 Dex Race
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/login" className="font-semibold text-emerald-600 underline underline-offset-2 dark:text-emerald-400">
            Sign in
          </Link>{" "}
          to race your friends&apos; Living Dex progress — every dex entry counts!
        </p>
      </section>
    );
  }

  if (collectionMissing) {
    return (
      <section
        aria-label="Living Dex race"
        className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200 dark:bg-amber-950 dark:ring-amber-800"
      >
        <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200">🏁 Dex Race</h2>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
          The Dex Race needs the latest database updates — run{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">supabase/migration-collection.sql</code>{" "}
          and{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">supabase/migration-dex-race.sql</code>{" "}
          in the Supabase SQL Editor to enable it.
        </p>
      </section>
    );
  }

  const me = entries.find((e) => e.isMe);
  const weekLabel = weekStart();

  return (
    <section
      aria-label="Living Dex race"
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 p-5 text-left sm:p-6"
      >
        <span className="text-xl" aria-hidden="true">🏁</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Dex Race
          </h2>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Friendly Living Dex leaderboard · week of {weekLabel}
          </p>
        </div>
        <span aria-hidden="true" className="shrink-0 text-slate-400">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-400">Lacing up running shoes…</p>
          ) : entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No racers yet — catch a Pokémon to join the race, and tell your friends
              to tap a few too. Every dex entry counts!
            </p>
          ) : (
            <>
              {me && (
                <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {me.rank === 1
                    ? "🏆 You're leading the pack — amazing catching!"
                    : `You're #${me.rank} of ${entries.length} — keep climbing, every dex entry counts!`}
                </p>
              )}
              <ol className="space-y-2">
                {entries.map((entry) => {
                  const mv = MOVEMENT_STYLE[entry.movement];
                  return (
                    <li
                      key={entry.userId}
                      className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition ${
                        entry.isMe
                          ? "bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-800"
                          : "bg-slate-50 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="w-8 shrink-0 text-center text-sm font-bold text-slate-500 dark:text-slate-400"
                      >
                        {rankMedal(entry.rank)}
                        {entry.rank}
                      </span>
                      <Avatar username={entry.username} avatarUrl={entry.avatarUrl} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {entry.username}
                            {entry.isMe && (
                              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                you
                              </span>
                            )}
                          </p>
                          <p className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {entry.pct.toFixed(1)}%
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                            style={{ width: `${entry.pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {entry.caughtCount.toLocaleString()} / 1,025 caught
                          </p>
                          <p
                            className={`shrink-0 text-xs font-semibold ${mv.cls}`}
                            title={mv.label}
                            aria-label={`${entry.username}: ${mv.label}, ${movementText(entry)}`}
                          >
                            <span aria-hidden="true">{mv.icon}</span> {movementText(entry)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
                Rankings refresh when you open this page — catch more Pokémon and watch
                yourself climb! 🌱
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
