import type { Metadata } from "next";
import Link from "next/link";
import { NEWS } from "@/lib/data/news";

export const metadata: Metadata = {
  title: "News — Pokémon Companion",
};

const TAG_BADGE: Record<string, string> = {
  Champions: "bg-violet-100 text-violet-800",
  "Gen 10": "bg-sky-100 text-sky-800",
  App: "bg-emerald-100 text-emerald-800",
  Movies: "bg-amber-100 text-amber-800",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Pokémon News
        </h1>
        <p className="mt-2 text-slate-600">
          The latest from the world of Pokémon — Champions rotations, new
          game announcements, and app updates.
        </p>

        <Link
          href="/champions"
          className="mt-6 block rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-violet-200">
            New
          </p>
          <p className="mt-1 text-lg font-extrabold">
            Pokémon Champions Hub →
          </p>
          <p className="mt-1 text-sm text-violet-100">
            The current meta, winning teams from Worlds and Regionals, and the
            players to watch — with links to follow them.
          </p>
        </Link>

        <div className="mt-6 space-y-4">
          {NEWS.map((item) => (
            <article
              key={`${item.date}-${item.title}`}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-center gap-2">
                <time
                  dateTime={item.date}
                  className="text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
                  {formatDate(item.date)}
                </time>
                {item.tag && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TAG_BADGE[item.tag] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {item.tag}
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Source: {item.source.label} ↗
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
