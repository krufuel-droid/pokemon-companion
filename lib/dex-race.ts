/**
 * Living Dex race — data functions for the friends leaderboard (DexRace).
 *
 * How it works:
 * - The `dex_race_snapshots` table (supabase/migration-dex-race.sql) holds one
 *   row per (user, week) with that week's distinct-species caught count.
 * - When the DexRace component loads it fire-and-forgets ensureWeekSnapshot(),
 *   which records this week's count for the viewer and, on a week boundary,
 *   settles the previous week's race (unlocking the Dex Sprinter achievement
 *   for its winner).
 * - Movement for a row = this week's snapshot vs last week's snapshot
 *   (▲ up / ▼ down / – same or no history).
 * - Only users with at least 1 dex entry this week appear (opt-in by
 *   participation — no empty rows, no pressure).
 *
 * Everything degrades gracefully: unknown tables / RLS failures return
 * empty results and the caller shows a hint instead of crashing.
 */
import { createClient } from "./supabase/client";
import { unlockAchievement } from "./achievements";

/** Total species the completion % is computed against (matches the Living Dex page). */
export const TOTAL_SPECIES = 1025;

export type RaceMovement = "up" | "down" | "same" | "none";

export interface RaceEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  caughtCount: number;
  /** Completion %, 0-100. */
  pct: number;
  movement: RaceMovement;
  /** Signed delta vs last week's snapshot (0 when none). */
  movementDelta: number;
  rank: number;
  isMe: boolean;
}

export function completionPct(caughtCount: number): number {
  if (TOTAL_SPECIES <= 0) return 0;
  return Math.min(100, (caughtCount / TOTAL_SPECIES) * 100);
}

/** Monday of the given date's week, as a local YYYY-MM-DD string. */
export function weekStart(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Monday-start weeks; Sunday (0) rolls back 6 days.
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** week_start string one week earlier than the given week_start. */
export function previousWeekStart(weekStartStr: string): string {
  const [y, m, d] = weekStartStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 7);
  return weekStart(dt);
}

type SupabaseBrowserClient = ReturnType<typeof createClient>;

interface SnapshotRow {
  user_id: string;
  week_start: string;
  caught_count: number;
}

function isMissingTable(e: unknown): boolean {
  return (e as { code?: string } | null)?.code === "42P01";
}

/**
 * Distinct species count in a user's collection (a species can have two
 * rows: regular + shiny). Returns null when the collection can't be read
 * (missing migration → the caller shows the setup hint).
 */
export async function countDistinctSpecies(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("collection")
      .select("species_id")
      .eq("user_id", userId);
    if (error) {
      if (isMissingTable(error)) return null;
      return null;
    }
    const ids = new Set<number>();
    for (const row of (data as { species_id: number }[] | null) ?? []) {
      if (typeof row.species_id === "number") ids.add(row.species_id);
    }
    return ids.size;
  } catch {
    return null;
  }
}

/** Ids of users with an accepted friendship with me, either direction. */
async function acceptedFriendIds(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (error) return [];
    const rows = (data as { requester_id: string; addressee_id: string }[] | null) ?? [];
    const ids = new Set<string>();
    for (const r of rows) {
      const other = r.requester_id === userId ? r.addressee_id : r.requester_id;
      if (other && other !== userId) ids.add(other);
    }
    return [...ids];
  } catch {
    return [];
  }
}

async function fetchSnapshots(
  supabase: SupabaseBrowserClient,
  userIds: string[],
  weeks: string[],
): Promise<{ rows: SnapshotRow[]; missingTable: boolean }> {
  try {
    const { data, error } = await supabase
      .from("dex_race_snapshots")
      .select("user_id, week_start, caught_count")
      .in("user_id", userIds)
      .in("week_start", weeks);
    if (error) {
      return { rows: [], missingTable: isMissingTable(error) };
    }
    return { rows: (data as SnapshotRow[] | null) ?? [], missingTable: false };
  } catch {
    return { rows: [], missingTable: false };
  }
}

/**
 * Assemble the leaderboard for a given week among the viewer + their
 * accepted friends. Only participants with a snapshot for `week` and
 * caught_count >= 1 are included. `missingTable` is true when the snapshots
 * (or collection) table hasn't been migrated yet.
 */
export async function fetchLeaderboard(
  userId: string,
  week: string = weekStart(),
): Promise<{ entries: RaceEntry[]; missingTable: boolean }> {
  const supabase = createClient();
  const friendIds = await acceptedFriendIds(supabase, userId);
  const ids = [userId, ...friendIds];
  if (ids.length === 0) return { entries: [], missingTable: false };

  const prevWeek = previousWeekStart(week);
  const { rows, missingTable } = await fetchSnapshots(supabase, ids, [week, prevWeek]);
  if (missingTable) return { entries: [], missingTable: true };

  const byUser = new Map<string, { current?: SnapshotRow; previous?: SnapshotRow }>();
  for (const row of rows) {
    const slot = byUser.get(row.user_id) ?? {};
    if (row.week_start === week) slot.current = row;
    else if (row.week_start === prevWeek) slot.previous = row;
    byUser.set(row.user_id, slot);
  }

  const participants = [...byUser.entries()].filter(
    ([, s]) => (s.current?.caught_count ?? 0) >= 1,
  );
  if (participants.length === 0) return { entries: [], missingTable: false };

  let profiles: { id: string; username: string; avatar_url: string | null }[] = [];
  try {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", participants.map(([id]) => id));
    profiles = (data as typeof profiles | null) ?? [];
  } catch {
    // names fall back below
  }
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const entries: Omit<RaceEntry, "rank">[] = participants.map(([id, s]) => {
    const current = s.current!;
    const delta = s.previous ? current.caught_count - s.previous.caught_count : 0;
    const movement: RaceMovement = !s.previous
      ? "none"
      : delta > 0
        ? "up"
        : delta < 0
          ? "down"
          : "same";
    const profile = byId.get(id);
    return {
      userId: id,
      username: profile?.username ?? "A trainer",
      avatarUrl: profile?.avatar_url ?? null,
      caughtCount: current.caught_count,
      pct: completionPct(current.caught_count),
      movement,
      movementDelta: delta,
      isMe: id === userId,
    };
  });

  entries.sort((a, b) => {
    if (b.caughtCount !== a.caughtCount) return b.caughtCount - a.caughtCount;
    return a.username.localeCompare(b.username);
  });

  return {
    entries: entries.map((e, i) => ({ ...e, rank: i + 1 })),
    missingTable: false,
  };
}

/**
 * Settle a finished week's race: the rank-1 participant(s) among the viewer
 * and their accepted friends unlock the "dex-race-leader" (Dex Sprinter)
 * achievement. Fire-and-forget — never throws.
 */
export async function settleWeekRace(
  userId: string,
  week: string,
): Promise<void> {
  try {
    const { entries } = await fetchLeaderboard(userId, week);
    if (entries.length === 0) return;
    const top = entries[0].caughtCount;
    const winners = entries.filter((e) => e.caughtCount === top);
    await Promise.all(
      winners.map((w) => unlockAchievement(w.userId, "dex-race-leader").catch(() => false)),
    );
  } catch {
    // graceful: a missed settlement just means no achievement this week
  }
}

/**
 * Lazy snapshot routine: record my current distinct-species count for this
 * week (upsert), and if my most recent snapshot is from an older week,
 * settle the just-finished week first. Returns the current count, or null
 * when the collection table can't be read (caller shows the setup hint).
 * Fire-and-forget safe — never throws.
 */
export async function ensureWeekSnapshot(userId: string): Promise<number | null> {
  try {
    const supabase = createClient();
    const count = await countDistinctSpecies(supabase, userId);
    if (count === null) return null;

    const thisWeek = weekStart();
    // Did I already have a snapshot for an earlier week? → week boundary.
    try {
      const { data, error } = await supabase
        .from("dex_race_snapshots")
        .select("week_start")
        .eq("user_id", userId)
        .lt("week_start", thisWeek)
        .order("week_start", { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        const lastWeek = previousWeekStart(thisWeek);
        // Settle the just-finished week exactly once per week per viewer.
        const settled = await getSettledWeeks(userId);
        if (!settled.has(lastWeek)) {
          void settleWeekRace(userId, lastWeek).then(() =>
            markWeekSettled(userId, lastWeek),
          );
        }
      }
    } catch {
      // snapshots table may not exist yet — the upsert below will no-op
    }

    try {
      await supabase.from("dex_race_snapshots").upsert(
        { user_id: userId, week_start: thisWeek, caught_count: count },
        { onConflict: "user_id,week_start" },
      );
    } catch {
      // table missing → race UI will show the hint instead
    }
    return count;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Settlement bookkeeping (localStorage — one settle per week per user) */
/* ------------------------------------------------------------------ */

const SETTLED_KEY = "dex-race-settled-weeks";

function settledStorageKey(userId: string): string {
  return `${SETTLED_KEY}:${userId}`;
}

function getSettledWeeks(userId: string): Promise<Set<string>> {
  try {
    const raw = localStorage.getItem(settledStorageKey(userId));
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Promise.resolve(new Set(Array.isArray(arr) ? arr : []));
  } catch {
    return Promise.resolve(new Set());
  }
}

async function markWeekSettled(userId: string, week: string): Promise<void> {
  try {
    const settled = await getSettledWeeks(userId);
    settled.add(week);
    // Keep only recent weeks so the value stays small.
    const recent = [...settled].sort().slice(-8);
    localStorage.setItem(settledStorageKey(userId), JSON.stringify(recent));
  } catch {
    // non-fatal
  }
}
