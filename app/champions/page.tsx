import type { Metadata } from "next";
import Link from "next/link";
import {
  SNAPSHOT_DATE,
  REGULATION,
  META_PICKS,
  META_SOURCE,
  SINGLES_PICKS,
  HONORABLE_MENTIONS,
  TOP_ITEMS,
  FEATURED_TEAMS,
  PLAYERS_TO_WATCH,
  PLAYER_RANKINGS_SOURCE,
  UPCOMING_TOURNAMENTS,
  EVENT_FINDER_URL,
  FOLLOW_THE_SCENE,
  TOURNAMENT_RESULTS,
  getSpeciesCard,
  playerAnchor,
  hasPlayerProfile,
  type SocialLinks,
  type TeamMon,
} from "@/lib/data/champions";
import { PickemPicker, PickemLeaderboard } from "./pickem";

export const metadata: Metadata = {
  title: "Champions Hub — Poké Companion",
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
      <span className="text-sm font-bold text-slate-900 group-hover:underline dark:text-slate-100">
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
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
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

function TeamGrid({ team }: { team: TeamMon[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((mon) => (
        <div
          key={mon.name}
          className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-800"
        >
          <MonLink mon={mon} />
          <dl className="mt-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            {mon.ability && (
              <div className="flex gap-1">
                <dt className="font-semibold text-slate-400 dark:text-slate-500">
                  Ability:
                </dt>
                <dd>{mon.ability}</dd>
              </div>
            )}
            {mon.item && (
              <div className="flex gap-1">
                <dt className="font-semibold text-slate-400 dark:text-slate-500">
                  Item:
                </dt>
                <dd>{mon.item}</dd>
              </div>
            )}
            {mon.nature && (
              <div className="flex gap-1">
                <dt className="font-semibold text-slate-400 dark:text-slate-500">
                  Nature:
                </dt>
                <dd>{mon.nature}</dd>
              </div>
            )}
            {mon.evs && (
              <div className="flex gap-1">
                <dt className="font-semibold text-slate-400 dark:text-slate-500">
                  EVs:
                </dt>
                <dd className="font-mono">{mon.evs}</dd>
              </div>
            )}
          </dl>
          {mon.moves && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {mon.moves.join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ChampionsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Pokémon Champions Hub
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
          The current competitive meta, the teams actually winning tournaments,
          and the players shaping the format — so you can steal their ideas and
          cheer them on.
        </p>

        {/* Regulation banner */}
        <section className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide dark:bg-slate-900/20">
              Current regulation
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold dark:bg-slate-900/20">
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

        {/* Recent results */}
        <section className="mt-10 scroll-mt-20" id="recent-results">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Recent results
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Who won the last stops — updated automatically after each event.
          </p>
          <div className="mt-4 space-y-3">
            {TOURNAMENT_RESULTS.map((r) => {
              const team = r.team;
              return (
                <details
                  key={r.name}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <summary className="cursor-pointer list-none p-4 marker:hidden [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        🏆 {r.winner}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{r.name}</span>
                      <span className="text-xs text-slate-400">{r.dates} · {r.kind}</span>
                      {team && (
                        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                          <path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {r.winningTeam && (
                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                        Winning core: <span className="font-semibold text-slate-700 dark:text-slate-200">{r.winningTeam}</span>
                      </p>
                    )}
                    {r.runnerUp && (
                      <p className="mt-0.5 text-xs text-slate-400">Runner-up: {r.runnerUp}</p>
                    )}
                  </summary>
                  {team && (
                    <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                      <TeamGrid team={team} />
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </section>

        {/* Current meta */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            The current meta
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Doubles is Champions&apos; main competitive format. Usage
            percentages come from{" "}
            <a
              href={META_SOURCE.url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
            >
              {META_SOURCE.label} ↗
            </a>
            . Tap any Pokémon to open its Pokédex page.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {META_PICKS.map((pick) => {
              const card = getSpeciesCard(pick.speciesName ?? pick.name);
              const usage = pick.note.match(/(\d+(?:\.\d+)?)%/)?.[1];
              return (
                <details
                  key={pick.name}
                  className="group rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                      {card && (
                        <img
                          src={card.sprite}
                          alt={card.name}
                          className="h-10 w-10 object-contain"
                          loading="lazy"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {pick.name}
                        </span>
                        {usage && (
                          <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {usage}% usage
                          </span>
                        )}
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 border-t border-slate-100 pt-2 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                    {pick.note}{" "}
                    {card && (
                      <Link
                        href={`/pokedex/${card.id}`}
                        className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                      >
                        Pokédex ↗
                      </Link>
                    )}
                  </p>
                </details>
              );
            })}
          </div>
          <p className="mt-4 text-sm italic text-slate-500 dark:text-slate-400">
            {HONORABLE_MENTIONS}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Singles ladder staples
              </h3>
              <ul className="mt-3 space-y-2">
                {SINGLES_PICKS.map((pick) => {
                  const card = getSpeciesCard(pick.name);
                  return (
                    <li key={pick.name} className="text-sm">
                      <Link
                        href={card ? `/pokedex/${card.id}` : "#"}
                        className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
                      >
                        {pick.name}
                      </Link>
                      <span className="text-slate-500 dark:text-slate-400"> — {pick.note}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Most-held items
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOP_ITEMS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Winning teams
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            The actual six that lifted trophies — with items, natures, and
            movesets where tournament coverage published them.
          </p>
          <div className="mt-4 space-y-3">
            {FEATURED_TEAMS.map((team) => (
              <details
                key={`${team.event}-${team.player}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <summary className="cursor-pointer list-none px-6 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                      {team.placement}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {team.event}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">
                        {team.player} · {team.date}
                      </span>
                    </span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    >
                      <path
                        d="M5 7l5 5 5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </summary>
                <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {team.headline}
                  </p>
                </div>
                <div className="p-6">
                  <TeamGrid team={team.team} />
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                  {team.replicaCode && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-400 dark:text-slate-500">
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
                    className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                  >
                    Source: {team.source.label} ↗
                  </a>
                </div>
                {team.footnote && (
                  <p className="border-t border-slate-100 bg-amber-50/60 px-6 py-3 text-xs leading-relaxed text-amber-900 dark:border-slate-800 dark:bg-amber-950/60 dark:text-amber-100">
                    {team.footnote}
                  </p>
                )}
              </details>
            ))}
          </div>
        </section>

        {/* Upcoming tournaments */}
        <section className="mt-10 scroll-mt-20" id="tournaments">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Upcoming tournaments
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            The next stops on the Championship Series — tap one for players to
            watch and storylines. For the full schedule, check the{" "}
            <a
              href={EVENT_FINDER_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
            >
              official event finder ↗
            </a>
            .
          </p>
          <div className="mt-4 space-y-3">
            {UPCOMING_TOURNAMENTS.map((tourney) => {
              const anchor = tourney.id;
              const hasPreview = (tourney.playersToWatch?.length ?? 0) > 0 || (tourney.storylines?.length ?? 0) > 0;
              return (
                <details
                  key={tourney.name}
                  id={anchor}
                  className="scroll-mt-36 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 open:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:open:ring-emerald-700"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="w-28 shrink-0 rounded-full bg-mint px-2.5 py-1 text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                      {tourney.dates}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tourney.name}
                    </span>
                    <span className="hidden shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200 sm:inline dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-800">
                      {tourney.kind}
                    </span>
                    <span aria-hidden className="shrink-0 text-slate-400">▸</span>
                  </summary>
                  <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
                    {tourney.playersToWatch && tourney.playersToWatch.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Players to watch <span className="font-medium normal-case text-slate-400/80">(in form coming in)</span></p>
                        <ul className="mt-1.5 space-y-1">
                          {tourney.playersToWatch.map((p) => (
                            <li key={p.name} className="text-sm text-slate-600 dark:text-slate-300">
                              ⭐{" "}
                              {hasPlayerProfile(p.name) ? (
                                <a
                                  href={`/champions#${playerAnchor(p.name)}`}
                                  className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                                >
                                  {p.name}
                                </a>
                              ) : (
                                <span className="font-semibold">{p.name}</span>
                              )}{" "}
                              — {p.note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tourney.storylines && tourney.storylines.length > 0 && (
                      <div className={tourney.playersToWatch?.length ? "mt-3" : ""}>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Storylines</p>
                        <ul className="mt-1.5 space-y-1">
                          {tourney.storylines.map((s) => (
                            <li key={s} className="text-sm leading-6 text-slate-600 dark:text-slate-300">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tourney.broadcast && (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        📺 <span className="font-semibold">Watch:</span> {tourney.broadcast}
                      </p>
                    )}
                    {!hasPreview && (
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        Full preview with players to watch coming as the event approaches.
                      </p>
                    )}
                    <PickemPicker tourney={tourney} />
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <PickemLeaderboard />

        {/* Players to watch */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Players to watch
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            The gamers behind the teams — follow and support them. Rankings
            from{" "}
            <a
              href={PLAYER_RANKINGS_SOURCE.url}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
            >
              {PLAYER_RANKINGS_SOURCE.label} ↗
            </a>
            ; only publicly listed accounts are linked, no private profiles.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PLAYERS_TO_WATCH.map((player) => (
              <div
                key={player.name}
                id={playerAnchor(player.name)}
                className="scroll-mt-36 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {player.name}
                </h3>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  {player.tagline}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {player.bio}
                </p>
                {player.socials && <SocialPills socials={player.socials} />}
              </div>
            ))}
          </div>
        </section>

        {/* Follow the scene */}
        <section className="mt-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Follow the scene
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FOLLOW_THE_SCENE.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:ring-slate-700"
              >
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {link.label}{" "}
                  <span className="font-semibold text-slate-400 dark:text-slate-500">
                    {link.handle}
                  </span>{" "}
                  ↗
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{link.note}</p>
              </a>
            ))}
          </div>
        </section>

        <footer className="mt-10 rounded-2xl bg-slate-100 p-5 text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
          <p>
            This hub is a hand-curated snapshot as of {SNAPSHOT_DATE}. The meta
            moves fast — check the{" "}
            <Link href="/news" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
              News
            </Link>{" "}
            page for the latest regulation changes, and the{" "}
            <Link
              href="/pokedex"
              className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
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
