/**
 * Pokémon of the Day picker — single source of truth.
 *
 * The pick is deterministic: same date → same Pokémon for everyone,
 * changing at midnight UTC. Seasonal events (which recur yearly) can
 * restrict the candidate pool for the given date. Because it's pure,
 * the POTD archive page can recompute any past pick without storage.
 */
import { getAllSpecies, type SpeciesIndex } from "./pokedex";
import { applySeasonalFilter } from "./seasonal-potd";

/** Deterministic pick for the given date (UTC day). */
export function getPokemonOfTheDay(date: Date = new Date()): SpeciesIndex {
  const all = applySeasonalFilter(getAllSpecies(), date);
  const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return all[hash % all.length];
}
