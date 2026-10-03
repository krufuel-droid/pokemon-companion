/**
 * All 50 obtainable marks in Pokémon Scarlet & Violet.
 *
 * Verified against Bulbapedia's "Mark (game mechanic)" page (Oct 2026):
 *
 * - 41 WILD marks: 28 personality (#70–97), 4 time-of-day (#53–56),
 *   7 weather (#57–64 minus the Dry Mark, which is Sword/Shield-only),
 *   plus the Uncommon (#68) and Rare (#69) marks.
 * - 9 SPECIAL marks: Destiny, Jumbo, Mini, Itemfinder, Partner, Gourmand,
 *   Alpha, Mightiest, Titan.
 *
 * Excluded because they are NOT obtainable in Scarlet/Violet:
 * Fishing Mark, Curry Mark, Dry Mark (all Sword/Shield-only).
 *
 * Note on event marks: Bulbapedia's trivia notes that no mark is exclusive
 * to event distributions — event Pokémon instead come with a regular mark
 * assigned by the event data (e.g. Hisuian Zoroark with the Charismatic
 * Mark, Gimmighoul with the Upbeat Mark). There is no standalone "Jolly
 * Mark" in the documented data.
 */

export type MarkCategory = "wild" | "special";
export type MarkGroup = "personality" | "time" | "weather" | "rarity" | "special";

export interface MarkDef {
  /** Slug id — must match user_marks.mark_id. */
  id: string;
  /** e.g. "Rowdy Mark" */
  name: string;
  /** Title shown when the Pokémon is sent out — e.g. "the Rowdy" */
  title: string;
  description: string;
  category: MarkCategory;
  group: MarkGroup;
  howToGet: string;
  /** Caveats like missable/event-only/time-gated conditions. */
  note?: string;
}

export const MARK_CATEGORIES: { key: MarkCategory; label: string }[] = [
  { key: "wild", label: "Wild Marks" },
  { key: "special", label: "Special Marks" },
];

export const MARK_GROUPS: Record<MarkGroup, { label: string; blurb: string }> = {
  personality: { label: "Personality", blurb: "28 personality marks — each 1 in 2,800 on a wild catch" },
  time: { label: "Time of Day", blurb: "Only appear during the right time of day" },
  weather: { label: "Weather", blurb: "Only appear in the matching weather" },
  rarity: { label: "Rarity", blurb: "The 1-in-50 Uncommon and 1-in-1,000 Rare marks" },
  special: { label: "Special", blurb: "Earned through specific actions, events, or transfers" },
};

export const MARKS: MarkDef[] = [
  // ------------------------------------------------------------------
  // Personality marks (#70–97) — wild
  // ------------------------------------------------------------------
  { id: "rowdy", name: "Rowdy Mark", title: "the Rowdy", description: "A mark for a rowdy Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "absent-minded", name: "Absent-Minded Mark", title: "the Spacey", description: "A mark for a spacey Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "jittery", name: "Jittery Mark", title: "the Anxious", description: "A mark for an anxious Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "excited", name: "Excited Mark", title: "the Giddy", description: "A mark for a giddy Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "charismatic", name: "Charismatic Mark", title: "the Radiant", description: "A mark for a radiant Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "calmness", name: "Calmness Mark", title: "the Serene", description: "A mark for a serene Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "intense", name: "Intense Mark", title: "the Feisty", description: "A mark for a feisty Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "zoned-out", name: "Zoned-Out Mark", title: "the Daydreamer", description: "A mark for a daydreaming Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "joyful", name: "Joyful Mark", title: "the Joyful", description: "A mark for a joyful Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "angry", name: "Angry Mark", title: "the Furious", description: "A mark for a furious Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "smiley", name: "Smiley Mark", title: "the Beaming", description: "A mark for a beaming Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "teary", name: "Teary Mark", title: "the Teary-Eyed", description: "A mark for a teary-eyed Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "upbeat", name: "Upbeat Mark", title: "the Chipper", description: "A mark for a chipper Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "peeved", name: "Peeved Mark", title: "the Grumpy", description: "A mark for a grumpy Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "intellectual", name: "Intellectual Mark", title: "the Scholar", description: "A mark for a scholarly Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "ferocious", name: "Ferocious Mark", title: "the Rampaging", description: "A mark for a rampaging Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "crafty", name: "Crafty Mark", title: "the Opportunist", description: "A mark for an opportunistic Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "scowling", name: "Scowling Mark", title: "the Stern", description: "A mark for a stern Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "kindly", name: "Kindly Mark", title: "the Kindhearted", description: "A mark for a kindhearted Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "flustered", name: "Flustered Mark", title: "the Easily Flustered", description: "A mark for an easily flustered Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "pumped-up", name: "Pumped-Up Mark", title: "the Driven", description: "A mark for a driven Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "zero-energy", name: "Zero Energy Mark", title: "the Apathetic", description: "A mark for an apathetic Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "prideful", name: "Prideful Mark", title: "the Arrogant", description: "A mark for an arrogant Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "unsure", name: "Unsure Mark", title: "the Reluctant", description: "A mark for an unsure Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "humble", name: "Humble Mark", title: "the Humble", description: "A mark for a humble Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "thorny", name: "Thorny Mark", title: "the Pompous", description: "A mark for a pompous Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "vigor", name: "Vigor Mark", title: "the Lively", description: "A mark for a lively Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },
  { id: "slump", name: "Slump Mark", title: "the Worn-Out", description: "A mark for a worn-out Pokémon.", category: "wild", group: "personality", howToGet: "Random wild catch (1 in 2,800)" },

  // ------------------------------------------------------------------
  // Time-of-day marks (#53–56) — wild
  // ------------------------------------------------------------------
  { id: "lunchtime", name: "Lunchtime Mark", title: "the Peckish", description: "A mark for a peckish Pokémon.", category: "wild", group: "time", howToGet: "Caught in the afternoon (12:00–18:59)" },
  { id: "sleepy-time", name: "Sleepy-Time Mark", title: "the Sleepy", description: "A mark for a sleepy Pokémon.", category: "wild", group: "time", howToGet: "Caught at night (20:00–05:59)" },
  { id: "dusk", name: "Dusk Mark", title: "the Dozy", description: "A mark for a dozy Pokémon.", category: "wild", group: "time", howToGet: "Caught in the evening (19:00–19:59)" },
  { id: "dawn", name: "Dawn Mark", title: "the Early Riser", description: "A mark for an early-riser Pokémon.", category: "wild", group: "time", howToGet: "Caught in the morning (06:00–11:59)" },

  // ------------------------------------------------------------------
  // Weather marks (#57–64, Dry Mark excluded — SwSh only) — wild
  // ------------------------------------------------------------------
  { id: "cloudy", name: "Cloudy Mark", title: "the Cloud Watcher", description: "A mark for a cloud-watching Pokémon.", category: "wild", group: "weather", howToGet: "Caught in cloudy weather" },
  { id: "rainy", name: "Rainy Mark", title: "the Sodden", description: "A mark for a sodden Pokémon.", category: "wild", group: "weather", howToGet: "Caught in rain" },
  { id: "stormy", name: "Stormy Mark", title: "the Thunderstruck", description: "A mark for a thunderstruck Pokémon.", category: "wild", group: "weather", howToGet: "Caught in a thunderstorm" },
  { id: "snowy", name: "Snowy Mark", title: "the Snow Frolicker", description: "A mark for a snow-frolicking Pokémon.", category: "wild", group: "weather", howToGet: "Caught in snow" },
  { id: "blizzard", name: "Blizzard Mark", title: "the Shivering", description: "A mark for a shivering Pokémon.", category: "wild", group: "weather", howToGet: "Caught in a blizzard" },
  { id: "sandstorm", name: "Sandstorm Mark", title: "the Sandswept", description: "A mark for a sandswept Pokémon.", category: "wild", group: "weather", howToGet: "Caught in a sandstorm" },
  {
    id: "misty",
    name: "Misty Mark",
    title: "the Mist Drifter",
    description: "A mark for a mist-drifter Pokémon.",
    category: "wild",
    group: "weather",
    howToGet: "Caught in fog — naturally only in Kitakami's out-of-bounds cliff fog",
    note: "Normally only in Kitakami's out-of-bounds fog; Mass Outbreak events (e.g. Greavard/Houndstone, Oct 2023) have made it legitimately obtainable.",
  },

  // ------------------------------------------------------------------
  // Rarity marks — wild
  // ------------------------------------------------------------------
  { id: "uncommon", name: "Uncommon Mark", title: "the Sociable", description: "A mark for a sociable Pokémon.", category: "wild", group: "rarity", howToGet: "Random wild catch (1 in 50)" },
  { id: "rare", name: "Rare Mark", title: "the Recluse", description: "A mark for a reclusive Pokémon.", category: "wild", group: "rarity", howToGet: "Random wild catch (1 in 1,000)" },

  // ------------------------------------------------------------------
  // Special marks
  // ------------------------------------------------------------------
  {
    id: "destiny",
    name: "Destiny Mark",
    title: "the Chosen One",
    description: "A mark of a chosen Pokémon.",
    category: "special",
    group: "special",
    howToGet: "Wild catch on the date registered as your birthday",
    note: "Missable: only obtainable on your registered birthday.",
  },
  {
    id: "jumbo",
    name: "Jumbo Mark",
    title: "the Great",
    description: "A mark for a Pokémon that's the largest it can be.",
    category: "special",
    group: "special",
    howToGet: "Show a max-size Pokémon (Scale 255) to the hiker near the Mesagoza (West) Pokémon Center",
  },
  {
    id: "mini",
    name: "Mini Mark",
    title: "the Teeny",
    description: "A mark for a Pokémon that's the smallest it can be.",
    category: "special",
    group: "special",
    howToGet: "Show a min-size Pokémon (Scale 0) to the hiker near the Mesagoza (West) Pokémon Center",
  },
  {
    id: "itemfinder",
    name: "Itemfinder Mark",
    title: "the Treasure Hunter",
    description: "A mark for a Pokémon that likes to pick things up.",
    category: "special",
    group: "special",
    howToGet: "Small chance granted to your lead Pokémon when it picks up an item (v2.0.1+)",
  },
  {
    id: "partner",
    name: "Partner Mark",
    title: "the Reliable Partner",
    description: "A mark for a friendly Pokémon.",
    category: "special",
    group: "special",
    howToGet: "Small chance every 10,000 steps to a party Pokémon with 200+ friendship",
  },
  {
    id: "gourmand",
    name: "Gourmand Mark",
    title: "the Gourmet",
    description: "A mark for a Pokémon gourmet.",
    category: "special",
    group: "special",
    howToGet: "Small chance after making a sandwich or buying food from shops",
  },
  {
    id: "alpha",
    name: "Alpha Mark",
    title: "the Former Alpha",
    description: "A mark for a Pokémon that was an alpha.",
    category: "special",
    group: "special",
    howToGet: "Transfer an Alpha Pokémon from Pokémon Legends: Arceus via Pokémon HOME",
    note: "Requires an Alpha Pokémon from Pokémon Legends: Arceus transferred via HOME.",
  },
  {
    id: "mightiest",
    name: "Mightiest Mark",
    title: "the Unrivaled",
    description: "A mark for an especially mighty Pokémon.",
    category: "special",
    group: "special",
    howToGet: "Catch the Pokémon in a 7★ Tera Raid via a Poké Portal News event",
    note: "Event-limited: 7★ raids run for a few days, and each can be caught only once per save.",
  },
  {
    id: "titan",
    name: "Titan Mark",
    title: "the Former Titan",
    description: "A mark for a Pokémon that was a Titan.",
    category: "special",
    group: "special",
    howToGet: "Catch a Titan Pokémon again after obtaining its Titan Badge",
    note: "One chance per Titan per save file.",
  },
];

export const TOTAL_MARKS = MARKS.length;
export const WILD_MARKS = MARKS.filter((m) => m.category === "wild");
export const SPECIAL_MARKS = MARKS.filter((m) => m.category === "special");

export function getMark(id: string): MarkDef | undefined {
  return MARKS.find((m) => m.id === id);
}
