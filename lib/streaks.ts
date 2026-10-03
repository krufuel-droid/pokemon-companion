/**
 * Catch streaks (Workstream 3).
 *
 * Streaks are computed entirely from `daily_catches.potd_date` — no new
 * table needed. All queries degrade gracefully: if the table isn't
 * migrated yet (or any query fails), callers get zeros/empty lists and the
 * UI keeps working.
 *
 * ---------------------------------------------------------------------------
 * DATE CONVENTION — UTC vs America/Chicago
 * ---------------------------------------------------------------------------
 * The homepage generates potd_date with `new Date().toISOString().slice(0, 10)`
 * (app/page.tsx) — i.e. a UTC date string. Streaks therefore count consecutive
 * UTC days, matching exactly the labels users see on their logged catches.
 * If the app ever moves potd_date to America/Chicago day boundaries, change
 * STREAK_TIMEZONE below and todayKey() picks Chicago days up automatically.
 * ---------------------------------------------------------------------------
 */

import { createClient } from "./supabase/client";
import { unlockAchievement } from "./achievements";

type Client = ReturnType<typeof createClient>;

export interface CatchStreak {
  current: number; // consecutive days ending today (or yesterday, streak alive)
  longest: number; // best run ever
}

/** Day-boundary convention for streak math. "UTC" matches potd_date. */
export const STREAK_TIMEZONE = "UTC";

/** Today's date key in YYYY-MM-DD, same convention as potd_date. */
export function todayKey(from: Date = new Date()): string {
  if (STREAK_TIMEZONE === "UTC") return from.toISOString().slice(0, 10);
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STREAK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);
}

function keyToDayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function dayNumberToKey(dayNumber: number): string {
  return new Date(dayNumber * 86400000).toISOString().slice(0, 10);
}

function addDays(key: string, n: number): string {
  return dayNumberToKey(keyToDayNumber(key) + n);
}

/**
 * Pure streak math from a list of date keys (duplicates allowed).
 * Exported for testing.
 */
export function streaksFromKeys(keys: string[]): CatchStreak {
  const days = [...new Set(keys.map(keyToDayNumber).filter((n) => !Number.isNaN(n)))].sort(
    (a, b) => a - b,
  );
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: the run ending today; if today isn't logged yet but
  // yesterday is, the streak is still alive (not broken until a day is
  // fully missed).
  const today = keyToDayNumber(todayKey());
  const last = days[days.length - 1];
  let current = 0;
  if (last === today || last === today - 1) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i] === days[i + 1] - 1) current += 1;
      else break;
    }
  }
  return { current, longest };
}

/** All potd_date keys a user has logged. Empty on any failure. */
async function getCatchKeys(userId: string): Promise<string[]> {
  try {
    const { data, error } = await createClient()
      .from("daily_catches")
      .select("potd_date")
      .eq("user_id", userId)
      .order("potd_date", { ascending: true });
    if (error) return [];
    return ((data as { potd_date: string }[] | null) ?? []).map((r) => r.potd_date);
  } catch {
    return [];
  }
}

/** Current + longest catch streak for a user. Zeros on any failure. */
export async function getCatchStreak(userId: string): Promise<CatchStreak> {
  return streaksFromKeys(await getCatchKeys(userId));
}

/** Has the user logged today's Pokémon-of-the-Day catch? False on any failure. */
export async function hasLoggedToday(userId: string): Promise<boolean> {
  try {
    const { data, error } = await createClient()
      .from("daily_catches")
      .select("id")
      .eq("user_id", userId)
      .eq("potd_date", todayKey())
      .maybeSingle();
    if (error) return false;
    return data !== null;
  } catch {
    return false;
  }
}

/** Accepted friend ids for a user. Empty on any failure. */
export async function getFriendIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await createClient()
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (error) return [];
    const rows = (data as { requester_id: string; addressee_id: string }[] | null) ?? [];
    return [
      ...new Set(rows.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id))),
    ];
  } catch {
    return [];
  }
}

export interface StreakLeaderRow {
  userId: string;
  username: string;
  avatarUrl: string | null;
  current: number;
  longest: number;
}

/**
 * Friends + me ranked by current streak (tie-break: longest). One query for
 * all catch dates, one for profiles. Empty on any failure.
 */
export async function getStreakLeaderboard(userId: string): Promise<StreakLeaderRow[]> {
  try {
    const supabase = createClient();
    const ids = [...new Set([userId, ...(await getFriendIds(userId))])];

    const { data: catches, error: catchesError } = await supabase
      .from("daily_catches")
      .select("user_id, potd_date")
      .in("user_id", ids);
    if (catchesError) return [];
    const byUser = new Map<string, string[]>();
    for (const row of (catches as { user_id: string; potd_date: string }[] | null) ?? []) {
      const list = byUser.get(row.user_id) ?? [];
      list.push(row.potd_date);
      byUser.set(row.user_id, list);
    }

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);
    const nameMap = new Map<string, { username: string; avatarUrl: string | null }>();
    for (const p of (profs as { id: string; username: string; avatar_url: string | null }[] | null) ?? []) {
      nameMap.set(p.id, { username: p.username, avatarUrl: p.avatar_url });
    }

    return ids
      .map((id) => {
        const s = streaksFromKeys(byUser.get(id) ?? []);
        return {
          userId: id,
          username: nameMap.get(id)?.username ?? "Unknown",
          avatarUrl: nameMap.get(id)?.avatarUrl ?? null,
          current: s.current,
          longest: s.longest,
        };
      })
      .sort((a, b) => b.current - a.current || b.longest - a.longest);
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Streak milestones: fire-and-forget after a daily catch is logged.   */
/* ------------------------------------------------------------------ */

export const STREAK_MILESTONES = [
  { days: 7, achievementId: "streak-7" },
  { days: 30, achievementId: "streak-30" },
] as const;

/**
 * Recompute the user's streak and unlock milestone achievements when
 * thresholds are crossed. Safe to call fire-and-forget:
 *   void evaluateStreakMilestones(userId).catch(() => {})
 * Returns the ids newly unlocked by this call.
 *
 * Note: emblems (lib/streak-emblems.ts) and the widget derive the best
 * streak on demand from daily_catches, so no record counter is needed.
 */
export async function evaluateStreakMilestones(userId: string): Promise<string[]> {
  try {
    const { current } = await getCatchStreak(userId);
    const newly: string[] = [];
    for (const m of STREAK_MILESTONES) {
      if (current >= m.days) {
        // Returns false when already unlocked or the achievements row
        // isn't migrated yet — both fine.
        const fresh = await unlockAchievement(userId, m.achievementId);
        if (fresh) newly.push(m.achievementId);
      }
    }
    return newly;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Weekly-challenge tie-in (lib/challenges.ts stays untouched).        */
/* ------------------------------------------------------------------ */

/**
 * Auto-count for a daily-catch-flavored weekly challenge: how many distinct
 * days in the challenge week (Monday → Monday) the user logged a
 * Pokémon-of-the-Day catch.
 *
 * Suggested default for the lib/challenges.ts DEFAULT_CHALLENGES rotation:
 *   { title: "📅 Daily Devotee",
 *     description: "Log 3 Pokémon-of-the-Day catches this week — one per day keeps the streak alive!",
 *     goal_type: "daily_catch", target_count: 3 }
 *
 * To wire it in: add "daily_catch" to the ChallengeDefault goal_type union,
 * return true for it in isAutoCounted(), and return
 * dailyCatchCountForWeek(client, userId, challenge.week_start) for it in
 * myChallengeCount(). Until then, this helper documents the counting rule.
 */
export async function dailyCatchCountForWeek(
  client: Client,
  userId: string,
  weekStart: string,
): Promise<number> {
  try {
    const { data, error } = await client
      .from("daily_catches")
      .select("potd_date")
      .eq("user_id", userId)
      .gte("potd_date", weekStart)
      .lt("potd_date", addDays(weekStart, 7));
    if (error) return 0;
    return new Set(
      ((data as { potd_date: string }[] | null) ?? []).map((r) => r.potd_date),
    ).size;
  } catch {
    return 0;
  }
}
