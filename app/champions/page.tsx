import type { Metadata } from "next";
import Link from "next/link";
import {
  SNAPSHOT_DATE,
  REGULATION,
  META_PICKS,
  SINGLES_PICKS,
  HONORABLE_MENTIONS,
  TOP_ITEMS,
  FEATURED_TEAMS,
  PLAYERS_TO_WATCH,
  FOLLOW_THE_SCENE,
  getSpeciesCard,
  type SocialLinks,
  type TeamMon,
} from "@/lib/data/champions";

export const metadata: Metadata = {
  title: "Champions Hub — Pokémon Companion",
  description:
    "The current Pokémon Champions meta, winning teams from Worlds and Regionals, and the players to watch — with links to follow them.",
};

function MonLink({ mon }: { mon: TeamMon }) {
  const card = getSpeciesCard(mon.name);
  const label = mon.form ?? mon.name;
  if (!card) return <span className="text-sm font-semibold">{label}</span>;
  return (
    <Link
      href={`/pokedex/${card.id}`}
      className="group flex items-center gap-3"
      title={`View ${card.name} in the Pokédex`}
    >
      <img
        src={card.sprite}
        alt={card.name}
        className="h-14 w-14 shrink-0 object-contain transition group-hover:scale-110"
        loading="lazy"
      />
      <span className="text-sm font-bold text-slate-900 group-hover:underline">
        {label}
      </span>
    </Link>
  );
}

function SocialPills({ socials }: { socials: SocialLinks }) {
  const links = [
    socials.x && { label: "X", url: socials.x },
    socials.youtube && { label: "YouTube", url: socials.youtube },
    socials.twitch && { label: "Twitch", url: socials.twitch },
  ].filter(Boolean) as { label: string; url: string }[];
  if (links.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Follow
      </span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700"
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}

export default function ChampionsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Pokémon Champions Hub
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          The current competitive meta, the teams actually winning tournaments,
          and the players shaping the format — so you can steal their ideas and
          cheer them on.
        </p>

        {/* Regulation banner */}
        <section className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Current regulation
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              Meta snapshot: {SNAPSHOT_DATE}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-extrabold">{REGULATION.name}</h2>
          <p className="mt-1 text-sm font-medium text-violet-100">
            {REGULATION.dates} · {REGULATION.detail}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-50">
            {REGULATION.note}
          </p>
        </section>

        {/* Current meta */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            The current meta
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Doubles is Champions&apos; main competitive format. Tap any
            Pokémon to open its Pokédex page.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {META_PICKS.map((pick) => {
              const card = getSpeciesCard(pick.name);
              return (
                <div
                  key={pick.name}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-center gap-3">
                    {card && (
                      <img
                        src={card.sprite}
                        alt={card.name}
                        className="h-12 w-12 object-contain"
                        loading="lazy"
                      />
                    )}
                    <Link
                      href={card ? `/pokedex/${card.id}` : "#"}
                      className="text-base font-bold text-slate-900 hover:underline"
                    >
                      {pick.name}
                    </Link>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {pick.note}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm italic text-slate-500">
            {HONORABLE_MENTIONS}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Singles ladder staples
              </h3>
              <ul className="mt-3 space-y-2">
                {SINGLES_PICKS.map((pick) => {
                  const card = getSpeciesCard(pick.name);
                  return (
                    <li key={pick.name} className="text-sm">
                      <Link
                        href={card ? `/pokedex/${card.id}` : "#"}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {pick.name}
                      </Link>
                      <span className="text-slate-500"> — {pick.note}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Most-held items
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOP_ITEMS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                The format&apos;s default toolkit: Focus Sash and Sitrus Berry
                keep attackers alive, Life Orb and Choice Scarf turn them into
                sweepers, and Light Clay stretches screens across doubles
                slugfests.
              </p>
            </div>
          </div>
        </section>

        {/* Featured winning teams */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Winning teams
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The actual six that lifted trophies — with items, natures, and
            movesets where tournament coverage published them.
          </p>
          <div className="mt-4 space-y-6">
            {FEATURED_TEAMS.map((team) => (
              <article
                key={`${team.event}-${team.player}`}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-slate-900">
                      {team.placement}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {team.date}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-extrabold text-slate-900">
                    {team.event}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600">
                    {team.player}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {team.headline}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
                  {team.team.map((mon) => (
                    <div
                      key={mon.name}
                      className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100"
                    >
                      <MonLink mon={mon} />
                      <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
                        {mon.ability && (
                          <div className="flex gap-1">
                            <dt className="font-semibold text-slate-400">
                              Ability:
                            </dt>
                            <dd>{mon.ability}</dd>
                          </div>
                        )}
                        {mon.item && (
                          <div className="flex gap-1">
                            <dt className="font-semibold text-slate-400">
                              Item:
                            </dt>
                            <dd>{mon.item}</dd>
                          </div>
                        )}
                        {mon.nature && (
                          <div className="flex gap-1">
                            <dt className="font-semibold text-slate-400">
                              Nature:
                            </dt>
                            <dd>{mon.nature}</dd>
                          </div>
                        )}
                      </dl>
                      {mon.moves && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          {mon.moves.join(" · ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 px-6 py-4">
                  {team.replicaCode && (
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-400">
                        Replica code:{" "}
                      </span>
                      <code className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                        {team.replicaCode}
                      </code>
                    </p>
                  )}
                  <a
                    href={team.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    Source: {team.source.label} ↗
                  </a>
                </div>
                {team.footnote && (
                  <p className="border-t border-slate-100 bg-amber-50/60 px-6 py-3 text-xs leading-relaxed text-amber-900">
                    {team.footnote}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Players to watch */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Players to watch
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The gamers behind the teams — follow and support them. Only
            publicly listed accounts are linked; no private profiles.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PLAYERS_TO_WATCH.map((player) => (
              <div
                key={player.name}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                <h3 className="text-base font-extrabold text-slate-900">
                  {player.name}
                </h3>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-indigo-600">
                  {player.tagline}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {player.bio}
                </p>
                {player.socials && <SocialPills socials={player.socials} />}
              </div>
            ))}
          </div>
        </section>

        {/* Follow the scene */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Follow the scene
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FOLLOW_THE_SCENE.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-base font-extrabold text-slate-900">
                  {link.label}{" "}
                  <span className="font-semibold text-slate-400">
                    {link.handle}
                  </span>{" "}
                  ↗
                </p>
                <p className="mt-1 text-sm text-slate-600">{link.note}</p>
              </a>
            ))}
          </div>
        </section>

        <footer className="mt-10 rounded-2xl bg-slate-100 p-5 text-sm text-slate-500 ring-1 ring-slate-200">
          <p>
            This hub is a hand-curated snapshot as of {SNAPSHOT_DATE}. The meta
            moves fast — check the{" "}
            <Link href="/news" className="font-semibold text-indigo-700 hover:underline">
              News
            </Link>{" "}
            page for the latest regulation changes, and the{" "}
            <Link
              href="/pokedex"
              className="font-semibold text-indigo-700 hover:underline"
            >
              Pokédex
            </Link>{" "}
            for every species&apos; stats and matchups.
          </p>
        </footer>
      </div>
    </main>
  );
}
