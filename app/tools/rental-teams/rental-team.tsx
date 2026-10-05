"use client";

import { useState } from "react";
import Link from "next/link";
import { decodeSharedTeam } from "@/lib/rental-teams";
import { lookupSpecies, type TeamMember } from "../team-builder/team-builder";
import type { SpeciesIndex } from "@/lib/pokedex";
import { TypePills } from "@/app/pokedex/type-pills";

interface ResolvedMember {
  member: TeamMember;
  species: SpeciesIndex;
}

type LoadState =
  | { status: "empty" }
  | { status: "error" }
  | { status: "ok"; members: ResolvedMember[]; rawParam: string };

function loadFromUrl(): LoadState {
  // Client-only: read the shared ?team= payload without suspending SSR.
  if (typeof window === "undefined") return { status: "empty" };
  const param = new URLSearchParams(window.location.search).get("team");
  if (!param) return { status: "empty" };
  const decoded = decodeSharedTeam(param);
  if (!decoded) return { status: "error" };
  const members: ResolvedMember[] = [];
  for (const member of decoded) {
    const species = lookupSpecies(member.speciesId);
    if (species) members.push({ member, species });
  }
  if (members.length === 0) return { status: "error" };
  return { status: "ok", members, rawParam: param };
}

const EV_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const EV_LABELS: Record<(typeof EV_KEYS)[number], string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

function evText(m: TeamMember): string | null {
  const parts = EV_KEYS.filter((k) => (m.evs?.[k] ?? 0) > 0).map(
    (k) => `${m.evs![k]} ${EV_LABELS[k]}`,
  );
  return parts.length > 0 ? parts.join(" / ") : null;
}

function ivText(m: TeamMember): string | null {
  if (!m.ivs) return null;
  const parts = EV_KEYS.filter((k) => (m.ivs?.[k] ?? 31) !== 31).map(
    (k) => `${m.ivs![k]} ${EV_LABELS[k]}`,
  );
  return parts.length > 0 ? parts.join(" / ") : null;
}

function MemberCard({ member, species }: ResolvedMember) {
  const nickname = member.nickname?.trim();
  const moves = (member.moves ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const evs = evText(member);
  const ivs = ivText(member);
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex items-center gap-3">
        <img
          src={species.sprites.regular}
          alt={species.name}
          loading="lazy"
          className="h-16 w-16 shrink-0"
        />
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-slate-800 dark:text-slate-100">
            {nickname ? (
              <>
                {nickname} <span className="font-medium text-slate-400">({species.name})</span>
              </>
            ) : (
              species.name
            )}
          </div>
          <div className="mt-1">
            <TypePills types={species.types} />
          </div>
        </div>
        <div className="ml-auto shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500">
          Lv. {member.level ?? 50}
        </div>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        {member.item && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-slate-400 dark:text-slate-500">Item</dt>
            <dd className="text-slate-700 dark:text-slate-200">{member.item}</dd>
          </div>
        )}
        {member.ability && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-slate-400 dark:text-slate-500">Ability</dt>
            <dd className="text-slate-700 dark:text-slate-200">{member.ability}</dd>
          </div>
        )}
        {member.nature && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-slate-400 dark:text-slate-500">Nature</dt>
            <dd className="text-slate-700 dark:text-slate-200">{member.nature}</dd>
          </div>
        )}
        {evs && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-slate-400 dark:text-slate-500">EVs</dt>
            <dd className="text-slate-700 dark:text-slate-200">{evs}</dd>
          </div>
        )}
        {ivs && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 font-semibold text-slate-400 dark:text-slate-500">IVs</dt>
            <dd className="text-slate-700 dark:text-slate-200">{ivs}</dd>
          </div>
        )}
      </dl>
      <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
        {moves.length > 0 ? (
          <ul className="grid grid-cols-1 gap-1 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
            {moves.map((mv) => (
              <li key={mv} className="truncate">
                <span className="mr-1.5 text-emerald-500">–</span>
                {mv}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-slate-400 dark:text-slate-500">No moves listed.</p>
        )}
      </div>
    </div>
  );
}

export default function RentalTeam() {
  const [state] = useState<LoadState>(loadFromUrl);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked — the URL is right there in the address bar */
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Rental Team</h1>
      {state.status === "ok" && (
        <>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Someone shared this {state.members.length}-Pokémon team with you — full sets, ready to
            battle.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <Link
              href={`/tools/team-builder?fullteam=${state.rawParam}`}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-800"
            >
              Open in team builder
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {state.members.map(({ member, species }) => (
              <MemberCard key={`${member.speciesId}-${species.name}`} member={member} species={species} />
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            Shared from Poké Companion&apos;s team builder. Rental links carry the whole team in
            the URL — no account needed to view.
          </p>
        </>
      )}
      {state.status === "error" && (
        <div className="mt-8 rounded-xl bg-white p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            This rental link doesn&apos;t look right.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            The link may have been copied incompletely, or it was made with an older version.
            Ask the sender to hit “Share as link” in the team builder again.
          </p>
          <Link
            href="/tools/team-builder"
            className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Build your own team
          </Link>
        </div>
      )}
      {state.status === "empty" && (
        <div className="mt-8 rounded-xl bg-white p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            No team here yet.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Rental links open here — build a team, hit “Share as link,” and send the URL to a
            friend. They&apos;ll see the full sets, no account needed.
          </p>
          <Link
            href="/tools/team-builder"
            className="mt-4 inline-block rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
          >
            Go to team builder
          </Link>
        </div>
      )}
    </div>
  );
}
