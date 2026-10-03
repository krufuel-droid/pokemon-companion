/**
 * Time-limited Pokémon events: Tera raids, Mystery Gifts, distributions.
 * Shown on /tools/event-calendar. Keep end dates current — the weekly
 * Limitless meta check is a good moment to refresh this file.
 */

export interface GameEvent {
  id: string;
  title: string;
  game: "Scarlet & Violet" | "Legends: Z-A";
  kind: "raid" | "gift" | "distribution" | "release";
  /** ISO date, e.g. "2026-10-08". Null = no announced end. */
  startDate: string | null;
  endDate: string | null;
  detail: string;
  /** Link to the in-app page with full details. */
  href: string;
}

export const GAME_EVENTS: GameEvent[] = [
  {
    id: "tyranitar-raid",
    title: "7★ Tyranitar the Unrivaled (rerun)",
    game: "Scarlet & Violet",
    kind: "raid",
    startDate: "2026-10-02",
    endDate: "2026-10-08",
    detail: "Ghost Tera Tyranitar with the Mightiest Mark. Final rerun — catch it before it's gone.",
    href: "/tools/raid-counters",
  },
  {
    id: "salamence-raid",
    title: "7★ Salamence the Unrivaled (rerun)",
    game: "Scarlet & Violet",
    kind: "raid",
    startDate: "2026-10-09",
    endDate: "2026-10-15",
    detail: "Level 100 Salamence with the Unrivaled Mark. Bring Ice counters.",
    href: "/tools/raid-counters",
  },
  {
    id: "za-bundle",
    title: "Z-A Switch 2 Edition + Mega Dimension bundle",
    game: "Legends: Z-A",
    kind: "release",
    startDate: "2026-10-29",
    endDate: null,
    detail: "Physical bundle with both on one card + 100 Ultra Balls Mystery Gift bonus.",
    href: "/tools/mystery-gifts",
  },
  {
    id: "audino-birthday",
    title: "Cherish Ball Audino (birthday event)",
    game: "Legends: Z-A",
    kind: "distribution",
    startDate: null,
    endDate: "2027-01-31",
    detail: "Visit a Pokémon Center (Japan, Singapore, Taiwan) during your birthday month.",
    href: "/tools/mystery-gifts",
  },
  {
    id: "prepar1ng",
    title: "PREPAR1NG Mystery Gift code",
    game: "Legends: Z-A",
    kind: "gift",
    startDate: null,
    endDate: "2027-03-31",
    detail: "5 Max Revives, 10 Full Restores, 10 Ultra Balls.",
    href: "/tools/mystery-gifts",
  },
  {
    id: "garchompite-z",
    title: "Garchompite Z Mystery Gift",
    game: "Legends: Z-A",
    kind: "gift",
    startDate: null,
    endDate: "2027-03-31",
    detail: "Via Internet after one hyperspace adventure in the Mega Dimension DLC.",
    href: "/tools/mystery-gifts",
  },
  {
    id: "mewtwo-diancie",
    title: "Mewtwonite X/Y + Diancite Mystery Gifts",
    game: "Legends: Z-A",
    kind: "gift",
    startDate: null,
    endDate: null,
    detail: "Via Internet after completing the main campaign. No expiry announced.",
    href: "/tools/mystery-gifts",
  },
  {
    id: "sv-gifts",
    title: "S/V tracksuits, phone cases & Pecha Berry",
    game: "Scarlet & Violet",
    kind: "gift",
    startDate: null,
    endDate: null,
    detail: "STRACKSU1T / VTRACKSU1T, SB00KC0VER / VB00KC0VER, NE0R0T0MC0VER, Mythical Pecha Berry. No expiry announced.",
    href: "/tools/mystery-gifts",
  },
];

const KIND_LABEL: Record<GameEvent["kind"], string> = {
  raid: "Tera Raid",
  gift: "Mystery Gift",
  distribution: "Distribution",
  release: "Release",
};

const KIND_COLOR: Record<GameEvent["kind"], string> = {
  raid: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  gift: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  distribution: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  release: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
};

export { KIND_LABEL, KIND_COLOR };
