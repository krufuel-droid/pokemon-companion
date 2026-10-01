/**
 * Curated item database: Mega Stones, evolution stones, and other notable
 * evolution items.
 *
 * Pokémon are referenced by species NAME (as in data/pokedex-full.json) and
 * resolved to Pokédex numbers at module load, so links stay correct.
 * To add an item: append an entry to ITEMS with the exact species names.
 */
import { getAllSpecies } from "@/lib/pokedex";

export type ItemCategory = "mega-stone" | "evolution-stone" | "evolution-item";

export interface ItemEntry {
  name: string;
  category: ItemCategory;
  description: string;
  /** Species names this item works on (may be empty). */
  pokemon: string[];
  games: string[];
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  "mega-stone": "Mega Stones",
  "evolution-stone": "Evolution Stones",
  "evolution-item": "Evolution Items",
};

const MEGA_GAMES = [
  "X/Y",
  "OR/AS",
  "Sun/Moon",
  "Let's Go",
  "Legends: Z-A",
  "Champions",
];

const megaStone = (name: string, pokemon: string): ItemEntry => ({
  name,
  category: "mega-stone",
  description: `Lets ${pokemon} Mega Evolve in battle when held.`,
  pokemon: [pokemon],
  games: MEGA_GAMES,
});

export const ITEMS: ItemEntry[] = [
  // ---- Mega Stones (all 48) ----
  megaStone("Venusaurite", "Venusaur"),
  megaStone("Charizardite X", "Charizard"),
  megaStone("Charizardite Y", "Charizard"),
  megaStone("Blastoisinite", "Blastoise"),
  megaStone("Alakazite", "Alakazam"),
  megaStone("Gengarite", "Gengar"),
  megaStone("Kangaskhanite", "Kangaskhan"),
  megaStone("Pinsirite", "Pinsir"),
  megaStone("Gyaradosite", "Gyarados"),
  megaStone("Aerodactylite", "Aerodactyl"),
  megaStone("Mewtwonite X", "Mewtwo"),
  megaStone("Mewtwonite Y", "Mewtwo"),
  megaStone("Ampharosite", "Ampharos"),
  megaStone("Scizorite", "Scizor"),
  megaStone("Heracronite", "Heracross"),
  megaStone("Houndoominite", "Houndoom"),
  megaStone("Tyranitarite", "Tyranitar"),
  megaStone("Blazikenite", "Blaziken"),
  megaStone("Gardevoirite", "Gardevoir"),
  megaStone("Mawilite", "Mawile"),
  megaStone("Aggronite", "Aggron"),
  megaStone("Medichamite", "Medicham"),
  megaStone("Manectite", "Manectric"),
  megaStone("Banettite", "Banette"),
  megaStone("Absolite", "Absol"),
  megaStone("Garchompite", "Garchomp"),
  megaStone("Lucarionite", "Lucario"),
  megaStone("Abomasite", "Abomasnow"),
  megaStone("Beedrillite", "Beedrill"),
  megaStone("Pidgeotite", "Pidgeot"),
  megaStone("Slowbronite", "Slowbro"),
  megaStone("Steelixite", "Steelix"),
  megaStone("Sceptilite", "Sceptile"),
  megaStone("Swampertite", "Swampert"),
  megaStone("Sablenite", "Sableye"),
  megaStone("Sharpedonite", "Sharpedo"),
  megaStone("Cameruptite", "Camerupt"),
  megaStone("Altarianite", "Altaria"),
  megaStone("Glalitite", "Glalie"),
  megaStone("Salamencite", "Salamence"),
  megaStone("Metagrossite", "Metagross"),
  megaStone("Latiasite", "Latias"),
  megaStone("Latiosite", "Latios"),
  megaStone("Lopunnite", "Lopunny"),
  megaStone("Galladite", "Gallade"),
  megaStone("Audinite", "Audino"),
  megaStone("Diancite", "Diancie"),

  // ---- Evolution stones ----
  {
    name: "Fire Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It burns as hot as a volcano.",
    pokemon: ["Vulpix", "Growlithe", "Eevee", "Pansear"],
    games: ["Red/Blue", "Gold/Silver", "X/Y", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Thunder Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It crackles with electricity.",
    pokemon: ["Pikachu", "Eevee", "Eelektrik", "Charjabug", "Tadbulb"],
    games: ["Red/Blue", "Black/White", "Sun/Moon", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Water Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It glistens like the ocean.",
    pokemon: ["Poliwhirl", "Shellder", "Staryu", "Eevee", "Lombre", "Panpour"],
    games: ["Red/Blue", "Diamond/Pearl", "X/Y", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Leaf Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It smells faintly of leaves.",
    pokemon: ["Gloom", "Weepinbell", "Exeggcute", "Nuzleaf", "Pansage"],
    games: ["Red/Blue", "Diamond/Pearl", "Black/White", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Moon Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It glows faintly at night.",
    pokemon: ["Nidorina", "Nidorino", "Clefairy", "Jigglypuff", "Skitty", "Munna"],
    games: ["Red/Blue", "Gold/Silver", "Diamond/Pearl", "Sword/Shield"],
  },
  {
    name: "Sun Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It feels warm as sunshine.",
    pokemon: ["Gloom", "Sunkern", "Cottonee", "Petilil", "Heliolisk"],
    games: ["Gold/Silver", "Diamond/Pearl", "Black/White", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Shiny Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It shines with dazzling light.",
    pokemon: ["Togetic", "Roselia", "Minccino", "Floette"],
    games: ["Diamond/Pearl", "Black/White", "X/Y", "Sword/Shield"],
  },
  {
    name: "Dusk Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It holds shadows within.",
    pokemon: ["Murkrow", "Misdreavus", "Lampent", "Doublade"],
    games: ["Diamond/Pearl", "Black/White", "X/Y", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Dawn Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It sparkles like a sunrise.",
    pokemon: ["Kirlia", "Snorunt"],
    games: ["Diamond/Pearl", "Black/White", "Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Ice Stone",
    category: "evolution-stone",
    description: "A peculiar stone that makes certain Pokémon evolve. It is cold enough to freeze skin.",
    pokemon: ["Vulpix", "Sandshrew", "Darumaka", "Eevee", "Crabrawler"],
    games: ["Sun/Moon", "Sword/Shield", "Scarlet/Violet"],
  },

  // ---- Other evolution items ----
  {
    name: "King's Rock",
    category: "evolution-item",
    description: "Trade while holding to evolve Poliwhirl into Politoed or Slowpoke into Slowking. May make foes flinch when held.",
    pokemon: ["Poliwhirl", "Slowpoke"],
    games: ["Gold/Silver", "Diamond/Pearl", "Black/White", "Sword/Shield"],
  },
  {
    name: "Metal Coat",
    category: "evolution-item",
    description: "Trade while holding to evolve Onix into Steelix or Scyther into Scizor. Boosts Steel moves when held.",
    pokemon: ["Onix", "Scyther"],
    games: ["Gold/Silver", "Diamond/Pearl", "Legends: Arceus", "Scarlet/Violet"],
  },
  {
    name: "Dragon Scale",
    category: "evolution-item",
    description: "Trade while holding to evolve Seadra into Kingdra.",
    pokemon: ["Seadra"],
    games: ["Gold/Silver", "Diamond/Pearl", "Black/White"],
  },
  {
    name: "Up-Grade",
    category: "evolution-item",
    description: "Trade while holding to evolve Porygon into Porygon2.",
    pokemon: ["Porygon"],
    games: ["Gold/Silver", "Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Dubious Disc",
    category: "evolution-item",
    description: "Trade while holding to evolve Porygon2 into Porygon-Z.",
    pokemon: ["Porygon2"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Electirizer",
    category: "evolution-item",
    description: "Trade while holding to evolve Electabuzz into Electivire.",
    pokemon: ["Electabuzz"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Magmarizer",
    category: "evolution-item",
    description: "Trade while holding to evolve Magmar into Magmortar.",
    pokemon: ["Magmar"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Protector",
    category: "evolution-item",
    description: "Trade while holding to evolve Rhydon into Rhyperior.",
    pokemon: ["Rhydon"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Reaper Cloth",
    category: "evolution-item",
    description: "Trade while holding to evolve Dusclops into Dusknoir.",
    pokemon: ["Dusclops"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Razor Claw",
    category: "evolution-item",
    description: "Level up at night while holding to evolve Sneasel into Weavile. Boosts critical-hit ratio when held.",
    pokemon: ["Sneasel"],
    games: ["Diamond/Pearl", "Legends: Arceus", "Scarlet/Violet"],
  },
  {
    name: "Razor Fang",
    category: "evolution-item",
    description: "Level up at night while holding to evolve Gligar into Gliscor. May make foes flinch when held.",
    pokemon: ["Gligar"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Oval Stone",
    category: "evolution-item",
    description: "Level up during the day while holding to evolve Happiny into Chansey.",
    pokemon: ["Happiny"],
    games: ["Diamond/Pearl", "Legends: Arceus"],
  },
  {
    name: "Prism Scale",
    category: "evolution-item",
    description: "Trade while holding to evolve Feebas into Milotic.",
    pokemon: ["Feebas"],
    games: ["Black/White", "X/Y", "Sword/Shield"],
  },
  {
    name: "Sachet",
    category: "evolution-item",
    description: "Trade while holding to evolve Spritzee into Aromatisse.",
    pokemon: ["Spritzee"],
    games: ["X/Y", "Sword/Shield"],
  },
  {
    name: "Whipped Dream",
    category: "evolution-item",
    description: "Trade while holding to evolve Swirlix into Slurpuff.",
    pokemon: ["Swirlix"],
    games: ["X/Y", "Sword/Shield"],
  },
  {
    name: "Sweet Apple",
    category: "evolution-item",
    description: "Evolves Applin into Appletun.",
    pokemon: ["Applin"],
    games: ["Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Tart Apple",
    category: "evolution-item",
    description: "Evolves Applin into Flapple.",
    pokemon: ["Applin"],
    games: ["Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Cracked Pot",
    category: "evolution-item",
    description: "Evolves Sinistea into Polteageist.",
    pokemon: ["Sinistea"],
    games: ["Sword/Shield", "Scarlet/Violet"],
  },
  {
    name: "Linking Cord",
    category: "evolution-item",
    description: "A mysterious cord from Hisui that evolves trade-evolution Pokémon without trading.",
    pokemon: ["Kadabra", "Machoke", "Graveler", "Haunter"],
    games: ["Legends: Arceus"],
  },
  {
    name: "Black Augurite",
    category: "evolution-item",
    description: "Evolves Scyther into Kleavor in Hisui.",
    pokemon: ["Scyther"],
    games: ["Legends: Arceus"],
  },
  {
    name: "Peat Block",
    category: "evolution-item",
    description: "Use on Ursaring during a full moon in Hisui to evolve it into Ursaluna.",
    pokemon: ["Ursaring"],
    games: ["Legends: Arceus"],
  },
  {
    name: "Scroll of Darkness",
    category: "evolution-item",
    description: "Lets Kubfu evolve into Single Strike Style Urshifu after training at the Tower of Darkness.",
    pokemon: ["Kubfu"],
    games: ["Sword/Shield (Isle of Armor)"],
  },
  {
    name: "Scroll of Waters",
    category: "evolution-item",
    description: "Lets Kubfu evolve into Rapid Strike Style Urshifu after training at the Tower of Waters.",
    pokemon: ["Kubfu"],
    games: ["Sword/Shield (Isle of Armor)"],
  },
  {
    name: "Galarica Cuff",
    category: "evolution-item",
    description: "Braided from Galarica Twigs; evolves Galarian Slowpoke into Galarian Slowbro.",
    pokemon: ["Slowpoke"],
    games: ["Sword/Shield (Isle of Armor)"],
  },
  {
    name: "Galarica Wreath",
    category: "evolution-item",
    description: "Braided from Galarica Twigs; evolves Galarian Slowpoke into Galarian Slowking.",
    pokemon: ["Slowpoke"],
    games: ["Sword/Shield (Crown Tundra)"],
  },
  {
    name: "Max Soup",
    category: "evolution-item",
    description: "Made from Max Mushrooms; gives a Gigantamax-capable Pokémon its Gigantamax form.",
    pokemon: [],
    games: ["Sword/Shield (Isle of Armor)"],
  },
];

// ---- Name → Pokédex number resolution ----
const nameToId = new Map<string, number>(
  getAllSpecies().map((s) => [s.name.toLowerCase(), s.id])
);

/** Pokédex numbers for the species an item works on. Unmatched names are dropped. */
export function getItemPokemonIds(item: ItemEntry): number[] {
  const ids: number[] = [];
  for (const name of item.pokemon) {
    const id = nameToId.get(name.toLowerCase());
    if (id !== undefined) ids.push(id);
  }
  return ids;
}

/** Species name for display next to a resolved id. */
export function getSpeciesName(id: number): string {
  return getAllSpecies().find((s) => s.id === id)?.name ?? `#${id}`;
}
