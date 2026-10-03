import Link from "next/link";

interface Tool {
  href: string;
  title: string;
  desc: string;
}

const CALCULATORS: Tool[] = [
  {
    href: "/tools/damage-calculator",
    title: "Damage Calculator",
    desc: "Gen V+ damage formula with 85–100% rolls, STAB, crits, burn, weather, and type effectiveness.",
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
    href: "/tools/team-builder",
    title: "Team Builder",
    desc: "Draft a 6-Pokémon team, check defensive weaknesses and offensive coverage, save teams, and share them with a link.",
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
    href: "/tools/mystery-gifts",
    title: "Mystery Gift Tracker",
    desc: "Active Mystery Gift codes and distributions for Z-A and Scarlet/Violet — tap a code to copy it.",
  },
  {
    href: "/tools/raid-counters",
    title: "Tera Raid Counters",
    desc: "Best builds for the current 7-star raid events, plus raid fundamentals.",
  },
];

const FUN: Tool[] = [
  {
    href: "/tools/quiz",
    title: "Who's That Pokémon?",
    desc: "Name the silhouette — build your streak and earn quiz achievements.",
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
        <ToolDropdown title="Fun" tools={FUN} />
      </div>
    </div>
  );
}
