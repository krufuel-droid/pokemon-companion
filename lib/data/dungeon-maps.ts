/**
 * Shared index for the dungeon maps feature.
 *
 * Each generation's data lives in its own file (dungeon-maps-genN.ts) so
 * researchers can work in parallel without merge conflicts. This module
 * defines the canonical interfaces and aggregates everything.
 */

export interface DungeonMapItem {
  x: number;
  y: number;
  name: string;
}

export interface DungeonMapTrainer {
  x: number;
  y: number;
  note: string;
}

export interface DungeonFloor {
  name: string; // "1F", "B1F"
  /** Rows of chars. Legend: '#' wall, '.' walkable, 'S' stairs/ladder,
   *  'I' item pickup, 'T' trainer battle, 'E' entrance, 'X' exit */
  grid: string[];
  items: DungeonMapItem[];
  trainers: DungeonMapTrainer[];
  notes?: string;
}

export interface DungeonMap {
  game: string; // exact POKEMON_GAMES title
  dungeon: string; // "Mt. Moon"
  floors: DungeonFloor[]; // in traversal order
  walkthrough: string[]; // numbered steps in traversal order
}

import { DUNGEON_MAPS_GEN1 } from "./dungeon-maps-gen1";
import { DUNGEON_MAPS_GEN2 } from "./dungeon-maps-gen2";
import { DUNGEON_MAPS_GEN3 } from "./dungeon-maps-gen3";
import { DUNGEON_MAPS_GEN4 } from "./dungeon-maps-gen4";
import { DUNGEON_MAPS_GEN5 } from "./dungeon-maps-gen5";
import { DUNGEON_MAPS_GEN6 } from "./dungeon-maps-gen6";
import { DUNGEON_MAPS_GEN7 } from "./dungeon-maps-gen7";
import { DUNGEON_MAPS_GEN8 } from "./dungeon-maps-gen8";
import { DUNGEON_MAPS_GEN9 } from "./dungeon-maps-gen9";

export const DUNGEON_MAPS: DungeonMap[] = [
  ...DUNGEON_MAPS_GEN1,
  ...DUNGEON_MAPS_GEN2,
  ...DUNGEON_MAPS_GEN3,
  ...DUNGEON_MAPS_GEN4,
  ...DUNGEON_MAPS_GEN5,
  ...DUNGEON_MAPS_GEN6,
  ...DUNGEON_MAPS_GEN7,
  ...DUNGEON_MAPS_GEN8,
  ...DUNGEON_MAPS_GEN9,
];

/** All dungeons for one game title (exact POKEMON_GAMES title). */
export function getDungeonsForGame(game: string): DungeonMap[] {
  return DUNGEON_MAPS.filter((d) => d.game === game);
}
