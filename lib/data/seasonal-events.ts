/**
 * Seasonal events framework (Workstream: seasonal events).
 *
 * DATA-DRIVEN: adding a future event is a data-only change — just append an
 * entry to SEASONAL_EVENTS below. No other file needs to be edited:
 *
 * - `getActiveSeasonalEvent()` drives the homepage banner
 *   (components/SeasonalSpotlight.tsx), the themed Pokémon of the Day
 *   (lib/seasonal-potd.ts), seasonal achievements (lib/achievements-seasonal.ts),
 *   and seasonal emblems (lib/seasonal-emblems.ts).
 *
 * Event windows recur every year. `starts`/`ends` use 1-indexed months and
 * correctly handle year-wrap (e.g. { month: 12, day: 20 } → { month: 1, day: 5 }).
 */
export interface SeasonalEvent {
  /** Stable slug, e.g. "spooky-week". Also used as a localStorage key part. */
  id: string;
  /** Display name, e.g. "Spooky Week". */
  name: string;
  /** Emoji used in the banner and default emblem. */
  emoji: string;
  /** One-line hook shown on the homepage banner. */
  tagline: string;
  /** Window start (1-indexed month). */
  starts: { month: number; day: number };
  /** Window end (1-indexed month), inclusive. */
  ends: { month: number; day: number };
  /**
   * Lowercase Pokémon type names that the Pokémon-of-the-Day picker is
   * restricted to while the event is active. Empty/omitted = no filter.
   */
  potdTypeFilter: string[];
  /** Accent color (hex) for the banner theme. */
  themeColor: string;
  /** Optional gradient stops for the banner background, e.g. ["#7c3aed", "#1e1b4b"]. */
  themeGradient?: [string, string];
  /** Longer blurb shown on the banner. */
  description: string;
  /**
   * Emblem awarded for participating (logging a Pokémon-of-the-Day catch
   * during the window). Defaults to { icon: emoji, name, detail } when omitted.
   */
  emblem?: { icon: string; name: string; detail: string };
  /**
   * Limited-time achievements for this event. Fully data-driven: each entry
   * generates an achievement id of `${event.id}-${suffix}-${year}` (the year
   * the event window belongs to). `count` omitted or 1 = participation
   * (unlock on a single catch during the window); higher = unlock after that
   * many Pokémon-of-the-Day catches inside the window.
   */
  achievements?: Array<{
    suffix: string;
    name: string;
    description: string;
    icon: string;
    count?: number;
  }>;
}

export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: "spooky-week",
    name: "Spooky Week",
    emoji: "🎃",
    tagline:
      "Pokémon of the Day goes full spooky — a whole week of ghosts, ghouls, and things that go bump in the night!",
    starts: { month: 10, day: 25 },
    ends: { month: 10, day: 31 },
    potdTypeFilter: ["ghost", "dark"],
    themeColor: "#7c3aed",
    themeGradient: ["#7c3aed", "#1e1b4b"],
    description:
      "From October 25–31, the Pokémon of the Day is always a Ghost or Dark type. Log your catches to earn limited-time Spooky Week achievements and a profile emblem.",
    emblem: {
      icon: "🎃",
      name: "Spooky Week",
      detail: "Logged a Pokémon-of-the-Day catch during Spooky Week",
    },
    achievements: [
      {
        suffix: "catch",
        name: "Ghostly Greetings",
        description: "Log a Pokémon of the Day catch during Spooky Week",
        icon: "👻",
      },
      {
        suffix: "catch-5",
        name: "Graveyard Shift",
        description: "Log 5 Pokémon of the Day catches during Spooky Week",
        icon: "🪦",
        count: 5,
      },
    ],
  },
];

/** Convert a month/day pair to a comparable number (month * 100 + day). */
function md(month: number, day: number): number {
  return month * 100 + day;
}

/** True when the given local date falls inside the event's yearly window (inclusive). */
export function isEventActiveOn(event: SeasonalEvent, date: Date): boolean {
  const now = md(date.getMonth() + 1, date.getDate());
  const start = md(event.starts.month, event.starts.day);
  const end = md(event.ends.month, event.ends.day);
  // Normal window (start <= end) or year-wrap window (e.g. Dec → Jan).
  return start <= end ? now >= start && now <= end : now >= start || now <= end;
}

/**
 * The seasonal event active on `date` (defaults to now), or null.
 * When events overlap, the one with the latest start date wins.
 */
export function getActiveSeasonalEvent(date: Date = new Date()): SeasonalEvent | null {
  const active = SEASONAL_EVENTS.filter((e) => isEventActiveOn(e, date));
  if (active.length === 0) return null;
  active.sort(
    (a, b) => md(b.starts.month, b.starts.day) - md(a.starts.month, a.starts.day),
  );
  return active[0];
}

/**
 * Find a seasonal event by id. Used by the achievements/emblems libs so they
 * can resolve event windows from a stored id.
 */
export function getSeasonalEventById(id: string): SeasonalEvent | null {
  return SEASONAL_EVENTS.find((e) => e.id === id) ?? null;
}

/**
 * Human-readable date range for a banner, e.g. "Oct 25 – Oct 31".
 * Year is intentionally omitted: windows recur yearly.
 */
export function eventDateRange(event: SeasonalEvent): string {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const s = `${MONTHS[event.starts.month - 1]} ${event.starts.day}`;
  const e = `${MONTHS[event.ends.month - 1]} ${event.ends.day}`;
  return `${s} – ${e}`;
}
