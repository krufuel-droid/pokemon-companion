"use server";

import { getSpeciesById } from "@/lib/pokedex";
import evolutions from "@/data/evolutions.json";
import type { EvoNode } from "@/app/pokedex/[id]/evolution-section";
import { RANDOMIZER_GAMES, GAME_STARTERS } from "./games";

/**
 * Server action for the Team Randomizer tool.
 *
 * Picks a balanced 6-Pokémon team for a playthrough of the selected game:
 * - Exactly ONE starter: randomly dealt from that game's starter options
 *   (e.g. Chikorita/Cyndaquil/Totodile for HeartGold).
 * - Five non-starters: candidates come from the first 40 entries of the
 *   game's regional Pokédex (PokéAPI lists them in encounter order, so
 *   these are the Pokémon a player actually meets early on), excluding
 *   every starter evolution line so you can't roll two starters.
 * - Viability filter: a non-starter's evolution line must be able to reach
 *   350+ base stat total, so the randomizer never saddles the player with
 *   a team that can't keep up.
 * - Type diversity: greedy pick that avoids stacking the same type, so
 *   the player doesn't end up with six Normal-types.
 */

export interface RandomTeamMember {
  id: number;
  name: string;
  sprite: string;
  types: string[];
  isStarter?: boolean;
}

export interface RandomTeamResult {
  team: RandomTeamMember[];
  gameLabel: string;
  poolSize: number;
  error?: string;
}

const EARLY_POOL_SIZE = 40;
const MIN_CHAIN_BST = 350;
const TEAM_SIZE = 6;

function bstTotal(species: { baseStats: { value: number }[] }): number {
  return species.baseStats.reduce((sum, s) => sum + s.value, 0);
}

/** Highest base stat total reachable in the species' evolution line. */
function chainMaxBst(speciesId: number): number {
  const species = getSpeciesById(speciesId);
  const own = species ? bstTotal(species) : 0;
  const idx =
    evolutions.speciesToChain[String(speciesId) as keyof typeof evolutions.speciesToChain];
  if (idx === undefined) return own;
  let max = 0;
  const walk = (node: EvoNode) => {
    if (node.id != null) {
      const s = getSpeciesById(node.id);
      if (s) max = Math.max(max, bstTotal(s));
    }
    for (const child of node.evolvesTo) walk(child);
  };
  walk(evolutions.chains[idx] as EvoNode);
  return Math.max(max, own);
}

/** All species IDs in the evolution chain containing the given species. */
function chainSpeciesIds(speciesId: number): number[] {
  const ids: number[] = [];
  const idx =
    evolutions.speciesToChain[String(speciesId) as keyof typeof evolutions.speciesToChain];
  if (idx === undefined) return [speciesId];
  const walk = (node: EvoNode) => {
    if (node.id != null) ids.push(node.id);
    for (const child of node.evolvesTo) walk(child);
  };
  walk(evolutions.chains[idx] as EvoNode);
  return ids.length > 0 ? ids : [speciesId];
}

function speciesIdFromUrl(url: string): number | null {
  const m = /\/pokemon-species\/(\d+)\/?$/.exec(url);
  return m ? Number(m[1]) : null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Greedy team pick for type diversity: first pass allows at most one
 * Pokémon per type, second pass at most two, then fill whatever remains.
 * `seedTypes` pre-populates the type counts (e.g. the starter's types).
 */
function pickDiverseTeam(
  pool: RandomTeamMember[],
  size: number,
  seedTypes: string[] = []
): RandomTeamMember[] {
  const shuffled = shuffle(pool);
  const team: RandomTeamMember[] = [];
  const typeCount: Record<string, number> = {};
  for (const t of seedTypes) typeCount[t] = (typeCount[t] ?? 0) + 1;
  const add = (mon: RandomTeamMember) => {
    team.push(mon);
    for (const t of mon.types) typeCount[t] = (typeCount[t] ?? 0) + 1;
  };
  for (const maxPerType of [1, 2]) {
    for (const mon of shuffled) {
      if (team.length >= size) break;
      if (team.includes(mon)) continue;
      const clash = mon.types.some((t) => (typeCount[t] ?? 0) >= maxPerType);
      if (!clash) add(mon);
    }
    if (team.length >= size) break;
  }
  for (const mon of shuffled) {
    if (team.length >= size) break;
    if (!team.includes(mon)) add(mon);
  }
  return team;
}

export async function randomizeTeam(version: string): Promise<RandomTeamResult> {
  const game = RANDOMIZER_GAMES.find((g) => g.version === version);
  if (!game) {
    return { team: [], gameLabel: "", poolSize: 0, error: "Unknown game." };
  }
  let entries: { pokemon_species: { url: string } }[];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokedex/${game.pokedexId}/`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`PokéAPI responded ${res.status}`);
    const data = await res.json();
    entries = data.pokemon_entries ?? [];
  } catch {
    return {
      team: [],
      gameLabel: game.label,
      poolSize: 0,
      error: "Couldn't load that game's Pokédex right now. Try again in a moment.",
    };
  }

  const seen = new Set<number>();
  const candidates: RandomTeamMember[] = [];
  for (const entry of entries.slice(0, EARLY_POOL_SIZE)) {
    const id = speciesIdFromUrl(entry.pokemon_species.url);
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    const species = getSpeciesById(id);
    if (!species) continue;
    // Viability: the evolution line must be able to reach a respectable
    // stat total, so the team can actually keep up with the game.
    if (chainMaxBst(id) < MIN_CHAIN_BST) continue;
    candidates.push({
      id,
      name: species.name,
      sprite: species.sprites.regular,
      types: species.types,
    });
  }

  // Safety net: if the viability filter leaves too few candidates,
  // fall back to the unfiltered early pool.
  let pool = candidates;
  if (pool.length < TEAM_SIZE) {
    pool = [];
    const seenFallback = new Set<number>();
    for (const entry of entries.slice(0, EARLY_POOL_SIZE)) {
      const id = speciesIdFromUrl(entry.pokemon_species.url);
      if (id == null || seenFallback.has(id)) continue;
      seenFallback.add(id);
      const species = getSpeciesById(id);
      if (!species) continue;
      pool.push({
        id,
        name: species.name,
        sprite: species.sprites.regular,
        types: species.types,
      });
    }
  }

  if (pool.length === 0) {
    return {
      team: [],
      gameLabel: game.label,
      poolSize: 0,
      error: "No Pokémon found for that game.",
    };
  }

  // Deal exactly one starter from this game's starter options, then build
  // the other five from the pool excluding every starter evolution line
  // (so e.g. a Johto team can't roll both Cyndaquil and a Meganium).
  const starterIds = GAME_STARTERS[version] ?? [];
  const starterLineIds = new Set<number>();
  for (const sid of starterIds) {
    for (const id of chainSpeciesIds(sid)) starterLineIds.add(id);
  }
  const nonStarterPool = pool.filter((m) => !starterLineIds.has(m.id));

  let starter: RandomTeamMember | null = null;
  if (starterIds.length > 0) {
    const pickId = starterIds[Math.floor(Math.random() * starterIds.length)];
    const species = getSpeciesById(pickId);
    if (species) {
      starter = {
        id: pickId,
        name: species.name,
        sprite: species.sprites.regular,
        types: species.types,
        isStarter: true,
      };
    }
  }

  const restPool =
    nonStarterPool.length >= 5
      ? nonStarterPool
      : pool.filter((m) => m.id !== starter?.id);
  const rest = pickDiverseTeam(
    restPool,
    Math.min(5, restPool.length),
    starter?.types ?? []
  );

  const team = starter ? [starter, ...rest] : pickDiverseTeam(pool, Math.min(TEAM_SIZE, pool.length));

  return {
    team,
    gameLabel: game.label,
    poolSize: nonStarterPool.length,
  };
}
