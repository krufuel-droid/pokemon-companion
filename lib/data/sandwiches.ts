/**
 * Sparkling Power Lv. 3 sandwich recipes for shiny hunting in Scarlet/Violet.
 * Each recipe gives Sparkling Lv. 3 + Encounter Lv. 3 + Title Lv. 3 for one type.
 * Source: community research (ggrecon, Polygon).
 */

export interface SandwichRecipe {
  type: string;
  ingredient: string;
  herba1: string;
  herba2: string;
}

export const SANDWICH_RECIPES: SandwichRecipe[] = [
  { type: "Normal", ingredient: "Chorizo", herba1: "Salty", herba2: "Salty" },
  { type: "Fire", ingredient: "Basil", herba1: "Salty", herba2: "Sweet" },
  { type: "Water", ingredient: "Cucumber", herba1: "Salty", herba2: "Salty" },
  { type: "Electric", ingredient: "Yellow Bell Pepper", herba1: "Salty", herba2: "Spicy" },
  { type: "Grass", ingredient: "Lettuce", herba1: "Salty", herba2: "Sour" },
  { type: "Ice", ingredient: "Klawf Stick", herba1: "Salty", herba2: "Salty" },
  { type: "Fighting", ingredient: "Pickles", herba1: "Salty", herba2: "Salty" },
  { type: "Poison", ingredient: "Noodles", herba1: "Salty", herba2: "Salty" },
  { type: "Ground", ingredient: "Ham", herba1: "Salty", herba2: "Salty" },
  { type: "Flying", ingredient: "Prosciutto", herba1: "Salty", herba2: "Salty" },
  { type: "Psychic", ingredient: "Onion", herba1: "Salty", herba2: "Salty" },
  { type: "Bug", ingredient: "Cherry Tomatoes", herba1: "Salty", herba2: "Salty" },
  { type: "Rock", ingredient: "Jalapeño", herba1: "Salty", herba2: "Salty" },
  { type: "Ghost", ingredient: "Red Onion", herba1: "Salty", herba2: "Salty" },
  { type: "Dragon", ingredient: "Avocado", herba1: "Salty", herba2: "Salty" },
  { type: "Dark", ingredient: "Smoked Fillet", herba1: "Salty", herba2: "Sweet" },
  { type: "Steel", ingredient: "Hamburger", herba1: "Salty", herba2: "Sweet" },
  { type: "Fairy", ingredient: "Tomato", herba1: "Salty", herba2: "Salty" },
];

export const SANDWICH_TIPS = [
  "Use Creative Mode (press X at the picnic table) to build these by hand.",
  "Herba Mystica drop from 5-star and higher Tera raids — roughly a 2–3% chance per raid.",
  "Each sandwich lasts 30 minutes. Eat, then hunt in a mass outbreak for best results.",
  "With Shiny Charm + Sparkling Lv. 3 + a 60+ KO outbreak, odds hit ~1/512.",
  "Don't mix Sweet + Sour Herba Mystica — they cancel the Encounter Power bonus.",
];
