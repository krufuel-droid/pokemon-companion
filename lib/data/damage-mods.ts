/**
 * Damage-relevant abilities, items, statuses, weather, and terrain for the
 * advanced damage calculator. Multipliers follow the Gen 7+ games.
 * Anything marked "(assumed)" is a simplification noted in the UI.
 */

export interface DamageMod {
  name: string;
  desc: string;
}

export const ATTACKER_ABILITIES: DamageMod[] = [
  { name: "None", desc: "No ability effect." },
  { name: "Adaptability", desc: "STAB becomes ×2 instead of ×1.5." },
  { name: "Blaze", desc: "×1.5 on Fire moves at 1/3 HP or less (use the toggle)." },
  { name: "Overgrow", desc: "×1.5 on Grass moves at 1/3 HP or less (use the toggle)." },
  { name: "Torrent", desc: "×1.5 on Water moves at 1/3 HP or less (use the toggle)." },
  { name: "Swarm", desc: "×1.5 on Bug moves at 1/3 HP or less (use the toggle)." },
  { name: "Technician", desc: "×1.5 on moves with 60 base power or less." },
  { name: "Huge Power", desc: "Attack stat ×2." },
  { name: "Pure Power", desc: "Attack stat ×2." },
  { name: "Hustle", desc: "Physical Attack ×1.5 (accuracy drop ignored)." },
  { name: "Guts", desc: "Attack ×1.5 while statused; ignores burn's Attack drop." },
  { name: "Sheer Force", desc: "×1.3 (assumes the move has a secondary effect)." },
  { name: "Tough Claws", desc: "×1.3 (assumes a contact move)." },
];

export const DEFENDER_ABILITIES: DamageMod[] = [
  { name: "None", desc: "No ability effect." },
  { name: "Multiscale", desc: "Damage ×0.5 when at full HP." },
  { name: "Shadow Shield", desc: "Damage ×0.5 when at full HP." },
  { name: "Filter", desc: "×0.75 damage from super-effective hits." },
  { name: "Solid Rock", desc: "×0.75 damage from super-effective hits." },
  { name: "Prism Armor", desc: "×0.75 damage from super-effective hits." },
  { name: "Fur Coat", desc: "Defense ×2 against physical moves." },
  { name: "Thick Fat", desc: "×0.5 damage from Fire- and Ice-type moves." },
  { name: "Marvel Scale", desc: "Defense ×1.5 while statused." },
];

export const ATTACKER_ITEMS: DamageMod[] = [
  { name: "None", desc: "No held item." },
  { name: "Choice Band", desc: "Attack ×1.5." },
  { name: "Choice Specs", desc: "Sp. Atk ×1.5." },
  { name: "Life Orb", desc: "Damage ×1.3 (recoil ignored)." },
  { name: "Expert Belt", desc: "×1.2 on super-effective hits." },
  { name: "Muscle Band", desc: "×1.1 on physical moves." },
  { name: "Wise Glasses", desc: "×1.1 on special moves." },
  { name: "Type-boosting item", desc: "×1.2 on same-type moves (Charcoal, Mystic Water…)." },
];

export const DEFENDER_ITEMS: DamageMod[] = [
  { name: "None", desc: "No held item." },
  { name: "Eviolite", desc: "Def/Sp. Def ×1.5 if not fully evolved (use the toggle)." },
  { name: "Assault Vest", desc: "Sp. Def ×1.5." },
  { name: "Focus Sash", desc: "Survives a KO hit with 1 HP (only at full HP)." },
];

export const STATUSES = [
  "Healthy",
  "Burned",
  "Paralyzed",
  "Poisoned",
  "Badly poisoned",
  "Asleep",
  "Frozen",
] as const;

export const WEATHERS = [
  "None",
  "Harsh Sunlight",
  "Rain",
  "Sandstorm",
  "Snow",
] as const;

export const TERRAINS = [
  "None",
  "Electric",
  "Grassy",
  "Psychic",
  "Misty",
] as const;

/** Pinch abilities (Blaze etc.): the move type each one boosts. */
export const PINCH_ABILITY_TYPE: Record<string, string> = {
  Blaze: "Fire",
  Overgrow: "Grass",
  Torrent: "Water",
  Swarm: "Bug",
};
