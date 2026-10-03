/**
 * Section 4: Shared goals & weekly challenges.
 *
 * One active challenge per week, created on demand. `ensureWeeklyChallenge`
 * is called when the Challenges tab loads: it reads the row for this week's
 * Monday, and if none exists it inserts a rotated default (any signed-in
 * trainer may insert via RLS; the unique(goal_type, week_start) constraint
 * keeps it to one row per type per week, so races are harmless).
 *
 * Progress counting:
 *  - 'say_hi' is AUTO-counted: how many distinct friends you "Said hi" to
 *    (friendship_progress rows with last_interaction_date inside the week).
 *  - 'catches' and 'achievements' are MANUAL: the app's "+1 Log" button
 *    upserts your count in challenge_progress. Simple, and avoids inventing
 *    definitions of "a catch" across a dozen game contexts.
 */

import type { createClient } from "@/lib/supabase/client";

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_count: number;
  week_start: string; // YYYY-MM-DD, the Monday
  created_at: string;
}

interface ChallengeDefault {
  title: string;
  description: string;
  goal_type: "catches" | "achievements" | "say_hi";
  target_count: number;
}

const DEFAULT_CHALLENGES: ChallengeDefault[] = [
  {
    title: "🐾 Early-Bird Catcher",
    description: "Log 10 Pokémon you catch (or run into!) this week.",
    goal_type: "catches",
    target_count: 10,
  },
  {
    title: "🏅 Trophy Room",
    description: "Unlock 3 achievements this week — any category counts.",
    goal_type: "achievements",
    target_count: 3,
  },
  {
    title: "👋 Friendly Waves",
    description:
      'Say hi to 5 different friends this week. No logging needed — your daily "Say hi" waves count automatically.',
    goal_type: "say_hi",
    target_count: 5,
  },
];

/** Monday of the current week as YYYY-MM-DD in local time. */
export function weekStartLocal(from: Date = new Date()): string {
  const d = new Date(from);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO week number, used to rotate the default challenge each week. */
function isoWeekNumber(from: Date = new Date()): number {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

type Client = ReturnType<typeof createClient>;

/**
 * Get this week's challenge, creating it from the rotated defaults if it
 * doesn't exist yet. Best-effort: returns null when the tables haven't been
 * migrated (Amanda must run the latest SQL first) or on any other error.
 */
export async function ensureWeeklyChallenge(
  client: Client,
): Promise<WeeklyChallenge | null> {
  const monday = weekStartLocal();
  try {
    const { data: existing } = await client
      .from("challenges")
      .select("*")
      .eq("week_start", monday)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return existing as WeeklyChallenge;

    const def = DEFAULT_CHALLENGES[isoWeekNumber() % DEFAULT_CHALLENGES.length];
    await client.from("challenges").insert({
      title: def.title,
      description: def.description,
      goal_type: def.goal_type,
      target_count: def.target_count,
      week_start: monday,
    });

    const { data: created } = await client
      .from("challenges")
      .select("*")
      .eq("week_start", monday)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (created as WeeklyChallenge | null) ?? null;
  } catch {
    return null;
  }
}

/** Is this goal type counted automatically (no "+1 Log" button)? */
export function isAutoCounted(goalType: string): boolean {
  return goalType === "say_hi";
}

/**
 * Auto-count for the 'say_hi' challenge: how many friends you said hi to
 * during the challenge week (distinct friends with a "Say hi" interaction
 * on or after Monday).
 */
export async function sayHiCountForWeek(
  client: Client,
  userId: string,
  weekStart: string,
): Promise<number> {
  const { data, error } = await client
    .from("friendship_progress")
    .select("friend_id")
    .eq("user_id", userId)
    .gte("last_interaction_date", weekStart);
  if (error) throw new Error(error.message);
  return new Set((data as { friend_id: string }[] | null)?.map((r) => r.friend_id) ?? []).size;
}

/** Manual count from challenge_progress (catches / achievements). */
export async function manualCount(
  client: Client,
  challengeId: string,
  userId: string,
): Promise<number> {
  const { data, error } = await client
    .from("challenge_progress")
    .select("count")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as { count: number } | null)?.count ?? 0;
}

/**
 * "+1 Log" for manual challenges: read the current count and upsert count+1.
 * Throws on error so the UI can surface it.
 */
export async function logChallengeProgress(
  client: Client,
  challengeId: string,
  userId: string,
): Promise<number> {
  const current = await manualCount(client, challengeId, userId);
  const next = current + 1;
  const { error } = await client.from("challenge_progress").upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      count: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "challenge_id,user_id" },
  );
  if (error) throw new Error(error.message);
  return next;
}

/** Your count for a challenge, choosing auto vs manual based on goal type. */
export async function myChallengeCount(
  client: Client,
  challenge: WeeklyChallenge,
  userId: string,
): Promise<number> {
  if (isAutoCounted(challenge.goal_type)) {
    return sayHiCountForWeek(client, userId, challenge.week_start);
  }
  return manualCount(client, challenge.id, userId);
}

/** "Week of Oct 5 – Oct 11" for a Monday date string. */
export function weekLabel(weekStart: string): string {
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `Week of ${fmt(start)} – ${fmt(end)}`;
}
