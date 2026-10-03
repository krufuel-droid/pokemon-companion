import Link from "next/link";

export const metadata = {
  title: "EV Training Guide | Pokémon Companion",
  description: "How to EV train in every Pokémon generation, from Gen 3 to Scarlet/Violet.",
};

const SECTIONS: {
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
        title: "Power items",
        detail:
          "Power Bracer, Belt, Lens, Band, Anklet, and Weight each add +4 EVs in their stat per battle. Stack with Pokérus (doubles all EV gains) for +10 per KO.",
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
        title: "Let's Go auto-battles",
        detail:
          "Send your lead Pokémon out with R to auto-battle outbreaks of the species that gives the EVs you want. Power items still work.",
      },
    ],
  },
];

const QUICK_TIPS = [
  "A Pokémon can have max 510 EVs total, with max 252 in any single stat.",
  "The classic competitive spread is 252/252/4 — two maxed stats and 4 in a third.",
  "Use mints (see Items → Mints) to fix the nature after EV training — nature and EVs are independent.",
  "Pokérus doubles all EV gains and is the single biggest speedup in Gens 3–7.",
  "In Scarlet/Violet, you can check EVs on the stat screen (press L) — yellow = trained.",
];

export default function EVTrainingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/guides"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All guides
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Training guide
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        EV Training by Generation
      </h1>
      <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
        Effort Values are the hidden stats behind competitive Pokémon. Here&apos;s how to train
        them in every era.
      </p>

      <div className="mt-8 space-y-4">
        {SECTIONS.map((s) => (
          <details key={s.gen} className="rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold text-slate-900 marker:hidden dark:text-slate-100 [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
              {s.gen}
              <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {s.games}
              </span>
            </summary>
            <ul className="space-y-4 px-6 pb-6">
              {s.methods.map((m) => (
                <li key={m.title}>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{m.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{m.detail}</p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <section className="mt-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quick tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {QUICK_TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/items" className="font-semibold text-emerald-600 underline underline-offset-2 dark:text-emerald-400">
            Browse mints in the Items database →
          </Link>
        </p>
      </section>
    </div>
  );
}
