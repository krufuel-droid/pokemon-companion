/**
 * Which game groups a species appears in, via PokéAPI `game_indices`.
 * Used to filter game pickers (e.g. shiny hunts) so trainers only see
 * games their Pokémon can actually be found in.
 */
import { POKEMON_GAMES } from "./games";

/** PokéAPI version keys per game group (mirrors catch-planner.tsx). */
const GAME_VERSIONS: Record<string, string[]> = {
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
  "Pokémon Red, Blue & Yellow": ["red", "blue", "yellow"],
};

/** PokéAPI version name → POKEMON_GAMES display label. */
const VERSION_TO_GAME = new Map<string, string>();
for (const [game, versions] of Object.entries(GAME_VERSIONS)) {
  for (const v of versions) VERSION_TO_GAME.set(v, game);
}

const cache = new Map<number, string[]>();

interface ApiGameIndex {
  game_indices: { version: { name: string } }[];
}

/**
 * Game-group labels (in POKEMON_GAMES order) that this species appears in.
 * Results are cached in memory. Throws on network/HTTP errors — callers
 * should fall back to the full game list.
 */
export async function fetchGamesForSpecies(speciesId: number): Promise<string[]> {
  const hit = cache.get(speciesId);
  if (hit) return hit;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
  if (!res.ok) throw new Error(`PokéAPI responded ${res.status}`);
  const data = (await res.json()) as ApiGameIndex;
  const groups = new Set<string>();
  for (const gi of data.game_indices ?? []) {
    const game = VERSION_TO_GAME.get(gi.version.name);
    if (game) groups.add(game);
  }
  const ordered = POKEMON_GAMES.filter((g) => groups.has(g as string));
  cache.set(speciesId, ordered as string[]);
  return ordered as string[];
}
