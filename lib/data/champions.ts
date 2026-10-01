/**
 * Pokémon Champions competitive hub data.
 *
 * This is a manually curated snapshot of the Champions competitive scene as
 * of SNAPSHOT_DATE — the current regulation, the meta staples, featured
 * winning teams, and players to watch. Team data comes from tournament
 * coverage and creator showcases (sources linked on each team); only use
 * details those sources actually publish, never fill in moves/items/natures
 * from memory.
 *
 * To update the snapshot:
 *  1. Update SNAPSHOT_DATE and REGULATION if the regulation set changed.
 *  2. Add new featured winning teams to FEATURED_TEAMS (event, date,
 *     player, placement, team with moves/items/natures, source link).
 *  3. Refresh META_PICKS / SINGLES_PICKS notes.
 *  4. Add/remove entries in PLAYERS_TO_WATCH. Only include social handles
 *     that are publicly listed by the player (their own bios, tournament
 *     profiles, official Pokémon sources) — never dig up or guess at
 *     private accounts. If a handle can't be verified, omit socials for
 *     that player rather than guessing.
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
  name: string;
  note: string;
}

export interface FollowLink {
  label: string;
  handle: string;
  url: string;
  note: string;
}

/** Honest "as of" label shown on the page — this file is updated by hand. */
export const SNAPSHOT_DATE = "October 2026";

export const REGULATION = {
  name: "Regulation M-C",
  dates: "September 9 – December 2, 2026",
  detail: "231 species legal · 82 Mega Evolutions",
  note: "The second Champions regulation set. Megas define the format — knowing when to Mega Evolve, and which one to choose, is the format's defining skill.",
};

/** Doubles meta staples (Champions' main competitive format). */
export const META_PICKS: MetaPick[] = [
  {
    name: "Incineroar",
    note: "The format's most-used support: 53.76% usage in Champions' first tournament. Fake Out + Intimidate + Parting Shot is still the glue of doubles.",
  },
  {
    name: "Sneasler",
    note: "36.84% usage with a 51.38% win rate out of the gate — Dire Claw and Fake Out pressure every team preview.",
  },
  {
    name: "Rillaboom",
    note: "Topped the early Regulation M-C doubles tier list: Grassy Terrain, Fake Out, and priority Grassy Glide.",
  },
  {
    name: "Sinistcha",
    note: "Rage Powder + Matcha Gotcha support piece on winning teams, including the first-ever Champions Regional.",
  },
  {
    name: "Garchomp",
    note: "Choice Scarf cleaner and Earthquake/Rock Slide spread threat — a staple across doubles and singles.",
  },
  {
    name: "Basculegion",
    note: "Adaptability Wave Crash + Last Respects; widely tipped as a long-term format dominator.",
  },
  {
    name: "Kingambit",
    note: "Sucker Punch + Kowtow Cleave win condition; the recommended starting point for singles builders too.",
  },
  {
    name: "Charizard",
    note: "Mega Charizard Y's Drought sun is one of the format's defining archetypes — it carried Hiroshi Onishi to the Worlds final.",
  },
  {
    name: "Tyranitar",
    note: "Sand Stream enabler; Joseph Ugarte won Baltimore's 1,081-trainer field with sand + Psychic Terrain.",
  },
  {
    name: "Pelipper",
    note: "Rain setter for Pelipper + Basculegion cores.",
  },
  {
    name: "Whimsicott",
    note: "Tailwind and Fake Tears speed control.",
  },
  {
    name: "Archaludon",
    note: "Electro Shot setup tank — a doubles and singles staple.",
  },
];

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
        moves: ["Sucker Punch", "Kowtow Cleave", "Low Kick", "Iron Head"],
      },
      {
        name: "Basculegion",
        ability: "Adaptability",
        item: "Life Orb",
        nature: "Adamant",
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
        moves: ["Dragon Claw", "Stomping Tantrum", "Earthquake", "Rock Slide"],
      },
    ],
    replicaCode: "A4RBR NN9YE",
    footnote:
      "Runner-up Hiroshi Onishi brought Mega Charizard Y sun to the final — a clash of the format's two defining Mega archetypes.",
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
    name: "Takuma Yamazaki",
    tagline: "2026 VGC Masters World Champion",
    bio: "Competed for over 15 years without ever qualifying for Worlds — then won the entire tournament on his first appearance in San Francisco, piloting Mega Dragonite + Mega Floette. The defining underdog story of the Champions era.",
  },
  {
    name: "Joseph Ugarte",
    tagline: "3× Regional Champion · Baltimore winner",
    bio: "Won the first Regulation M-C official event over 1,081 trainers with sand + Psychic Terrain, and regularly breaks down his own tournament runs on his channel.",
    socials: {
      x: "https://x.com/JoeUX9",
      youtube: "https://www.youtube.com/@joeux9",
    },
  },
  {
    name: "Wolfe Glick",
    tagline: "2016 World Champion · 10× Regional Champion",
    bio: "VGC legend and one of the biggest competitive Pokémon creators — finalist at the first Champions Regional with an inventive Mega Steelix team, and a constant source of deep meta analysis.",
    socials: {
      x: "https://x.com/WolfeyGlick",
      youtube: "https://www.youtube.com/@WolfeyVGC",
    },
  },
  {
    name: 'Aaron "Cybertron" Zheng',
    tagline: "Caster & creator · 2× National, 5× Regional Champion",
    bio: "Worlds semifinalist turned premier VGC caster and YouTuber. His team showcases and regulation breakdowns are the fastest way to understand a new format.",
    socials: {
      x: "https://x.com/CybertronVGC",
      youtube: "https://www.youtube.com/@CybertronVGC",
      twitch: "https://www.twitch.tv/cybertronvgc",
    },
  },
  {
    name: "Arsal Puri",
    tagline: "First Champions Regional winner",
    bio: "Won the very first Pokémon Champions Regional (Indianapolis, May 2026), sweeping Wolfe Glick 2-0 in the finals with a Mega Charizard / Mega Floette core.",
  },
  {
    name: "Aditya Subramanian",
    tagline: "Baltimore finalist",
    bio: "Took 2nd at Baltimore with a creative Mega Golisopod rain Trick Room team backed by a Charizard sun mode — one of M-C's most interesting builders.",
  },
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
