import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, type GuideMilestone } from "@/lib/data/guides";
import GuideCaughtChecklist from "@/components/GuideCaughtChecklist";
import GymTeamPanel from "@/components/GymTeamPanel";
import EliteFourPanel from "@/components/EliteFourPanel";

/** Guide pages are server-rendered on demand (not pre-built) to keep deployments lean. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  return {
    title: guide ? `${guide.title} Playthrough Guide | Poké Companion` : "Guide | Poké Companion",
    description: guide?.tagline ?? "Playthrough guide.",
  };
}

const KIND_STYLES: Record<GuideMilestone["kind"], string> = {
  gym: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  titan: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  base: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  story: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  elite: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  champion: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const KIND_LABELS: Record<GuideMilestone["kind"], string> = {
  gym: "Gym",
  trial: "Trial",
  titan: "Titan",
  base: "Team Star",
  story: "Story",
  elite: "Elite Four",
  champion: "Champion",
  other: "Milestone",
};

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/guides"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All guides
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        {guide.generation}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        {guide.title}
      </h1>
      <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
        {guide.tagline}
      </p>

      {/* The Path */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          The Path
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The intended order — follow this and you&apos;ll stay at the right
          level all game.
        </p>
        <ol className="mt-6 space-y-0">
          {guide.path.map((m, i) => (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              {i < guide.path.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[19px] top-10 h-[calc(100%-2rem)] w-0.5 bg-slate-200 dark:bg-slate-700"
                />
              )}
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                {i + 1}
              </span>
              <div className="flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {m.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_STYLES[m.kind]}`}
                  >
                    {KIND_LABELS[m.kind]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {m.detail}
                </p>
                <GymTeamPanel game={guide.title} challengeName={m.name} />
                <EliteFourPanel game={guide.title} kind={m.kind} challengeName={m.name} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Story */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          The Story
        </h2>
        <div className="mt-4 space-y-4">
          {guide.story.map((para, i) => (
            <p key={i} className="leading-7 text-slate-600 dark:text-slate-300">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Good to Know
        </h2>
        <ul className="mt-4 space-y-3">
          {guide.tips.map((tip, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <span aria-hidden className="text-emerald-500">
                ✓
              </span>
              <span className="text-slate-600 dark:text-slate-300">{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Post-game */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          After the Credits
        </h2>
        <ul className="mt-4 space-y-3">
          {guide.postgame.map((item, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <span aria-hidden className="text-amber-500">
                ★
              </span>
              <span className="text-slate-600 dark:text-slate-300">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <GuideCaughtChecklist slug={slug} />

      <p className="mt-12 rounded-2xl bg-slate-100 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        Want the full step-by-step walkthrough? This page is the roadmap —
        for turn-by-turn directions,{" "}
        <a
          href="https://bulbapedia.bulbagarden.net/wiki/Main_Page"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Bulbapedia
        </a>{" "}
        and{" "}
        <a
          href="https://www.serebii.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Serebii
        </a>{" "}
        both have detailed per-route guides.
      </p>
    </div>
  );
}
