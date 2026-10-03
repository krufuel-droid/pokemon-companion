"use client";

import { useState } from "react";
import {
  getBonusBattleForChallenge,
  getLeagueForGame,
} from "@/lib/data/elite-four-teams";
import { useAuth } from "@/components/AuthProvider";
import { TeamMemberRow, CounterPickRow, fireScoutAchievement } from "@/components/GymTeamPanel";

/**
 * Collapsible Pokémon League team viewer for battle prep.
 * Renders nothing unless `kind` is "elite" or "champion" and the game has
 * league data. Collapsed by default; sprites link to Pokédex pages.
 *
 * Shares the "scout" achievement session guard with GymTeamPanel.
 */

const panelButtonClass =
  "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:ring-slate-600";

const panelBoxClass =
  "mt-2 rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700";

function MemberHeader({ name, tag }: { name: string; tag: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
        {name}
      </span>
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
        {tag}
      </span>
    </div>
  );
}

export default function EliteFourPanel({
  game,
  kind,
  challengeName,
}: {
  /** Exact game title from POKEMON_GAMES. */
  game: string;
  /** Guide path / tracker challenge kind. */
  kind: string;
  /** Challenge name — used to match bonus super-bosses (e.g. Red). */
  challengeName?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (kind !== "elite" && kind !== "champion") return null;
  const league = getLeagueForGame(game);
  if (!league) return null;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && user) fireScoutAchievement(user.id);
  };

  /* ---------------- Champion (or bonus super-boss) ---------------- */
  if (kind === "champion") {
    const bonus =
      (challengeName && getBonusBattleForChallenge(game, challengeName)) ??
      null;
    const name = bonus ? bonus.heading : league.champion.title
      ? `${league.champion.name} — ${league.champion.title}`
      : league.champion.name;
    const team = bonus ? bonus.team : league.champion.team;
    const note = bonus ? bonus.note : league.champion.note;
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={panelButtonClass}
        >
          <span aria-hidden>🔍</span>
          {open ? "Hide team" : `View ${bonus ? bonus.name : league.champion.name}'s team`}
          <span aria-hidden className="text-slate-400 dark:text-slate-500">
            {open ? "▾" : "▸"}
          </span>
        </button>
        {open && (
          <div className={panelBoxClass}>
            <MemberHeader name={name} tag="Champion" />
            {(bonus ? bonus.counterPick : league.champion.counterPick) && (
              <CounterPickRow
                pick={(bonus ? bonus.counterPick : league.champion.counterPick)!}
              />
            )}
            <ul className="space-y-2">
              {team.map((member, i) => (
                <TeamMemberRow
                  key={`${member.species}-${member.level}-${i}`}
                  member={member}
                />
              ))}
            </ul>
            {note && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {note}
              </p>
            )}
            {league.altChampion && !bonus && (
              <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
                <MemberHeader
                  name={league.altChampion.name}
                  tag={league.altChampion.title ?? "Champion"}
                />
                {league.altChampion.counterPick && (
                  <CounterPickRow pick={league.altChampion.counterPick} />
                )}
                <ul className="space-y-2">
                  {league.altChampion.team.map((member, i) => (
                    <TeamMemberRow
                      key={`${member.species}-${member.level}-${i}`}
                      member={member}
                    />
                  ))}
                </ul>
                {league.altChampion.note && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {league.altChampion.note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- Elite Four ---------------- */
  const label = league.eliteFour.length > 0 ? "Elite Four" : "League";
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={panelButtonClass}
      >
        <span aria-hidden>🔍</span>
        {open ? "Hide teams" : `View ${label} teams`}
        <span aria-hidden className="text-slate-400 dark:text-slate-500">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className={panelBoxClass}>
          {league.eliteFour.length === 0 ? (
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {league.note ??
                "This region has no traditional Elite Four."}
            </p>
          ) : (
            <div className="space-y-4">
              {league.eliteFour.map((member) => (
                <div key={member.name}>
                  <MemberHeader name={member.name} tag={member.specialty} />
                  {member.counterPick && (
                    <CounterPickRow pick={member.counterPick} />
                  )}
                  <ul className="space-y-2">
                    {member.team.map((m, i) => (
                      <TeamMemberRow
                        key={`${m.species}-${m.level}-${i}`}
                        member={m}
                      />
                    ))}
                  </ul>
                  {member.note && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {member.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {league.bonusBattles && league.bonusBattles.length > 0 && (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-3 dark:border-slate-700">
              {league.bonusBattles.map((b) => (
                <div key={b.name}>
                  <MemberHeader name={b.heading} tag="Bonus battle" />
                  {b.counterPick && <CounterPickRow pick={b.counterPick} />}
                  <ul className="space-y-2">
                    {b.team.map((m, i) => (
                      <TeamMemberRow
                        key={`${m.species}-${m.level}-${i}`}
                        member={m}
                      />
                    ))}
                  </ul>
                  {b.note && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {b.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {league.note && league.eliteFour.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {league.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
