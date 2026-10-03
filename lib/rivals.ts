/**
 * Rival system: declare a friend your rival, settle weekly auto-competitions.
 *
 * SCORING (weekly, Monday–Sunday America/Chicago):
 *   score = 10 × (Pokémon-of-the-Day catches logged that week)
 *         + 5 × (new Living Dex entries that week)
 *
 * Only timestamped sources are used: daily_catches.created_at (public read)
 * and collection.caught_at (rivals-scoped read policy in
 * supabase/migration-rivals.sql). Quiz counters in user_records are cumulative
 * with no per-week timestamps, so they are intentionally NOT scored.
 *
 * Weeks settle lazily: the first time anyone views the Rivals section after a
 * week ends, last week's row is computed and written to rival_weeks — no cron.
 */

import { createClient } from "./supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

const CHICAGO_TZ = "America/Chicago";

/** Points per logged Pokémon-of-the-Day catch inside the week. */
export const CATCH_POINTS = 10;
/** Points per new Living Dex entry inside the week. */
export const DEX_POINTS = 5;

export interface RivalRow {
  id: string;
  user_id: string;
  rival_id: string;
  created_at: string;
}

export interface RivalWeekRow {
  id: string;
  week_start: string; // YYYY-MM-DD (Monday)
  user_id: string;
  rival_id: string;
  user_score: number;
  rival_score: number;
  winner_id: string | null; // null = tie
  loser_title: string | null;
  settled_at: string | null;
}

export interface WeeklyScore {
  catches: number;
  dexEntries: number;
  total: number;
}

/** The rotating silly loser titles, in rotation order. Affectionate roasts only. */
export const LOSER_TITLES: string[] = [
  "Magikarp Splash Award",
  "MissingNo. Memorial Trophy",
  "Wild Zubat Encounter Survivor",
  "Prof. Oak's Rat Catcher",
  "Tall Grass Enthusiast",
  "Master of the Struggle Move",
  "Champion of the Bench",
  "Potion Hoarder (Never Uses Them)",
  "Repellent Salesperson of the Week",
  "Slowpoke Well Tourist",
  "Certified HM Slave Manager",
  "NPC Energy Award",
];

/** Deterministic title for a week: rotates through LOSER_TITLES by week number. */
export function loserTitleForWeek(weekStart: string): string {
  const weekNum = Math.floor(
    Date.parse(`${weekStart}T12:00:00Z`) / (7 * 86400000),
  );
  const idx = ((weekNum % LOSER_TITLES.length) + LOSER_TITLES.length) % LOSER_TITLES.length;
  return LOSER_TITLES[idx];
}

/* ------------------------------------------------------------------ */
/* Week math (America/Chicago)                                          */
/* ------------------------------------------------------------------ */

/** Monday (YYYY-MM-DD) of the Chicago week containing `now`. */
export function chicagoWeekStart(now: Date = new Date()): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    weekday: "long",
  }).format(now);
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const idx = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(
    weekday,
  );
  const [y, m, d] = iso.split("-").map(Number);
  const monday = new Date(Date.UTC(y, m - 1, d - (idx < 0 ? 0 : idx)));
  return monday.toISOString().slice(0, 10);
}

/** Add `days` to a YYYY-MM-DD date string. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  return dt.toISOString().slice(0, 10);
}

/** Human label for a week: "Oct 5 – Oct 11". */
export function weekLabel(weekStart: string): string {
  const fmt = (s: string) =>
    new Date(`${s}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(weekStart)} – ${fmt(addDays(weekStart, 6))}`;
}

/** Chicago's UTC offset in minutes for a given UTC instant. */
function chicagoOffsetMinutes(utc: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: CHICAGO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(utc)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUTC - utc.getTime()) / 60000;
}

/** ISO UTC timestamp for midnight in Chicago on the given YYYY-MM-DD. */
export function chicagoMidnightISO(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const approx = new Date(Date.UTC(y, m - 1, d, 12));
  const offsetMin = chicagoOffsetMinutes(approx);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMin * 60000).toISOString();
}

/* ------------------------------------------------------------------ */
/* Scoring                                                              */
/* ------------------------------------------------------------------ */

/** One user's score breakdown for a week. Errors (e.g. unreadable rows) → 0. */
export async function weeklyScore(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
): Promise<WeeklyScore> {
  const startISO = chicagoMidnightISO(weekStart);
  const endISO = chicagoMidnightISO(addDays(weekStart, 7));
  let catches = 0;
  let dexEntries = 0;
  try {
    const { count } = await supabase
      .from("daily_catches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startISO)
      .lt("created_at", endISO);
    catches = count ?? 0;
  } catch {
    catches = 0;
  }
  try {
    const { count } = await supabase
      .from("collection")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("caught_at", startISO)
      .lt("caught_at", endISO);
    dexEntries = count ?? 0;
  } catch {
    dexEntries = 0;
  }
  return {
    catches,
    dexEntries,
    total: catches * CATCH_POINTS + dexEntries * DEX_POINTS,
  };
}

/* ------------------------------------------------------------------ */
/* Rival management                                                     */
/* ------------------------------------------------------------------ */

export type DeclareResult = "ok" | "already" | "self" | "error";

/** Declare `rivalId` as `userId`'s rival. Graceful on every failure. */
export async function declareRival(
  userId: string,
  rivalId: string,
): Promise<DeclareResult> {
  if (userId === rivalId) return "self";
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("rivals")
      .insert({ user_id: userId, rival_id: rivalId });
    if (error) {
      if (error.code === "23505") return "already";
      return "error";
    }
    return "ok";
  } catch {
    return "error";
  }
}

/** End a rivalry (either side may end it). */
export async function removeRival(userId: string, rivalId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("rivals")
      .delete()
      .or(
        `and(user_id.eq.${userId},rival_id.eq.${rivalId}),and(user_id.eq.${rivalId},rival_id.eq.${userId})`,
      );
    return !error;
  } catch {
    return false;
  }
}

/** All rivalries `userId` is part of, either direction. Empty on failure. */
export async function getMyRivalries(userId: string): Promise<RivalRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("rivals")
      .select("id, user_id, rival_id, created_at")
      .or(`user_id.eq.${userId},rival_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as RivalRow[]) ?? [];
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Lazy week settling                                                   */
/* ------------------------------------------------------------------ */

/**
 * Settle the most recently completed Chicago week for every rivalry.
 * Skips rows that are already settled; never recomputes a finalized week.
 * Returns the settled rows (or existing unfinalized rows when scoring fails).
 */
export async function settlePastWeeks(
  supabase: SupabaseClient,
  rivalries: RivalRow[],
): Promise<RivalWeekRow[]> {
  const lastMonday = addDays(chicagoWeekStart(), -7);
  const out: RivalWeekRow[] = [];
  for (const r of rivalries) {
    try {
      const { data: existing } = await supabase
        .from("rival_weeks")
        .select("*")
        .eq("week_start", lastMonday)
        .eq("user_id", r.user_id)
        .eq("rival_id", r.rival_id)
        .maybeSingle();
      const existingRow = (existing as RivalWeekRow | null) ?? null;
      if (existingRow?.settled_at) continue;
      const [a, b] = await Promise.all([
        weeklyScore(supabase, r.user_id, lastMonday),
        weeklyScore(supabase, r.rival_id, lastMonday),
      ]);
      const winnerId =
        a.total === b.total ? null : a.total > b.total ? r.user_id : r.rival_id;
      const row = {
        week_start: lastMonday,
        user_id: r.user_id,
        rival_id: r.rival_id,
        user_score: a.total,
        rival_score: b.total,
        winner_id: winnerId,
        loser_title: winnerId ? loserTitleForWeek(lastMonday) : null,
        settled_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("rival_weeks")
        .upsert(row, { onConflict: "week_start,user_id,rival_id" })
        .select("*")
        .maybeSingle();
      if (!error && data) out.push(data as RivalWeekRow);
      else if (existingRow) out.push(existingRow);
    } catch {
      // One bad rivalry must not block the others.
    }
  }
  return out;
}

/** Settled weeks for these rivalries, newest first. Empty on failure. */
export async function getRivalryHistory(
  supabase: SupabaseClient,
  rivalries: RivalRow[],
  limit = 24,
): Promise<RivalWeekRow[]> {
  if (rivalries.length === 0) return [];
  const keys = rivalries.map((r) => `(user_id.eq.${r.user_id},rival_id.eq.${r.rival_id})`);
  try {
    const { data, error } = await supabase
      .from("rival_weeks")
      .select("*")
      .or(keys.join(","))
      .order("week_start", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data as RivalWeekRow[]) ?? []).filter((w) => w.settled_at);
  } catch {
    return [];
  }
}
