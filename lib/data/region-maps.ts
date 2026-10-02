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
};

export const REGION_LABEL: Record<string, string> = {
  galar: "Galar",
};
