/**
 * Curated alternate-form data for the Pokédex detail pages.
 *
 * Sprites use the Smogon Sprite Project community sprites hosted on
 * Pokémon Showdown (play.pokemonshowdown.com), replacing the PokéAPI
 * game-rip URLs on 2026-10-01 for IP hygiene. All 135 form sprite URLs
 * were verified live (HTTP 200) on 2026-10-01.
 * Pokémon Champions-original Megas have no community artwork yet, so they
 * reuse the base species sprite and carry a note saying so.
 *
 * To add a form: append a tuple to the right list below. `types` is only
 * needed when the form's typing differs from the base species.
 */

export type FormKind = "mega" | "gigantamax" | "regional" | "champions" | "mask";

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
  mask: "Mask form",
};

const sprite = (showdownName: string) =>
  `https://play.pokemonshowdown.com/sprites/gen5/${showdownName}.png`;

// [speciesId, formName, showdownSpriteName, megaStone, types?]
const MEGAS: Array<
  [number, string, string, string, string[]?]
> = [
  [3, "Mega Venusaur", "venusaur-mega", "Venusaurite"],
  [6, "Mega Charizard X", "charizard-megax", "Charizardite X", ["fire", "dragon"]],
  [6, "Mega Charizard Y", "charizard-megay", "Charizardite Y"],
  [9, "Mega Blastoise", "blastoise-mega", "Blastoisinite"],
  [15, "Mega Beedrill", "beedrill-mega", "Beedrillite"],
  [18, "Mega Pidgeot", "pidgeot-mega", "Pidgeotite"],
  [65, "Mega Alakazam", "alakazam-mega", "Alakazite"],
  [80, "Mega Slowbro", "slowbro-mega", "Slowbronite"],
  [94, "Mega Gengar", "gengar-mega", "Gengarite"],
  [115, "Mega Kangaskhan", "kangaskhan-mega", "Kangaskhanite"],
  [127, "Mega Pinsir", "pinsir-mega", "Pinsirite", ["bug", "flying"]],
  [130, "Mega Gyarados", "gyarados-mega", "Gyaradosite", ["water", "dark"]],
  [142, "Mega Aerodactyl", "aerodactyl-mega", "Aerodactylite"],
  [150, "Mega Mewtwo X", "mewtwo-megax", "Mewtwonite X", ["psychic", "fighting"]],
  [150, "Mega Mewtwo Y", "mewtwo-megay", "Mewtwonite Y"],
  [181, "Mega Ampharos", "ampharos-mega", "Ampharosite", ["electric", "dragon"]],
  [208, "Mega Steelix", "steelix-mega", "Steelixite"],
  [212, "Mega Scizor", "scizor-mega", "Scizorite"],
  [214, "Mega Heracross", "heracross-mega", "Heracronite"],
  [229, "Mega Houndoom", "houndoom-mega", "Houndoominite"],
  [248, "Mega Tyranitar", "tyranitar-mega", "Tyranitarite"],
  [254, "Mega Sceptile", "sceptile-mega", "Sceptilite", ["grass", "dragon"]],
  [257, "Mega Blaziken", "blaziken-mega", "Blazikenite"],
  [260, "Mega Swampert", "swampert-mega", "Swampertite"],
  [282, "Mega Gardevoir", "gardevoir-mega", "Gardevoirite", ["psychic", "fairy"]],
  [302, "Mega Sableye", "sableye-mega", "Sablenite"],
  [303, "Mega Mawile", "mawile-mega", "Mawilite", ["steel", "fairy"]],
  [306, "Mega Aggron", "aggron-mega", "Aggronite", ["steel"]],
  [308, "Mega Medicham", "medicham-mega", "Medichamite"],
  [310, "Mega Manectric", "manectric-mega", "Manectite"],
  [319, "Mega Sharpedo", "sharpedo-mega", "Sharpedonite"],
  [323, "Mega Camerupt", "camerupt-mega", "Cameruptite"],
  [334, "Mega Altaria", "altaria-mega", "Altarianite", ["dragon", "fairy"]],
  [354, "Mega Banette", "banette-mega", "Banettite"],
  [359, "Mega Absol", "absol-mega", "Absolite"],
  [362, "Mega Glalie", "glalie-mega", "Glalitite"],
  [373, "Mega Salamence", "salamence-mega", "Salamencite"],
  [376, "Mega Metagross", "metagross-mega", "Metagrossite"],
  [380, "Mega Latias", "latias-mega", "Latiasite"],
  [381, "Mega Latios", "latios-mega", "Latiosite"],
  [428, "Mega Lopunny", "lopunny-mega", "Lopunnite", ["normal", "fighting"]],
  [445, "Mega Garchomp", "garchomp-mega", "Garchompite"],
  [448, "Mega Lucario", "lucario-mega", "Lucarionite"],
  [460, "Mega Abomasnow", "abomasnow-mega", "Abomasite"],
  [475, "Mega Gallade", "gallade-mega", "Galladite"],
  [531, "Mega Audino", "audino-mega", "Audinite", ["normal", "fairy"]],
  [719, "Mega Diancie", "diancie-mega", "Diancite"],
];

// [speciesId, formName, showdownSpriteName, obtainOverride?]
const GMAX_DEFAULT_OBTAIN = "Max Raid Battles in Pokémon Sword/Shield";
const GIGANTAMAX: Array<[number, string, string, string?]> = [
  [3, "Gigantamax Venusaur", "venusaur-gmax"],
  [6, "Gigantamax Charizard", "charizard-gmax"],
  [9, "Gigantamax Blastoise", "blastoise-gmax"],
  [12, "Gigantamax Butterfree", "butterfree-gmax"],
  [25, "Gigantamax Pikachu", "pikachu-gmax", "Requires a Let's Go, Pikachu! save on your Switch (Sword/Shield)"],
  [52, "Gigantamax Meowth", "meowth-gmax", "Mystery Gift event in Pokémon Sword/Shield"],
  [68, "Gigantamax Machamp", "machamp-gmax"],
  [94, "Gigantamax Gengar", "gengar-gmax"],
  [99, "Gigantamax Kingler", "kingler-gmax"],
  [131, "Gigantamax Lapras", "lapras-gmax"],
  [133, "Gigantamax Eevee", "eevee-gmax", "Requires a Let's Go, Eevee! save on your Switch (Sword/Shield)"],
  [143, "Gigantamax Snorlax", "snorlax-gmax"],
  [569, "Gigantamax Garbodor", "garbodor-gmax"],
  [809, "Gigantamax Melmetal", "melmetal-gmax", "Transfer a Melmetal from Pokémon GO"],
  [812, "Gigantamax Rillaboom", "rillaboom-gmax"],
  [815, "Gigantamax Cinderace", "cinderace-gmax"],
  [818, "Gigantamax Inteleon", "inteleon-gmax"],
  [823, "Gigantamax Corviknight", "corviknight-gmax"],
  [826, "Gigantamax Orbeetle", "orbeetle-gmax"],
  [839, "Gigantamax Coalossal", "coalossal-gmax"],
  [841, "Gigantamax Flapple", "flapple-gmax"],
  [842, "Gigantamax Appletun", "appletun-gmax"],
  [844, "Gigantamax Sandaconda", "sandaconda-gmax"],
  [849, "Gigantamax Toxtricity", "toxtricity-gmax"],
  [851, "Gigantamax Centiskorch", "centiskorch-gmax"],
  [858, "Gigantamax Hatterene", "hatterene-gmax"],
  [861, "Gigantamax Grimmsnarl", "grimmsnarl-gmax"],
  [869, "Gigantamax Alcremie", "alcremie-gmax"],
  [879, "Gigantamax Copperajah", "copperajah-gmax"],
  [884, "Gigantamax Duraludon", "duraludon-gmax"],
  [892, "Gigantamax Urshifu (Single Strike)", "urshifu-gmax"],
  [892, "Gigantamax Urshifu (Rapid Strike)", "urshifu-gmax"],
];

// [speciesId, formName, showdownSpriteName, types, region]
const REGIONALS: Array<[number, string, string, string[], string]> = [
  [19, "Alolan Rattata", "rattata-alola", ["dark", "normal"], "Alola"],
  [20, "Alolan Raticate", "raticate-alola", ["dark", "normal"], "Alola"],
  [26, "Alolan Raichu", "raichu-alola", ["electric", "psychic"], "Alola"],
  [27, "Alolan Sandshrew", "sandshrew-alola", ["ice", "steel"], "Alola"],
  [28, "Alolan Sandslash", "sandslash-alola", ["ice", "steel"], "Alola"],
  [37, "Alolan Vulpix", "vulpix-alola", ["ice"], "Alola"],
  [38, "Alolan Ninetales", "ninetales-alola", ["ice", "fairy"], "Alola"],
  [50, "Alolan Diglett", "diglett-alola", ["ground", "steel"], "Alola"],
  [51, "Alolan Dugtrio", "dugtrio-alola", ["ground", "steel"], "Alola"],
  [52, "Alolan Meowth", "meowth-alola", ["dark"], "Alola"],
  [53, "Alolan Persian", "persian-alola", ["dark"], "Alola"],
  [74, "Alolan Geodude", "geodude-alola", ["rock", "electric"], "Alola"],
  [75, "Alolan Graveler", "graveler-alola", ["rock", "electric"], "Alola"],
  [76, "Alolan Golem", "golem-alola", ["rock", "electric"], "Alola"],
  [88, "Alolan Grimer", "grimer-alola", ["poison", "dark"], "Alola"],
  [89, "Alolan Muk", "muk-alola", ["poison", "dark"], "Alola"],
  [103, "Alolan Exeggutor", "exeggutor-alola", ["grass", "dragon"], "Alola"],
  [105, "Alolan Marowak", "marowak-alola", ["fire", "ghost"], "Alola"],
  [52, "Galarian Meowth", "meowth-galar", ["steel"], "Galar"],
  [77, "Galarian Ponyta", "ponyta-galar", ["psychic"], "Galar"],
  [78, "Galarian Rapidash", "rapidash-galar", ["psychic", "fairy"], "Galar"],
  [79, "Galarian Slowpoke", "slowpoke-galar", ["psychic"], "Galar"],
  [80, "Galarian Slowbro", "slowbro-galar", ["poison", "psychic"], "Galar"],
  [83, "Galarian Farfetch'd", "farfetchd-galar", ["fighting"], "Galar"],
  [110, "Galarian Weezing", "weezing-galar", ["poison", "fairy"], "Galar"],
  [122, "Galarian Mr. Mime", "mrmime-galar", ["ice", "psychic"], "Galar"],
  [144, "Galarian Articuno", "articuno-galar", ["psychic", "flying"], "Galar"],
  [145, "Galarian Zapdos", "zapdos-galar", ["fighting", "flying"], "Galar"],
  [146, "Galarian Moltres", "moltres-galar", ["dark", "flying"], "Galar"],
  [199, "Galarian Slowking", "slowking-galar", ["poison", "psychic"], "Galar"],
  [222, "Galarian Corsola", "corsola-galar", ["ghost"], "Galar"],
  [263, "Galarian Zigzagoon", "zigzagoon-galar", ["dark", "normal"], "Galar"],
  [264, "Galarian Linoone", "linoone-galar", ["dark", "normal"], "Galar"],
  [554, "Galarian Darumaka", "darumaka-galar", ["ice"], "Galar"],
  [562, "Galarian Yamask", "yamask-galar", ["ground", "ghost"], "Galar"],
  [618, "Galarian Stunfisk", "stunfisk-galar", ["ground", "steel"], "Galar"],
  [58, "Hisuian Growlithe", "growlithe-hisui", ["fire", "rock"], "Hisui"],
  [59, "Hisuian Arcanine", "arcanine-hisui", ["fire", "rock"], "Hisui"],
  [100, "Hisuian Voltorb", "voltorb-hisui", ["electric", "grass"], "Hisui"],
  [101, "Hisuian Electrode", "electrode-hisui", ["electric", "grass"], "Hisui"],
  [157, "Hisuian Typhlosion", "typhlosion-hisui", ["fire", "ghost"], "Hisui"],
  [211, "Hisuian Qwilfish", "qwilfish-hisui", ["dark", "poison"], "Hisui"],
  [215, "Hisuian Sneasel", "sneasel-hisui", ["fighting", "poison"], "Hisui"],
  [503, "Hisuian Samurott", "samurott-hisui", ["water", "dark"], "Hisui"],
  [549, "Hisuian Lilligant", "lilligant-hisui", ["grass", "fighting"], "Hisui"],
  [570, "Hisuian Zorua", "zorua-hisui", ["normal", "ghost"], "Hisui"],
  [571, "Hisuian Zoroark", "zoroark-hisui", ["normal", "ghost"], "Hisui"],
  [628, "Hisuian Braviary", "braviary-hisui", ["psychic", "flying"], "Hisui"],
  [705, "Hisuian Sliggoo", "sliggoo-hisui", ["steel", "dragon"], "Hisui"],
  [706, "Hisuian Goodra", "goodra-hisui", ["steel", "dragon"], "Hisui"],
  [713, "Hisuian Avalugg", "avalugg-hisui", ["ice", "rock"], "Hisui"],
  [724, "Hisuian Decidueye", "decidueye-hisui", ["grass", "fighting"], "Hisui"],
  [128, "Paldean Tauros (Combat Breed)", "tauros-paldeacombat", ["fighting"], "Paldea"],
  [128, "Paldean Tauros (Blaze Breed)", "tauros-paldeablaze", ["fighting", "fire"], "Paldea"],
  [128, "Paldean Tauros (Aqua Breed)", "tauros-paldeaaqua", ["fighting", "water"], "Paldea"],
  [194, "Paldean Wooper", "wooper-paldea", ["poison", "ground"], "Paldea"],
];

const REGION_GAMES: Record<string, string> = {
  Alola: "Pokémon Sun/Moon",
  Galar: "Pokémon Sword/Shield",
  Hisui: "Pokémon Legends: Arceus",
  Paldea: "Pokémon Scarlet/Violet",
};

// Champions-original Megas: no community artwork exists, so the base species
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

// Base-species Showdown sprite names for the Champions-original Megas above.
const CHAMPIONS_BASE_SPRITES: Record<number, string> = {
  26: "raichu", 254: "sceptile", 257: "blaziken", 260: "swampert",
  303: "mawile", 359: "absol", 373: "salamence", 376: "metagross",
  398: "staraptor", 445: "garchomp", 448: "lucario", 545: "scolipede",
  560: "scrafty", 604: "eelektross", 668: "pyroar", 687: "malamar",
  689: "barbaracle", 690: "dragalge", 768: "golisopod", 870: "falinks",
  969: "glimmora", 998: "baxcalibur",
};

const CHAMPIONS_NOTE =
  "Champions-original Mega — no official artwork yet, shown with the base sprite.";

const bySpecies = new Map<number, PokemonForm[]>();

function add(speciesId: number, form: PokemonForm) {
  const list = bySpecies.get(speciesId) ?? [];
  list.push(form);
  bySpecies.set(speciesId, list);
}

for (const [speciesId, formName, showdownName, stone, types] of MEGAS) {
  add(speciesId, {
    formName,
    kind: "mega",
    sprite: sprite(showdownName),
    obtain: `Mega Stone: ${stone}`,
    ...(types ? { types } : {}),
  });
}

for (const [speciesId, formName, showdownName, obtain] of GIGANTAMAX) {
  add(speciesId, {
    formName,
    kind: "gigantamax",
    sprite: sprite(showdownName),
    obtain: obtain ?? GMAX_DEFAULT_OBTAIN,
  });
}

for (const [speciesId, formName, showdownName, types, region] of REGIONALS) {
  add(speciesId, {
    formName,
    kind: "regional",
    sprite: sprite(showdownName),
    types,
    obtain: `Wild encounters in ${region} (${REGION_GAMES[region]})`,
  });
}

for (const [speciesId, formName, ability] of CHAMPIONS_MEGAS) {
  add(speciesId, {
    formName,
    kind: "champions",
    sprite: sprite(CHAMPIONS_BASE_SPRITES[speciesId]),
    obtain: "Mega Evolution in Pokémon Champions",
    note: [CHAMPIONS_NOTE, ability].filter(Boolean).join(" "),
  });
}

// [speciesId, formName, showdownSpriteName, types, obtain]
const MASKS: Array<[number, string, string, string[], string]> = [
  [
    1017,
    "Wellspring Mask",
    "ogerpon-wellspring",
    ["grass", "water"],
    "Ogerpon wears the Wellspring Mask — earned in The Teal Mask story (Kitakami)",
  ],
  [
    1017,
    "Hearthflame Mask",
    "ogerpon-hearthflame",
    ["grass", "fire"],
    "Ogerpon wears the Hearthflame Mask — earned in The Teal Mask story (Kitakami)",
  ],
  [
    1017,
    "Cornerstone Mask",
    "ogerpon-cornerstone",
    ["grass", "rock"],
    "Ogerpon wears the Cornerstone Mask — earned in The Teal Mask story (Kitakami)",
  ],
];

for (const [speciesId, formName, showdownName, types, obtain] of MASKS) {
  add(speciesId, {
    formName,
    kind: "mask",
    sprite: sprite(showdownName),
    types,
    obtain,
  });
}

/** All curated forms for a species by National Pokédex number (may be empty). */
export function getFormsForSpecies(speciesId: number): PokemonForm[] {
  return bySpecies.get(speciesId) ?? [];
}

export interface RegionalForm {
  speciesId: number;
  formName: string;
  sprite: string;
  types: string[];
  region: string;
}

/** Every curated regional variant (Alola/Galar/Hisui/Paldea), in Pokédex order. */
export function getRegionalForms(): RegionalForm[] {
  return REGIONALS.map(([speciesId, formName, showdownName, types, region]) => ({
    speciesId,
    formName,
    sprite: sprite(showdownName),
    types,
    region,
  }));
}

/** Region names present in the regional-form data, in display order. */
export const REGIONAL_REGIONS = ["Alola", "Galar", "Hisui", "Paldea"] as const;
