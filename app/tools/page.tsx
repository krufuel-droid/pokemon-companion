import Link from "next/link";

interface Tool {
  href: string;
  title: string;
  desc: string;
}

const CALCULATORS: Tool[] = [
  {
    href: "/tools/damage-calc",
    title: "Damage Calculator",
    desc: "Pick real attacker and defender Pokémon — stats, typing, and STAB auto-fill. 16-roll min/max damage with KO odds.",
  },
  {
    href: "/tools/damage-calculator",
    title: "Advanced Damage Calc",
    desc: "Manual-entry damage calc with crits, burn, weather, and full stat overrides.",
  },
  {
    href: "/tools/catch-rate",
    title: "Catch Rate Calculator",
    desc: "Gen V+ capture odds from HP, base catch rate, ball choice, and status condition.",
  },
  {
    href: "/tools/shiny-odds",
    title: "Shiny Odds Calculator",
    desc: "Combine a Pokémon's spawn rate with your hunting method for the true shiny odds per encounter.",
  },
];

const TEAM_TOOLS: Tool[] = [
  {
    href: "/tools/team-weakness",
    title: "Team Weakness Analyzer",
    desc: "Add up to 6 Pokémon and spot shared weaknesses, immunities, and STAB coverage gaps.",
  },
  {
    href: "/tools/coverage",
    title: "Coverage Analyzer",
    desc: "Give up to 6 Pokémon their moves and see which of the 18 types your team can hit super-effectively.",
  },
  {
    href: "/tools/team-coverage",
    title: "Team Coverage Checker",
    desc: "Pick 6 Pokémon — 4x/2x defensive breakdowns per attacking type, plus which types your STABs can't touch.",
  },
  {
    href: "/tools/counter-finder",
    title: "Counter Finder",
    desc: "Pick a meta threat (forms included) and get ranked type-based answers — who resists it and hits back super-effectively.",
  },
  {
    href: "/tools/meta-matchups",
    title: "Meta Matchup Matrix",
    desc: "The 12 most-used Regulation M-C Pokémon in a 12×12 grid — who holds the type edge, cell by cell.",
  },
  {
    href: "/tools/complete-my-core",
    title: "Complete My Core",
    desc: "Give it 2–4 Pokémon you love — it finds your defensive holes and coverage gaps, then ranks partners that patch both.",
  },
  {
    href: "/tools/lead-matchups",
    title: "Lead Matchup Advisor",
    desc: "Your 2 leads vs their 2 leads — type verdicts for every pairing, speed notes, and which lead to open with.",
  },
  {
    href: "/tools/ev-optimizer",
    title: "EV Survival Optimizer",
    desc: "How much bulk to survive that hit? Searches every HP/Def EV split for the cheapest spread that lives — 1 hit and 2 hits.",
  },
  {
    href: "/tools/speed-tiers",
    title: "Speed Tiers",
    desc: "Who outspeeds whom — the 12 meta staples sorted by real Speed stats, with Scarf, Tailwind, paralysis, and Swift Swim toggles.",
  },
  {
    href: "/tools/tera-advisor",
    title: "Tera Type Advisor",
    desc: "Which Tera type for your Pokémon? All 19 ranked by weaknesses removed, resists gained, and STAB — with the full type-chart breakdown.",
  },
  {
    href: "/tools/move-coverage",
    title: "Move Coverage Ranker",
    desc: "Every damaging move your Pokémon learns, ranked by super-effective coverage against the 12 meta staples — plus the best 4-move combo.",
  },
  {
    href: "/tools/breeding",
    title: "Breeding Compatibility",
    desc: "Check whether two Pokémon can breed by egg group — and see the egg moves their offspring could inherit.",
  },
  {
    href: "/tools/randomizer",
    title: "Team Randomizer",
    desc: "Pick a game and get a balanced team of early-route Pokémon for your next playthrough — viable picks spread across types.",
  },
  {
    href: "/tools/gym-run",
    title: "Gym Run Tracker",
    desc: "Pick a game and log its gyms, trials, and titans in order — your team, results, and notes, with a progress bar toward your next achievement.",
  },
  {
    href: "/tools/team-builder",
    title: "Team Builder",
    desc: "Draft a 6-Pokémon team, check defensive weaknesses and offensive coverage, save teams, and share them with a link.",
  },
  {
    href: "/tools/nuzlocke-encounters",
    title: "Nuzlocke Encounters",
    desc: "Pick a game and location to see every wild encounter — levels, rates, and conditions — for planning that first-encounter-per-area catch.",
  },
];

const REFERENCE: Tool[] = [
  {
    href: "/tools/type-chart",
    title: "Type Chart",
    desc: "Every type matchup in the game — quick lookup for any attack vs. defense, plus the full 18×18 grid.",
  },
  {
    href: "/tools/sandwiches",
    title: "Sandwich Guide",
    desc: "Every sandwich recipe sorted by what it does — shiny hunting, breeding, raids, and more.",
  },
  {
    href: "/tools/sandwich-builder",
    title: "Sandwich Builder",
    desc: "Build a custom Scarlet/Violet sandwich from real ingredients, preview its exact meal powers, and save your favorites.",
  },
  {
    href: "/tools/mystery-gifts",
    title: "Mystery Gift Tracker",
    desc: "Active Mystery Gift codes and distributions for Z-A and Scarlet/Violet — tap a code to copy it.",
  },
  {
    href: "/tools/raid-counters",
    title: "Tera Raid Counters",
    desc: "Best builds for the current 7-star raid events, plus raid fundamentals.",
  },
  {
    href: "/events",
    title: "Events Calendar",
    desc: "Tera raids, Mystery Gifts, distributions, and tournaments on a real calendar — with end dates so nothing slips by.",
  },
];

const FUN: Tool[] = [
  {
    href: "/tools/quiz",
    title: "Who's That Pokémon?",
    desc: "Name the silhouette — build your streak and earn quiz achievements.",
  },
  {
    href: "/tools/cry-quiz",
    title: "Cry Quiz",
    desc: "Hear a cry and name that Pokémon — the audio sequel to Who's That Pokémon?",
  },
];

const TRACKERS: Tool[] = [
  {
    href: "/tools/marks",
    title: "Mark Tracker",
    desc: "Check off all 50 obtainable marks in Scarlet & Violet — wild, weather, time-of-day, and special marks.",
  },
  {
    href: "/tools/tcg-collection",
    title: "TCG Collection Tracker",
    desc: "Search every Pokémon TCG card, track your collection and want list by set, and watch sets fill up.",
  },
  {
    href: "/tools/deck-builder",
    title: "TCG Deck Builder",
    desc: "Build 60-card decks with format legality checks, cross-reference your collection, export lists, and share them.",
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      key={tool.href}
      href={tool.href}
      className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
    >
      <h2 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
        {tool.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{tool.desc}</p>
      <span className="mt-4 inline-block rounded-full bg-emerald-300/40 px-3 py-1 text-xs font-semibold text-slate-700 group-hover:bg-emerald-300 dark:bg-emerald-600/40 dark:text-slate-300 dark:group-hover:bg-emerald-600">
        Open tool →
      </span>
    </Link>
  );
}

function ToolDropdown({ title, tools, defaultOpen = false }: { title: string; tools: Tool[]; defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen || undefined}
      className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
        {title}
        <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
          {tools.length} {tools.length === 1 ? "tool" : "tools"}
        </span>
      </summary>
      <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} tool={tool} />
        ))}
      </div>
    </details>
  );
}

export default function ToolsIndex() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Battle &amp; Breeding Tools</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Quick calculators for the games — no account needed.
      </p>
      <div className="mt-8 space-y-4">
        <ToolDropdown title="Calculators" tools={CALCULATORS} defaultOpen />
        <ToolDropdown title="Team Tools" tools={TEAM_TOOLS} />
        <ToolDropdown title="Reference" tools={REFERENCE} />
        <ToolDropdown title="Trackers" tools={TRACKERS} />
        <ToolDropdown title="Fun" tools={FUN} />
      </div>
    </div>
  );
}
