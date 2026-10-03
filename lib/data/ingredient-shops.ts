/**
 * Where to buy sandwich ingredients in Scarlet/Violet.
 * Shops: Deli Cioso, Sure Cans, Artisan Bakery (multiple cities),
 * Aquiesta Supermarket (Levincia only — has exclusives).
 */

export interface IngredientInfo {
  name: string;
  emoji: string;
  shops: string[];
  badges: number; // gym badges needed (0 = default)
  price: number;
}

export const INGREDIENTS: Record<string, IngredientInfo> = {
  "Chorizo": { name: "Chorizo", emoji: "🌭", shops: ["Deli Cioso"], badges: 0, price: 150 },
  "Basil": { name: "Basil", emoji: "🌿", shops: ["Deli Cioso", "Aquiesta Supermarket"], badges: 3, price: 280 },
  "Cucumber": { name: "Cucumber", emoji: "🥒", shops: ["Deli Cioso", "Aquiesta Supermarket"], badges: 1, price: 130 },
  "Yellow Bell Pepper": { name: "Yellow Bell Pepper", emoji: "🫑", shops: ["Deli Cioso"], badges: 0, price: 240 },
  "Lettuce": { name: "Lettuce", emoji: "🥬", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 90 },
  "Klawf Stick": { name: "Klawf Stick", emoji: "🦀", shops: ["Aquiesta Supermarket"], badges: 8, price: 500 },
  "Pickles": { name: "Pickles", emoji: "🥒", shops: ["Sure Cans"], badges: 0, price: 90 },
  "Pickle": { name: "Pickle", emoji: "🥒", shops: ["Sure Cans"], badges: 0, price: 90 },
  "Noodles": { name: "Noodles", emoji: "🍜", shops: ["Sure Cans"], badges: 5, price: 280 },
  "Ham": { name: "Ham", emoji: "🍖", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 170 },
  "Prosciutto": { name: "Prosciutto", emoji: "🥓", shops: ["Deli Cioso"], badges: 0, price: 200 },
  "Onion": { name: "Onion", emoji: "🧅", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 130 },
  "Cherry Tomatoes": { name: "Cherry Tomatoes", emoji: "🍅", shops: ["Sure Cans", "Aquiesta Supermarket"], badges: 1, price: 100 },
  "Jalapeño": { name: "Jalapeño", emoji: "🌶️", shops: ["Sure Cans"], badges: 4, price: 220 },
  "Red Onion": { name: "Red Onion", emoji: "🧅", shops: ["Deli Cioso"], badges: 0, price: 230 },
  "Avocado": { name: "Avocado", emoji: "🥑", shops: ["Deli Cioso", "Aquiesta Supermarket"], badges: 2, price: 180 },
  "Smoked Fillet": { name: "Smoked Fillet", emoji: "🐟", shops: ["Deli Cioso"], badges: 0, price: 330 },
  "Hamburger": { name: "Hamburger", emoji: "🍔", shops: ["Deli Cioso"], badges: 2, price: 380 },
  "Tomato": { name: "Tomato", emoji: "🍅", shops: ["Sure Cans"], badges: 0, price: 100 },
  "Egg": { name: "Egg", emoji: "🥚", shops: ["Deli Cioso"], badges: 0, price: 80 },
  "Cheese": { name: "Cheese", emoji: "🧀", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 1, price: 120 },
  "Bacon": { name: "Bacon", emoji: "🥓", shops: ["Deli Cioso"], badges: 1, price: 150 },
  "Lettuce ": { name: "Lettuce", emoji: "🥬", shops: ["Artisan Bakery"], badges: 0, price: 90 },
  "Mayo": { name: "Mayo", emoji: "🫙", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 120 },
  "Mustard": { name: "Mustard", emoji: "🫙", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 130 },
  "Marmalade": { name: "Marmalade", emoji: "🍊", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 4, price: 260 },
  "Salt": { name: "Salt", emoji: "🧂", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 90 },
  "Pepper": { name: "Pepper", emoji: "🧂", shops: ["Artisan Bakery"], badges: 0, price: 100 },
  "Vinegar": { name: "Vinegar", emoji: "🫙", shops: ["Deli Cioso", "Aquiesta Supermarket"], badges: 2, price: 300 },
  "Cream Cheese": { name: "Cream Cheese", emoji: "🧈", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 280 },
  "Watercress": { name: "Watercress", emoji: "🥗", shops: ["Deli Cioso", "Artisan Bakery"], badges: 0, price: 270 },
  "Potato Tortilla": { name: "Potato Tortilla", emoji: "🥔", shops: ["Deli Cioso"], badges: 0, price: 250 },
  "Olive Oil": { name: "Olive Oil", emoji: "🫒", shops: ["Artisan Bakery", "Aquiesta Supermarket"], badges: 0, price: 300 },
};

export const SHOP_LOCATIONS: Record<string, string> = {
  "Deli Cioso": "Mesagoza, Artazon, Cascarrafa, Cortondo, Levincia, Medali, Montenevera, Porto Marinada",
  "Sure Cans": "Artazon, Cascarrafa, Levincia, Medali, Mesagoza, Porto Marinada",
  "Artisan Bakery": "Alfornada, Artazon, Cascarrafa, Cortondo, Levincia, Medali, Mesagoza, Porto Marinada",
  "Aquiesta Supermarket": "Levincia only (north side) — exclusive items!",
};

export function getIngredientInfo(name: string): IngredientInfo | null {
  // Try exact match, then normalized
  if (INGREDIENTS[name]) return INGREDIENTS[name];
  const normalized = name.replace(/×\d+\s*/, "").trim();
  if (INGREDIENTS[normalized]) return INGREDIENTS[normalized];
  // Try without quantity prefix like "1× "
  for (const key of Object.keys(INGREDIENTS)) {
    if (normalized.toLowerCase() === key.toLowerCase()) return INGREDIENTS[key];
  }
  return null;
}
