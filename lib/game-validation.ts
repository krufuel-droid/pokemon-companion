/**
 * Fact-check helper: does a species actually appear in a given game?
 * Uses PokéAPI's game_indices so trainers can't log a catch in a game
 * the Pokémon was never in.
 */

import type { PokemonGame } from "@/lib/data/games";

/** Display game name → PokéAPI version names. */
const GAME_VERSIONS: Record<PokemonGame, string[]> = {
  "Pokémon Scarlet & Violet": ["scarlet", "violet"],
  "Pokémon Legends: Arceus": ["legends-arceus"],
  "Pokémon Sword & Shield": ["sword", "shield"],
  "Pokémon Brilliant Diamond & Shining Pearl": ["brilliant-diamond", "shining-pearl"],
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!": ["lets-go-pikachu", "lets-go-eevee"],
  "Pokémon Sun & Moon": ["sun", "moon"],
  "Pokémon Ultra Sun & Ultra Moon": ["ultra-sun", "ultra-moon"],
  "Pokémon X & Y": ["x", "y"],
  "Pokémon Omega Ruby & Alpha Sapphire": ["omega-ruby", "alpha-sapphire"],
  "Pokémon Black & White": ["black", "white"],
  "Pokémon Black 2 & White 2": ["black-2", "white-2"],
  "Pokémon Diamond & Pearl": ["diamond", "pearl"],
  "Pokémon Platinum": ["platinum"],
  "Pokémon HeartGold & SoulSilver": ["heartgold", "soulsilver"],
  "Pokémon Ruby, Sapphire & Emerald": ["ruby", "sapphire", "emerald"],
  "Pokémon FireRed & LeafGreen": ["firered", "leafgreen"],
  "Pokémon Gold, Silver & Crystal": ["gold", "silver", "crystal"],
  "Pokémon Red, Blue & Yellow": ["red", "blue", "yellow", "green"],
};

// In-memory cache: speciesId → version names from PokéAPI.
const cache = new Map<number, string[]>();

async function versionsForSpecies(speciesId: number): Promise<string[]> {
  const hit = cache.get(speciesId);
  if (hit) return hit;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
  if (!res.ok) throw new Error(`PokéAPI responded ${res.status}`);
  const data = await res.json();
  const versions: string[] = (data.game_indices ?? []).map(
    (gi: { version: { name: string } }) => gi.version.name
  );
  cache.set(speciesId, versions);
  return versions;
}

/**
 * Returns true if the species appears in the given game.
 * Throws if PokéAPI can't be reached — callers should surface that
 * as "couldn't verify, try again" rather than silently allowing it.
 */
export async function speciesAppearsInGame(
  speciesId: number,
  game: string
): Promise<boolean> {
  const versions = GAME_VERSIONS[game as PokemonGame];
  if (!versions) return true; // Unknown game label — don't block.
  const speciesVersions = await versionsForSpecies(speciesId);
  return versions.some((v) => speciesVersions.includes(v));
}

/**
 * Real wild-encounter location names for a species in a game, via PokéAPI.
 * Returns an empty array when there's no encounter data (e.g. Scarlet/Violet,
 * transfer-only) — callers should fall back to free text.
 */
export async function encounterLocations(
  speciesId: number,
  game: string
): Promise<string[]> {
  const versions = GAME_VERSIONS[game as PokemonGame];
  if (!versions) return [];
  let areas: { location_area: { name: string }; version_details: { version: { name: string } }[] }[];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}/encounters`);
    if (!res.ok) return [];
    areas = await res.json();
  } catch {
    return [];
  }
  const names = new Set<string>();
  for (const area of areas) {
    const inGame = area.version_details.some((vd) => versions.includes(vd.version.name));
    if (inGame) names.add(prettyLocation(area.location_area.name));
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function prettyLocation(name: string): string {
  return name
    .replace(/-area$/, "")
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Check a free-text location against the species' real wild-encounter
 * locations in the given game (via PokéAPI encounters).
 *
 * Returns:
 *  - "match" — the location plausibly matches a real encounter spot.
 *  - "mismatch" — the game has encounter data but nothing resembles the input.
 *  - "unknown" — no wild-encounter data for this game (transfer/gift-only,
 *    or PokéAPI unreachable); can't verify, so don't block.
 */
export async function checkCatchLocation(
  speciesId: number,
  game: string,
  location: string
): Promise<"match" | "mismatch" | "unknown"> {
  const versions = GAME_VERSIONS[game as PokemonGame];
  if (!versions) return "unknown";
  let areas: { location_area: { name: string }; version_details: { version: { name: string } }[] }[];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}/encounters`);
    if (!res.ok) return "unknown";
    areas = await res.json();
  } catch {
    return "unknown";
  }

  const known = new Set<string>();
  for (const area of areas) {
    const inGame = area.version_details.some((vd) => versions.includes(vd.version.name));
    if (inGame) known.add(prettyLocation(area.location_area.name).toLowerCase());
  }
  if (known.size === 0) return "unknown";

  const input = location.toLowerCase().trim();
  // Fuzzy: either string containing the other, ignoring tiny words.
  const words = input.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  for (const loc of known) {
    if (loc.includes(input) || input.includes(loc)) return "match";
    if (words.some((w) => loc.includes(w))) return "match";
  }
  return "mismatch";
}
