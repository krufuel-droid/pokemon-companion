/**
 * Competitive movesets observed on tournament-winning teams.
 *
 * Aggregates `FEATURED_TEAMS` and `TOURNAMENT_RESULTS` in
 * `@/lib/data/champions` (the same sources as the Champions page) into
 * per-species movesets: moves, nature, item, ability, EVs, and how many
 * winning teams ran each set, with sources.
 *
 * Honesty rules (same as champions.ts): only sets the linked sources
 * actually publish. Fields the coverage didn't report come back as null —
 * never filled in from memory. Species with no winning-team appearances
 * return null so callers can fall back cleanly (e.g. to the learnset API).
 *
 * Coverage grows automatically as new winning teams are added to
 * champions.ts (the weekly meta job already refreshes that file).
 */

import {
  FEATURED_TEAMS,
  TOURNAMENT_RESULTS,
  type TeamMon,
} from "@/lib/data/champions";
import { resolveSpecies } from "@/lib/damage-calc";

export interface MovesetSource {
  event: string;
  date: string;
  player: string;
  placement: string;
  /** Display label of the linked coverage, e.g. "Limitless VGC". */
  sourceLabel?: string;
  sourceUrl?: string;
}

export interface ObservedMoveset {
  /** Display label for the form actually used, e.g. "Mega Dragonite". Null when the base form ran. */
  form: string | null;
  ability: string | null;
  item: string | null;
  nature: string | null;
  /** EV spread as reported, e.g. "252 HP / 252 Atk / 4 Def". Null when coverage didn't report it. */
  evs: string | null;
  moves: string[];
  /** How many winning teams ran exactly this set. */
  observations: number;
  sources: MovesetSource[];
}

export interface SpeciesMovesets {
  species: string;
  dexId: number;
  /** Most-observed set first. */
  sets: ObservedMoveset[];
}

interface RawObservation {
  mon: TeamMon;
  event: string;
  date: string;
  player: string;
  placement: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

/** resolveSpecies throws on no match; for aggregation we just skip those. */
function tryResolve(ref: string | number | null | undefined) {
  try {
    return resolveSpecies(ref);
  } catch {
    return null;
  }
}

function signature(mon: TeamMon): string {
  return JSON.stringify({
    form: mon.form ?? null,
    ability: mon.ability ?? null,
    item: mon.item ?? null,
    nature: mon.nature ?? null,
    evs: mon.evs ?? null,
    moves: [...(mon.moves ?? [])].sort(),
  });
}

/** Every winning-team appearance with a published moveset, from both sources. */
function allObservations(): RawObservation[] {
  const observations: RawObservation[] = [];
  for (const team of FEATURED_TEAMS) {
    for (const mon of team.team) {
      if (!mon.moves || mon.moves.length === 0) continue;
      observations.push({
        mon,
        event: team.event,
        date: team.date,
        player: team.player,
        placement: team.placement,
        sourceLabel: team.source?.label,
        sourceUrl: team.source?.url,
      });
    }
  }
  for (const result of TOURNAMENT_RESULTS) {
    if (!result.team) continue;
    for (const mon of result.team) {
      if (!mon.moves || mon.moves.length === 0) continue;
      observations.push({
        mon,
        event: result.name,
        date: result.dates,
        player: result.winner,
        placement: "Winner",
      });
    }
  }
  return observations;
}

/**
 * All species with at least one observed competitive set, sorted A–Z.
 * Useful for callers to discover coverage (also returned on 404).
 */
export function getCoveredSpecies(): { name: string; dexId: number }[] {
  const seen = new Map<number, string>();
  for (const obs of allObservations()) {
    const resolved = tryResolve(obs.mon.name);
    if (!resolved) continue;
    if (!seen.has(resolved.id)) seen.set(resolved.id, resolved.name);
  }
  return [...seen.entries()]
    .map(([dexId, name]) => ({ name, dexId }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Most common competitive movesets for a species, most-observed first.
 * Accepts a species name or National Pokédex number (case-insensitive),
 * via the same resolver the damage/learnset APIs use.
 * Returns null when the species is unknown OR has no observed sets —
 * callers that need to tell those apart can use `resolveSpecies` directly
 * (it throws on unknown species).
 */
export function getMovesetsForSpecies(
  ref: string | number,
): SpeciesMovesets | null {
  const resolved = tryResolve(ref);
  if (!resolved) return null;

  const grouped = new Map<string, ObservedMoveset>();
  for (const obs of allObservations()) {
    const monSpecies = tryResolve(obs.mon.name);
    if (!monSpecies || monSpecies.id !== resolved.id) continue;
    const key = signature(obs.mon);
    let set = grouped.get(key);
    if (!set) {
      set = {
        form: obs.mon.form ?? null,
        ability: obs.mon.ability ?? null,
        item: obs.mon.item ?? null,
        nature: obs.mon.nature ?? null,
        evs: obs.mon.evs ?? null,
        moves: [...(obs.mon.moves ?? [])],
        observations: 0,
        sources: [],
      };
      grouped.set(key, set);
    }
    set.observations += 1;
    set.sources.push({
      event: obs.event,
      date: obs.date,
      player: obs.player,
      placement: obs.placement,
      ...(obs.sourceLabel ? { sourceLabel: obs.sourceLabel } : {}),
      ...(obs.sourceUrl ? { sourceUrl: obs.sourceUrl } : {}),
    });
  }

  if (grouped.size === 0) return null;
  const sets = [...grouped.values()].sort(
    (a, b) => b.observations - a.observations,
  );
  return { species: resolved.name, dexId: resolved.id, sets };
}
