"use client";

import { useState } from "react";
import Link from "next/link";
import { getSpeciesById } from "@/lib/pokedex";
import type { CandidateMon } from "./mon-picker";
import { inputCls, labelCls } from "../damage-calc/shared";

/**
 * Read-only mirror of the team builder's saved-team shape
 * (app/tools/team-builder/team-builder.tsx). The builder owns the data —
 * this module only reads localStorage key "pc-team-builder-teams" and
 * handles both the current `{ name, members }` shape and legacy
 * `{ name, ids }` entries, exactly like the builder's own loadSaved().
 * Never writes; never import the builder component itself from here.
 */
export interface SavedTeamMember {
  speciesId: number;
  nickname?: string;
  item?: string;
  ability?: string;
  nature?: string;
  level?: number;
  evs?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  ivs?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves?: string[];
}

export interface SavedTeam {
  name: string;
  members: SavedTeamMember[];
  savedAt: string;
}

const STORAGE_KEY = "pc-team-builder-teams";
const MAX_TEAM = 6;

/**
 * Team-builder species ids >= 100000 are synthetic regional-variant ids
 * (speciesId * 100000 + index). Decode to the base species id for tools
 * that work on base species; the MonPicker form chips let users re-pick
 * the variant manually.
 */
export function baseSpeciesId(id: number): number {
  return id >= 100000 ? Math.floor(id / 100000) : id;
}

function validSpeciesId(id: unknown): id is number {
  if (!Number.isInteger(id)) return false;
  return getSpeciesById(baseSpeciesId(id as number)) != null;
}

export function loadSavedTeams(): SavedTeam[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: SavedTeam[] = [];
    for (const t of parsed as Array<Record<string, unknown>>) {
      if (!t || typeof t.name !== "string") continue;
      let members: SavedTeamMember[] = [];
      if (Array.isArray(t.members)) {
        members = (t.members as SavedTeamMember[]).filter(
          (m) => m && validSpeciesId(m.speciesId),
        );
      } else if (Array.isArray(t.ids)) {
        members = (t.ids as unknown[])
          .filter(validSpeciesId)
          .map((id) => ({ speciesId: id as number }));
      }
      if (members.length === 0) continue;
      out.push({
        name: t.name,
        members: members.slice(0, MAX_TEAM),
        savedAt: typeof t.savedAt === "string" ? t.savedAt : "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** Base SpeciesIndex for a saved member (variant ids decode to base). */
export function savedMemberSpecies(m: SavedTeamMember) {
  return getSpeciesById(baseSpeciesId(m.speciesId)) ?? null;
}

/** A saved member as a CandidateMon for the type-math tools. */
export function savedMemberToCandidate(m: SavedTeamMember): CandidateMon | null {
  const base = savedMemberSpecies(m);
  if (!base) return null;
  return {
    id: base.id,
    label: m.nickname?.trim() || base.name,
    formName: null,
    types: base.types,
    sprite: base.sprites.regular,
    slug: base.slug,
  };
}

/**
 * Saved-team dropdown. Calls onSelect only when the action button is
 * clicked (changing the dropdown alone does nothing destructive).
 * Shows a one-line hint linking to the builder when nothing is saved.
 */
export function TeamSavePicker({
  onSelect,
  actionLabel = "Use team",
}: {
  onSelect: (team: SavedTeam | null) => void;
  actionLabel?: string;
}) {
  const [teams] = useState<SavedTeam[]>(() => loadSavedTeams());
  const [sel, setSel] = useState(0);

  if (teams.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No saved teams yet — build and save one in{" "}
        <Link
          href="/tools/team-builder"
          className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
        >
          Team Builder
        </Link>
        .
      </p>
    );
  }

  const team = teams[Math.min(sel, teams.length - 1)] ?? null;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <span className={labelCls}>Saved team</span>
        <select
          value={sel}
          onChange={(e) => setSel(Number(e.target.value))}
          className={`${inputCls} mt-1`}
          aria-label="Saved team"
        >
          {teams.map((t, i) => (
            <option key={`${t.name}-${i}`} value={i}>
              {t.name} ({t.members.length})
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => onSelect(team)}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-600"
      >
        {actionLabel}
      </button>
    </div>
  );
}
