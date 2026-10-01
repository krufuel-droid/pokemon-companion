/**
 * Move database: static records baked in at build time by
 * scripts/fetch-moves.mjs (data/moves.json + data/move-species.json).
 * No runtime API calls.
 */
import movesData from "../../data/moves.json";
import moveSpeciesData from "../../data/move-species.json";

export type MoveCategory = "Physical" | "Special" | "Status";

export interface MoveEntry {
  id: number;
  name: string;
  /** Capitalized type name, e.g. "Fire". */
  type: string;
  category: MoveCategory;
  /** null for variable/no power (e.g. Seismic Toss, status moves). */
  power: number | null;
  /** null for moves that never miss. */
  accuracy: number | null;
  pp: number;
  priority: number;
  /** Generation the move debuted in (1–9); null if unknown. */
  gen: number | null;
  shortEffect: string;
  effect: string;
  /** National Pokédex ids of species that can learn the move, ascending. */
  learnedBy: number[];
}

/** Compact species lookup for learnset chips (id, name, sprite). */
export interface MoveSpecies {
  id: number;
  name: string;
  sprite: string;
}

export const MOVES: MoveEntry[] = movesData as MoveEntry[];
export const MOVE_SPECIES: MoveSpecies[] = moveSpeciesData as MoveSpecies[];

export const MOVE_CATEGORIES: MoveCategory[] = ["Physical", "Special", "Status"];

/** All move types present in the data, alphabetical. */
export const MOVE_TYPES: string[] = Array.from(
  new Set(movesData.map((m) => m.type))
).sort();

const GEN_ROMAN: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
  7: "VII",
  8: "VIII",
  9: "IX",
};

/** "Gen VII"-style label for a generation number, or null. */
export function genLabel(gen: number | null): string | null {
  if (gen === null || !(gen in GEN_ROMAN)) return null;
  return `Gen ${GEN_ROMAN[gen]}`;
}

/** Generation numbers present in the data, ascending. */
export const MOVE_GENS: number[] = Array.from(
  new Set((movesData as MoveEntry[]).map((m) => m.gen).filter((g) => g !== null))
).sort((a, b) => (a as number) - (b as number)) as number[];

/** Count of standard moves (Z-Moves and Max/G-Max moves excluded at fetch). */
export const MOVE_COUNT = MOVES.length;
