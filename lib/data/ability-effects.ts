/**
 * Type-chart effects of defensively relevant abilities, for the type-math
 * tools (counter finder, matchup matrix, complete-my-core, lead advisor,
 * Tera advisor). Multipliers follow the Gen 7+ games.
 *
 * Scope note: only abilities with clean TYPE-level effects are modeled.
 * Category-based ones (Fluffy, Ice Scales, Fur Coat) and one-time ones
 * (Sturdy, Tera Shell, Disguise) are intentionally left out — the tools
 * say so in their limitation footers. Anything marked "(not modeled)"
 * in a desc is a real in-game effect the math below ignores.
 */

export interface AbilityTypeEffect {
  name: string;
  desc: string;
  /** Attacking types that deal 0x while this ability is up. */
  immunities?: string[];
  /** Attacking types halved (×0.5). */
  resists?: string[];
  /** Multiplier applied to super-effective hits (Filter family: 0.75). */
  seDampen?: number;
  /** Only super-effective-or-better hits land; everything else is 0x. */
  wonderGuard?: boolean;
}

export const ABILITY_TYPE_EFFECTS: AbilityTypeEffect[] = [
  { name: "Levitate", desc: "Immune to Ground.", immunities: ["Ground"] },
  { name: "Flash Fire", desc: "Immune to Fire (Fire boost not modeled).", immunities: ["Fire"] },
  { name: "Lightning Rod", desc: "Immune to Electric.", immunities: ["Electric"] },
  { name: "Motor Drive", desc: "Immune to Electric.", immunities: ["Electric"] },
  { name: "Volt Absorb", desc: "Immune to Electric.", immunities: ["Electric"] },
  { name: "Storm Drain", desc: "Immune to Water.", immunities: ["Water"] },
  { name: "Water Absorb", desc: "Immune to Water.", immunities: ["Water"] },
  {
    name: "Dry Skin",
    desc: "Immune to Water (Fire ×1.25 and weather healing not modeled).",
    immunities: ["Water"],
  },
  { name: "Sap Sipper", desc: "Immune to Grass.", immunities: ["Grass"] },
  { name: "Earth Eater", desc: "Immune to Ground.", immunities: ["Ground"] },
  { name: "Well Baked Body", desc: "Immune to Fire.", immunities: ["Fire"] },
  {
    name: "Thick Fat",
    desc: "Fire- and Ice-type moves deal ×0.5.",
    resists: ["Fire", "Ice"],
  },
  {
    name: "Heatproof",
    desc: "Fire-type moves deal ×0.5 (burn damage not modeled).",
    resists: ["Fire"],
  },
  {
    name: "Purifying Salt",
    desc: "Ghost-type moves deal ×0.5 (status immunity not modeled).",
    resists: ["Ghost"],
  },
  {
    name: "Filter",
    desc: "Super-effective hits deal ×0.75.",
    seDampen: 0.75,
  },
  {
    name: "Solid Rock",
    desc: "Super-effective hits deal ×0.75.",
    seDampen: 0.75,
  },
  {
    name: "Prism Armor",
    desc: "Super-effective hits deal ×0.75.",
    seDampen: 0.75,
  },
  {
    name: "Wonder Guard",
    desc: "Only super-effective hits land; everything else is immune.",
    wonderGuard: true,
  },
];

const BY_NAME = new Map<string, AbilityTypeEffect>(
  ABILITY_TYPE_EFFECTS.map((a) => [a.name.toLowerCase(), a]),
);

/** Look up a modeled ability by name (case-insensitive). Returns undefined for "None"/unknown. */
export function getAbilityTypeEffect(name: string | null | undefined): AbilityTypeEffect | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  if (key === "none" || key === "") return undefined;
  return BY_NAME.get(key);
}

/**
 * Apply an ability's defensive type effect to a type-chart multiplier.
 *
 * @param abilityName ability selected by the user ("None"/undefined = no-op)
 * @param attackType  capitalized attacking type, e.g. "Ground"
 * @param baseMult    type-chart multiplier before abilities (e.g. 2, 1, 0.5, 0)
 */
export function abilityDefenseMult(
  abilityName: string | null | undefined,
  attackType: string,
  baseMult: number,
): number {
  const fx = getAbilityTypeEffect(abilityName);
  if (!fx) return baseMult;
  if (fx.wonderGuard) return baseMult >= 2 ? baseMult : 0;
  if (fx.immunities?.includes(attackType)) return 0;
  let mult = baseMult;
  if (fx.resists?.includes(attackType)) mult *= 0.5;
  if (fx.seDampen !== undefined && baseMult > 1) mult *= fx.seDampen;
  return mult;
}

/**
 * One-line explanation of what an ability changed, for result breakdowns.
 * Returns null when the ability doesn't affect this matchup.
 */
export function abilityNote(
  abilityName: string | null | undefined,
  attackType: string,
  baseMult: number,
): string | null {
  const fx = getAbilityTypeEffect(abilityName);
  if (!fx) return null;
  const after = abilityDefenseMult(abilityName, attackType, baseMult);
  if (after === baseMult) return null;
  if (after === 0) return `${fx.name}: immune to ${attackType}`;
  return `${fx.name}: ${attackType} ×${baseMult} → ×${after}`;
}
