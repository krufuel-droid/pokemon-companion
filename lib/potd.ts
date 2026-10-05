/**
 * Pokémon of the Day picker — single source of truth.
 *
 * The pick is deterministic: same date → same Pokémon for everyone,
 * changing at midnight UTC. Seasonal events (which recur yearly) can
 * restrict the candidate pool for the given date. Because it's pure,
 * the POTD archive page can recompute any past pick without storage.
 *
 * Picks from 2026-10-05 and earlier used a sequential hash (consecutive
 * days walked the dex in order — hence the evolution-line parades).
 * From 2026-10-06 on, picks use a scattering hash so each day jumps
 * somewhere new. The cutoff keeps the archive's history truthful.
 */
import { getAllSpecies, type SpeciesIndex } from "./pokedex";
import { applySeasonalFilter } from "./seasonal-potd";

/** Old sequential hash — kept so pre-cutoff archive picks stay accurate. */
function legacyHash(day: string): number {
  let hash = 0;
  for (let i = 0; i < day.length; i++) hash = (hash * 31 + day.charCodeAt(i)) >>> 0;
  return hash;
}

/**
 * cyrb53 — small input changes avalanche into wildly different outputs,
 * so consecutive dates scatter across the dex instead of walking it.
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (h2 >>> 0) + (h1 >>> 0);
}

/** Last date using the old sequential picks. */
const SCATTER_CUTOFF = "2026-10-05";

/** Deterministic pick for the given date (UTC day). */
export function getPokemonOfTheDay(date: Date = new Date()): SpeciesIndex {
  const all = applySeasonalFilter(getAllSpecies(), date);
  const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const hash = day <= SCATTER_CUTOFF ? legacyHash(day) : cyrb53("potd:" + day);
  return all[hash % all.length];
}
