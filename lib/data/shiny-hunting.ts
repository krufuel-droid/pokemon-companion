/**
 * Shiny hunting methods by generation. Shared between /guides and /guides/shiny-hunting.
 */

export const SHINY_SECTIONS: {
  gen: string;
  games: string;
  methods: { title: string; detail: string }[];
}[] = [
  {
    gen: "Gen 2",
    games: "Gold/Silver/Crystal",
    methods: [
      {
        title: "Odd Egg",
        detail:
          "The Odd Egg from the Day Care has a 14% shiny chance — the best odds in the series for a gift Pokémon.",
      },
      {
        title: "Wild encounters",
        detail:
          "Base shiny rate is 1/8192. The red Gyarados at Lake of Rage is a guaranteed shiny.",
      },
    ],
  },
  {
    gen: "Gen 3–5",
    games: "Ruby/Sapphire → Black 2/White 2",
    methods: [
      {
        title: "Masuda Method",
        detail:
          "Breed two Pokémon from different-language games. Cuts odds to ~1/1638 (Gen 4) or ~1/1365 (Gen 5).",
      },
      {
        title: "Poké Radar chaining (D/P/Pt)",
        detail:
          "Chain the same species to 40+ for odds as good as ~1/200. Breaks if you leave the grass or the wrong patch.",
      },
      {
        title: "Shiny Charm (B2/W2)",
        detail:
          "Complete the National Dex for the Shiny Charm: 1/2731 normally, 1/1024 with Masuda.",
      },
    ],
  },
  {
    gen: "Gen 6",
    games: "X/Y, Omega Ruby/Alpha Sapphire",
    methods: [
      {
        title: "Chain fishing",
        detail:
          "Fish consecutively without moving or missing. Chain to 20+ for dramatically boosted odds (~1/100).",
      },
      {
        title: "DexNav chaining (OR/AS)",
        detail:
          "Sneak up on DexNav encounters to build a chain — higher chain means better odds plus egg moves and hidden abilities.",
      },
      {
        title: "Horde encounters",
        detail: "Five Pokémon per horde = five shiny rolls per battle. Sweet Scent to summon.",
      },
    ],
  },
  {
    gen: "Gen 7",
    games: "Sun/Moon, Ultra Sun/Ultra Moon",
    methods: [
      {
        title: "SOS chaining",
        detail:
          "Chain allies to 30+ (70+ in US/UM for max odds). With Shiny Charm, odds reach ~1/273.",
      },
      {
        title: "Ultra Wormholes (US/UM)",
        detail:
          "Travel far through wormholes — distant wormholes have boosted shiny rates up to ~1/25 for legendaries.",
      },
    ],
  },
  {
    gen: "Gen 8",
    games: "Sword/Shield",
    methods: [
      {
        title: "Brilliant Aura / combo KO",
        detail:
          "KO or catch 500+ of a species to max its brilliant-aura rate. With Shiny Charm: ~1/512.",
      },
      {
        title: "Masuda + Charm",
        detail: "Still the most reliable: ~1/512 per egg with Shiny Charm.",
      },
      {
        title: "Dynamax Adventures",
        detail:
          "Endless Dynamax Adventures — legendaries have boosted shiny odds here: 1/100, or 1/50 with the Shiny Charm.",
      },
    ],
  },
  {
    gen: "Gen 9",
    games: "Scarlet/Violet",
    methods: [
      {
        title: "Mass outbreaks",
        detail:
          "Clear 60+ Pokémon in an outbreak. With Shiny Charm + sparkling sandwich: ~1/512.",
      },
      {
        title: "Sparkling sandwiches",
        detail:
          "Sandwich powers (Sparkling Lv. 3 + Encounter Lv. 3) boost shiny odds for a type for 30 minutes.",
      },
      {
        title: "Masuda + Charm",
        detail: "Eggs: ~1/512 with Shiny Charm. Picnics make it fast.",
      },
    ],
  },
  {
    gen: "Legends: Z-A",
    games: "Pokémon Legends: Z-A",
    methods: [
      {
        title: "Sparkling Power Donuts (Mega Dimension DLC)",
        detail:
          "Cook donuts maxing out Sweetness (pink stat) with 8 ingredients including Hyperspace Butter. Like S/V sandwiches but donuts — the effect lasts for your Hyperspace visit (duration is calorie-based, not a fixed timer).",
      },
      {
        title: "Shiny Charm + spawn resetting",
        detail:
          "Z-A has no mass outbreaks or breeding — the Shiny Charm (~1/1,365) is the only base-game odds booster. In the Mega Dimension DLC, pair it with Sparkling Power donuts (~1/585 with Charm + Sparkling Power 3) and reset grouped Hyperspace spawns.",
      },
    ],
  },
];

export const SHINY_TIPS = [
  "Base shiny odds were 1/8192 through Gen 5, then doubled to 1/4096 from Gen 6 on.",
  "The Shiny Charm roughly triples your odds in most games — always worth getting.",
  "Shiny Pokémon never have better stats — it's purely cosmetic (and bragging rights).",
  "Save before static encounters and gift Pokémon so you can reset for shiny.",
];
