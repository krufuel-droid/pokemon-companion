"use client";

/**
 * Tournament Pick'em — predict the winner of each upcoming Championship
 * Series event, then climb the leaderboard (10 pts per correct pick).
 *
 * ---- Pick'em keys ----
 * Picks are keyed by the tournament's `id` from UPCOMING_TOURNAMENTS
 * (e.g. "tourn-louisville"). When an event completes, the weekly meta check
 * removes it from UPCOMING_TOURNAMENTS and adds a TOURNAMENT_RESULTS entry —
 * results carry the same key in their `pickKey` field (set by the weekly
 * meta check when it records the result — see resultPickemKey), so picks
 * keep scoring after the event leaves the upcoming list.
 *
 * Requires supabase/migration-tournament-picks.sql to be run (Amanda runs
 * migrations in the Supabase SQL Editor). Until then the UI degrades to a
 * quiet "setting up" note.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  UPCOMING_TOURNAMENTS,
  TOURNAMENT_RESULTS,
  type UpcomingTournament,
  type TournamentResult,
} from "@/lib/data/champions";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const POINTS_PER_CORRECT_PICK = 10;

/** Key used for a tournament's picks — the stable tournament `id`. */
export function pickemKeyForTournament(t: UpcomingTournament): string {
  return t.id;
}

/**
 * Match a completed result back to its tournament's pick key.
 * Prefers the explicit `pickKey` the weekly meta check sets when recording
 * the result; falls back to name-matching for older entries.
 */
export function resultPickemKey(r: TournamentResult): string {
  if (r.pickKey) return r.pickKey;
  const lower = r.name.toLowerCase();
  for (const t of UPCOMING_TOURNAMENTS) {
    const slug = t.id.replace(/^tourn-/, "");
    if (slug && lower.includes(slug)) return t.id;
  }
  // Fallback for results whose event was never in the upcoming list.
  return (
    "tourn-" + lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  );
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse the tournament's start date from its `dates` string
 * ("Oct 9–11", "Oct 31 – Nov 1"). The year is inferred from `now`: the
 * month/day in the current year, rolled forward a year if that's more than
 * 90 days in the past (handles the season turn).
 */
export function tournamentStartDate(
  dates: string,
  now: Date = new Date(),
): Date | null {
  const m = dates.match(/([A-Za-z]+)\s+(\d{1,2})/);
  if (!m) return null;
  const month = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  const day = parseInt(m[2], 10);
  let d = new Date(now.getFullYear(), month, day);
  if (now.getTime() - d.getTime() > 90 * 86400000) {
    d = new Date(now.getFullYear() + 1, month, day);
  }
  return d;
}

const norm = (s: string) => s.trim().toLowerCase();

interface Pick {
  user_id: string;
  tournament_key: string;
  picked_player: string;
}

async function usernamesFor(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", [...new Set(ids)]);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as { id: string; username: string }[]) {
    map[row.id] = row.username;
  }
  return map;
}

const cardCls =
  "mt-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-800";

/** "Make your pick" block rendered inside each upcoming tournament card. */
export function PickemPicker({ tourney }: { tourney: UpcomingTournament }) {
  const { user, loading: authLoading } = useAuth();
  const key = pickemKeyForTournament(tourney);
  const result = useMemo(
    () => TOURNAMENT_RESULTS.find((r) => resultPickemKey(r) === key),
    [key],
  );
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [tableMissing, setTableMissing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [choice, setChoice] = useState("");
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const options = useMemo(
    () => (tourney.playersToWatch ?? []).map((p) => p.name),
    [tourney],
  );

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tournament_picks")
      .select("user_id, tournament_key, picked_player")
      .eq("tournament_key", key);
    if (error) {
      // Signed-in users can read picks by policy, so their error means the
      // table doesn't exist yet (migration not run). Signed-out users simply
      // have no read access — degrade quietly for them too.
      if (user) setTableMissing(true);
      else setLoadFailed(true);
      return;
    }
    const rows = (data ?? []) as Pick[];
    setPicks(rows);
    setNames(await usernamesFor(rows.map((p) => p.user_id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user]);

  useEffect(() => {
    load();
  }, [load]);

  const myPick = user ? picks?.find((p) => p.user_id === user.id) ?? null : null;
  const start = useMemo(
    () => tournamentStartDate(tourney.dates),
    [tourney.dates],
  );
  const started = start ? new Date() >= start : false;

  async function savePick() {
    if (!user) return;
    const picked = choice === "__custom__" || options.length === 0 ? custom.trim() : choice;
    if (!picked) {
      setSaveError("Pick a player first.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("tournament_picks").upsert(
        {
          user_id: user.id,
          tournament_key: key,
          picked_player: picked,
        },
        { onConflict: "user_id,tournament_key" },
      );
      if (error) throw error;
      setChoice("");
      setCustom("");
      await load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Couldn't save your pick.");
    } finally {
      setSaving(false);
    }
  }

  if (tableMissing) {
    return (
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        🔮 Pick&apos;em is setting up — check back soon.
      </p>
    );
  }

  // Tournament complete: show the winner and who called it.
  if (result) {
    const correct = (picks ?? []).filter(
      (p) => norm(p.picked_player) === norm(result.winner),
    );
    return (
      <div className={cardCls}>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          🔒 Locked — won by {result.winner} 🏆
        </p>
        {picks === null && !loadFailed ? (
          <p className="mt-1 text-xs text-slate-400">Loading picks…</p>
        ) : loadFailed ? null : correct.length > 0 ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            ✅ Called it:{" "}
            {correct
              .map((p) => names[p.user_id] ?? "a trainer")
              .join(", ")}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Nobody picked the winner — the field stays humble.
          </p>
        )}
      </div>
    );
  }

  // Tournament underway but no result yet.
  if (started) {
    return (
      <div className={cardCls}>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          🔒 Picks are locked — the tournament is underway. Results land here
          when they&apos;re official.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <p className="mt-3 text-xs text-slate-400">Loading pick&apos;em…</p>
    );
  }

  if (!user) {
    return (
      <div className={cardCls}>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          🔮{" "}
          <Link href="/login" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            Sign in
          </Link>{" "}
          to predict the winner and join the leaderboard.
        </p>
      </div>
    );
  }

  const usingCustom = choice === "__custom__" || options.length === 0;

  return (
    <div className={cardCls}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        🔮 Pick&apos;em — who wins {tourney.dates}?
      </p>
      {myPick && (
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          Your pick: <span className="font-bold text-slate-900 dark:text-slate-100">{myPick.picked_player}</span>{" "}
          <span className="text-xs text-slate-400">(change it any time before the event)</span>
        </p>
      )}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        {options.length > 0 && (
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none sm:max-w-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Pick the winner"
          >
            <option value="">Choose a player…</option>
            {options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="__custom__">Someone else…</option>
          </select>
        )}
        {usingCustom && (
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Type the player's name"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none sm:max-w-xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Custom pick"
          />
        )}
        <button
          type="button"
          onClick={savePick}
          disabled={saving}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : myPick ? "Change pick" : "Lock in my pick"}
        </button>
      </div>
      {saveError && (
        <p className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
          {saveError}
        </p>
      )}
      {picks !== null && picks.length > 0 && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {picks.length} {picks.length === 1 ? "trainer has" : "trainers have"} picked so far.
        </p>
      )}
    </div>
  );
}

/** Leaderboard: 10 pts per pick matching an official tournament winner. */
export function PickemLeaderboard() {
  const [rows, setRows] = useState<
    { userId: string; username: string; points: number; correct: number; total: number }[] | null
  >(null);
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tournament_picks")
        .select("user_id, tournament_key, picked_player");
      if (error) {
        setTableMissing(true);
        return;
      }
      const picks = (data ?? []) as Pick[];
      const names = await usernamesFor(picks.map((p) => p.user_id));
      const byUser = new Map<string, { points: number; correct: number; total: number }>();
      for (const p of picks) {
        const entry = byUser.get(p.user_id) ?? { points: 0, correct: 0, total: 0 };
        entry.total += 1;
        const result = TOURNAMENT_RESULTS.find(
          (r) => resultPickemKey(r) === p.tournament_key,
        );
        if (result && norm(p.picked_player) === norm(result.winner)) {
          entry.points += POINTS_PER_CORRECT_PICK;
          entry.correct += 1;
        }
        byUser.set(p.user_id, entry);
      }
      const sorted = [...byUser.entries()]
        .map(([userId, s]) => ({
          userId,
          username: names[userId] ?? "a trainer",
          ...s,
        }))
        .sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));
      setRows(sorted);
    })();
  }, []);

  if (tableMissing) return null;

  return (
    <section className="mt-10 scroll-mt-20" id="pickem-leaderboard">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        🏆 Pick&apos;em leaderboard
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {POINTS_PER_CORRECT_PICK} points for every winner you call correctly. Bragging rights are forever.
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        {rows === null ? (
          <p className="px-6 py-5 text-sm text-slate-400">Loading the leaderboard…</p>
        ) : rows.length === 0 ? (
          <p className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
            No picks yet — be the first! 🎯
          </p>
        ) : (
          <ol>
            {rows.map((r, i) => (
              <li
                key={r.userId}
                className="flex items-center gap-3 border-b border-slate-100 px-6 py-3 last:border-0 dark:border-slate-800"
              >
                <span className="w-8 shrink-0 text-center text-lg font-extrabold text-slate-400">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {r.username}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {r.correct}/{r.total} correct
                </span>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  {r.points} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
