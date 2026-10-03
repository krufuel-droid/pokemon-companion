import Link from "next/link";
import { SECTIONS, QUICK_TIPS } from "@/lib/data/ev-training";

export const metadata = {
  title: "EV Training Guide | Pokémon Companion",
  description: "How to EV train in every Pokémon generation, from Gen 3 to Scarlet/Violet.",
};

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
