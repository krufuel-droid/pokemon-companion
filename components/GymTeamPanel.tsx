"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { unlockAchievement } from "@/lib/achievements";
import {
  getGymTeamForChallenge,
  gymMemberSprite,
  type GymTeamMember,
} from "@/lib/data/gym-teams";

/**
 * Collapsible gym leader / trial captain team viewer for battle prep.
 * Collapsed by default; expands to show sprites (linked to Pokédex pages),
 * levels, key moves, and ability/item badges.
 *
 * Fires the "scout" achievement the first time a signed-in user expands a
 * team each session (guarded — never breaks the UI).
 */

const SCOUT_FIRED_KEY = "gym-team-scout-fired";

function fireScoutAchievement(userId: string) {
  try {
    if (typeof window === "undefined" || !userId) return;
    if (window.sessionStorage.getItem(SCOUT_FIRED_KEY)) return;
    window.sessionStorage.setItem(SCOUT_FIRED_KEY, "1");
    void unlockAchievement(userId, "scout").catch(() => {});
  } catch {
    /* achievement must never break the UI */
  }
}

function TeamMemberRow({ member }: { member: GymTeamMember }) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200/70 dark:bg-slate-800/60 dark:ring-slate-700/70">
      <Link
        href={`/pokedex/${member.id}`}
        className="shrink-0 rounded-lg transition hover:ring-2 hover:ring-emerald-400"
        title={`View ${member.species} in the Pokédex`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gymMemberSprite(member)}
          alt={member.species}
          width={56}
          height={56}
          loading="lazy"
          className="h-14 w-14 object-contain"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <Link
            href={`/pokedex/${member.id}`}
            className="font-semibold text-emerald-700 hover:text-emerald-600 hover:underline dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            {member.species}
          </Link>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Lv. {member.level}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {member.moves.join(" · ")}
        </p>
        {(member.ability || member.item) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {member.ability && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
                {member.ability}
              </span>
            )}
            {member.item && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                🎒 {member.item}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function GymTeamPanel({
  game,
  challengeName,
}: {
  /** Exact game title from POKEMON_GAMES. */
  game: string;
  /** Guide path / tracker challenge name, e.g. "Cortondo Gym". */
  challengeName: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const team = getGymTeamForChallenge(game, challengeName);
  if (!team) return null;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && user) fireScoutAchievement(user.id);
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 hover:ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:ring-slate-600"
      >
        <span aria-hidden>🔍</span>
        {open ? "Hide team" : `View ${team.leader}'s team`}
        <span aria-hidden className="text-slate-400 dark:text-slate-500">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {team.leader}
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              {team.specialty}
            </span>
            {team.badge !== "—" && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                🏅 {team.badge}
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {team.team.map((member, i) => (
              <TeamMemberRow
                key={`${member.species}-${member.level}-${i}`}
                member={member}
              />
            ))}
          </ul>
          {team.note && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {team.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
