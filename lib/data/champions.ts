/**
 * Pokémon Champions competitive hub data.
 *
 * This is a manually curated snapshot of the Champions competitive scene as
 * of SNAPSHOT_DATE — the current regulation, the meta staples, featured
 * winning teams, players to watch, and upcoming events.
 *
 * Sources:
 * - Meta usage percentages and player rankings: Limitless VGC
 *   (https://limitlessvgc.com) Regulation M-C rankings — numbers are copied
 *   from their published data, never estimated.
 * - Featured winning teams: only use details the linked sources actually
 *   publish (Limitless VGC team lists, tournament coverage, creator
 *   showcases) — never fill in moves/items/natures from memory.
 * - Upcoming tournaments: the official Pokémon event finder
 *   (https://championships.pokemon.com/en-us/events), snapshotted by hand.
 *
 * To update the snapshot:
 *  1. Update SNAPSHOT_DATE and REGULATION if the regulation set changed.
 *  2. Refresh META_PICKS from the Limitless VGC Regulation M-C usage
 *     ranking (top ~12, with usage % in each note).
 *  3. Add new featured winning teams to FEATURED_TEAMS (event, date,
 *     player, placement, team with moves/items/natures, source link).
 *  4. Refresh PLAYERS_TO_WATCH from the Limitless VGC player rankings.
 *     Only include social handles that are publicly listed by the player
 *     (their own bios, tournament profiles, official Pokémon sources) —
 *     never dig up or guess at private accounts. If a handle can't be
 *     verified, omit socials for that player rather than guessing.
 *  5. Refresh UPCOMING_TOURNAMENTS from the official event finder.
 *
 * Pokémon are referenced by base species NAME (as in data/pokedex-full.json)
 * and resolved to Pokédex numbers at module load, so links stay correct.
 * Form labels (e.g. "Mega Dragonite") are display-only; links go to the
 * base species page. To add a Pokémon: use the exact species name.
 */
import { getAllSpecies } from "@/lib/pokedex";

export interface SocialLinks {
  x?: string;
  youtube?: string;
  twitch?: string;
}

export interface TeamMon {
  /** Base species name, e.g. "Dragonite". */
  name: string;
  /** Display label for the form actually used, e.g. "Mega Dragonite". */
  form?: string;
  ability?: string;
  item?: string;
  nature?: string;
  /** EV spread, e.g. "252 HP / 252 Atk / 4 Def". Partial if that's all coverage reported. */
  evs?: string;
  moves?: string[];
}

export interface TeamSource {
  label: string;
  url: string;
}

export interface FeaturedTeam {
  event: string;
  date: string;
  player: string;
  placement: string;
  headline: string;
  team: TeamMon[];
  replicaCode?: string;
  footnote?: string;
  source: TeamSource;
}

export interface PlayerToWatch {
  name: string;
  tagline: string;
  bio: string;
  socials?: SocialLinks;
}

export interface MetaPick {
  /** Display name (may be a form, e.g. "Hisuian Arcanine"). */
  name: string;
  /**
   * Base species name used for the Pokédex link/sprite when `name` is a
   * form (e.g. "Arcanine" for "Hisuian Arcanine"). Omit when identical.
   */
  speciesName?: string;
  note: string;
}

export interface FollowLink {
  label: string;
  handle: string;
  url: string;
  note: string;
}

/** Honest "as of" label shown on the page — this file is updated by hand. */
export const SNAPSHOT_DATE = "October 1, 2026";

export const REGULATION = {
  name: "Regulation M-C",
  dates: "September 9 – December 2, 2026",
  detail: "231 species legal · 82 Mega Evolutions",
  note: "The second Champions regulation set. Megas define the format — knowing when to Mega Evolve, and which one to choose, is the format's defining skill.",
};

/** Doubles meta staples (Champions' main competitive format), ordered by
 *  Limitless VGC's Regulation M-C usage ranking with the usage % in each note. */
export const META_PICKS: MetaPick[] = [
  {
    name: "Rillaboom",
    note: "The #1 most-used Pokémon in Regulation M-C at 53.6% usage — Grassy Surge, Fake Out, and priority Grassy Glide.",
  },
  {
    name: "Sneasler",
    note: "41.0% usage — Dire Claw and Fake Out pressure every team preview.",
  },
  {
    name: "Incineroar",
    note: "38.1% usage — Fake Out + Intimidate + Parting Shot is still the glue of doubles.",
  },
  {
    name: "Kingambit",
    note: "32.3% usage — Sucker Punch + Kowtow Cleave win condition.",
  },
  {
    name: "Gholdengo",
    note: "27.8% usage — Make It Rain spread damage with Good as Gold status immunity.",
  },
  {
    name: "Raichu",
    note: "27.1% usage — Mega Raichu Y is one of M-C's defining new Megas; Fake Out + Lightning Rod support.",
  },
  {
    name: "Garchomp",
    note: "23.6% usage — Mega Garchomp Z headlined back-to-back Regional wins (Frankfurt and Brisbane).",
  },
  {
    name: "Salamence",
    note: "22.7% usage — Mega Salamence's Intimidate + Aerilate-boosted attacks.",
  },
  {
    name: "Hisuian Arcanine",
    speciesName: "Arcanine",
    note: "21.7% usage in its Hisuian form — an Intimidate physical attacker with strong Fire/Rock coverage.",
  },
  {
    name: "Eternal Flower Floette",
    speciesName: "Floette",
    note: "17.7% usage in its Eternal Flower form — a fast Fairy-type special attacker.",
  },
  {
    name: "Archaludon",
    note: "16.9% usage — Electro Shot setup tank, a doubles and singles staple.",
  },
  {
    name: "Charizard",
    note: "16.5% usage — Mega Charizard Y's Drought sun remains one of the format's defining archetypes.",
  },
];

/** Where the usage percentages above come from. */
export const META_SOURCE = {
  label: "Limitless VGC — Regulation M-C rankings",
  url: "https://limitlessvgc.com",
};

/** Singles ladder staples (in-game ranked). */
export const SINGLES_PICKS: MetaPick[] = [
  { name: "Garchomp", note: "Singles ladder #1 on the in-game ranked board." },
  { name: "Primarina", note: "Bulky special attacker and terrain-adjacent pivot." },
  { name: "Charizard", note: "Mega Charizard Y sun translates to singles." },
  { name: "Corviknight", note: "Defensive pivot; Bulk Up + Power Trip tech won games in Baltimore." },
  { name: "Archaludon", note: "Electro Shot setup wall." },
  { name: "Hippowdon", note: "Sand setter for singles sand teams." },
  { name: "Gengar", note: "Fast special breaker; Mega Gengar perish-trap variants exist." },
  { name: "Scizor", note: "Priority Bullet Punch revenge killer." },
  { name: "Aegislash", note: "Stance-change mind games and King's Shield." },
  { name: "Dragonite", note: "Mega Dragonite's Multiscale bulk works in singles too." },
];

export const HONORABLE_MENTIONS =
  "Also in the mix: Mimikyu (Trick Room), Aerodactyl (speed control), Rotom (pivot), Meowscarada, Metagross, and Delphox (sun-mode attacker).";

/** Most-held items across top teams. */
export const TOP_ITEMS = [
  "Focus Sash",
  "Sitrus Berry",
  "Life Orb",
  "Leftovers",
  "Choice Scarf",
  "Light Clay",
];

export const FEATURED_TEAMS: FeaturedTeam[] = [
  {
    event: "2026 Frankfurt Regional Championships — Masters",
    date: "September 26–27, 2026 · Frankfurt",
    player: "Eric Rios",
    placement: "Regional Champion",
    headline:
      "A perfect 17-0 through 1,129 trainers — the first Regulation M-C European Regional — built around Mega Garchomp Z and Mega Raichu Y. Rios is also Limitless VGC's #2 all-time points leader.",
    team: [
      {
        name: "Gholdengo",
        ability: "Good as Gold",
        item: "Life Orb",
        nature: "Modest",
        moves: ["Protect", "Shadow Ball", "Nasty Plot", "Make It Rain"],
      },
      {
        name: "Volcarona",
        ability: "Flame Body",
        item: "Rocky Helmet",
        nature: "Timid",
        moves: ["Overheat", "Struggle Bug", "Rage Powder", "Tailwind"],
      },
      {
        name: "Garchomp",
        form: "Mega Garchomp Z",
        ability: "Rough Skin",
        item: "Garchompite Z",
        nature: "Modest",
        moves: ["Dragon Pulse", "Earth Power", "Power Gem", "Protect"],
      },
      {
        name: "Incineroar",
        ability: "Intimidate",
        item: "Sitrus Berry",
        nature: "Impish",
        moves: ["Parting Shot", "Fake Out", "Flare Blitz", "Darkest Lariat"],
      },
      {
        name: "Rillaboom",
        ability: "Grassy Surge",
        item: "Miracle Seed",
        nature: "Adamant",
        moves: ["Grassy Glide", "Wood Hammer", "Fake Out", "U-turn"],
      },
      {
        name: "Raichu",
        form: "Mega Raichu Y",
        ability: "Lightning Rod",
        item: "Raichunite Y",
        nature: "Timid",
        moves: ["Zap Cannon", "Focus Blast", "Fake Out", "Protect"],
      },
    ],
    footnote:
      "Mega Garchomp Z went back-to-back: it also won the Brisbane Regional the same weekend — three Mega Garchomp Z made Brisbane's top cut.",
    source: {
      label: "Limitless VGC: Eric Rios — Frankfurt Regional team list",
      url: "https://standings.limitlessvgc.com/0039/player/1025/teamlist",
    },
  },
  {
    event: "2026 Pokémon World Championships — Masters",
    date: "August 28–30, 2026 · San Francisco",
    player: "Takuma Yamazaki",
    placement: "World Champion",
    headline:
      "Fifteen-plus years of competing without ever qualifying for Worlds — then he won the whole thing on his first appearance, on Pokémon Champions' biggest stage.",
    team: [
      {
        name: "Dragonite",
        form: "Mega Dragonite",
        ability: "Multiscale",
        item: "Dragoninite",
        nature: "Modest",
        moves: ["Dragon Pulse", "Heat Wave", "Extreme Speed", "Protect"],
      },
      {
        name: "Floette",
        form: "Mega Floette",
        ability: "Flower Veil → Fairy Aura",
        item: "Floettite",
        nature: "Timid",
        moves: ["Moonblast", "Dazzling Gleam", "Light of Ruin", "Protect"],
      },
      {
        name: "Kingambit",
        ability: "Defiant",
        item: "Chople Berry",
        nature: "Adamant",
        evs: "32 HP / 19 SpD",
        moves: ["Sucker Punch", "Kowtow Cleave", "Low Kick", "Iron Head"],
      },
      {
        name: "Basculegion",
        ability: "Adaptability",
        item: "Life Orb",
        nature: "Adamant",
        evs: "25 Spe",
        moves: ["Wave Crash", "Last Respects", "Aqua Jet", "Protect"],
      },
      {
        name: "Sneasler",
        ability: "Poison Touch",
        item: "Focus Sash",
        nature: "Jolly",
        moves: ["Close Combat", "Dire Claw", "Fake Out", "Feint"],
      },
      {
        name: "Garchomp",
        ability: "Rough Skin",
        item: "Choice Scarf",
        nature: "Adamant",
        evs: "27 Spe",
        moves: ["Dragon Claw", "Stomping Tantrum", "Earthquake", "Rock Slide"],
      },
    ],
    replicaCode: "A4RBR NN9YE",
    footnote:
      "Runner-up Hiroshi Onishi brought Mega Charizard Y sun to the final — a clash of the format's two defining Mega archetypes. Partial EV investments as reported in post-tournament coverage (both finalists revealed spreads).",
    source: {
      label: "DevonCorp: Takuma Yamazaki — The Makings of a World Champion",
      url: "https://devoncorp.press/tournament-coverage/takuma-yamazaki-the-makings-of-a-world-champion",
    },
  },
  {
    event: "2026 Baltimore Regional Championships — Masters",
    date: "September 19–20, 2026 · Baltimore",
    player: "Joseph Ugarte",
    placement: "Regional Champion",
    headline:
      "The first Regulation M-C official event (1,081 trainers) and Ugarte's third Regional title — a sand + Psychic Terrain statement that reset the new format's tier list.",
    team: [
      {
        name: "Excadrill",
        ability: "Sand Rush",
        item: "Focus Sash",
        nature: "Jolly",
        moves: ["Iron Head", "High Horsepower", "Rock Slide", "Protect"],
      },
      {
        name: "Salamence",
        form: "Mega Salamence",
        ability: "Intimidate → Aerilate",
        item: "Salamencite",
        nature: "Timid",
        moves: ["Hyper Voice", "Draco Meteor", "Flamethrower", "Protect"],
      },
      {
        name: "Indeedee",
        ability: "Psychic Surge",
        item: "Choice Scarf",
        nature: "Modest",
        moves: ["Expanding Force", "Mystical Fire", "Trick", "Protect"],
      },
      {
        name: "Tyranitar",
        form: "Mega Tyranitar",
        ability: "Sand Stream",
        item: "Tyranitarite",
        nature: "Jolly",
        moves: ["Rock Slide", "Knock Off", "Low Kick", "Protect"],
      },
      {
        name: "Corviknight",
        ability: "Mirror Armor",
        item: "Psychic Seed",
        nature: "Careful",
        moves: ["Brave Bird", "Power Trip", "Bulk Up", "Roost"],
      },
      {
        name: "Sneasler",
        ability: "Unburden",
        item: "White Herb",
        nature: "Adamant",
        moves: ["Close Combat", "Dire Claw", "Coaching", "Protect"],
      },
    ],
    footnote:
      "Finalist Aditya Subramanian answered with a creative Mega Golisopod rain Trick Room team — with a Charizard sun mode in the back.",
    source: {
      label: "OHKO Podcast Ep. 132: Joe Ugarte breaks down the Baltimore win",
      url: "https://www.youtube.com/watch?v=Mug6dcq4AWQ",
    },
  },
  {
    event: "2026 Indianapolis Regional Championships — Masters",
    date: "May 30, 2026 · Indianapolis",
    player: "Arsal Puri",
    placement: "Regional Champion",
    headline:
      "The first-ever Pokémon Champions Regional: Puri beat 1,000+ players and swept Wolfe Glick 2-0 in the finals with Mega Charizard + Mega Floette.",
    team: [
      {
        name: "Charizard",
        form: "Mega Charizard Y",
        item: "Charizardite Y",
        moves: ["Heat Wave", "Solar Beam", "Weather Ball", "Protect"],
      },
      {
        name: "Sinistcha",
        item: "Kasib Berry",
        moves: ["Matcha Gotcha", "Rage Powder", "Trick Room", "Protect"],
      },
      {
        name: "Floette",
        form: "Mega Floette",
        item: "Floettite",
        moves: ["Moonblast", "Dazzling Gleam", "Calm Mind", "Protect"],
      },
      {
        name: "Garchomp",
        item: "Choice Scarf",
        moves: ["Earthquake", "Rock Slide", "Stomping Tantrum", "Dragon Claw"],
      },
      {
        name: "Incineroar",
        item: "Sitrus Berry",
        moves: ["Fake Out", "Flare Blitz", "Throat Chop", "Parting Shot"],
      },
      {
        name: "Venusaur",
        item: "Focus Sash",
        moves: ["Sleep Powder", "Sludge Bomb", "Earth Power", "Protect"],
      },
    ],
    replicaCode: "7UWGKDSYDT",
    footnote:
      "Wolfe Glick's finals run featured an inventive Mega Steelix + Sharp Beak Talonflame team that troubled the whole field.",
    source: {
      label: "Insider Gaming: The first Pokémon Champions VGC team to win a Regional",
      url: "https://insider-gaming.com/the-first-pokemon-champions-vgc-team-to-win-a-regional/",
    },
  },
];

export const PLAYERS_TO_WATCH: PlayerToWatch[] = [
  {
    name: "Wolfe Glick",
    tagline: "All-time #1 · 913 pts · $91,500 earned",
    bio: "Limitless VGC's all-time points leader and top earner — the 2016 World Champion whose teams and meta reads still shape every format. 15th at Baltimore (Sept 2026) with Incineroar / Sneasler / Gholdengo / Gardevoir / Salamence / Indeedee-F.",
    socials: {
      x: "https://x.com/WolfeyGlick",
      youtube: "https://www.youtube.com/@WolfeyVGC",
    },
  },
  {
    name: "Eric Rios",
    tagline: "All-time #2 · 719 pts · Frankfurt Regional Champion",
    bio: "Went a perfect 17-0 to win Frankfurt (Sept 2026, 1,129 players) — the first Regulation M-C European Regional — with Mega Garchomp Z and Mega Raichu Y.",
  },
  {
    name: "Paul Chua",
    tagline: "All-time #3 · 635 pts · $64,250 earned",
    bio: "One of the most consistent competitors in VGC history — top-3 all-time in both points and career earnings.",
  },
  {
    name: "Alex Gómez Berna",
    tagline: "All-time #4 · 629 pts",
    bio: "Spain's top-ranked VGC competitor and a fixture of European top cuts.",
  },
  {
    name: "Joseph Ugarte",
    tagline: "All-time #5 · 616 pts · Baltimore Regional Champion",
    bio: "Won the first Regulation M-C official event over 1,081 trainers with sand + Psychic Terrain, and regularly breaks down his own tournament runs on his channel.",
    socials: {
      x: "https://x.com/JoeUX9",
      youtube: "https://www.youtube.com/@joeux9",
    },
  },
  {
    name: "Marco Hemantha Kaludura Silva",
    tagline: "#2 all-time earnings · $80,750",
    bio: "The second-highest earner in VGC history (497 all-time points) — a threat at every International he enters.",
  },
];

/** Hand-verified ranking snapshot behind PLAYERS_TO_WATCH (Limitless VGC). */
export const PLAYER_RANKINGS_SOURCE = {
  label: "Limitless VGC — player rankings",
  url: "https://limitlessvgc.com",
};

/** Upcoming Championship Series events, snapshotted from the official
 *  Pokémon event finder (static list — see EVENT_FINDER_URL for the live schedule). */
export interface UpcomingTournament {
  /** Anchor id, e.g. "tourn-louisville" — must match the event id in lib/data/events.ts. */
  id: string;
  name: string;
  dates: string;
  kind: "Regional" | "Special" | "International";
  /** Notable players expected — verified names only. */
  playersToWatch?: string[];
  /** Storyline angles for this event. */
  storylines?: string[];
  /** Where to watch the broadcast. */
  broadcast?: string;
}

export const EVENT_FINDER_URL = "https://championships.pokemon.com/en-us/events";

export const UPCOMING_TOURNAMENTS: UpcomingTournament[] = [
  { id: "tourn-recife", name: "Recife Regional Championships", dates: "Oct 3–4", kind: "Regional" },
  { id: "tourn-louisville", name: "Louisville Regional Championships", dates: "Oct 9–11", kind: "Regional",
    playersToWatch: [
      "Joseph Ugarte — won Baltimore (Sept 2026, first M-C event) with Mega Salamence + Mega Tyranitar; 3x Regional Champion",
      "Wolfe Glick — 2016 World Champion; Top 64 at Baltimore",
      "Brady Smith, Blaik Thompson, Dorian Kang, Justin Tang — all Baltimore Top 16/Top 8",
    ],
    storylines: [
      "Back-to-back? Louisville is the second NA regional of the M-C era — if Ugarte's Salamence/Tyranitar core wins again, it becomes the defining team of early M-C.",
      "Meta still unsolved: with only Baltimore as NA data, Louisville is where the format's first real counter-meta emerges.",
    ],
    broadcast: "Expected on Twitch.tv/Pokemon and YouTube.com/Pokemon (2025 event streamed there); Victory Road covers via @VGCVictoryRoad.",
  },
  { id: "tourn-nice", name: "Nice Regional Championships", dates: "Oct 17–18", kind: "Regional",
    playersToWatch: [
      "Eric Rios — won Frankfurt (Sept 2026, Europe's first M-C event) with Mega Garchomp Z + Mega Raichu Y; 5x Regional Champion",
      "Sebastian Liu Li — Frankfurt runner-up; Giuseppe Musicco — Frankfurt Top 8",
      "Théotime Massaut — 2026 LAIC semifinalist; won the Victory Road September Challenge #2",
    ],
    storylines: [
      "Rios's reign: five regional titles and a fresh Frankfurt win — Nice is where Europe finds out if anyone has an answer for his Garchomp Z + Raichu Y core.",
      "Europe vs. NA meta split: Frankfurt's top cut looked different from Baltimore's — Nice shows whether the regions converge or develop separately.",
    ],
    broadcast: "Expected on Twitch.tv/Pokemon and YouTube.com/Pokemon; Victory Road covers via @VGCVictoryRoad.",
  },
  { id: "tourn-puebla", name: "Puebla Regional Championships", dates: "Oct 24–25", kind: "Regional",
    storylines: [
      "Recife fallout: Latin America's first Champions-era regional (Oct 3–4) just concluded — if a new star or team broke out there, Puebla is where the region adapts.",
      "Road to São Paulo: the Latin America International is Nov 20–22 — Puebla is the last big CP stop before the continent's biggest event.",
    ],
    broadcast: "Expected on Twitch.tv/Pokemon and YouTube.com/Pokemon; Victory Road covers via @VGCVictoryRoad.",
  },
  { id: "tourn-gdansk", name: "Gdańsk Regional Championships", dates: "Oct 31 – Nov 1", kind: "Regional" },
  { id: "tourn-buenos-aires", name: "Buenos Aires Special Championships", dates: "Nov 14–15", kind: "Special" },
  { id: "tourn-laic", name: "Latin America International Championships", dates: "Nov 20–22", kind: "International" },
  { id: "tourn-stuttgart", name: "Stuttgart Regional Championships", dates: "Nov 28–29", kind: "Regional" },
  { id: "tourn-las-vegas", name: "Las Vegas Regional Championships", dates: "Dec 4–6", kind: "Regional" },
];

export const FOLLOW_THE_SCENE: FollowLink[] = [
  {
    label: "Victory Road VGC",
    handle: "@VGCVictoryRoad",
    url: "https://x.com/VGCVictoryRoad",
    note: "The longtime home of competitive Pokémon VGC coverage, standings, and event results.",
  },
  {
    label: "Play! Pokémon",
    handle: "@playpokemon",
    url: "https://x.com/playpokemon",
    note: "Official Play! Pokémon account — event news, broadcasts, and Championship Series updates.",
  },
];

// ---- Name → Pokédex number resolution ----
const nameToId = new Map<string, number>(
  getAllSpecies().map((s) => [s.name.toLowerCase(), s.id])
);

/** Pokédex number for a species name. Unmatched names are dropped. */
export function resolveSpeciesId(name: string): number | undefined {
  return nameToId.get(name.toLowerCase());
}

/** Sprite + id for rendering meta picks and team members. */
export function getSpeciesCard(name: string) {
  const species = getAllSpecies().find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
  return species
    ? { id: species.id, name: species.name, sprite: species.sprites.regular }
    : undefined;
}
