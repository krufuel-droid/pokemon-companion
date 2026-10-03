import Link from "next/link";

const TOOLS = [
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
  {
    href: "/tools/shiny-odds",
    title: "Shiny Odds Calculator",
    desc: "Combine a Pokémon's spawn rate with your hunting method for the true shiny odds per encounter.",
  },
];

export default function ToolsIndex() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Battle &amp; Breeding Tools</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Quick calculators for the games — no account needed.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
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
        ))}
      </div>
    </div>
  );
}
