import Link from "next/link";
import { GUIDES } from "@/lib/data/guides";
import { SECTIONS as EV_SECTIONS, QUICK_TIPS as EV_TIPS } from "@/lib/data/ev-training";
import { NATURES, NATURE_TIPS } from "@/lib/data/natures";
import { SHINY_SECTIONS, SHINY_TIPS } from "@/lib/data/shiny-hunting";
import { IV_SECTIONS, IV_TIPS } from "@/lib/data/iv-training";

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

      <details className="mt-10 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
          <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
          Training
          <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
            EV training by generation
          </span>
        </summary>
        <div className="space-y-4 px-6 pb-6">
          <details className="rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <summary className="cursor-pointer list-none px-5 py-3 text-lg font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
              EV Training by Generation
            </summary>
            <div className="space-y-3 px-5 pb-5">
              {EV_SECTIONS.map((s) => (
                <details key={s.gen} className="rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <summary className="cursor-pointer list-none px-4 py-2.5 font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                    <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
                    {s.gen}
                    <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {s.games}
                    </span>
                  </summary>
                  <ul className="space-y-3 px-4 pb-4">
                    {s.methods.map((m) => (
                      <li key={m.title}>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{m.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{m.detail}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Quick tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                  {EV_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <details className="rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <summary className="cursor-pointer list-none px-5 py-3 text-lg font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
              Nature Chart
              <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                all 25 natures
              </span>
            </summary>
            <div className="px-5 pb-5">
              <div className="overflow-x-auto rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left dark:bg-slate-800">
                      <th className="px-4 py-2 font-semibold text-slate-700 dark:text-slate-200">Nature</th>
                      <th className="px-4 py-2 font-semibold text-emerald-700 dark:text-emerald-300">▲ Raises</th>
                      <th className="px-4 py-2 font-semibold text-rose-700 dark:text-rose-300">▼ Lowers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {NATURES.map((n) => (
                      <tr key={n.name} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="px-4 py-1.5 font-medium text-slate-800 dark:text-slate-200">{n.name}</td>
                        <td className="px-4 py-1.5 text-slate-600 dark:text-slate-400">{n.raises ?? "—"}</td>
                        <td className="px-4 py-1.5 text-slate-600 dark:text-slate-400">{n.lowers ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                {NATURE_TIPS.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </details>

          <details className="rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <summary className="cursor-pointer list-none px-5 py-3 text-lg font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
              Shiny Hunting by Generation
            </summary>
            <div className="space-y-3 px-5 pb-5">
              {SHINY_SECTIONS.map((s) => (
                <details key={s.gen} className="rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <summary className="cursor-pointer list-none px-4 py-2.5 font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                    <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
                    {s.gen}
                    <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {s.games}
                    </span>
                  </summary>
                  <ul className="space-y-3 px-4 pb-4">
                    {s.methods.map((m) => (
                      <li key={m.title}>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{m.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{m.detail}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Quick tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                  {SHINY_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <details className="rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <summary className="cursor-pointer list-none px-5 py-3 text-lg font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
              <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
              IVs & Hyper Training
            </summary>
            <div className="space-y-3 px-5 pb-5">
              {IV_SECTIONS.map((s) => (
                <details key={s.gen} className="rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                  <summary className="cursor-pointer list-none px-4 py-2.5 font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                    <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
                    {s.gen}
                    <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {s.games}
                    </span>
                  </summary>
                  <ul className="space-y-3 px-4 pb-4">
                    {s.methods.map((m) => (
                      <li key={m.title}>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{m.title}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{m.detail}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <div className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Quick tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
                  {IV_TIPS.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </div>
      </details>

      <details className="mt-10 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <summary className="cursor-pointer list-none px-6 py-4 text-xl font-bold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
          <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
          Playthrough Guides
          <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
            {GUIDES.length} games
          </span>
        </summary>
        <div className="space-y-4 px-6 pb-6">
          {byGen.map(({ gen, guides }) => (
            <details key={gen} className="rounded-xl bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <summary className="cursor-pointer list-none px-5 py-3 text-lg font-semibold text-slate-700 marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
                <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">▸</span>
                {gen}
                <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                  {guides.length} {guides.length === 1 ? "guide" : "guides"}
                </span>
              </summary>
              <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="group rounded-2xl bg-white p-6 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
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
        </div>
      </details>

      {GUIDES.length === 0 && (
        <p className="mt-10 text-slate-500 dark:text-slate-400">
          Guides are on the way — check back soon!
        </p>
      )}
    </div>
  );
}
