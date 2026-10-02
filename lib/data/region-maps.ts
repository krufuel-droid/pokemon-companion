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
};

export const REGION_LABEL: Record<string, string> = {
  galar: "Galar",
  paldea: "Paldea",
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
