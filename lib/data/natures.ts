/**
 * All 25 natures: which stat each raises and lowers.
 * Neutral natures (Bashful, Docile, Hardy, Quirky, Serious) raise/lower nothing.
 */

export interface Nature {
  name: string;
  raises: string | null;
  lowers: string | null;
}

export const NATURES: Nature[] = [
  { name: "Adamant", raises: "Attack", lowers: "Sp. Atk" },
  { name: "Bashful", raises: null, lowers: null },
  { name: "Bold", raises: "Defense", lowers: "Attack" },
  { name: "Brave", raises: "Attack", lowers: "Speed" },
  { name: "Calm", raises: "Sp. Def", lowers: "Attack" },
  { name: "Careful", raises: "Sp. Def", lowers: "Sp. Atk" },
  { name: "Docile", raises: null, lowers: null },
  { name: "Gentle", raises: "Sp. Def", lowers: "Defense" },
  { name: "Hardy", raises: null, lowers: null },
  { name: "Hasty", raises: "Speed", lowers: "Defense" },
  { name: "Impish", raises: "Defense", lowers: "Sp. Atk" },
  { name: "Jolly", raises: "Speed", lowers: "Sp. Atk" },
  { name: "Lax", raises: "Defense", lowers: "Sp. Def" },
  { name: "Lonely", raises: "Attack", lowers: "Defense" },
  { name: "Mild", raises: "Sp. Atk", lowers: "Defense" },
  { name: "Modest", raises: "Sp. Atk", lowers: "Attack" },
  { name: "Naive", raises: "Speed", lowers: "Sp. Def" },
  { name: "Naughty", raises: "Attack", lowers: "Sp. Def" },
  { name: "Quiet", raises: "Sp. Atk", lowers: "Speed" },
  { name: "Quirky", raises: null, lowers: null },
  { name: "Rash", raises: "Sp. Atk", lowers: "Sp. Def" },
  { name: "Relaxed", raises: "Defense", lowers: "Speed" },
  { name: "Sassy", raises: "Sp. Def", lowers: "Speed" },
  { name: "Serious", raises: null, lowers: null },
  { name: "Timid", raises: "Speed", lowers: "Attack" },
];

export const NATURE_TIPS = [
  "A nature raises one stat by 10% and lowers another by 10% — neutral natures do neither.",
  "Physical attackers usually want Adamant (+Atk) or Jolly (+Spe); special attackers want Modest (+SpA) or Timid (+Spe).",
  "Mints change the stat effect without changing the listed nature — find them under Items → Mints.",
  "Breed with an Everstone to pass the parent's nature to the egg (100% in Gen 6+).",
];
