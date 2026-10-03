/**
 * Seasonal achievements (Workstream: seasonal events).
 *
 * DATA-DRIVEN: achievement templates live on each entry in
 * lib/data/seasonal-events.ts (`achievements` array). This file only
 * materializes them into catalog defs and runs the unlock checks.
 *
 * New achievement IDs are generated per event window year:
 * `${event.id}-${suffix}-${year}`, e.g. "spooky-week-catch-2026" and
 * "spooky-week-catch-5-2026".
 *
 * Everything degrades gracefully: any failure returns [] / empty lists and
 * the catch flow keeps working. Callers must use fire-and-forget:
 * `void checkSeasonalAchievements(user.id, potdDate).catch(() => {})`.
 */
import { unlockAchievement, type AchievementDef } from "./achievements";
import {
  getActiveSeasonalEvent,
  SEASONAL_EVENTS,
  type SeasonalEvent,
} from "./data/seasonal-events";
import { createClient } from "./supabase/client";

const CATEGORY = "Seasonal";

/**
 * The catalog defs for seasonal achievements in `year`. Coordinator: seed
 * these rows into the `achievements` table (same columns as the existing
 * seed SQL) so /achievements and profile showcases render their names/icons.
 * Unlocking works regardless of seeding — unknown ids are simply skipped in
 * def-based displays.
 */
export function getSeasonalAchievementDefs(year?: number): AchievementDef[] {
  const y = year ?? new Date().getFullYear();
  return SEASONAL_EVENTS.flatMap((event) =>
    (event.achievements ?? []).map((a) => ({
      id: seasonalAchievementId(event, a.suffix, y),
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: CATEGORY,
    })),
  );
}

/** Static convenience export for the current year's catalog merge. */
export const SEASONAL_ACHIEVEMENTS: AchievementDef[] = getSeasonalAchievementDefs();

/** Build the window-year-scoped achievement id. */
export function seasonalAchievementId(
  event: SeasonalEvent,
  suffix: string,
  year: number,
): string {
  return `${event.id}-${suffix}-${year}`;
}

/* ------------------------------------------------------------------ */
/* Unlock check — called fire-and-forget from the daily catch flow    */
/* ------------------------------------------------------------------ */

/** Parse a "YYYY-MM-DD" potd_date at noon to avoid timezone shifts. */
function parsePotdDate(potdDate: string): Date | null {
  const d = new Date(`${potdDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * The year the event window containing `date` belongs to. For year-wrap
 * windows (e.g. Dec 20 → Jan 5), a January date belongs to the window that
 * started the previous December, so it keeps the start year.
 */
export function windowYear(event: SeasonalEvent, date: Date): number {
  const startMd = event.starts.month * 100 + event.starts.day;
  const endMd = event.ends.month * 100 + event.ends.day;
  const nowMd = (date.getMonth() + 1) * 100 + date.getDate();
  if (startMd <= endMd) return date.getFullYear();
  return nowMd >= startMd ? date.getFullYear() : date.getFullYear() - 1;
}

/** YYYY-MM-DD bounds of the event window that starts in `year`. */
export function eventWindowForYear(
  event: SeasonalEvent,
  year: number,
): { start: string; end: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const wraps =
    event.starts.month * 100 + event.starts.day >
    event.ends.month * 100 + event.ends.day;
  return {
    start: `${year}-${pad(event.starts.month)}-${pad(event.starts.day)}`,
    end: `${wraps ? year + 1 : year}-${pad(event.ends.month)}-${pad(event.ends.day)}`,
  };
}

/** YYYY-MM-DD bounds of the event window containing `date`. */
export function eventWindowBounds(
  event: SeasonalEvent,
  date: Date,
): { start: string; end: string } {
  return eventWindowForYear(event, windowYear(event, date));
}

/** Count the user's Pokémon-of-the-Day catches between two YYYY-MM-DD dates. Any failure → 0. */
export async function countCatchesBetween(
  userId: string,
  start: string,
  end: string,
): Promise<number> {
  try {
    const { count, error } = await createClient()
      .from("daily_catches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("potd_date", start)
      .lte("potd_date", end);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Count the user's Pokémon-of-the-Day catches inside the event window. Any failure → 0. */
async function countWindowCatches(
  userId: string,
  event: SeasonalEvent,
  date: Date,
): Promise<number> {
  const { start, end } = eventWindowBounds(event, date);
  return countCatchesBetween(userId, start, end);
}

/**
 * Check + unlock seasonal achievements for a just-logged Pokémon-of-the-Day
 * catch. Only unlocks while a seasonal event covers `potdDate` ("YYYY-MM-DD",
 * the same string the logger stores). Fire-and-forget safe — returns the ids
 * newly unlocked, or [] on any failure.
 *
 * COORDINATOR HOOK (components/daily-catch-logger.tsx, after the successful
 * insert next to the existing incrementRecord call):
 *   void checkSeasonalAchievements(user.id, potdDate).catch(() => {});
 */
export async function checkSeasonalAchievements(
  userId: string,
  potdDate: string,
): Promise<string[]> {
  try {
    const date = parsePotdDate(potdDate);
    if (!date) return [];
    const event = getActiveSeasonalEvent(date);
    if (!event || !event.achievements || event.achievements.length === 0) return [];
    const year = windowYear(event, date);
    const unlocked: string[] = [];
    for (const a of event.achievements) {
      const id = seasonalAchievementId(event, a.suffix, year);
      const need = a.count ?? 1;
      let ok = false;
      if (need <= 1) {
        ok = true; // participation: this catch counts
      } else {
        ok = (await countWindowCatches(userId, event, date)) >= need;
      }
      if (ok && (await unlockAchievement(userId, id))) unlocked.push(id);
    }
    return unlocked;
  } catch {
    return [];
  }
}
