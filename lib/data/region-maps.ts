/**
 * Galar region map data for the custom interactive encounter maps.
 *
 * Coordinates are on a 0–200 grid over the stylized Galar SVG map.
 * Positions are approximate, based on the official Galar region layout:
 * mainland (south→north), Isle of Armor (east), Crown Tundra (far south).
 */

export interface MapLocation {
  /** [x, y] on the 0–200 map grid. */
  coords: [number, number];
  /** Short label shown on the map for major landmarks. */
  label?: string;
}

export const GALAR_LOCATIONS: Record<string, MapLocation> = {
  // --- Mainland: far south ---
  postwick: { coords: [70, 145], label: "Postwick" },
  wedgehurst: { coords: [80, 138], label: "Wedgehurst" },
  "slumbering-weald": { coords: [60, 135], label: "Slumbering Weald" },
  "galar-route-1": { coords: [84, 134] },
  "galar-route-2": { coords: [90, 126] },
  // --- Wild Area (central-south) ---
  "rolling-fields": { coords: [100, 120] },
  "dappled-grove": { coords: [85, 115], label: "Dappled Grove" },
  "watchtower-ruins": { coords: [95, 112] },
  "west-lake-axewell": { coords: [85, 108] },
  "east-lake-axewell": { coords: [115, 115] },
  "axews-eye": { coords: [100, 105] },
  "south-lake-miloch": { coords: [105, 125] },
  "north-lake-miloch": { coords: [110, 100] },
  "motostoke-riverbank": { coords: [120, 118] },
  "bridge-field": { coords: [110, 112] },
  "stony-wilderness": { coords: [125, 108] },
  "dusty-bowl": { coords: [118, 102] },
  "giants-mirror": { coords: [95, 98] },
  "giants-cap": { coords: [110, 95] },
  "giants-seat": { coords: [105, 92] },
  "hammerlocke-hills": { coords: [120, 98] },
  "lake-of-outrage": { coords: [90, 90] },
  "meetup-spot": { coords: [100, 118] },
  "dyna-tree-hill": { coords: [96, 86] },
  "galar-wild-area-max-dens": { coords: [105, 110] },
  "roaming-galar-wild-area": { coords: [105, 110] },
  // --- Central ---
  motostoke: { coords: [115, 115], label: "Motostoke" },
  "motostoke-outskirts": { coords: [118, 118] },
  "galar-route-3": { coords: [90, 105] },
  "galar-mine": { coords: [80, 100], label: "Galar Mine" },
  "galar-mine-no-2": { coords: [110, 88] },
  // --- West ---
  "galar-route-4": { coords: [70, 95] },
  turffield: { coords: [55, 90], label: "Turffield" },
  "galar-route-5": { coords: [60, 82] },
  hulbury: { coords: [50, 80], label: "Hulbury" },
  "energy-plant": { coords: [58, 78] },
  // --- East-central ---
  "galar-route-6": { coords: [110, 80] },
  "stow-on-side": { coords: [125, 75], label: "Stow-on-Side" },
  "glimwood-tangle": { coords: [135, 70], label: "Glimwood Tangle" },
  ballonlea: { coords: [145, 68], label: "Ballonlea" },
  "galar-route-7": { coords: [135, 65] },
  "lakeside-cave": { coords: [130, 72] },
  "old-cemetery": { coords: [132, 62] },
  // --- North ---
  "galar-route-8": { coords: [110, 60] },
  circhester: { coords: [105, 55], label: "Circhester" },
  "galar-route-9": { coords: [120, 50] },
  spikemuth: { coords: [135, 48], label: "Spikemuth" },
  "warm-up-tunnel": { coords: [115, 45] },
  "galar-route-10": { coords: [110, 40] },
  wyndon: { coords: [105, 32], label: "Wyndon" },
  "galar-battle-tower": { coords: [105, 28] },
  // --- Isle of Armor (east) ---
  "fields-of-honor": { coords: [175, 105], label: "Fields of Honor" },
  "soothing-wetlands": { coords: [180, 100] },
  "forest-of-focus": { coords: [185, 108] },
  "challenge-beach": { coords: [188, 115] },
  "challenge-road": { coords: [182, 112] },
  "brawlers-cave": { coords: [180, 108] },
  "tower-of-waters": { coords: [185, 105] },
  "tower-of-darkness": { coords: [178, 110] },
  "master-dojo": { coords: [182, 106], label: "Master Dojo" },
  "training-lowlands": { coords: [175, 118] },
  "potbottom-desert": { coords: [185, 122] },
  "workout-sea": { coords: [172, 125] },
  "stepping-stone-sea": { coords: [180, 128] },
  "insular-sea": { coords: [188, 125] },
  "honeycalm-sea": { coords: [185, 95] },
  "honeycalm-island": { coords: [188, 92] },
  "loop-lagoon": { coords: [178, 98] },
  "roaring-sea-caves": { coords: [172, 100] },
  "courageous-cavern": { coords: [183, 118] },
  "isle-of-armor-caves": { coords: [180, 108] },
  "roaming-isle-of-armor": { coords: [180, 110] },
  // --- Crown Tundra (far south) ---
  freezington: { coords: [100, 170], label: "Freezington" },
  "frostpoint-field": { coords: [100, 165] },
  "slippery-slope": { coords: [90, 172] },
  "giants-bed": { coords: [110, 175], label: "Giant's Bed" },
  "ballimere-lake": { coords: [120, 178] },
  "snowslide-slope": { coords: [110, 182] },
  "tunnel-to-the-top": { coords: [105, 185] },
  "path-to-the-peak": { coords: [100, 188] },
  "crown-shrine": { coords: [100, 191], label: "Crown Shrine" },
  "max-lair": { coords: [115, 180], label: "Max Lair" },
  "frigid-sea": { coords: [130, 175] },
  "three-point-pass": { coords: [125, 182] },
  "giants-foot": { coords: [95, 178] },
  "roaming-crown-tundra": { coords: [105, 178] },
  // --- Ruins (legendary birds / golems) ---
  "galar-iceberg-ruins": { coords: [108, 176] },
  "galar-iron-ruins": { coords: [112, 176] },
  "galar-rock-peak-ruins": { coords: [104, 180] },
  "split-decision-ruins": { coords: [122, 180] },
  // --- Misc ---
  hammerlocke: { coords: [118, 94], label: "Hammerlocke" },
  "steamdrift-way": { coords: [128, 178] },
};

/** Game version → region key for map lookup. */
export const VERSION_REGION: Record<string, string> = {
  sword: "galar",
  shield: "galar",
  scarlet: "paldea",
  violet: "paldea",
  red: "kanto",
  blue: "kanto",
  yellow: "kanto",
  green: "kanto",
  firered: "kanto",
  leafgreen: "kanto",
  "lets-go-pikachu": "kanto",
  "lets-go-eevee": "kanto",
  gold: "johto",
  silver: "johto",
  crystal: "johto",
  heartgold: "johto",
  soulsilver: "johto",
};

export const REGION_LABEL: Record<string, string> = {
  galar: "Galar",
  paldea: "Paldea",
  kanto: "Kanto",
  johto: "Johto",
};

/**
 * Paldea region map data (Scarlet/Violet), including the Kitakami highlands
 * (Teal Mask DLC) and the Blueberry Academy Terarium (Indigo Disk DLC).
 * Coordinates on the same 0–200 grid as Galar.
 */
export const PALDEA_LOCATIONS: Record<string, MapLocation> = {
  // --- South Paldea ---
  "cabo-poco": { coords: [60, 170], label: "Cabo Poco" },
  "los-platos": { coords: [85, 165], label: "Los Platos" },
  "poco-path": { coords: [75, 160] },
  "south-paldean-sea": { coords: [100, 185] },
  // --- Southwest ---
  cortondo: { coords: [55, 145], label: "Cortondo" },
  alfornada: { coords: [40, 140], label: "Alfornada" },
  "alfornada-cavern": { coords: [42, 142] },
  // --- West ---
  cascarrafa: { coords: [45, 110], label: "Cascarrafa" },
  "porto-marinada": { coords: [35, 115], label: "Porto Marinada" },
  "west-paldean-sea": { coords: [22, 120] },
  "inlet-grotto": { coords: [40, 125] },
  // --- Center ---
  mesagoza: { coords: [100, 130], label: "Mesagoza" },
  "area-zero": { coords: [100, 132], label: "Area Zero" },
  "zero-lab": { coords: [100, 134] },
  "naranja-academy": { coords: [100, 128] },
  "uva-academy": { coords: [100, 128] },
  // --- West-central ---
  "asado-desert": { coords: [60, 115], label: "Asado Desert" },
  medali: { coords: [75, 95], label: "Medali" },
  // --- Northwest ---
  "casseroya-lake": { coords: [60, 70], label: "Casseroya Lake" },
  "crystal-pool": { coords: [65, 75] },
  // --- East-central ---
  "tagtree-thicket": { coords: [130, 110], label: "Tagtree Thicket" },
  artazon: { coords: [145, 135], label: "Artazon" },
  // --- East ---
  levincia: { coords: [165, 110], label: "Levincia" },
  "east-paldean-sea": { coords: [180, 120] },
  // --- Northeast ---
  zapapico: { coords: [150, 75], label: "Zapapico" },
  "dalizapa-passage": { coords: [140, 60] },
  "pokemon-league": { coords: [155, 55], label: "Pokémon League" },
  // --- North ---
  montenevera: { coords: [120, 45], label: "Montenevera" },
  "glaseado-mountain": { coords: [125, 25], label: "Glaseado Mt." },
  "socarrat-trail": { coords: [135, 40] },
  "north-paldean-sea": { coords: [100, 12] },
  // --- Provinces: south ---
  "paldea-south-province-area-one": { coords: [85, 155] },
  "paldea-south-province-area-two": { coords: [70, 150] },
  "paldea-south-province-area-three": { coords: [110, 150] },
  "paldea-south-province-area-four": { coords: [95, 145] },
  "paldea-south-province-area-five": { coords: [120, 145] },
  "paldea-south-province-area-six": { coords: [60, 135] },
  // --- Provinces: west ---
  "paldea-west-province-area-one": { coords: [50, 125] },
  "paldea-west-province-area-two": { coords: [55, 100] },
  "paldea-west-province-area-three": { coords: [70, 85] },
  // --- Provinces: east ---
  "paldea-east-province-area-one": { coords: [135, 125] },
  "paldea-east-province-area-two": { coords: [150, 115] },
  "paldea-east-province-area-three": { coords: [140, 95] },
  // --- Provinces: north ---
  "paldea-north-province-area-one": { coords: [110, 70] },
  "paldea-north-province-area-two": { coords: [125, 60] },
  "paldea-north-province-area-three": { coords: [115, 50] },
  // --- Team Star bases ---
  "segin-squads-base": { coords: [75, 140] },
  "schedar-squads-base": { coords: [120, 130] },
  "navi-squads-base": { coords: [135, 100] },
  "ruchbah-squads-base": { coords: [90, 60] },
  "caph-squads-base": { coords: [110, 35] },
  // --- Ruinous shrines ---
  "grasswither-shrine": { coords: [55, 120] },
  "icerend-shrine": { coords: [125, 30] },
  "groundblight-shrine": { coords: [145, 120] },
  "firescourge-shrine": { coords: [70, 80] },
  // --- Misc Paldea ---
  "apple-hills": { coords: [90, 140] },
  "dreaded-den": { coords: [100, 135] },
  "mossfell-confluence": { coords: [70, 90] },
  "wistful-fields": { coords: [120, 90] },
  "chargestone-cavern": { coords: [105, 75] },
  "chilling-waterhead": { coords: [130, 85] },
  "infernal-pass": { coords: [145, 90] },
  "fellhorn-gorge": { coords: [150, 65] },
  "paradise-barrens": { coords: [115, 105] },
  "torchlit-labyrinth": { coords: [125, 115] },
  // --- Kitakami (Teal Mask DLC, northeast highlands) ---
  "mossui-town": { coords: [178, 42], label: "Mossui Town" },
  "kitakami-wilds": { coords: [174, 36] },
  "oni-mountain": { coords: [180, 28], label: "Oni Mountain" },
  "onis-maw": { coords: [183, 32] },
  "loyalty-plaza": { coords: [178, 44] },
  "kitakami-hall": { coords: [178, 40] },
  "kitakami-road": { coords: [174, 46] },
  "revelers-road": { coords: [172, 42] },
  "timeless-woods": { coords: [186, 36] },
  // --- Blueberry Academy Terarium (Indigo Disk DLC) ---
  "savanna-biome": { coords: [168, 162], label: "Savanna Biome" },
  "coastal-biome": { coords: [182, 162], label: "Coastal Biome" },
  "canyon-biome": { coords: [168, 174], label: "Canyon Biome" },
  "polar-biome": { coords: [182, 174], label: "Polar Biome" },
  "central-plaza": { coords: [175, 168] },
  "savanna-plaza": { coords: [168, 165] },
  "coastal-plaza": { coords: [182, 165] },
  "canyon-plaza": { coords: [168, 171] },
  "polar-plaza": { coords: [182, 171] },
  "league-club-room": { coords: [175, 166] },
};

/**
 * Kanto region map data (Red/Blue/Yellow, FireRed/LeafGreen, Let's Go),
 * including the Sevii Islands archipelago to the far south.
 * Coordinates on the same 0–200 grid.
 */
export const KANTO_LOCATIONS: Record<string, MapLocation> = {
  // --- Southwest: home ---
  "pallet-town": { coords: [60, 160], label: "Pallet Town" },
  "kanto-route-1": { coords: [60, 150] },
  "viridian-city": { coords: [60, 140], label: "Viridian City" },
  "kanto-route-22": { coords: [45, 140] },
  "kanto-route-23": { coords: [32, 122] },
  "kanto-route-26": { coords: [25, 136] },
  "kanto-route-27": { coords: [18, 138] },
  "kanto-route-28": { coords: [14, 130], label: "Mt. Silver" },
  "kanto-victory-road-1": { coords: [35, 132] },
  "kanto-victory-road-2": { coords: [32, 128] },
  "indigo-plateau": { coords: [28, 124], label: "Indigo Plateau" },
  // --- West ---
  "kanto-route-2": { coords: [60, 130] },
  "viridian-forest": { coords: [60, 122], label: "Viridian Forest" },
  "pewter-city": { coords: [60, 112], label: "Pewter City" },
  "kanto-route-3": { coords: [75, 112] },
  "mt-moon": { coords: [88, 112], label: "Mt. Moon" },
  "kanto-route-4": { coords: [100, 112] },
  // --- Northeast ---
  "cerulean-city": { coords: [112, 112], label: "Cerulean City" },
  "kanto-route-24": { coords: [118, 102] },
  "kanto-route-25": { coords: [122, 94] },
  "cerulean-cave": { coords: [106, 100], label: "Cerulean Cave" },
  // --- East-central ---
  "kanto-route-9": { coords: [125, 130] },
  "kanto-route-10": { coords: [130, 120] },
  "rock-tunnel": { coords: [132, 112], label: "Rock Tunnel" },
  "kanto-power-plant": { coords: [136, 118] },
  "lavender-town": { coords: [136, 128], label: "Lavender Town" },
  "pokemon-tower": { coords: [136, 126] },
  // --- Center ---
  "saffron-city": { coords: [112, 128], label: "Saffron City" },
  "kanto-route-5": { coords: [112, 120] },
  "kanto-underground-path": { coords: [112, 130] },
  "kanto-route-6": { coords: [112, 138] },
  "kanto-route-7": { coords: [100, 128] },
  "kanto-route-8": { coords: [124, 128] },
  // --- West-central ---
  "celadon-city": { coords: [88, 128], label: "Celadon City" },
  "kanto-route-16": { coords: [78, 128] },
  "kanto-route-17": { coords: [70, 136] },
  "kanto-route-18": { coords: [70, 146] },
  // --- South-central ---
  "fuchsia-city": { coords: [70, 156], label: "Fuchsia City" },
  "kanto-safari-zone": { coords: [70, 159] },
  "kanto-route-15": { coords: [85, 159] },
  "kanto-route-14": { coords: [96, 159] },
  "kanto-route-13": { coords: [106, 159] },
  "kanto-route-12": { coords: [115, 156] },
  // --- South coast & sea ---
  "vermilion-city": { coords: [112, 148], label: "Vermilion City" },
  "ss-anne": { coords: [114, 152] },
  "digletts-cave": { coords: [125, 148] },
  "kanto-route-11": { coords: [128, 148] },
  "kanto-sea-route-19": { coords: [90, 168] },
  "kanto-sea-route-20": { coords: [104, 170] },
  "seafoam-islands": { coords: [114, 172], label: "Seafoam Islands" },
  "kanto-sea-route-21": { coords: [124, 170] },
  "cinnabar-island": { coords: [70, 178], label: "Cinnabar Island" },
  "pokemon-mansion": { coords: [70, 181] },
  // --- Sevii Islands (far south) ---
  "one-island": { coords: [40, 192], label: "One Island" },
  "kindle-road": { coords: [45, 194] },
  "mt-ember": { coords: [48, 196], label: "Mt. Ember" },
  "berry-forest": { coords: [43, 193] },
  "two-island": { coords: [68, 192], label: "Two Island" },
  "cape-brink": { coords: [66, 194] },
  "bond-bridge": { coords: [72, 194] },
  "treasure-beach": { coords: [68, 196] },
  "three-island": { coords: [98, 192], label: "Three Island" },
  "three-isle-path": { coords: [96, 194] },
  "three-isle-port": { coords: [100, 194] },
  "green-path": { coords: [98, 196] },
  "four-island": { coords: [122, 192], label: "Four Island" },
  "icefall-cave": { coords: [124, 194] },
  "five-island": { coords: [144, 192], label: "Five Island" },
  "five-isle-meadow": { coords: [146, 194] },
  "memorial-pillar": { coords: [142, 194] },
  "lost-cave": { coords: [146, 196] },
  "six-island": { coords: [162, 192], label: "Six Island" },
  "pattern-bush": { coords: [160, 194] },
  "ruin-valley": { coords: [164, 194] },
  "kanto-altering-cave": { coords: [162, 196] },
  "seven-island": { coords: [178, 192], label: "Seven Island" },
  "sevault-canyon": { coords: [180, 194] },
  "tanoby-ruins": { coords: [184, 197], label: "Tanoby Ruins" },
  "water-labyrinth": { coords: [168, 196] },
  "water-path": { coords: [172, 196] },
  "resort-gorgeous": { coords: [174, 194] },
  "trainer-tower": { coords: [176, 192] },
  "outcast-island": { coords: [76, 196] },
  "canyon-entrance": { coords: [100, 198] },
  // Tanoby Ruins Unown chambers (clustered at the ruins)
  "monean-chamber": { coords: [184, 197] },
  "liptoo-chamber": { coords: [185, 197] },
  "weepth-chamber": { coords: [183, 198] },
  "dilford-chamber": { coords: [185, 198] },
  "scufib-chamber": { coords: [184, 196] },
  "rixy-chamber": { coords: [186, 197] },
  "viapos-chamber": { coords: [183, 197] },
  // Event islands
  "navel-rock": { coords: [110, 200] },
  "birth-island": { coords: [90, 200] },
  // Misc
  "roaming-kanto": { coords: [100, 130] },
  "kanto-pokecenter": { coords: [112, 128] },
  "kanto-pokemart": { coords: [112, 129] },
};

/**
 * Johto region map data (Gold/Silver/Crystal, HeartGold/SoulSilver).
 * Coordinates on the same 0–200 grid.
 */
export const JOHTO_LOCATIONS: Record<string, MapLocation> = {
  // --- Far northeast ---
  "blackthorn-city": { coords: [150, 40], label: "Blackthorn City" },
  "dragons-den": { coords: [152, 44] },
  "ice-path": { coords: [140, 50], label: "Ice Path" },
  "johto-route-44": { coords: [135, 55] },
  "johto-route-45": { coords: [130, 65] },
  "johto-route-46": { coords: [125, 55] },
  // --- Northeast ---
  "mahogany-town": { coords: [120, 70], label: "Mahogany Town" },
  "lake-of-rage": { coords: [120, 60], label: "Lake of Rage" },
  "johto-route-43": { coords: [120, 76] },
  "team-rocket-hq": { coords: [120, 72] },
  "mt-mortar": { coords: [110, 80], label: "Mt. Mortar" },
  "johto-route-42": { coords: [105, 83] },
  // --- North-central ---
  "ecruteak-city": { coords: [95, 86], label: "Ecruteak City" },
  "bell-tower": { coords: [95, 83] },
  "burned-tower": { coords: [93, 88] },
  "bellchime-trail": { coords: [97, 84] },
  "embedded-tower": { coords: [98, 80] },
  // --- East-central ---
  "violet-city": { coords: [80, 96], label: "Violet City" },
  "sprout-tower": { coords: [80, 94] },
  "johto-route-36": { coords: [87, 90] },
  "johto-route-37": { coords: [90, 92] },
  "ruins-of-alph": { coords: [82, 103], label: "Ruins of Alph" },
  "johto-route-32": { coords: [82, 109] },
  "union-cave": { coords: [82, 115] },
  "johto-route-33": { coords: [76, 118] },
  // --- South-central ---
  "azalea-town": { coords: [70, 121], label: "Azalea Town" },
  "slowpoke-well": { coords: [70, 123] },
  "ilex-forest": { coords: [75, 126], label: "Ilex Forest" },
  // --- Central ---
  "goldenrod-city": { coords: [86, 119], label: "Goldenrod City" },
  "radio-tower": { coords: [86, 117] },
  "goldenrod-tunnel": { coords: [86, 121] },
  "johto-route-34": { coords: [76, 116] },
  "johto-route-35": { coords: [89, 111] },
  "national-park": { coords: [90, 106], label: "National Park" },
  "pokeathlon-dome": { coords: [88, 113] },
  // --- West-central ---
  "johto-route-38": { coords: [76, 101] },
  "johto-route-39": { coords: [66, 101] },
  "olivine-city": { coords: [56, 101], label: "Olivine City" },
  "johto-lighthouse": { coords: [56, 99] },
  "ss-aqua": { coords: [54, 103] },
  "frontier-access": { coords: [50, 92] },
  // --- Far west ---
  "cianwood-city": { coords: [36, 111], label: "Cianwood City" },
  "johto-sea-route-40": { coords: [46, 106] },
  "johto-sea-route-41": { coords: [41, 116] },
  "whirl-islands": { coords: [51, 126], label: "Whirl Islands" },
  "cliff-cave": { coords: [39, 113] },
  "cliff-edge-gate": { coords: [41, 109] },
  "johto-route-47": { coords: [31, 116] },
  "johto-route-48": { coords: [29, 121] },
  "johto-safari-zone": { coords: [33, 126], label: "Safari Zone" },
  "safari-zone-gate": { coords: [35, 124] },
  // --- Southeast ---
  "new-bark-town": { coords: [110, 141], label: "New Bark Town" },
  "cherrygrove-city": { coords: [96, 143], label: "Cherrygrove City" },
  "johto-route-29": { coords: [103, 142] },
  "johto-route-30": { coords: [96, 136] },
  "johto-route-31": { coords: [89, 131] },
  "dark-cave": { coords: [91, 133] },
  // --- Northwest (Mt. Silver) ---
  "mt-silver": { coords: [60, 60], label: "Mt. Silver" },
  "mt-silver-cave": { coords: [60, 58] },
  "tohjo-falls": { coords: [70, 70], label: "Tohjo Falls" },
  "sinjoh-ruins": { coords: [65, 64] },
  // --- Misc ---
  "roaming-johto": { coords: [90, 110] },
  "johto-pokemart": { coords: [86, 119] },
  "pokewalker": { coords: [90, 110] },
  "unknown-all-bugs": { coords: [82, 103] },
  "unknown-all-poliwag": { coords: [82, 103] },
  "unknown-all-rattata": { coords: [82, 103] },
};
