/**
 * Curated alternate-form data for the Pokédex detail pages.
 *
 * Sprite IDs were verified against the PokéAPI pokemon-form endpoint on
 * 2026-10-01; sprites use the standard raw.githubusercontent.com pattern.
 * Pokémon Champions-original Megas have no official artwork, so they reuse
 * the base species sprite and carry a note saying so.
 *
 * To add a form: append a tuple to the right list below. `types` is only
 * needed when the form's typing differs from the base species.
 */

export type FormKind = "mega" | "gigantamax" | "regional" | "champions";

export interface PokemonForm {
  formName: string;
  kind: FormKind;
  sprite: string;
  /** Types when they differ from the base species. */
  types?: string[];
  obtain: string;
  note?: string;
}

export const KIND_LABEL: Record<FormKind, string> = {
  mega: "Mega Evolution",
  gigantamax: "Gigantamax",
  regional: "Regional form",
  champions: "Champions Mega",
};

const sprite = (pokemonId: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

// [speciesId, formName, spriteId, megaStone, types?]
const MEGAS: Array<
  [number, string, number, string, string[]?]
> = [
  [3, "Mega Venusaur", 10033, "Venusaurite"],
  [6, "Mega Charizard X", 10034, "Charizardite X", ["fire", "dragon"]],
  [6, "Mega Charizard Y", 10035, "Charizardite Y"],
  [9, "Mega Blastoise", 10036, "Blastoisinite"],
  [15, "Mega Beedrill", 10090, "Beedrillite"],
  [18, "Mega Pidgeot", 10073, "Pidgeotite"],
  [65, "Mega Alakazam", 10037, "Alakazite"],
  [80, "Mega Slowbro", 10071, "Slowbronite"],
  [94, "Mega Gengar", 10038, "Gengarite"],
  [115, "Mega Kangaskhan", 10039, "Kangaskhanite"],
  [127, "Mega Pinsir", 10040, "Pinsirite", ["bug", "flying"]],
  [130, "Mega Gyarados", 10041, "Gyaradosite", ["water", "dark"]],
  [142, "Mega Aerodactyl", 10042, "Aerodactylite"],
  [150, "Mega Mewtwo X", 10043, "Mewtwonite X", ["psychic", "fighting"]],
  [150, "Mega Mewtwo Y", 10044, "Mewtwonite Y"],
  [181, "Mega Ampharos", 10045, "Ampharosite", ["electric", "dragon"]],
  [208, "Mega Steelix", 10072, "Steelixite"],
  [212, "Mega Scizor", 10046, "Scizorite"],
  [214, "Mega Heracross", 10047, "Heracronite"],
  [229, "Mega Houndoom", 10048, "Houndoominite"],
  [248, "Mega Tyranitar", 10049, "Tyranitarite"],
  [254, "Mega Sceptile", 10065, "Sceptilite", ["grass", "dragon"]],
  [257, "Mega Blaziken", 10050, "Blazikenite"],
  [260, "Mega Swampert", 10064, "Swampertite"],
  [282, "Mega Gardevoir", 10051, "Gardevoirite", ["psychic", "fairy"]],
  [302, "Mega Sableye", 10066, "Sablenite"],
  [303, "Mega Mawile", 10052, "Mawilite", ["steel", "fairy"]],
  [306, "Mega Aggron", 10053, "Aggronite", ["steel"]],
  [308, "Mega Medicham", 10054, "Medichamite"],
  [310, "Mega Manectric", 10055, "Manectite"],
  [319, "Mega Sharpedo", 10070, "Sharpedonite"],
  [323, "Mega Camerupt", 10087, "Cameruptite"],
  [334, "Mega Altaria", 10067, "Altarianite", ["dragon", "fairy"]],
  [354, "Mega Banette", 10056, "Banettite"],
  [359, "Mega Absol", 10057, "Absolite"],
  [362, "Mega Glalie", 10074, "Glalitite"],
  [373, "Mega Salamence", 10089, "Salamencite"],
  [376, "Mega Metagross", 10076, "Metagrossite"],
  [380, "Mega Latias", 10062, "Latiasite"],
  [381, "Mega Latios", 10063, "Latiosite"],
  [428, "Mega Lopunny", 10088, "Lopunnite", ["normal", "fighting"]],
  [445, "Mega Garchomp", 10058, "Garchompite"],
  [448, "Mega Lucario", 10059, "Lucarionite"],
  [460, "Mega Abomasnow", 10060, "Abomasite"],
  [475, "Mega Gallade", 10068, "Galladite"],
  [531, "Mega Audino", 10069, "Audinite", ["normal", "fairy"]],
  [719, "Mega Diancie", 10075, "Diancite"],
];

// [speciesId, formName, spriteId, obtainOverride?]
const GMAX_DEFAULT_OBTAIN = "Max Raid Battles in Pokémon Sword/Shield";
const GIGANTAMAX: Array<[number, string, number, string?]> = [
  [3, "Gigantamax Venusaur", 10195],
  [6, "Gigantamax Charizard", 10196],
  [9, "Gigantamax Blastoise", 10197],
  [12, "Gigantamax Butterfree", 10198],
  [25, "Gigantamax Pikachu", 10199, "Requires a Let's Go, Pikachu! save on your Switch (Sword/Shield)"],
  [52, "Gigantamax Meowth", 10200, "Mystery Gift event in Pokémon Sword/Shield"],
  [68, "Gigantamax Machamp", 10201],
  [94, "Gigantamax Gengar", 10202],
  [99, "Gigantamax Kingler", 10203],
  [131, "Gigantamax Lapras", 10204],
  [133, "Gigantamax Eevee", 10205, "Requires a Let's Go, Eevee! save on your Switch (Sword/Shield)"],
  [143, "Gigantamax Snorlax", 10206],
  [569, "Gigantamax Garbodor", 10207],
  [809, "Gigantamax Melmetal", 10208, "Transfer a Melmetal from Pokémon GO"],
  [812, "Gigantamax Rillaboom", 10209],
  [815, "Gigantamax Cinderace", 10210],
  [818, "Gigantamax Inteleon", 10211],
  [823, "Gigantamax Corviknight", 10212],
  [826, "Gigantamax Orbeetle", 10213],
  [839, "Gigantamax Coalossal", 10215],
  [841, "Gigantamax Flapple", 10216],
  [842, "Gigantamax Appletun", 10217],
  [843, "Gigantamax Sandaconda", 10218],
  [849, "Gigantamax Toxtricity", 10219],
  [851, "Gigantamax Centiskorch", 10220],
  [858, "Gigantamax Hatterene", 10221],
  [861, "Gigantamax Grimmsnarl", 10222],
  [869, "Gigantamax Alcremie", 10223],
  [878, "Gigantamax Copperajah", 10224],
  [884, "Gigantamax Duraludon", 10225],
  [892, "Gigantamax Urshifu (Single Strike)", 10226],
  [892, "Gigantamax Urshifu (Rapid Strike)", 10227],
];

// [speciesId, formName, spriteId, types, region]
const REGIONALS: Array<[number, string, number, string[], string]> = [
  [19, "Alolan Rattata", 10091, ["dark", "normal"], "Alola"],
  [20, "Alolan Raticate", 10092, ["dark", "normal"], "Alola"],
  [26, "Alolan Raichu", 10100, ["electric", "psychic"], "Alola"],
  [27, "Alolan Sandshrew", 10101, ["ice", "steel"], "Alola"],
  [28, "Alolan Sandslash", 10102, ["ice", "steel"], "Alola"],
  [37, "Alolan Vulpix", 10103, ["ice"], "Alola"],
  [38, "Alolan Ninetales", 10104, ["ice", "fairy"], "Alola"],
  [50, "Alolan Diglett", 10105, ["ground", "steel"], "Alola"],
  [51, "Alolan Dugtrio", 10106, ["ground", "steel"], "Alola"],
  [52, "Alolan Meowth", 10107, ["dark"], "Alola"],
  [53, "Alolan Persian", 10108, ["dark"], "Alola"],
  [74, "Alolan Geodude", 10109, ["rock", "electric"], "Alola"],
  [75, "Alolan Graveler", 10110, ["rock", "electric"], "Alola"],
  [76, "Alolan Golem", 10111, ["rock", "electric"], "Alola"],
  [88, "Alolan Grimer", 10112, ["poison", "dark"], "Alola"],
  [89, "Alolan Muk", 10113, ["poison", "dark"], "Alola"],
  [103, "Alolan Exeggutor", 10114, ["grass", "dragon"], "Alola"],
  [105, "Alolan Marowak", 10115, ["fire", "ghost"], "Alola"],
  [52, "Galarian Meowth", 10161, ["steel"], "Galar"],
  [77, "Galarian Ponyta", 10162, ["psychic"], "Galar"],
  [78, "Galarian Rapidash", 10163, ["psychic", "fairy"], "Galar"],
  [79, "Galarian Slowpoke", 10164, ["psychic"], "Galar"],
  [80, "Galarian Slowbro", 10165, ["poison", "psychic"], "Galar"],
  [83, "Galarian Farfetch'd", 10166, ["fighting"], "Galar"],
  [110, "Galarian Weezing", 10167, ["poison", "fairy"], "Galar"],
  [122, "Galarian Mr. Mime", 10168, ["ice", "psychic"], "Galar"],
  [144, "Galarian Articuno", 10169, ["psychic", "flying"], "Galar"],
  [145, "Galarian Zapdos", 10170, ["fighting", "flying"], "Galar"],
  [146, "Galarian Moltres", 10171, ["dark", "flying"], "Galar"],
  [199, "Galarian Slowking", 10172, ["poison", "psychic"], "Galar"],
  [222, "Galarian Corsola", 10173, ["ghost"], "Galar"],
  [263, "Galarian Zigzagoon", 10174, ["dark", "normal"], "Galar"],
  [264, "Galarian Linoone", 10175, ["dark", "normal"], "Galar"],
  [554, "Galarian Darumaka", 10176, ["ice"], "Galar"],
  [562, "Galarian Yamask", 10179, ["ground", "ghost"], "Galar"],
  [618, "Galarian Stunfisk", 10180, ["ground", "steel"], "Galar"],
  [58, "Hisuian Growlithe", 10229, ["fire", "rock"], "Hisui"],
  [59, "Hisuian Arcanine", 10230, ["fire", "rock"], "Hisui"],
  [100, "Hisuian Voltorb", 10231, ["electric", "grass"], "Hisui"],
  [101, "Hisuian Electrode", 10232, ["electric", "grass"], "Hisui"],
  [157, "Hisuian Typhlosion", 10233, ["fire", "ghost"], "Hisui"],
  [211, "Hisuian Qwilfish", 10234, ["dark", "poison"], "Hisui"],
  [215, "Hisuian Sneasel", 10235, ["fighting", "poison"], "Hisui"],
  [503, "Hisuian Samurott", 10236, ["water", "dark"], "Hisui"],
  [549, "Hisuian Lilligant", 10237, ["grass", "fighting"], "Hisui"],
  [570, "Hisuian Zorua", 10238, ["normal", "ghost"], "Hisui"],
  [571, "Hisuian Zoroark", 10239, ["normal", "ghost"], "Hisui"],
  [628, "Hisuian Braviary", 10240, ["psychic", "flying"], "Hisui"],
  [705, "Hisuian Sliggoo", 10241, ["steel", "dragon"], "Hisui"],
  [706, "Hisuian Goodra", 10242, ["steel", "dragon"], "Hisui"],
  [713, "Hisuian Avalugg", 10243, ["ice", "rock"], "Hisui"],
  [724, "Hisuian Decidueye", 10244, ["grass", "fighting"], "Hisui"],
  [128, "Paldean Tauros (Combat Breed)", 10250, ["fighting"], "Paldea"],
  [128, "Paldean Tauros (Blaze Breed)", 10251, ["fighting", "fire"], "Paldea"],
  [128, "Paldean Tauros (Aqua Breed)", 10252, ["fighting", "water"], "Paldea"],
  [194, "Paldean Wooper", 10253, ["poison", "ground"], "Paldea"],
];

const REGION_GAMES: Record<string, string> = {
  Alola: "Pokémon Sun/Moon",
  Galar: "Pokémon Sword/Shield",
  Hisui: "Pokémon Legends: Arceus",
  Paldea: "Pokémon Scarlet/Violet",
};

// Champions-original Megas: no official artwork exists, so the base species
// sprite is reused with an explanatory note. Stone names are not official;
// [speciesId, formName, abilityNote]
const CHAMPIONS_MEGAS: Array<[number, string, string?]> = [
  [26, "Mega Raichu X", "Ability: Electric Surge"],
  [26, "Mega Raichu Y", "Ability: No Guard"],
  [254, "Mega Sceptile", undefined],
  [257, "Mega Blaziken", undefined],
  [260, "Mega Swampert", undefined],
  [303, "Mega Mawile", undefined],
  [373, "Mega Salamence", undefined],
  [376, "Mega Metagross", undefined],
  [398, "Mega Staraptor", "Ability: Contrary"],
  [545, "Mega Scolipede", "Ability: Shell Armor"],
  [560, "Mega Scrafty", "Ability: Intimidate"],
  [604, "Mega Eelektross", "Ability: Eelevate (new!)"],
  [668, "Mega Pyroar", "Ability: Fire Mane (new!)"],
  [687, "Mega Malamar", "Ability: Contrary"],
  [689, "Mega Barbaracle", "Ability: Tough Claws"],
  [690, "Mega Dragalge", "Ability: Regenerator"],
  [768, "Mega Golisopod", undefined],
  [870, "Mega Falinks", "Ability: Defiant"],
  [998, "Mega Baxcalibur", undefined],
  [969, "Mega Glimmora", undefined],
  [359, "Mega Absol Z", "Z-Mega Evolution"],
  [445, "Mega Garchomp Z", "Z-Mega Evolution"],
  [448, "Mega Lucario Z", "Z-Mega Evolution"],
];

const CHAMPIONS_NOTE =
  "Champions-original Mega — no official artwork yet, shown with the base sprite.";

const bySpecies = new Map<number, PokemonForm[]>();

function add(speciesId: number, form: PokemonForm) {
  const list = bySpecies.get(speciesId) ?? [];
  list.push(form);
  bySpecies.set(speciesId, list);
}

for (const [speciesId, formName, spriteId, stone, types] of MEGAS) {
  add(speciesId, {
    formName,
    kind: "mega",
    sprite: sprite(spriteId),
    obtain: `Mega Stone: ${stone}`,
    ...(types ? { types } : {}),
  });
}

for (const [speciesId, formName, spriteId, obtain] of GIGANTAMAX) {
  add(speciesId, {
    formName,
    kind: "gigantamax",
    sprite: sprite(spriteId),
    obtain: obtain ?? GMAX_DEFAULT_OBTAIN,
  });
}

for (const [speciesId, formName, spriteId, types, region] of REGIONALS) {
  add(speciesId, {
    formName,
    kind: "regional",
    sprite: sprite(spriteId),
    types,
    obtain: `Wild encounters in ${region} (${REGION_GAMES[region]})`,
  });
}

for (const [speciesId, formName, ability] of CHAMPIONS_MEGAS) {
  add(speciesId, {
    formName,
    kind: "champions",
    sprite: sprite(speciesId),
    obtain: "Mega Evolution in Pokémon Champions",
    note: [CHAMPIONS_NOTE, ability].filter(Boolean).join(" "),
  });
}

/** All curated forms for a species by National Pokédex number (may be empty). */
export function getFormsForSpecies(speciesId: number): PokemonForm[] {
  return bySpecies.get(speciesId) ?? [];
}
