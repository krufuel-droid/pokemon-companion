import Link from "next/link";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";

const FEATURES = [
  {
    title: "Pokédex",
    description:
      "Browse all 1,025 species with search, filters, and shiny sprites.",
    href: "/pokedex",
    emoji: "📖",
  },
  {
    title: "Community",
    description:
      "Post, react, add friends, and trade DMs with fellow trainers.",
    href: "/community",
    emoji: "💬",
  },
  {
    title: "Damage Calculator",
    description:
      "Crunch the numbers before your next big battle.",
    href: "/tools",
    emoji: "⚔️",
  },
  {
    title: "Catch-Rate Calculator",
    description:
      "Know your odds before you throw that Ultra Ball.",
    href: "/tools",
    emoji: "🎯",
  },
  {
    title: "Breeding Helper",
    description:
      "Plan egg moves, natures, and perfect IVs like a pro.",
    href: "/tools",
    emoji: "🥚",
  },
  {
    title: "Items",
    description:
      "Mega Stones, evolution stones, and the Pokémon they work on.",
    href: "/items",
    emoji: "💎",
  },
  {
    title: "News",
    description:
      "Champions rotations, new game announcements, and app updates.",
    href: "/news",
    emoji: "📰",
  },
] as const;

const COMING_SOON = ["Shiny-hunt trackers"] as const;

export default function HomePage() {
  return (
    <div>
      <AuthDebugPanel />
      {/* Hero */}
      <section className="bg-gradient-to-b from-emerald-100 to-white dark:from-emerald-950 dark:to-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-100">
            Your Pokémon journey, all in one place
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Explore a full Pokédex, sharpen your strategy with battle tools,
            look up items, catch up on the latest news, and connect with a
            trainer community.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pokedex"
              className="rounded-full bg-mint px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
            >
              Explore the Pokédex
            </Link>
            <Link
              href="/tools"
              className="rounded-full border-2 border-emerald-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-emerald-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-emerald-950"
            >
              Try the tools
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">What&apos;s inside</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
            >
              <div className="text-3xl" aria-hidden="true">
                {feature.emoji}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Coming soon strip */}
      <section className="border-t border-stone-200 bg-stone-100/60 dark:border-slate-700 dark:bg-slate-800/60">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Coming soon</h2>
            <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              Up next
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMING_SOON.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-6 text-slate-400 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-500"
              >
                <p className="font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
