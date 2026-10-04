/**
 * Time-limited Pokémon events: Tera raids, Mystery Gifts, distributions.
 * Shown on /tools/event-calendar. Keep end dates current — the weekly
 * Limitless meta check is a good moment to refresh this file.
 */

export interface GameEvent {
  id: string;
  title: string;
  game: "Scarlet & Violet" | "Legends: Z-A" | "Pokémon Champions";
  kind: "raid" | "gift" | "distribution" | "release" | "tournament";
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
  {
    id: "metagross-raid",
    title: "7★ Metagross the Unrivaled (rerun)",
    game: "Scarlet & Violet",
    kind: "raid",
    startDate: "2026-10-16",
    endDate: "2026-10-22",
    detail: "Steel Tera Metagross with the Mightiest Mark. Fire, Fighting, and Ground counters.",
    href: "/tools/raid-counters",
  },
  {
    id: "fidough-birthday",
    title: "Birthday Fidough (in-store)",
    game: "Scarlet & Violet",
    kind: "distribution",
    startDate: "2025-11-01",
    endDate: "2026-10-31",
    detail: "Lv. 5 Fidough with Celebrate and a Birthday Ribbon — Pokémon Centers (Japan, Taiwan, Singapore) during your birthday month. Ends Oct 31!",
    href: "/tools/mystery-gifts",
  },
  {
    id: "champions-coupons",
    title: "10M1NTRNR Mystery Gift code",
    game: "Pokémon Champions",
    kind: "gift",
    startDate: null,
    endDate: "2026-12-31",
    detail: "100 Quick Coupons — redeem in-game, collect from the Mailbox.",
    href: "/tools/mystery-gifts",
  },
  // ---- Championship Series tournaments (from the Champions page) ----
  {
    id: "tourn-recife",
    title: "Recife Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-10-03",
    endDate: "2026-10-04",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-recife",
  },
  {
    id: "tourn-louisville",
    title: "Louisville Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-10-09",
    endDate: "2026-10-11",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-louisville",
  },
  {
    id: "tourn-nice",
    title: "Nice Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-10-17",
    endDate: "2026-10-18",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-nice",
  },
  {
    id: "tourn-puebla",
    title: "Puebla Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-10-24",
    endDate: "2026-10-25",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-puebla",
  },
  {
    id: "tourn-gdansk",
    title: "Gdańsk Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-10-31",
    endDate: "2026-11-01",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-gdansk",
  },
  {
    id: "tourn-buenos-aires",
    title: "Buenos Aires Special Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    detail: "Play! Pokémon Special Championships — VGC.",
    href: "/champions#tourn-buenos-aires",
  },
  {
    id: "tourn-laic",
    title: "Latin America International Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    detail: "Play! Pokémon International Championships — VGC. The big one.",
    href: "/champions#tourn-laic",
  },
  {
    id: "tourn-stuttgart",
    title: "Stuttgart Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-11-28",
    endDate: "2026-11-29",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-stuttgart",
  },
  {
    id: "tourn-las-vegas",
    title: "Las Vegas Regional Championships",
    game: "Scarlet & Violet",
    kind: "tournament",
    startDate: "2026-12-04",
    endDate: "2026-12-06",
    detail: "Play! Pokémon Regional Championships — VGC.",
    href: "/champions#tourn-las-vegas",
  },
];

const KIND_LABEL: Record<GameEvent["kind"], string> = {
  raid: "Tera Raid",
  gift: "Mystery Gift",
  distribution: "Distribution",
  release: "Release",
  tournament: "Tournament",
};

const KIND_COLOR: Record<GameEvent["kind"], string> = {
  raid: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  gift: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  distribution: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  release: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
  tournament: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

export { KIND_LABEL, KIND_COLOR };
