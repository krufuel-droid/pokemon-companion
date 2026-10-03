import Link from "next/link";
import { GUIDES } from "@/lib/data/guides";

export const metadata = {
  title: "Playthrough Guides | Pokémon Companion",
  description:
    "The intended path through every mainline Pokémon game — gyms, trials, story beats, and post-game.",
};

const GEN_ORDER = ["Gen IX", "Gen VIII", "Gen VII", "Gen VI", "Gen V", "Gen IV", "Gen III", "Gen II", "Gen I"];

export default function GuidesIndex() {
  const byGen = GEN_ORDER.map((gen) => ({
    gen,
    guides: GUIDES.filter((g) => g.generation === gen),
  })).filter((g) => g.guides.length > 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Playthrough Guides
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        The intended path through each game — the way Nintendo designed it.
        Gyms, trials, story beats, and what to do after the credits.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
          Training
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            href="/guides/ev-training"
            className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
          >
            <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
              EV Training by Generation
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              How to train Effort Values in every era, from Gen 3 to Scarlet/Violet.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400">
              View guide →
            </span>
          </Link>
        </div>
      </section>

      {byGen.map(({ gen, guides }) => (
        <details key={gen} className="mt-4 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
            <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
            {gen}
            <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
              {guides.length} {guides.length === 1 ? "guide" : "guides"}
            </span>
          </summary>
          <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-800 dark:ring-slate-700 dark:hover:ring-emerald-700"
              >
                <h3 className="text-lg font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-slate-100 dark:group-hover:text-emerald-300">
                  {guide.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {guide.tagline}
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  View guide →
                </span>
              </Link>
            ))}
          </div>
        </details>
      ))}

      {GUIDES.length === 0 && (
        <p className="mt-10 text-slate-500 dark:text-slate-400">
          Guides are on the way — check back soon!
        </p>
      )}
    </div>
  );
}
