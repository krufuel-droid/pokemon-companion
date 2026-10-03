/**
 * Seasonal emblems (Workstream: seasonal events).
 *
 * Emblems are derived from existing data (the `daily_catches` table) — no new
 * table or migration needed. A user earns an event's emblem by logging at
 * least one Pokémon-of-the-Day catch during any occurrence of the event's
 * yearly window (this year or last year, so a just-ended event still shows).
 *
 * COORDINATOR WIRING (app/profile/page.tsx, ProfileHighlights, next to the
 * Daily Star emblem — do NOT edit that file here):
 *
 *   import { getSeasonalEmblems } from "@/lib/seasonal-emblems";
 *   // inside the useEffect, alongside the dailyCatches query:
 *   const seasonal = await getSeasonalEmblems(userId).catch(() => []);
 *   // then merge into setEmblems:
 *   setEmblems([
 *     ...(dailyCatches >= 5 ? [{ icon: "🌟", name: "Daily Star", detail: `${dailyCatches} Pokémon-of-the-Day catches` }] : []),
 *     ...seasonal,
 *   ]);
 *
 * The returned shape ({ icon, name, detail }) matches the existing emblem
 * cards exactly, so no UI changes are needed.
 */
import { SEASONAL_EVENTS, type SeasonalEvent } from "./data/seasonal-events";
import {
  countCatchesBetween,
  eventWindowForYear,
} from "./achievements-seasonal";

export interface SeasonalEmblem {
  icon: string;
  name: string;
  detail: string;
  /** The event id that awarded it (for keys/tooltips). */
  eventId: string;
}

/** Default emblem from an event entry when no custom `emblem` is defined. */
export function emblemForEvent(event: SeasonalEvent): Omit<SeasonalEmblem, "eventId"> {
  return (
    event.emblem ?? {
      icon: event.emoji,
      name: event.name,
      detail: `Participated in ${event.name}`,
    }
  );
}

/**
 * True when the user logged at least one Pokémon-of-the-Day catch inside the
 * event window starting in `year`. Any failure → false.
 */
export async function hasSeasonalParticipation(
  userId: string,
  event: SeasonalEvent,
  year: number,
): Promise<boolean> {
  const { start, end } = eventWindowForYear(event, year);
  return (await countCatchesBetween(userId, start, end)) > 0;
}

/**
 * All seasonal emblems the user has earned. Checks the current and previous
 * window year so participation in a just-ended event isn't lost. Empty on any
 * failure (graceful degradation).
 */
export async function getSeasonalEmblems(
  userId: string,
  date: Date = new Date(),
): Promise<SeasonalEmblem[]> {
  try {
    const year = date.getFullYear();
    const out: SeasonalEmblem[] = [];
    for (const event of SEASONAL_EVENTS) {
      // Check this year and last year: a just-ended event still awards its
      // emblem, and a future window simply yields zero catches.
      let earned = false;
      for (const y of [year, year - 1]) {
        if (await hasSeasonalParticipation(userId, event, y)) {
          earned = true;
          break;
        }
      }
      if (earned) out.push({ ...emblemForEvent(event), eventId: event.id });
    }
    return out;
  } catch {
    return [];
  }
}
