import Link from "next/link";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";
import DailyCatchLogger from "@/components/daily-catch-logger";
import SeasonalSpotlight from "@/components/SeasonalSpotlight";
import StreakWidget from "@/components/StreakWidget";
import { getPokemonOfTheDay } from "@/lib/potd";
import { TYPE_COLORS } from "@/lib/theme";
import { TOURNAMENT_RESULTS } from "@/lib/data/champions";

/** The Pokémon-of-the-Day pick uses `new Date()` at render time, so this
 *  page must not be statically generated — otherwise the pick (and the
 *  seasonal-event check) would freeze at build time instead of changing
 *  at midnight UTC. */
export const dynamic = "force-dynamic";

/** Deterministic daily pick — same Pokémon for everyone, changes at midnight. */
function PokemonOfTheDay() {
  const mon = getPokemonOfTheDay();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        <img
          src={mon.sprites.regular}
          alt={mon.name}
          className="h-32 w-32 object-contain"
          loading="lazy"
        />
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            ⭐ Pokémon of the Day
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {mon.name} <span className="text-base font-medium text-slate-400">#{mon.id}</span>
          </h2>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {mon.types.map((t) => (
              <span
                key={t}
                className="rounded-full px-3 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: TYPE_COLORS[t] ?? "#A8A77A" }}
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link
              href={`/pokedex/${mon.slug}`}
              className="inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Meet {mon.name} →
            </Link>
            <Link
              href="/tools/potd-archive"
              className="inline-block rounded-full border-2 border-emerald-300 px-5 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
            >
              Past picks →
            </Link>
          </div>
          <div>
            <DailyCatchLogger speciesId={mon.id} speciesName={mon.name} potdDate={today} />
          </div>
        </div>
      </div>
    </div>
  );
}

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
  {
    title: "Events",
    description:
      "Tera raids, Mystery Gifts, and tournaments on a real calendar — never miss one.",
    href: "/events",
    emoji: "📅",
  },
] as const;

const COMING_SOON = ["More player profiles & scene coverage"] as const;

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

      {/* Latest tournament result banner */}
      {TOURNAMENT_RESULTS.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <Link
            href="/champions#recent-results"
            className="block rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-4xl" aria-hidden>🏆</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-100">
                  Latest tournament result
                </p>
                <p className="mt-0.5 truncate text-lg font-extrabold">
                  {TOURNAMENT_RESULTS[0].winner} won the {TOURNAMENT_RESULTS[0].name}
                </p>
                {TOURNAMENT_RESULTS[0].winningTeam && (
                  <p className="text-sm text-amber-100">
                    Winning core: {TOURNAMENT_RESULTS[0].winningTeam}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
                All results →
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* Seasonal event spotlight (renders only during an active event) */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <SeasonalSpotlight />
      </section>

      {/* Daily streak + Pokémon of the Day — side by side on desktop, stacked on mobile */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <StreakWidget />
          <PokemonOfTheDay />
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
