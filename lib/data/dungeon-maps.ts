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

/** Anchor id for a dungeon card, e.g. "dungeon-mt-moon". */
export function dungeonAnchor(dungeon: string): string {
  return (
    "dungeon-" +
    dungeon
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function words(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
}

/**
 * Milestone names that don't share words with their dungeon, e.g. the Path
 * calls it "Rocket Game Corner" while the map is titled "Rocket Hideout".
 */
const DUNGEON_ALIASES: Record<string, string[]> = {
  "Rocket Hideout": ["rocket game corner", "game corner", "celadon hideout"],
  "Mt. Coronet": ["spear pillar"],
  "Plasma Frigate": ["neo team plasma"],
  "Team Flare HQ (Geosenge)": ["team flare"],
  "Rocket Warehouse": ["islands iv"],
  "Oceanic Museum": ["slateport"],
  "Seafloor Cavern": ["weather crisis"],
  "Cave of Origin": ["sootopolis showdown", "primal clash"],
};

/**
 * Find the dungeon map matching a Path milestone name ("Rock Tunnel &
 * Lavender" → the "Rock Tunnel" dungeon). Returns null when nothing matches.
 */
export function findDungeonForMilestone(
  milestoneName: string,
  game: string,
): DungeonMap | null {
  const dungeons = getDungeonsForGame(game);
  const mWords = new Set(words(milestoneName));
  const mNorm = words(milestoneName).join(" ");
  // Prefer the longest (most specific) dungeon name that fits.
  const sorted = [...dungeons].sort((a, b) => b.dungeon.length - a.dungeon.length);
  for (const d of sorted) {
    const dWords = words(d.dungeon);
    if (dWords.length > 0 && dWords.every((w) => mWords.has(w))) return d;
    const aliases = DUNGEON_ALIASES[d.dungeon] ?? [];
    if (aliases.some((a) => mNorm.includes(a))) return d;
  }
  return null;
}
