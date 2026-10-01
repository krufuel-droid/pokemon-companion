/**
 * Move database: static records baked in at build time by
 * scripts/fetch-moves.mjs (data/moves.json). No runtime API calls.
 */
import movesData from "../../data/moves.json";

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
  shortEffect: string;
  effect: string;
}

export const MOVES: MoveEntry[] = movesData as MoveEntry[];

export const MOVE_CATEGORIES: MoveCategory[] = ["Physical", "Special", "Status"];

/** All move types present in the data, alphabetical. */
export const MOVE_TYPES: string[] = Array.from(
  new Set(movesData.map((m) => m.type))
).sort();

/** Count of standard moves (Z-Moves and Max/G-Max moves excluded at fetch). */
export const MOVE_COUNT = MOVES.length;
