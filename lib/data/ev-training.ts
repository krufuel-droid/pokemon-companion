/**
 * EV training methods by generation. Shared between /guides and /guides/ev-training.
 */

export const SECTIONS: {
  gen: string;
  games: string;
  methods: { title: string; detail: string }[];
}[] = [
  {
    gen: "Gen 3–5",
    games: "Ruby/Sapphire/Emerald → Black 2/White 2",
    methods: [
      {
        title: "Targeted battling",
        detail:
          "Defeat specific Pokémon that yield the EVs you want (e.g. Zubats for Speed). Each KO gives 1–3 EVs in a stat; 4 EVs = 1 stat point at Lv. 100.",
      },
      {
        title: "Power items (Gen 4+)",
        detail:
          "Power items debuted in Diamond/Pearl — there are none in Gen 3. In Gen 4, each adds +4 EVs per battle in its stat (1 + 4 = 5 per KO, doubled to 10 with Pokérus). From Gen 5 on, Power items add +8 EVs instead.",
      },
      {
        title: "Vitamins (capped)",
        detail:
          "HP Up, Protein, Iron, Calcium, Zinc, and Carbos give 10 EVs each but stop working after 100 EVs in a stat. Use them first, then battle for the rest.",
      },
    ],
  },
  {
    gen: "Gen 6",
    games: "X/Y, Omega Ruby/Alpha Sapphire",
    methods: [
      {
        title: "Horde battles",
        detail:
          "Use Sweet Scent/Honey in grass to summon 5 Pokémon at once — 5× the EVs per battle. With a Power item + Pokérus, one horde can give 50+ EVs.",
      },
      {
        title: "Super Training",
        detail:
          "Touch-screen mini-games that award EVs directly, plus training bags. Slower than hordes but no battling required.",
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
          "Weaken a wild Pokémon and let it call for help. Each ally called gives 2× EVs. Chain to 30+ for massive gains with Power items + Pokérus.",
      },
      {
        title: "Poké Pelago",
        detail:
          "Send Pokémon to Isle Evelup for passive EV training while you do other things. Slow but fully hands-off.",
      },
    ],
  },
  {
    gen: "Gen 8",
    games: "Sword/Shield",
    methods: [
      {
        title: "Vitamins (uncapped!)",
        detail:
          "Vitamins now work all the way to 252 EVs per stat — 26 vitamins maxes a stat instantly. Buy with money from the Wild Area.",
      },
      {
        title: "Jobs",
        detail:
          "Send Pokémon on jobs from any PC. They earn EVs passively over real time, even with the game off.",
      },
      {
        title: "Feathers",
        detail:
          "Swift Feather, Muscle Feather, etc. give 1 EV each. Farm them on Bridge Field with the Cram-o-matic.",
      },
    ],
  },
  {
    gen: "Gen 9",
    games: "Scarlet/Violet",
    methods: [
      {
        title: "Vitamins from Chansey Supply",
        detail:
          "Same shop that sells mints! HP Up, Protein, Iron, Calcium, Zinc, Carbos — 10,000 Pokédollars each, uncapped. The fastest method by far.",
      },
      {
        title: "Feathers from Tera raids",
        detail:
          "Health Feather, Muscle Feather, Resist Feather, Genius Feather, Clever Feather, Swift Feather — 1 EV each, farmable from raids.",
      },
      {
        title: "Manual outbreak battles",
        detail:
          "Head to a mass outbreak of the species that yields the EVs you want and battle them yourself — auto-battles (R button) grant EXP but zero EVs. Hold the matching Power item for +8 EVs per KO.",
      },
    ],
  },
  {
    gen: "Legends: Z-A",
    games: "Pokémon Legends: Z-A",
    methods: [
      {
        title: "Battle to earn EVs",
        detail:
          "Defeat wild or trainer-owned Pokémon — each species grants EVs in its highest base stat. Check EVs on the stats page (press down on the right stick); maxed stats show sparkles.",
      },
      {
        title: "Vitamins (uncapped)",
        detail:
          "Same as recent generations — vitamins work all the way to 252. Buy in bulk once cash is flowing from the Z-A Royale.",
      },
    ],
  },
];

export const QUICK_TIPS = [
  "A Pokémon can have max 510 EVs total, with max 252 in any single stat.",
  "The classic competitive spread is 252/252/4 — two maxed stats and 4 in a third.",
  "Use mints (see Items → Mints) to fix the nature after EV training — nature and EVs are independent.",
  "Pokérus doubles all EV gains and is the single biggest speedup in Gens 3–7.",
  "In Scarlet/Violet, you can check EVs on the stat screen (press L) — yellow = trained.",
];
