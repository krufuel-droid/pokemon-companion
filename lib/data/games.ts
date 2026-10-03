/**
 * Shared Pokémon game list and game → region location helpers for Nuzlocke runs.
 */
import {
  GALAR_LOCATIONS,
  PALDEA_LOCATIONS,
  KANTO_LOCATIONS,
  JOHTO_LOCATIONS,
  HOENN_LOCATIONS,
  SINNOH_LOCATIONS,
  UNOVA_LOCATIONS,
  KALOS_LOCATIONS,
  ALOLA_LOCATIONS,
  HISUI_LOCATIONS,
  type MapLocation,
} from "./region-maps";

/** The 18 mainline game groups, newest first. */
export const POKEMON_GAMES = [
  "Pokémon Scarlet & Violet",
  "Pokémon Legends: Arceus",
  "Pokémon Sword & Shield",
  "Pokémon Brilliant Diamond & Shining Pearl",
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!",
  "Pokémon Sun & Moon",
  "Pokémon Ultra Sun & Ultra Moon",
  "Pokémon X & Y",
  "Pokémon Omega Ruby & Alpha Sapphire",
  "Pokémon Black & White",
  "Pokémon Black 2 & White 2",
  "Pokémon Diamond & Pearl",
  "Pokémon Platinum",
  "Pokémon HeartGold & SoulSilver",
  "Pokémon Ruby, Sapphire & Emerald",
  "Pokémon FireRed & LeafGreen",
  "Pokémon Gold, Silver & Crystal",
  "Pokémon Red, Blue & Yellow",
] as const;

export type PokemonGame = (typeof POKEMON_GAMES)[number];

const GAME_REGION: Record<string, Record<string, MapLocation>> = {
  "Pokémon Scarlet & Violet": PALDEA_LOCATIONS,
  "Pokémon Legends: Arceus": HISUI_LOCATIONS,
  "Pokémon Sword & Shield": GALAR_LOCATIONS,
  "Pokémon Brilliant Diamond & Shining Pearl": SINNOH_LOCATIONS,
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!": KANTO_LOCATIONS,
  "Pokémon Sun & Moon": ALOLA_LOCATIONS,
  "Pokémon Ultra Sun & Ultra Moon": ALOLA_LOCATIONS,
  "Pokémon X & Y": KALOS_LOCATIONS,
  "Pokémon Omega Ruby & Alpha Sapphire": HOENN_LOCATIONS,
  "Pokémon Black & White": UNOVA_LOCATIONS,
  "Pokémon Black 2 & White 2": UNOVA_LOCATIONS,
  "Pokémon Diamond & Pearl": SINNOH_LOCATIONS,
  "Pokémon Platinum": SINNOH_LOCATIONS,
  "Pokémon HeartGold & SoulSilver": JOHTO_LOCATIONS,
  "Pokémon Ruby, Sapphire & Emerald": HOENN_LOCATIONS,
  "Pokémon FireRed & LeafGreen": KANTO_LOCATIONS,
  "Pokémon Gold, Silver & Crystal": JOHTO_LOCATIONS,
  "Pokémon Red, Blue & Yellow": KANTO_LOCATIONS,
};

function prettyLabel(key: string, loc: MapLocation): string {
  if (loc.label) return loc.label;
  // "galar-route-1" → "Route 1", "rolling-fields" → "Rolling Fields"
  return key
    .replace(/^(galar|paldea|kanto|johto|hoenn|sinnoh|unova|kalos|alola|hisui)-/, "")
    .split("-")
    .map((w) => (w === "route" ? "Route" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Sorted, deduplicated human-readable location names for a game.
 *  Matching is fuzzy: "Scarlet" matches "Pokémon Scarlet & Violet". */
export function getLocationsForGame(game: string | null): string[] {
  if (!game) return [];
  const norm = (s: string) =>
    s.toLowerCase().replace(/pokémon\s*/i, "").replace(/[^a-z0-9]+/g, " ").trim();
  const needle = norm(game);
  const needleWords = new Set(needle.split(" ").filter(Boolean));
  let region: Record<string, MapLocation> | undefined;
  for (const [title, locs] of Object.entries(GAME_REGION)) {
    if (title.toLowerCase() === game.toLowerCase()) {
      region = locs;
      break;
    }
    const hayWords = new Set(norm(title).split(" ").filter(Boolean));
    // Match when every word of the shorter name appears in the longer one.
    const [shorter, longer] =
      needleWords.size <= hayWords.size ? [needleWords, hayWords] : [hayWords, needleWords];
    if (shorter.size > 0 && [...shorter].every((w) => longer.has(w))) {
      region = locs;
      break;
    }
  }
  if (!region) return [];
  const names = new Set<string>();
  for (const [key, loc] of Object.entries(region)) {
    names.add(prettyLabel(key, loc));
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
