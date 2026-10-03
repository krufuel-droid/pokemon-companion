/**
 * Scarlet/Violet sandwich builder data + meal-power calculator.
 *
 * DATA SOURCE (ingredient flavor / power / type values):
 * - Datamined ingredient table published by @Sibuna_Switch and @mattyoukhana_
 *   (the same spreadsheet linked from the community "Sandwich Research" doc),
 *   transcribed via https://www.pockettactics.com/pokemon-scarlet-violet/recipes
 *   ("All data comes from this comprehensive spreadsheet by @Sibuna_Switch and
 *   @mattyoukhana_ on Twitter").
 * - Cross-checked against https://serebii.net/scarletviolet/sandwichingredients.shtml
 *   and https://www.dexerto.com/pokemon/pokemon-scarlet-violet-sandwich-recipes-picnic-shiny-1985892/
 *
 * Two transcription typos in the Pocket Tactics table were corrected here:
 * - Basil lists "Dairy: 1" — there is no Dairy type; the datamined value is Fairy: 1.
 * - Yogurt lists "Raid power: 12    Raid power: 21" — Yogurt belongs to the raid
 *   condiment group (Butter, Chili Sauce, Ketchup, Mayonnaise, Mustard, Peanut
 *   Butter, Salt), all of which are Egg -3 / Exp 12 / Raid 21; Raid 21 is kept.
 *
 * ALGORITHM SOURCE ("Sandwich Research", https://pastebin.com/p9XhUB0A —
 * a summary of the open-source sandwich calculator by Reddit user
 * Illustrious-Big-2992, translating the game's decompiled logic):
 * 1. Sum every ingredient's flavor / power / type values.
 * 2. Flavor bonus: the highest flavor total adds +100 to a power (needs >= 16):
 *    Sweet -> Egg, Salty -> Encounter, Sour -> Teensy, Bitter -> Item Drop,
 *    Hot -> Humungo. EXCEPTION (no minimum): Sweet+Hot -> Raid +100,
 *    Sweet+Sour -> Catching +100, Salty+Bitter -> Exp +100. Flavor ties break
 *    in order Sweet, Salty, Sour, Bitter, Hot.
 * 3. The three highest power values become the sandwich's powers (ties break:
 *    Egg, Catching, Exp, Item Drop, Raid, Humungo, Teensy, Encounter).
 * 4. The three highest type values pair with the powers by rank, EXCEPT the
 *    last two types are swapped (P1<-T1, P2<-T3, P3<-T2). Type ties break in
 *    Pokedex order: Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost,
 *    Steel, Fire, Water, Grass, Electric, Psychic, Ice, Dragon, Dark, Fairy.
 *    Egg Power's type is paired but never shown. If the top type is >= 280 it
 *    is also assigned to the 2nd power (3rd power gets the 3rd type); if the
 *    top type is >= 480 every power gets the top type.
 * 5. Levels: level 2 needs power >= 100 and type >= 180; level 3 needs
 *    power >= 100 and type >= 480. The 3rd power additionally needs its
 *    assigned type AND the top type >= 280 for level 2 (>= 480 for level 3),
 *    and can never out-level the 1st power. Special case: six identical large
 *    fillings (Fried Fillet, Hamburger, Noodles, Potato Salad, Rice, Potato
 *    Tortilla) with a level-2 first power also make the second power level 2.
 * 6. Herba Mystica: each adds 1000 Title Power and 250 to every type. One
 *    herba removes the 2nd power's power requirement (always level 2) and
 *    makes the 3rd power level 2 when the top type is >= 280. Two or more
 *    herbas add Sparkling Power; Sparkling + Title become the top two powers
 *    and ALL powers become level 3 (the top type is always >= 480, so every
 *    power takes the top type).
 *
 * Only documented mechanics are implemented here — no guesses.
 */

export type Flavor = "sweet" | "salty" | "sour" | "bitter" | "hot";

export type MealPower =
  | "egg"
  | "catch"
  | "exp"
  | "item"
  | "raid"
  | "humungo"
  | "teensy"
  | "encounter"
  | "title"
  | "sparkling";

export interface IngredientDef {
  name: string;
  kind: "filling" | "condiment";
  sweet: number;
  salty: number;
  sour: number;
  bitter: number;
  hot: number;
  powers: Partial<Record<MealPower, number>>;
  types: Record<string, number>;
  herba?: boolean;
}

const T = (
  pairs: [string, number][],
): Record<string, number> => Object.fromEntries(pairs);

/** All 18 types, each with the given value (Herba Mystica / Cheese shorthand). */
const everyType = (v: number): Record<string, number> =>
  T(
    [
      "Normal",
      "Fighting",
      "Flying",
      "Poison",
      "Ground",
      "Rock",
      "Bug",
      "Ghost",
      "Steel",
      "Fire",
      "Water",
      "Grass",
      "Electric",
      "Psychic",
      "Ice",
      "Dragon",
      "Dark",
      "Fairy",
    ].map((t) => [t, v] as [string, number]),
  );

export const FILLINGS: IngredientDef[] = [
  { name: "Apple", kind: "filling", sweet: 4, salty: 0, sour: 3, bitter: 1, hot: 0, powers: { egg: 4, catch: -1, item: 7, humungo: -5 }, types: T([["Flying", 7], ["Steel", 7], ["Ice", 7]]) },
  { name: "Avocado", kind: "filling", sweet: 3, salty: 0, sour: 1, bitter: 0, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Dragon", 6]]) },
  { name: "Bacon", kind: "filling", sweet: 1, salty: 5, sour: 1, bitter: 4, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Rock", 6]]) },
  { name: "Banana", kind: "filling", sweet: 4, salty: 0, sour: 1, bitter: 0, hot: 0, powers: { egg: 4, catch: -1, item: 7, humungo: -5 }, types: T([["Normal", 7], ["Bug", 7], ["Electric", 7]]) },
  { name: "Basil", kind: "filling", sweet: 0, salty: 1, sour: 1, bitter: 4, hot: 0, powers: { egg: 2, raid: 2, encounter: -2 }, types: T([["Fire", 1], ["Water", 1], ["Grass", 1], ["Electric", 1], ["Psychic", 1], ["Ice", 1], ["Dragon", 1], ["Dark", 1], ["Fairy", 1]]) },
  { name: "Cheese", kind: "filling", sweet: 1, salty: 3, sour: 0, bitter: 0, hot: 0, powers: { catch: 2, exp: 2, item: 2, encounter: -2 }, types: everyType(5) },
  { name: "Cherry Tomatoes", kind: "filling", sweet: 3, salty: 0, sour: 5, bitter: 1, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Bug", 6]]) },
  { name: "Chorizo", kind: "filling", sweet: 0, salty: 4, sour: 0, bitter: 2, hot: 4, powers: { exp: 7, item: -1, encounter: 4 }, types: T([["Normal", 12], ["Poison", 12], ["Bug", 12], ["Fire", 12], ["Electric", 12], ["Dragon", 12]]) },
  { name: "Cucumber", kind: "filling", sweet: 0, salty: 0, sour: 1, bitter: 1, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Water", 6]]) },
  { name: "Egg", kind: "filling", sweet: 1, salty: 2, sour: 0, bitter: 1, hot: 0, powers: { exp: 7, item: -1, encounter: 4 }, types: T([["Flying", 12], ["Rock", 12], ["Steel", 12], ["Grass", 12], ["Ice", 12], ["Fairy", 12]]) },
  { name: "Fried Fillet", kind: "filling", sweet: 2, salty: 3, sour: 0, bitter: 3, hot: 0, powers: { catch: 21, raid: 12, encounter: -3 }, types: T([["Normal", 20], ["Flying", 20], ["Ground", 20], ["Bug", 20], ["Steel", 20], ["Water", 20], ["Electric", 20], ["Ice", 20], ["Dark", 20]]) },
  { name: "Green Bell Pepper", kind: "filling", sweet: 1, salty: 0, sour: 1, bitter: 5, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Poison", 6]]) },
  { name: "Ham", kind: "filling", sweet: 1, salty: 5, sour: 0, bitter: 0, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Ground", 6]]) },
  { name: "Hamburger", kind: "filling", sweet: 6, salty: 12, sour: 0, bitter: 9, hot: 0, powers: { catch: 12, raid: -3, encounter: 21 }, types: T([["Steel", 18]]) },
  { name: "Herbed Sausage", kind: "filling", sweet: 1, salty: 4, sour: 0, bitter: 4, hot: 0, powers: { exp: 7, item: -1, encounter: 4 }, types: T([["Fighting", 12], ["Ground", 12], ["Ghost", 12], ["Water", 12], ["Psychic", 12], ["Dark", 12]]) },
  { name: "Jalapeño", kind: "filling", sweet: 0, salty: 0, sour: 2, bitter: 0, hot: 5, powers: { egg: 4, catch: -1, item: 7, humungo: -5 }, types: T([["Rock", 7], ["Grass", 7], ["Fairy", 7]]) },
  { name: "Kiwi", kind: "filling", sweet: 2, salty: 0, sour: 5, bitter: 1, hot: 0, powers: { egg: 4, catch: -1, item: 7, humungo: -5 }, types: T([["Poison", 7], ["Fire", 7], ["Dragon", 7]]) },
  { name: "Klawf Stick", kind: "filling", sweet: 4, salty: 4, sour: 0, bitter: 0, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Ice", 6]]) },
  { name: "Lettuce", kind: "filling", sweet: 1, salty: 0, sour: 0, bitter: 2, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Grass", 6]]) },
  { name: "Noodles", kind: "filling", sweet: 0, salty: 4, sour: 0, bitter: 0, hot: 0, powers: { humungo: 21, teensy: -3, encounter: 12 }, types: T([["Poison", 30], ["Ground", 30], ["Rock", 30], ["Electric", 30], ["Psychic", 30], ["Ice", 30]]) },
  { name: "Onion", kind: "filling", sweet: 2, salty: 0, sour: 0, bitter: 1, hot: 3, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Psychic", 6]]) },
  { name: "Pickle", kind: "filling", sweet: 1, salty: 0, sour: 4, bitter: 2, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Fighting", 6]]) },
  { name: "Pineapple", kind: "filling", sweet: 3, salty: 0, sour: 5, bitter: 1, hot: 0, powers: { egg: 4, catch: -1, item: 7, humungo: -5 }, types: T([["Ground", 7], ["Water", 7], ["Dark", 7]]) },
  { name: "Potato Salad", kind: "filling", sweet: 2, salty: 3, sour: 4, bitter: 1, hot: 0, powers: { humungo: 21, teensy: -3, encounter: 12 }, types: T([["Bug", 30], ["Ghost", 30], ["Steel", 30], ["Dragon", 30], ["Dark", 30], ["Fairy", 30]]) },
  { name: "Potato Tortilla", kind: "filling", sweet: 3, salty: 4, sour: 1, bitter: 3, hot: 1, powers: { catch: 21, raid: 12, encounter: -3 }, types: T([["Fighting", 20], ["Poison", 20], ["Rock", 20], ["Ghost", 20], ["Fire", 20], ["Grass", 20], ["Psychic", 20], ["Dragon", 20], ["Fairy", 20]]) },
  { name: "Prosciutto", kind: "filling", sweet: 2, salty: 4, sour: 1, bitter: 0, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Flying", 6]]) },
  { name: "Red Bell Pepper", kind: "filling", sweet: 1, salty: 0, sour: 1, bitter: 3, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Fire", 6]]) },
  { name: "Red Onion", kind: "filling", sweet: 3, salty: 0, sour: 0, bitter: 1, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Ghost", 6]]) },
  { name: "Rice", kind: "filling", sweet: 3, salty: 0, sour: 1, bitter: 0, hot: 0, powers: { humungo: 21, teensy: -3, encounter: 12 }, types: T([["Normal", 30], ["Fighting", 30], ["Flying", 30], ["Fire", 30], ["Water", 30], ["Grass", 30]]) },
  { name: "Smoked Fillet", kind: "filling", sweet: 1, salty: 3, sour: 2, bitter: 3, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Dark", 6]]) },
  { name: "Strawberry", kind: "filling", sweet: 4, salty: 0, sour: 4, bitter: 0, hot: 0, powers: { egg: 4, catch: -1, item: 7, humungo: -5 }, types: T([["Fighting", 7], ["Ghost", 7], ["Psychic", 7]]) },
  { name: "Tofu", kind: "filling", sweet: 3, salty: 0, sour: 0, bitter: 0, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Normal", 6]]) },
  { name: "Tomato", kind: "filling", sweet: 2, salty: 0, sour: 4, bitter: 1, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Fairy", 6]]) },
  { name: "Watercress", kind: "filling", sweet: 0, salty: 1, sour: 2, bitter: 5, hot: 1, powers: { egg: 2, raid: 2, encounter: -2 }, types: T([["Normal", 1], ["Fighting", 1], ["Flying", 1], ["Poison", 1], ["Ground", 1], ["Rock", 1], ["Bug", 1], ["Ghost", 1], ["Steel", 1]]) },
  { name: "Yellow Bell Pepper", kind: "filling", sweet: 1, salty: 0, sour: 1, bitter: 3, hot: 0, powers: { catch: 4, raid: -1, encounter: 7 }, types: T([["Electric", 6]]) },
];

export const CONDIMENTS: IngredientDef[] = [
  { name: "Butter", kind: "condiment", sweet: 12, salty: 12, sour: 0, bitter: 0, hot: 0, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Bug", 2], ["Ghost", 2]]) },
  { name: "Chili Sauce", kind: "condiment", sweet: 8, salty: 12, sour: 8, bitter: 0, hot: 20, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Water", 2], ["Grass", 2]]) },
  { name: "Cream Cheese", kind: "condiment", sweet: 12, salty: 12, sour: 12, bitter: 0, hot: 0, powers: { egg: 5, exp: -3, item: 12, teensy: -15 }, types: T([["Bug", 4], ["Steel", 4], ["Water", 4]]) },
  { name: "Curry Powder", kind: "condiment", sweet: 4, salty: 4, sour: 4, bitter: 12, hot: 30, powers: { humungo: -3, teensy: 21, encounter: 12 }, types: T([["Bug", 2], ["Ghost", 2], ["Steel", 2], ["Fire", 2], ["Water", 2], ["Grass", 2]]) },
  { name: "Horseradish", kind: "condiment", sweet: 4, salty: 0, sour: 0, bitter: 0, hot: 16, powers: { humungo: -3, teensy: 21, encounter: 12 }, types: T([["Normal", 2], ["Fighting", 2], ["Flying", 2], ["Poison", 2], ["Ground", 2], ["Rock", 2]]) },
  { name: "Jam", kind: "condiment", sweet: 16, salty: 4, sour: 16, bitter: 0, hot: 0, powers: { egg: 5, exp: -3, item: 12, teensy: -15 }, types: T([["Electric", 4], ["Ice", 4], ["Dark", 4]]) },
  { name: "Ketchup", kind: "condiment", sweet: 8, salty: 16, sour: 16, bitter: 0, hot: 0, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Flying", 2], ["Poison", 2]]) },
  { name: "Marmalade", kind: "condiment", sweet: 12, salty: 4, sour: 16, bitter: 20, hot: 0, powers: { egg: 5, exp: -3, item: 12, teensy: -15 }, types: T([["Fighting", 4], ["Poison", 4], ["Rock", 4]]) },
  { name: "Mayonnaise", kind: "condiment", sweet: 8, salty: 8, sour: 20, bitter: 0, hot: 0, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Normal", 2], ["Fighting", 2]]) },
  { name: "Mustard", kind: "condiment", sweet: 4, salty: 8, sour: 8, bitter: 0, hot: 16, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Ground", 2], ["Rock", 2]]) },
  { name: "Olive Oil", kind: "condiment", sweet: 0, salty: 0, sour: 4, bitter: 4, hot: 0, powers: { egg: 5, exp: -3, item: 12, teensy: -15 }, types: T([["Ghost", 4], ["Fire", 4], ["Grass", 4]]) },
  { name: "Peanut Butter", kind: "condiment", sweet: 16, salty: 12, sour: 0, bitter: 0, hot: 0, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Steel", 2], ["Fire", 2]]) },
  { name: "Pepper", kind: "condiment", sweet: 0, salty: 4, sour: 0, bitter: 8, hot: 16, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Ice", 2], ["Dragon", 2]]) },
  { name: "Salt", kind: "condiment", sweet: 0, salty: 20, sour: 0, bitter: 4, hot: 0, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Electric", 2], ["Psychic", 2]]) },
  { name: "Vinegar", kind: "condiment", sweet: 4, salty: 0, sour: 20, bitter: 4, hot: 0, powers: { egg: 5, exp: -3, item: 12, teensy: -15 }, types: T([["Psychic", 4], ["Dragon", 4], ["Fairy", 4]]) },
  { name: "Wasabi", kind: "condiment", sweet: 4, salty: 4, sour: 0, bitter: 0, hot: 20, powers: { humungo: -3, teensy: 21, encounter: 12 }, types: T([["Electric", 2], ["Psychic", 2], ["Ice", 2], ["Dragon", 2], ["Dark", 2], ["Fairy", 2]]) },
  { name: "Whipped Cream", kind: "condiment", sweet: 20, salty: 0, sour: 0, bitter: 0, hot: 0, powers: { egg: 5, exp: -3, item: 12, teensy: -15 }, types: T([["Normal", 4], ["Flying", 4], ["Ground", 4]]) },
  { name: "Yogurt", kind: "condiment", sweet: 16, salty: 0, sour: 16, bitter: 0, hot: 0, powers: { egg: -3, exp: 12, raid: 21 }, types: T([["Dark", 2], ["Fairy", 2]]) },
  { name: "Bitter Herba Mystica", kind: "condiment", sweet: 0, salty: 0, sour: 0, bitter: 500, hot: 0, powers: { title: 1000 }, types: everyType(250), herba: true },
  { name: "Salty Herba Mystica", kind: "condiment", sweet: 0, salty: 500, sour: 0, bitter: 0, hot: 0, powers: { title: 1000 }, types: everyType(250), herba: true },
  { name: "Sour Herba Mystica", kind: "condiment", sweet: 0, salty: 0, sour: 500, bitter: 0, hot: 0, powers: { title: 1000 }, types: everyType(250), herba: true },
  { name: "Spicy Herba Mystica", kind: "condiment", sweet: 0, salty: 0, sour: 0, bitter: 0, hot: 500, powers: { title: 1000 }, types: everyType(250), herba: true },
  { name: "Sweet Herba Mystica", kind: "condiment", sweet: 500, salty: 0, sour: 0, bitter: 0, hot: 0, powers: { title: 1000 }, types: everyType(250), herba: true },
];

const INGREDIENT_BY_NAME = new Map<string, IngredientDef>();
for (const ing of [...FILLINGS, ...CONDIMENTS]) INGREDIENT_BY_NAME.set(ing.name, ing);

export function getIngredient(name: string): IngredientDef | undefined {
  return INGREDIENT_BY_NAME.get(name);
}

/* ------------------------------------------------------------------ */
/* Calculator                                                          */
/* ------------------------------------------------------------------ */

export const MAX_FILLINGS = 6;
export const MAX_CONDIMENTS = 4;

const FLAVOR_ORDER: Flavor[] = ["sweet", "salty", "sour", "bitter", "hot"];

const FLAVOR_POWER: Record<Flavor, MealPower> = {
  sweet: "egg",
  salty: "encounter",
  sour: "teensy",
  bitter: "item",
  hot: "humungo",
};

/** Power tie-break order from the research doc. */
const POWER_TIE_ORDER: MealPower[] = [
  "egg",
  "catch",
  "exp",
  "item",
  "raid",
  "humungo",
  "teensy",
  "encounter",
  "title",
  "sparkling",
];

/** Type tie-break order (Pokedex order) from the research doc. */
const TYPE_TIE_ORDER = [
  "Normal",
  "Fighting",
  "Flying",
  "Poison",
  "Ground",
  "Rock",
  "Bug",
  "Ghost",
  "Steel",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Psychic",
  "Ice",
  "Dragon",
  "Dark",
  "Fairy",
];

/** Large fillings for the "six identical large fillings" special case. */
const LARGE_FILLINGS = new Set([
  "Fried Fillet",
  "Hamburger",
  "Noodles",
  "Potato Salad",
  "Rice",
  "Potato Tortilla",
]);

export const POWER_META: Record<MealPower, { name: string; icon: string }> = {
  egg: { name: "Egg Power", icon: "🥚" },
  catch: { name: "Catching Power", icon: "🎯" },
  exp: { name: "Exp. Point Power", icon: "📈" },
  item: { name: "Item Drop Power", icon: "🎁" },
  raid: { name: "Raid Power", icon: "⚔️" },
  humungo: { name: "Humungo Power", icon: "🦣" },
  teensy: { name: "Teensy Power", icon: "🐜" },
  encounter: { name: "Encounter Power", icon: "🔍" },
  title: { name: "Title Power", icon: "🏷️" },
  sparkling: { name: "Sparkling Power", icon: "✨" },
};

export interface GrantedPower {
  power: MealPower;
  /** Null for Egg Power (type is paired internally but never shown). */
  type: string | null;
  level: 1 | 2 | 3;
  powerValue: number;
  typeValue: number;
}

export interface SandwichResult {
  /** Up to 3 granted meal powers, strongest first. */
  powers: GrantedPower[];
  flavorTotals: Record<Flavor, number>;
  /** All power scores, strongest first (for the "how it's calculated" view). */
  powerScores: { power: MealPower; value: number }[];
  /** All type scores, strongest first. */
  typeScores: { type: string; value: number }[];
  flavorBonus: string | null;
  herbaCount: number;
}

interface RankedPower {
  power: MealPower;
  value: number;
}

interface RankedType {
  type: string;
  value: number;
}

/** Assign types to up to 3 powers, implementing the swap + 280/480 rules. */
function assignTypes(
  powers: RankedPower[],
  rankedTypes: RankedType[],
): (RankedType | undefined)[] {
  const [t1, t2, t3] = rankedTypes;
  // Base pairing: the final two types are swapped.
  let assigned: (RankedType | undefined)[] = [t1, t3, t2];
  const topValue = rankedTypes[0]?.value ?? 0;
  if (topValue >= 480) {
    assigned = [t1, t1, t1];
  } else if (topValue >= 280) {
    // The top power's type is also assigned to the 2nd power; the 3rd power
    // gets the 3rd-highest type (per the swap).
    assigned = [t1, t1, t3];
  }
  return assigned.slice(0, powers.length);
}

/** Level for a power at a given rank (0, 1, 2) with no Herba Mystica. */
function baseLevel(
  rank: number,
  powerValue: number,
  typeValue: number,
  topTypeValue: number,
  firstPowerLevel: 1 | 2 | 3,
): 1 | 2 | 3 {
  if (powerValue < 100 || typeValue < 180) return 1;
  if (rank === 2 && (typeValue < 280 || topTypeValue < 280)) return 1;
  let level: 1 | 2 | 3 = 2;
  if (typeValue >= 480 && (rank !== 2 || topTypeValue >= 480)) level = 3;
  // The 3rd power can never be a higher level than the highest power.
  if (rank === 2 && level > firstPowerLevel) level = firstPowerLevel;
  return level;
}

export function calculateSandwich(
  fillingNames: string[],
  condimentNames: string[],
): SandwichResult {
  const ingredients = [...fillingNames, ...condimentNames]
    .map(getIngredient)
    .filter((i): i is IngredientDef => Boolean(i));

  const flavorTotals: Record<Flavor, number> = {
    sweet: 0,
    salty: 0,
    sour: 0,
    bitter: 0,
    hot: 0,
  };
  const powerSums = new Map<MealPower, number>();
  const typeSums = new Map<string, number>();
  let herbaCount = 0;

  for (const ing of ingredients) {
    flavorTotals.sweet += ing.sweet;
    flavorTotals.salty += ing.salty;
    flavorTotals.sour += ing.sour;
    flavorTotals.bitter += ing.bitter;
    flavorTotals.hot += ing.hot;
    for (const [power, value] of Object.entries(ing.powers) as [MealPower, number][]) {
      powerSums.set(power, (powerSums.get(power) ?? 0) + value);
    }
    for (const [type, value] of Object.entries(ing.types)) {
      typeSums.set(type, (typeSums.get(type) ?? 0) + value);
    }
    if (ing.herba) herbaCount++;
  }

  // --- Flavor bonus ---
  const rankedFlavors = FLAVOR_ORDER.map((f) => ({
    flavor: f,
    value: flavorTotals[f],
  })).sort(
    (a, b) =>
      b.value - a.value ||
      FLAVOR_ORDER.indexOf(a.flavor) - FLAVOR_ORDER.indexOf(b.flavor),
  );
  const [f1, f2] = rankedFlavors;
  const pair = new Set([f1.flavor, f2.flavor]);
  let flavorBonus: string | null = null;
  const bonusTo = (power: MealPower, amount: number) => {
    powerSums.set(power, (powerSums.get(power) ?? 0) + amount);
  };
  if (pair.has("sweet") && pair.has("hot")) {
    bonusTo("raid", 100);
    flavorBonus = "Sweet + Hot are the top flavors: Raid Power +100";
  } else if (pair.has("sweet") && pair.has("sour")) {
    bonusTo("catch", 100);
    flavorBonus = "Sweet + Sour are the top flavors: Catching Power +100";
  } else if (pair.has("salty") && pair.has("bitter")) {
    bonusTo("exp", 100);
    flavorBonus = "Salty + Bitter are the top flavors: Exp. Point Power +100";
  } else if (f1.value >= 16) {
    const power = FLAVOR_POWER[f1.flavor];
    bonusTo(power, 100);
    flavorBonus = `${cap(f1.flavor)} is the top flavor (≥ 16): ${POWER_META[power].name} +100`;
  }

  // --- Rank powers and types ---
  const rankedPowers: RankedPower[] = POWER_TIE_ORDER.map((power) => ({
    power,
    value: powerSums.get(power) ?? 0,
  })).sort(
    (a, b) =>
      b.value - a.value ||
      POWER_TIE_ORDER.indexOf(a.power) - POWER_TIE_ORDER.indexOf(b.power),
  );
  const rankedTypes: RankedType[] = TYPE_TIE_ORDER.map((type) => ({
    type,
    value: typeSums.get(type) ?? 0,
  })).sort(
    (a, b) =>
      b.value - a.value ||
      TYPE_TIE_ORDER.indexOf(a.type) - TYPE_TIE_ORDER.indexOf(b.type),
  );
  const topTypeValue = rankedTypes[0]?.value ?? 0;

  const powerScores = rankedPowers.map((p) => ({ power: p.power, value: p.value }));
  const typeScores = rankedTypes.map((t) => ({ type: t.type, value: t.value }));

  const result: SandwichResult = {
    powers: [],
    flavorTotals,
    powerScores,
    typeScores,
    flavorBonus,
    herbaCount,
  };

  const grant = (
    power: MealPower,
    powerValue: number,
    type: RankedType | undefined,
    level: 1 | 2 | 3,
  ): GrantedPower => ({
    power,
    type: power === "egg" ? null : (type?.type ?? null),
    level,
    powerValue,
    typeValue: type?.value ?? 0,
  });

  if (herbaCount >= 2) {
    // Sparkling + Title are the top two powers; the third is the strongest
    // remaining power. All are level 3 (top type is always >= 480).
    const third = rankedPowers.find(
      (p) => p.power !== "sparkling" && p.power !== "title" && p.value >= 1,
    );
    const topType = rankedTypes[0];
    result.powers.push(grant("sparkling", 0, topType, 3));
    result.powers.push(grant("title", powerSums.get("title") ?? 0, topType, 3));
    if (third) result.powers.push(grant(third.power, third.value, topType, 3));
    return result;
  }

  // Top three powers with value >= 1 (a sandwich with no positive power
  // grants nothing).
  const topThree = rankedPowers.filter((p) => p.value >= 1).slice(0, 3);
  if (topThree.length === 0) return result;

  const assigned = assignTypes(topThree, rankedTypes);
  const firstLevel =
    herbaCount === 1
      ? levelForFirstWithHerba(topThree[0].value, assigned[0]?.value ?? 0)
      : baseLevel(0, topThree[0].value, assigned[0]?.value ?? 0, topTypeValue, 3);

  result.powers = topThree.map((p, rank) => {
    const type = assigned[rank];
    let level: 1 | 2 | 3;
    if (herbaCount === 1) {
      if (rank === 0) level = firstLevel;
      else if (rank === 1) level = 2; // power requirement removed -> always Lv 2
      else level = topTypeValue >= 280 ? 2 : 1;
    } else {
      level = baseLevel(rank, p.value, type?.value ?? 0, topTypeValue, firstLevel);
    }
    return grant(p.power, p.value, type, level);
  });

  // Six identical large fillings with a level-2 first power also make the
  // second power level 2.
  if (
    herbaCount === 0 &&
    result.powers.length >= 2 &&
    firstLevel === 2 &&
    fillingNames.length === MAX_FILLINGS &&
    fillingNames.every((n) => n === fillingNames[0]) &&
    LARGE_FILLINGS.has(fillingNames[0])
  ) {
    result.powers[1] = { ...result.powers[1], level: 2 };
  }

  return result;
}

/** Level of the 1st power with exactly one Herba Mystica (normal thresholds). */
function levelForFirstWithHerba(powerValue: number, typeValue: number): 1 | 2 | 3 {
  if (powerValue >= 100 && typeValue >= 480) return 3;
  if (powerValue >= 100 && typeValue >= 180) return 2;
  return 1;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Everything the data file exports for the UI — kept for parity checks. */
export const ALL_INGREDIENTS = [...FILLINGS, ...CONDIMENTS];
