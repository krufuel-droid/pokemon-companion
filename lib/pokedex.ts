/**
 * Static data access layer for the National Pokédex.
 *
 * Data is generated offline by `node scripts/fetch-pokedex.mjs` into:
 *   - data/pokedex-index.json — lightweight records for list/search UI
 *   - data/pokedex-full.json  — complete records for detail views
 *
 * Both files are imported statically (bundled at build time); no
 * runtime fetches are needed.
 */
import indexData from "../data/pokedex-index.json";
import fullData from "../data/pokedex-full.json";

export interface Sprites {
  regular: string;
  shiny: string;
}

export interface DexEntry {
  game: string;
  gameLabel: string;
  text: string;
}

export interface SpeciesIndex {
  id: number;
  slug: string;
  name: string;
  types: string[];
  eggGroups: string[];
  sprites: Sprites;
}

export interface BaseStat {
  key: string;
  value: number;
}

export interface SpeciesFull extends SpeciesIndex {
  artwork: string;
  heightM: number;
  weightKg: number;
  genera: string | null;
  /** Base stats in display order: hp, attack, defense, special-attack, special-defense, speed. */
  baseStats: BaseStat[];
  dexEntries: DexEntry[];
  eggMoves: string[];
}

const index: SpeciesIndex[] = indexData as SpeciesIndex[];
const full: SpeciesFull[] = fullData as SpeciesFull[];

const fullById = new Map<number, SpeciesFull>(full.map((s) => [s.id, s]));

/** All species in National Pokédex order (1–1025), lightweight records. */
export function getAllSpecies(): SpeciesIndex[] {
  return index;
}

/** Full record for a species by National Pokédex number, or undefined. */
export function getSpeciesById(id: number): SpeciesFull | undefined {
  return fullById.get(id);
}

/**
 * Search species by name. Query is trimmed and lowercased; returns []
 * when it has fewer than 2 characters. Name-prefix matches come first,
 * then substring matches. Max 50 results, in Pokédex order.
 */
export function searchSpecies(query: string): SpeciesIndex[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const prefix: SpeciesIndex[] = [];
  const substring: SpeciesIndex[] = [];
  for (const s of index) {
    const name = s.name.toLowerCase();
    if (name.startsWith(q)) prefix.push(s);
    else if (q.length >= 4 && name.includes(q)) substring.push(s);
  }
  return [...prefix, ...substring].slice(0, 50);
}
