/** Standard Pokémon type colors, keyed by capitalized type name. */
export const TYPE_COLORS: Record<string, string> = {
  Normal: "#A8A77A",
  Fire: "#EE8130",
  Water: "#6390F0",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#C22E28",
  Poison: "#A33EA1",
  Ground: "#E2BF65",
  Flying: "#A98FF3",
  Psychic: "#F95587",
  Bug: "#A6B91A",
  Rock: "#B6A136",
  Ghost: "#735797",
  Dragon: "#6F35FC",
  Dark: "#705746",
  Steel: "#B7B7CE",
  Fairy: "#D685AD",
};

/** Return the hex color for a type name (case-insensitive), falling back to Normal. */
export function typeColor(t: string): string {
  const key = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return TYPE_COLORS[key] ?? "#A8A77A";
}
