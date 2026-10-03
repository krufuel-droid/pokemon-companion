/**
 * Sandwich recipes organized by meal power.
 * Sparkling recipes are the verified Herba Mystica combos.
 * Other sections explain the power and give the simplest reliable recipes.
 */

export interface PowerCategory {
  power: string;
  icon: string;
  description: string;
  recipes: { name: string; ingredients: string[]; effect: string }[];
}

export const SANDWICH_POWERS: PowerCategory[] = [
  {
    power: "Shiny Hunting",
    icon: "✨",
    description:
      "Sparkling Power Lv. 3 boosts shiny odds. Each recipe also gives Encounter Power Lv. 3 and Title Power Lv. 3 for that type. Use Creative Mode (X at picnic).",
    recipes: [
      { name: "Normal", ingredients: ["1× Chorizo", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Normal)" },
      { name: "Fire", ingredients: ["1× Basil", "1× Salty Herba Mystica", "1× Sweet Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Fire)" },
      { name: "Water", ingredients: ["1× Cucumber", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Water)" },
      { name: "Electric", ingredients: ["1× Yellow Bell Pepper", "1× Salty Herba Mystica", "1× Spicy Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Electric)" },
      { name: "Grass", ingredients: ["1× Lettuce", "1× Salty Herba Mystica", "1× Sour Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Grass)" },
      { name: "Ice", ingredients: ["1× Klawf Stick", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Ice)" },
      { name: "Fighting", ingredients: ["1× Pickles", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Fighting)" },
      { name: "Poison", ingredients: ["1× Noodles", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Poison)" },
      { name: "Ground", ingredients: ["1× Ham", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Ground)" },
      { name: "Flying", ingredients: ["1× Prosciutto", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Flying)" },
      { name: "Psychic", ingredients: ["1× Onion", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Psychic)" },
      { name: "Bug", ingredients: ["1× Cherry Tomatoes", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Bug)" },
      { name: "Rock", ingredients: ["1× Jalapeño", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Rock)" },
      { name: "Ghost", ingredients: ["1× Red Onion", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Ghost)" },
      { name: "Dragon", ingredients: ["1× Avocado", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Dragon)" },
      { name: "Dark", ingredients: ["1× Smoked Fillet", "1× Salty Herba Mystica", "1× Sweet Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Dark)" },
      { name: "Steel", ingredients: ["1× Hamburger", "1× Salty Herba Mystica", "1× Sweet Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Steel)" },
      { name: "Fairy", ingredients: ["1× Tomato", "1× Salty Herba Mystica", "1× Salty Herba Mystica"], effect: "Sparkling Lv. 3 · Encounter Lv. 3 · Title Lv. 3 (Fairy)" },
    ],
  },
  {
    power: "Egg Hatching",
    icon: "🥚",
    description:
      "Egg Power makes eggs appear faster at picnics. Essential for Masuda Method breeding. These are shop-bought — no cooking needed.",
    recipes: [
      { name: "Salisbury Steak with Fried Fixings", ingredients: ["Buy at Barato's (1,900₽)"], effect: "Egg Power Lv. 1" },
      { name: "Smoked Fillet with Herbs", ingredients: ["Buy at Seafood Fresco (1,400₽)"], effect: "Egg Power Lv. 1" },
      { name: "Tropical Sandwich", ingredients: ["Avocado ×1, Marmalade ×1, Klawf Stick ×1"], effect: "Egg Power Lv. 1 · Encounter (Fighting) Lv. 1 · Catching (Dragon) Lv. 1" },
      { name: "Cinnamon Churro", ingredients: ["Buy at Smoochurro (900₽)"], effect: "Egg Power Lv. 1 · Catching (Dragon) Lv. 1 · Teensy (Grass) Lv. 1" },
    ],
  },
  {
    power: "Catching",
    icon: "🎯",
    description:
      "Catching Power makes throws more likely to succeed. Great for legendaries and hard-to-catch shinies.",
    recipes: [
      { name: "Tropical Sandwich", ingredients: ["Avocado ×1, Marmalade ×1, Klawf Stick ×1"], effect: "Catching (Dragon) Lv. 1 · Egg Power Lv. 1" },
      { name: "Hamburger Patty Sandwich", ingredients: ["Hamburger ×1, Red Onion ×1, Vinegar ×1, Pepper ×1"], effect: "Catching (Steel) Lv. 1 · Humungo (Psychic) Lv. 1" },
      { name: "Great Ham Sandwich", ingredients: ["Pickle ×1, Ham ×1, Prosciutto ×1, Mayo ×1, Mustard ×1"], effect: "Catching (Flying) Lv. 1 · Encounter (Fighting) Lv. 2" },
    ],
  },
  {
    power: "EXP Grinding",
    icon: "📈",
    description: "Exp. Point Power boosts EXP from battles. Stack with Lucky Egg for fast leveling.",
    recipes: [
      { name: "Great Cheese Sandwich", ingredients: ["Cheese ×1, Avocado ×1, Cream Cheese ×1, Pepper ×1, Salt ×1"], effect: "Exp. (Bug) Lv. 1 · Encounter (Dragon) Lv. 2" },
      { name: "Smoky Sandwich", ingredients: ["Smoked Fillet ×1, Watercress ×1, Vinegar ×1, Pepper ×1, Salt ×1"], effect: "Exp. (Dark) Lv. 1 · Raid (Dragon) Lv. 1" },
      { name: "Great Smoky Sandwich", ingredients: ["Smoked Fillet ×1, Watercress ×1, Red Onion ×1, Vinegar ×1, Pepper ×1, Salt ×1"], effect: "Exp. (Ghost) Lv. 2 · Raid (Psychic) Lv. 1" },
    ],
  },
  {
    power: "Tera Raids",
    icon: "💎",
    description: "Raid Power gives more rewards from Tera Raid battles. Eat before farming Herba Mystica!",
    recipes: [
      { name: "Cheese Sandwich", ingredients: ["Cheese ×1, Cream Cheese ×1, Pepper ×1, Salt ×1"], effect: "Raid (Water) Lv. 1 · Encounter (Bug) Lv. 1" },
      { name: "Ham Sandwich", ingredients: ["Pickle ×1, Ham ×1, Prosciutto ×1, Mayo ×1, Mustard ×1"], effect: "Raid (Ground) Lv. 1 · Teensy (Fighting) Lv. 1" },
      { name: "Ultra Egg Sandwich", ingredients: ["Red Onion ×1, Cucumber ×1, Mayo ×1, Egg ×1, Salt ×1, Cheese ×1"], effect: "Raid (Rock) Lv. 1 · Encounter (Flying) Lv. 2 · Exp. (Steel) Lv. 2" },
    ],
  },
  {
    power: "Item Farming",
    icon: "🎒",
    description: "Item Drop Power makes wild Pokémon drop more materials. Great for farming evolution items and ingredients.",
    recipes: [
      { name: "Classic Bocadillo", ingredients: ["Prosciutto ×1, Cheese ×1, Potato Tortilla ×1, Olive Oil ×1"], effect: "Item Drop (Fire) Lv. 1 · Encounter (Ghost) Lv. 1 · Catching (Grass) Lv. 1" },
    ],
  },
  {
    power: "Size Hunting",
    icon: "📏",
    description: "Humungo Power makes Pokémon bigger, Teensy Power makes them smaller. For Mark hunters and fun.",
    recipes: [
      { name: "Hamburger Patty Sandwich", ingredients: ["Hamburger ×1, Red Onion ×1, Vinegar ×1, Pepper ×1"], effect: "Humungo (Psychic) Lv. 1 · Catching (Steel) Lv. 1" },
      { name: "BLT Sandwich", ingredients: ["Bacon ×1, Lettuce ×1, Tomato ×1, Mayo ×1, Mustard ×1"], effect: "Teensy (Rock) Lv. 1 · Encounter (Fairy) Lv. 1 · Catching (Grass) Lv. 1" },
      { name: "Ham Sandwich", ingredients: ["Pickle ×1, Ham ×1, Prosciutto ×1, Mayo ×1, Mustard ×1"], effect: "Teensy (Fighting) Lv. 1 · Raid (Ground) Lv. 1" },
    ],
  },
];

export const SANDWICH_GUIDE_TIPS = [
  "All sandwiches last 30 minutes. Plan your hunt around the timer.",
  "Herba Mystica drop from 5-star and 6-star Tera raids (~2–3% chance).",
  "Don't mix Sweet + Sour Herba Mystica — they cancel the Encounter Power bonus.",
  "For the full list of 150+ in-game recipes, check Game8's sandwich database.",
  "Eat a Raid Power sandwich before farming Herba Mystica raids for better drops.",
];
