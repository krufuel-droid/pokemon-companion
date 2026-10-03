/**
 * IVs and Hyper Training by generation. Shared between /guides and /guides/iv-training.
 */

export const IV_SECTIONS: {
  gen: string;
  games: string;
  methods: { title: string; detail: string }[];
}[] = [
  {
    gen: "What are IVs?",
    games: "All generations",
    methods: [
      {
        title: "Individual Values",
        detail:
          "Each stat has a hidden IV from 0–31. At Lv. 100, each IV is worth 1 stat point — a 31 IV stat is 31 points higher than 0.",
      },
      {
        title: "Checking IVs",
        detail:
          "Gen 7+: unlock the Judge function on the PC (hatch 20+ eggs in S/M, or beat the game in Sw/Sh and S/V). 'Best' means 31.",
      },
    ],
  },
  {
    gen: "Gen 3–6",
    games: "Ruby/Sapphire → Omega Ruby/Alpha Sapphire",
    methods: [
      {
        title: "Breeding for IVs",
        detail:
          "Give a parent a Destiny Knot to pass down 5 of 12 IVs (Gen 6+). Power items pass one specific IV. Everstone passes nature.",
      },
      {
        title: "Friend Safari / DexNav",
        detail:
          "X/Y Friend Safari Pokémon always have 2+ perfect IVs. OR/AS DexNav chains raise perfect IV counts.",
      },
    ],
  },
  {
    gen: "Gen 7+",
    games: "Sun/Moon onward",
    methods: [
      {
        title: "Hyper Training",
        detail:
          "At Lv. 100, trade a Bottle Cap (one stat) or Gold Bottle Cap (all stats) to max IVs. The Pokémon must be Lv. 100.",
      },
      {
        title: "Bottle Cap sources",
        detail:
          "S/M: Festival Plaza. US/UM: Royal Avenue. Sw/Sh: Battle Tower (BP). S/V: Delibird Presents shops (₽20,000).",
      },
      {
        title: "Breeding still matters",
        detail:
          "Hyper Trained stats don't pass down through breeding — the real IVs do. Breed 5–6 perfect IV parents for egg projects.",
      },
    ],
  },
  {
    gen: "Scarlet/Violet specifics",
    games: "Gen 9",
    methods: [
      {
        title: "Tera raid IVs",
        detail:
          "5-star raids guarantee 4 perfect IVs, 6-star raids guarantee 5. Great Hyper Training candidates.",
      },
      {
        title: "Mirror Herb + Egg Moves",
        detail:
          "Not IVs, but essential: give a Pokémon a Mirror Herb and picnic it with one that knows the egg move to learn it.",
      },
    ],
  },
  {
    gen: "Legends: Z-A",
    games: "Pokémon Legends: Z-A",
    methods: [
      {
        title: "Hyper Training at the Justice Dojo",
        detail:
          "An NPC at the Justice Dojo maxes IVs for Bottle Caps (one stat each) or a Gold Bottle Cap (all six). Pokémon must be Lv. 50+.",
      },
      {
        title: "Bottle Cap sources",
        detail:
          "Mable's Research (Lv. 36: 10 caps, Lv. 48: 3 Gold Caps), Infinite Z-A Royale rewards, Ranked Season 1, and Side Mission 103 'Facing the Furfrou League' (1 Gold Cap).",
      },
      {
        title: "Alpha Pokémon",
        detail:
          "Alpha Pokémon have maxed IVs in at least 3 stats — great Hyper Training candidates or breeding-adjacent shortcuts.",
      },
      {
        title: "Seeds of Mastery",
        detail:
          "Not IVs, but the other Justice Dojo NPC converts moves to Plus Moves for Seeds of Mastery, earned from defeating Alpha Pokémon.",
      },
    ],
  },
];

export const IV_TIPS = [
  "For most competitive builds you want 31 in everything except sometimes Attack (on special attackers, to reduce confusion/Foul Play damage) or Speed (for Trick Room).",
  "Hyper Training is usually faster than breeding a perfect Pokémon from scratch.",
  "A Ditto with perfect IVs (from raids) + Destiny Knot is the foundation of every breeding project.",
  "Mints (nature), Bottle Caps (IVs), and Vitamins (EVs) together can perfect any Pokémon — no breeding required.",
];
