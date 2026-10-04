/**
 * Gen 3 story-dungeon maps (Gen 3 dungeon researcher workstream).
 *
 * Schematic, hand-drawn-style floor maps for the major story dungeons of
 * Pokémon Ruby/Sapphire/Emerald and Omega Ruby/Alpha Sapphire. Grids are
 * READABLE APPROXIMATIONS, not pixel-perfect recreations.
 *
 * Grid legend: '#' wall, '.' walkable, 'S' stairs/ladder/warp pad,
 * 'I' item ball, 'T' trainer/NPC, 'E' entrance, 'X' exit.
 * Coordinates are 0-indexed: x = column, y = row.
 *
 * Item lists were researched from Bulbapedia dungeon pages (Oct 2026).
 * Hidden items and HM/requirement notes are called out in item notes.
 */

export interface DungeonMapItem {
  x: number;
  y: number;
  name: string;
  /** e.g. "hidden", "requires Surf", "from NPC after battle" */
  note?: string;
}

export interface DungeonMapTrainer {
  x: number;
  y: number;
  note: string;
}

export interface DungeonFloor {
  /** e.g. "1F", "B1F" */
  name: string;
  /** rows of chars; '#' wall, '.' walkable, 'S' stairs/ladder, 'I' item, 'T' trainer, 'E' entrance, 'X' exit */
  grid: string[];
  items: DungeonMapItem[];
  trainers: DungeonMapTrainer[];
  notes?: string;
}

export interface DungeonMap {
  game: string;
  dungeon: string;
  /** numbered steps in traversal order, one action per step */
  walkthrough: string[];
  /** floors in traversal order */
  floors: DungeonFloor[];
}

export const DUNGEON_MAPS_GEN3: DungeonMap[] = [
  // ------------------------------------------------------------------
  // POKéMON RUBY, SAPPHIRE & EMERALD
  // ------------------------------------------------------------------
  {
    game: "Pokémon Ruby, Sapphire & Emerald",
    dungeon: "Rusturf Tunnel",
    walkthrough: [
      "1. Enter from Route 116 through the north (Rustboro-side) entrance.",
      "2. Grab the Poké Ball in the northwest corner, then loop east for the Max Ether in the northeast corner.",
      "3. Battle the Team Magma Grunt (Ruby) / Team Aqua Grunt (Sapphire, Emerald) in the middle of the tunnel to recover the Devon Goods.",
      "4. The middle of the tunnel is blocked by cracked rocks — come back after the Dynamo Badge with Rock Smash.",
      "5. Smash the rocks to reunite Wanda with her boyfriend; he rewards you with HM04 (Strength).",
      "6. Exit south to reach Verdanturf Town.",
    ],
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#E.......##.........I#",
          "#........##..........#",
          "#....................#",
          "#..I.................#",
          "#..........##........#",
          "#..........##........#",
          "#....................#",
          "#.....T.........S....#",
          "#....................#",
          "#........X...........#",
          "######################",
        ],
        items: [
          { x: 3, y: 4, name: "Poké Ball", note: "northwest corner" },
          { x: 20, y: 1, name: "Max Ether", note: "northeast corner" },
          { x: 6, y: 8, name: "Devon Goods", note: "from the Grunt after you beat him" },
          { x: 16, y: 8, name: "HM04 (Strength)", note: "from Wanda's boyfriend after smashing the rocks (needs Rock Smash)" },
        ],
        trainers: [
          { x: 6, y: 8, note: "Team Magma Grunt (R) / Team Aqua Grunt (S, E) — recover the Devon Goods" },
        ],
        notes:
          "Only Whismur lives here. The tunnel can't be fully crossed until you have Rock Smash (Dynamo Badge).",
      },
    ],
  },
  {
    game: "Pokémon Ruby, Sapphire & Emerald",
    dungeon: "Granite Cave",
    walkthrough: [
      "1. Enter from Route 106 (south entrance) and talk to the Hiker for HM05 (Flash).",
      "2. Head west along the wall to pick up the Escape Rope.",
      "3. Take the north ladder down to B1F; follow the tunnel northeast past the muddy slope.",
      "4. Grab the Poké Ball at the south dead end, then take the southeast ladder down to B2F.",
      "5. On B2F, check the rock atop the center platform for a hidden Everstone.",
      "6. After the Dynamo Badge, return with the Mach Bike: cross the cracked floors for the Repel and the Rare Candy.",
      "7. For Steven: from 1F, follow the tunnel northwest all the way to the back chamber and deliver Mr. Stone's Letter — he gives you TM47 (Steel Wing).",
    ],
    floors: [
      {
        name: "1F",
        grid: [
          "####################",
          "#......S...........#",
          "#..................#",
          "#..................#",
          "#..I...............#",
          "#..................#",
          "#..................#",
          "#...............S..#",
          "#..T...............#",
          "#.......E..........#",
          "####################",
        ],
        items: [
          { x: 3, y: 4, name: "Escape Rope", note: "west of the entrance" },
          { x: 3, y: 8, name: "HM05 (Flash)", note: "from the Hiker near the entrance" },
        ],
        trainers: [
          { x: 3, y: 8, note: "Hiker — gives HM05 (Flash); needs the Knuckle Badge to use outside battle" },
        ],
        notes: "North ladder leads to B1F; northwest tunnel leads to Steven's chamber at the back of 1F.",
      },
      {
        name: "Steven's Chamber (1F Back)",
        grid: [
          "################",
          "#......S.......#",
          "#..............#",
          "#......T.......#",
          "#..............#",
          "#......E.......#",
          "################",
        ],
        items: [
          { x: 7, y: 3, name: "TM47 (Steel Wing)", note: "thank-you gift from Steven for delivering the Letter" },
        ],
        trainers: [
          { x: 7, y: 3, note: "Steven — deliver Mr. Stone's Letter; he gives TM47 (Steel Wing)" },
        ],
      },
      {
        name: "B1F",
        grid: [
          "####################",
          "#....S.............#",
          "#..................#",
          "#..................#",
          "#................I.#",
          "#..................#",
          "#..........S.......#",
          "#..................#",
          "#..................#",
          "#..................#",
          "####################",
        ],
        items: [
          { x: 17, y: 4, name: "Poké Ball", note: "south of the muddy slope" },
        ],
        trainers: [],
        notes: "The muddy slope needs the Mach Bike (post-Dynamo Badge) for full exploration.",
      },
      {
        name: "B2F",
        grid: [
          "####################",
          "#........I.........#",
          "#..................#",
          "#......####........#",
          "#......#.I#...I....#",
          "#......#..#........#",
          "#......####........#",
          "#..................#",
          "#..S...............#",
          "#..................#",
          "####################",
        ],
        items: [
          { x: 9, y: 1, name: "Repel", note: "beneath the cracked floors (needs Mach Bike)" },
          { x: 9, y: 4, name: "Everstone", note: "hidden — in the rock atop the center platform" },
          { x: 14, y: 4, name: "Rare Candy", note: "past the cracked floors (needs Mach Bike)" },
        ],
        trainers: [],
        notes:
          "Cracked floors need the Mach Bike. Smash the rocks here for Nosepass once you have Rock Smash.",
      },
    ],
  },
  {
    game: "Pokémon Ruby, Sapphire & Emerald",
    dungeon: "Meteor Falls",
    walkthrough: [
      "1. Enter from Route 114; grab the Full Heal on the hill north of the entrance and the Moon Stone on the west-side hill.",
      "2. Surf across the water to the north side and climb down the ladder into the inner cave (B1F).",
      "3. Work through the inner cave to the waterfall and climb it with Waterfall.",
      "4. In the back chamber, pick up TM02 (Dragon Claw) — Bagon's only habitat is here.",
      "5. From the back chamber, ladders lead back up to the main room's hills: TM23 (Iron Tail) on the northwesternmost hill and a PP Up on the southeasternmost hill (both need Surf + Waterfall).",
      "6. Post-Hall of Fame (Emerald): find Steven in the back chamber for a Lv 75–78 rematch.",
    ],
    floors: [
      {
        name: "1F — Entrance Chamber",
        grid: [
          "######################",
          "#....I...............#",
          "#....................#",
          "#....................#",
          "#..I..........S......#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#.........E..........#",
          "######################",
        ],
        items: [
          { x: 5, y: 1, name: "Full Heal", note: "hill north of the Route 114 entrance" },
          { x: 3, y: 4, name: "Moon Stone", note: "west-side hill in the main chamber" },
        ],
        trainers: [],
        notes: "Surf is needed to cross the water to the inner cave. The story grunts flee with the Meteorite — no battle in R/S/E.",
      },
      {
        name: "B1F — Inner Cave",
        grid: [
          "######################",
          "#S...................#",
          "#....................#",
          "#..........S.........#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [],
        trainers: [],
        notes: "Climb the waterfall (needs Waterfall) to reach the back chamber.",
      },
      {
        name: "B1F — Back Chamber",
        grid: [
          "######################",
          "#.........I..........#",
          "#....................#",
          "#..S..............S..#",
          "#....................#",
          "#....................#",
          "#......T.............#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 10, y: 1, name: "TM02 (Dragon Claw)", note: "dead-end back room (needs Surf + Waterfall)" },
          { x: 3, y: 3, name: "TM23 (Iron Tail)", note: "northwesternmost hill of the main room, reached from B1F (needs Surf + Waterfall)" },
          { x: 17, y: 3, name: "PP Up", note: "southeasternmost hill of the main room, via the inner cave (needs Surf + Waterfall)" },
        ],
        trainers: [
          { x: 7, y: 6, note: "Steven (Emerald only, post-Hall of Fame) — Skarmory 77 … Metagross 78" },
        ],
        notes: "Bagon appears only in this back chamber (Lv 25–35).",
      },
    ],
  },
  {
    game: "Pokémon Ruby, Sapphire & Emerald",
    dungeon: "Team Aqua/Magma Hideout (Lilycove)",
    walkthrough: [
      "1. Surf northeast from Lilycove City to the cove entrance (only opens after the submarine is stolen in Slateport).",
      "2. Beat the Grunts on 1F and ride the warp pads down to the B1F warp maze.",
      "3. Navigate the teleporter maze to the middle room: take the top-left item for the Master Ball and the bottom-left for a Nugget — the other two 'items' are Lv 30 Electrode traps!",
      "4. Use the right-hand teleporter near the stairs to reach the generator room for a Max Elixir.",
      "5. Head to the submarine room and grab the Nest Ball northwest of the dock.",
      "6. In the back room, battle Admin Matt (Sapphire/Emerald) or Tabitha (Ruby) — the leader has already left with the submarine toward Sootopolis.",
      "7. Surf east to Route 124, now unblocked, toward Mossdeep City.",
    ],
    floors: [
      {
        name: "1F — Entrance",
        grid: [
          "######################",
          "#E.........S.........#",
          "#....................#",
          "#....T........T......#",
          "#....................#",
          "#.........S..........#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#.........S..........#",
          "######################",
        ],
        items: [],
        trainers: [
          { x: 5, y: 3, note: "Team Aqua/Magma Grunt — Lv 30–32" },
          { x: 14, y: 3, note: "Team Aqua/Magma Grunt — Lv 30–32" },
        ],
        notes:
          "Two Grunts block deeper access until the submarine is stolen in Slateport City.",
      },
      {
        name: "B1F — Warp Maze",
        grid: [
          "######################",
          "#.........S..........#",
          "#....I......I........#",
          "#....I......I........#",
          "#.........S..........#",
          "#....................#",
          "#..T................T#",
          "#....................#",
          "#.........S..........#",
          "#....I...............#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 5, y: 2, name: "Master Ball", note: "top-left of the item cluster, past the teleporter maze" },
          { x: 12, y: 2, name: "Electrode", note: "FAKE ITEM — top-right of the cluster, Lv 30 battle!" },
          { x: 5, y: 3, name: "Nugget", note: "bottom-left of the item cluster" },
          { x: 12, y: 3, name: "Electrode", note: "FAKE ITEM — bottom-right of the cluster, Lv 30 battle!" },
          { x: 5, y: 9, name: "Max Elixir", note: "near the generator, via the right teleporter by the stairs" },
        ],
        trainers: [
          { x: 3, y: 6, note: "Team Aqua/Magma Grunt — Lv 30–32" },
          { x: 18, y: 6, note: "Team Aqua/Magma Grunt — Lv 30–32" },
        ],
        notes:
          "Teleporter solution (Emerald): left or right pad, then middle, then left, then left.",
      },
      {
        name: "Submarine Room",
        grid: [
          "######################",
          "#....................#",
          "#..I.................#",
          "#....................#",
          "#.......T......T.....#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 3, y: 2, name: "Nest Ball", note: "northwest of the dock" },
        ],
        trainers: [
          { x: 8, y: 4, note: "Team Aqua/Magma Grunt — Lv 32–33" },
          { x: 15, y: 4, note: "Team Aqua/Magma Grunt — Lv 32–33" },
        ],
      },
      {
        name: "Archie's Room",
        grid: [
          "##################",
          "#................#",
          "#.......T........#",
          "#................#",
          "#................#",
          "#................#",
          "#................#",
          "##################",
        ],
        items: [],
        trainers: [
          { x: 8, y: 2, note: "Admin Matt (S, E) / Tabitha (R) — the leader has left with the submarine" },
        ],
        notes:
          "VERSION DIFFERENCES: Team Aqua occupies it in Sapphire & Emerald, Team Magma in Ruby (grunts, admin, and leader swapped; Aqua's extra water removed). In Ruby/Sapphire the entrance seals after Tate & Liza — grab the Master Ball before then. (Emerald also has a separate Team Magma Hideout inside Mt. Chimney — see next entry.)",
      },
    ],
  },
  {
    game: "Pokémon Ruby, Sapphire & Emerald",
    dungeon: "Magma Hideout (Jagged Pass) — Emerald only",
    walkthrough: [
      "1. Get the Magma Emblem from the old couple atop Mt. Pyre.",
      "2. Walk the middle of Jagged Pass with the Emblem in your bag — the hidden entrance opens.",
      "3. Beat the Grunt at the entrance; loop around via B1F for the Rare Candy on the west side.",
      "4. B1F: grab the Full Restore west of the magma lake and the Max Elixir east of it; battle the Grunts.",
      "5. B2F: pick up the Nugget west of the southern magma lake.",
      "6. B3F: PP Max on the western side.",
      "7. B4F: Max Revive west of Admin Tabitha, then beat him (Numel 26, Mightyena 28, Zubat 30, Camerupt 33).",
      "8. B5F: Escape Rope in the southwestern corner, then face Maxie — he awakens Groudon with the Blue Orb (Mightyena 37, Crobat 38, Camerupt 39).",
    ],
    floors: [
      {
        name: "Entrance",
        grid: [
          "####################",
          "#E......T..........#",
          "#..................#",
          "#..I...............#",
          "#..................#",
          "#..........S.......#",
          "#..................#",
          "#..................#",
          "#..................#",
          "####################",
        ],
        items: [
          { x: 3, y: 3, name: "Rare Candy", note: "western side, reached by looping around via B1F" },
        ],
        trainers: [
          { x: 8, y: 1, note: "Team Magma Grunt — guards the sealed entrance (Poochyena 29)" },
        ],
        notes:
          "Emerald only. The entrance stays hidden until you carry the Magma Emblem (Mt. Pyre). No warp pads here — just tunnels. Wild Geodude, Graveler, and Torkoal appear.",
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#.........S..........#",
          "#..I..........I......#",
          "#....................#",
          "#......########......#",
          "#......########......#",
          "#......########......#",
          "#....................#",
          "#..T..............T..#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 3, y: 2, name: "Full Restore", note: "west of the magma lake" },
          { x: 14, y: 2, name: "Max Elixir", note: "east of the magma lake" },
        ],
        trainers: [
          { x: 3, y: 8, note: "Team Magma Grunt — Lv 28–29" },
          { x: 18, y: 8, note: "Team Magma Grunt — Lv 28–29" },
        ],
        notes: "Magma lakes drawn as rock blocks on this schematic.",
      },
      {
        name: "B2F",
        grid: [
          "######################",
          "#.........S..........#",
          "#....................#",
          "#..T.................#",
          "#....................#",
          "#......########......#",
          "#..I...########......#",
          "#......########......#",
          "#....................#",
          "#.................S..#",
          "######################",
        ],
        items: [
          { x: 3, y: 6, name: "Nugget", note: "west of the southern magma lake" },
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Magma Grunt — Lv 28–29" },
        ],
      },
      {
        name: "B3F",
        grid: [
          "######################",
          "#.........S..........#",
          "#....................#",
          "#..I..........T......#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#.................S..#",
          "######################",
        ],
        items: [
          { x: 3, y: 3, name: "PP Max", note: "western side" },
        ],
        trainers: [
          { x: 14, y: 3, note: "Team Magma Grunt — Lv 29" },
        ],
      },
      {
        name: "B4F",
        grid: [
          "######################",
          "#.........S..........#",
          "#....................#",
          "#..I.......T.........#",
          "#....................#",
          "#..........T.........#",
          "#....................#",
          "#....................#",
          "#.................S..#",
          "######################",
        ],
        items: [
          { x: 3, y: 3, name: "Max Revive", note: "west of Tabitha" },
        ],
        trainers: [
          { x: 11, y: 3, note: "Admin Tabitha — Numel 26, Mightyena 28, Zubat 30, Camerupt 33" },
          { x: 11, y: 5, note: "Team Magma Grunt — Lv 29" },
        ],
      },
      {
        name: "B5F — Magma Chamber",
        grid: [
          "######################",
          "#.........S..........#",
          "#....................#",
          "#..I.................#",
          "#....................#",
          "#....................#",
          "#.........T..........#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 3, y: 3, name: "Escape Rope", note: "southwestern corner" },
        ],
        trainers: [
          { x: 10, y: 6, note: "Maxie — Mightyena 37, Crobat 38, Camerupt 39; awakens Groudon with the Blue Orb" },
        ],
        notes: "The heart of the volcano — Groudon is awakened here just before the Maxie battle.",
      },
    ],
  },
  {
    game: "Pokémon Ruby, Sapphire & Emerald",
    dungeon: "Victory Road",
    walkthrough: [
      "1. Enter from Ever Grande City (south); bring Surf, Strength, and Rock Smash — Flash and Waterfall help too.",
      "2. 1F: work east across the bridges — grab the Max Elixir above the eastern ledge, the PP Up in the southeast corner, and the hidden Ultra Ball at the end of the SE ledge.",
      "3. Take the stairs down to B1F; pick up TM29 (Psychic) in the northeastern corner.",
      "4. Push boulders with Strength and smash rocks to reach the Full Restore north of Cooltrainer Samuel.",
      "5. Drop to B2F: the hidden Max Repel sits in the nook by the northeast ladder; the Full Heal is near Cooltrainer Vito.",
      "6. Surf to the two-square nook above the eastern waterfall for the hidden Elixir.",
      "7. Exit north to the Pokémon League — in Emerald, Wally challenges you to a rematch near the entrance first.",
    ],
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#E...............T...#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#.................I..#",
          "#..............II....#",
          "#....................#",
          "#.........S..........#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 18, y: 5, name: "Max Elixir", note: "above the ledge in the eastern part" },
          { x: 15, y: 6, name: "Ultra Ball", note: "hidden — end of the SE ledge, left of the PP Up" },
          { x: 16, y: 6, name: "PP Up", note: "southeastern corner" },
        ],
        trainers: [
          { x: 17, y: 1, note: "Wally (Emerald only) — rival rematch near the entrance" },
        ],
        notes: "Wally appears near the entrance in Emerald, near the exit in Ruby/Sapphire.",
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#.........S..........#",
          "#.................I..#",
          "#....................#",
          "#....T...............#",
          "#....................#",
          "#..I.................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 18, y: 2, name: "TM29 (Psychic)", note: "northeastern corner" },
          { x: 3, y: 6, name: "Full Restore", note: "north of Cooltrainer Samuel (needs Strength + Rock Smash)" },
        ],
        trainers: [
          { x: 5, y: 4, note: "Cooltrainer Samuel" },
        ],
      },
      {
        name: "B2F",
        grid: [
          "######################",
          "#.........S..........#",
          "#.................I..#",
          "#....................#",
          "#....................#",
          "#....T...............#",
          "#....................#",
          "#..I.................#",
          "#..............I.....#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 18, y: 2, name: "Max Repel", note: "hidden — nook by the ladder in the NE corner" },
          { x: 3, y: 7, name: "Full Heal", note: "near Cooltrainer Vito" },
          { x: 15, y: 8, name: "Elixir", note: "hidden — two-square nook above the eastern waterfall (needs Surf)" },
        ],
        trainers: [
          { x: 5, y: 5, note: "Cooltrainer Vito" },
        ],
        notes: "The north exit leads out to the Pokémon League.",
      },
    ],
  },
  // ------------------------------------------------------------------
  // POKéMON OMEGA RUBY & ALPHA SAPPHIRE
  // ------------------------------------------------------------------
  {
    game: "Pokémon Omega Ruby & Alpha Sapphire",
    dungeon: "Rusturf Tunnel",
    walkthrough: [
      "1. Enter from Route 116 through the north (Rustboro-side) entrance.",
      "2. Use the Dowsing Machine by the large rock near the entrance for a hidden Dire Hit.",
      "3. Grab the Poké Ball in the northwest corner, then loop east for the Max Ether in the northeast corner.",
      "4. Battle the Team Magma Grunt (OR) / Team Aqua Grunt (AS) in the middle of the tunnel to recover the Devon Parts.",
      "5. The middle of the tunnel is blocked by cracked rocks — come back after the Dynamo Badge with Rock Smash.",
      "6. Smash the rocks to reunite Wanda with her boyfriend; he rewards you with an Aggronite.",
      "7. Exit south to reach Verdanturf Town.",
    ],
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#E.......##.........I#",
          "#....................#",
          "#....................#",
          "#..I.................#",
          "#..........##........#",
          "#..........##........#",
          "#....................#",
          "#.....T.........S....#",
          "#....................#",
          "#........X...........#",
          "######################",
        ],
        items: [
          { x: 2, y: 1, name: "Dire Hit", note: "hidden — by the large rock north of the Rustboro-side entrance (Dowsing Machine)" },
          { x: 3, y: 4, name: "Poké Ball", note: "northwest corner" },
          { x: 20, y: 1, name: "Max Ether", note: "northeast corner" },
          { x: 6, y: 8, name: "Devon Parts", note: "from the Grunt after you beat him" },
          { x: 16, y: 8, name: "Aggronite", note: "from Wanda's boyfriend after smashing the rocks (needs Rock Smash)" },
        ],
        trainers: [
          { x: 6, y: 8, note: "Team Magma Grunt (OR) / Team Aqua Grunt (AS) — recover the Devon Parts" },
        ],
        notes:
          "Smashing the breakable rocks can also drop random items (Pearl, Heart Scale, Revive, Star Piece, …). Only Whismur lives here.",
      },
    ],
  },
  {
    game: "Pokémon Omega Ruby & Alpha Sapphire",
    dungeon: "Granite Cave",
    walkthrough: [
      "1. Enter from Route 106 (south entrance) and talk to the Hiker for TM70 (Flash).",
      "2. Follow the tunnel northwest to the back chamber and deliver Mr. Stone's Letter to Steven — he gives you TM51 (Steel Wing).",
      "3. Take the north ladder down to B1F; follow the tunnel northeast past the muddy slope.",
      "4. Grab the Poké Ball at the south dead end (and the hidden Paralyze Heal beside it), then take the southeast ladder down to B2F.",
      "5. After the Dynamo Badge, return with the Mach Bike: cross the cracked floors for the Repel, Rare Candy, TM65 (Shadow Claw), and the Steelixite.",
      "6. Battle Ruin Maniac Omari and Hiker Davian on B2F, and check the rocks for hidden Everstones.",
    ],
    floors: [
      {
        name: "1F",
        grid: [
          "####################",
          "#......S...........#",
          "#..................#",
          "#..................#",
          "#..................#",
          "#..................#",
          "#..................#",
          "#...............S..#",
          "#..T...............#",
          "#.......E..........#",
          "####################",
        ],
        items: [
          { x: 3, y: 8, name: "TM70 (Flash)", note: "from the Hiker near the entrance" },
        ],
        trainers: [
          { x: 3, y: 8, note: "Hiker — gives TM70 (Flash)" },
        ],
        notes: "North ladder leads to B1F; northwest tunnel leads to Steven's chamber at the back of 1F.",
      },
      {
        name: "Steven's Chamber (1F Back)",
        grid: [
          "################",
          "#......S.......#",
          "#..............#",
          "#......T.......#",
          "#..............#",
          "#......E.......#",
          "################",
        ],
        items: [
          { x: 7, y: 3, name: "TM51 (Steel Wing)", note: "thank-you gift from Steven for delivering the Letter" },
        ],
        trainers: [
          { x: 7, y: 3, note: "Steven — deliver Mr. Stone's Letter; he gives TM51 (Steel Wing)" },
        ],
        notes: "Steven admires the ancient mural here (Primal Groudon/Kyogre, version-dependent).",
      },
      {
        name: "B1F",
        grid: [
          "####################",
          "#....SI............#",
          "#..................#",
          "#..................#",
          "#...............II.#",
          "#..................#",
          "#..........S.......#",
          "#.I................#",
          "#..................#",
          "#..................#",
          "####################",
        ],
        items: [
          { x: 6, y: 1, name: "Escape Rope", note: "next to the ladder to 1F (needs Mach Bike)" },
          { x: 16, y: 4, name: "Paralyze Heal", note: "hidden — left of the Poké Ball (needs Mach Bike)" },
          { x: 17, y: 4, name: "Poké Ball", note: "south of the Mach Bike slope (needs Mach Bike)" },
          { x: 2, y: 7, name: "X Defense", note: "hidden — beyond the Mach Bike slope (needs Mach Bike)" },
        ],
        trainers: [],
        notes: "The muddy slopes need the Mach Bike (post-Dynamo Badge).",
      },
      {
        name: "B2F",
        grid: [
          "####################",
          "#........I.........#",
          "#....T.......T.....#",
          "#......####........#",
          "#.....I#.I#..I..I..#",
          "#......#..#........#",
          "#......####........#",
          "#..................#",
          "#.IS...............#",
          "#..................#",
          "####################",
        ],
        items: [
          { x: 9, y: 1, name: "Repel", note: "north of the ladders (needs Mach Bike)" },
          { x: 6, y: 4, name: "TM65 (Shadow Claw)", note: "left of the lone rock (needs Mach Bike)" },
          { x: 9, y: 4, name: "Everstone ×2", note: "hidden — in the rock near the Rare Candy (needs Mach Bike)" },
          { x: 13, y: 4, name: "Rare Candy", note: "down the third ladder (needs Mach Bike)" },
          { x: 16, y: 4, name: "Steelixite", note: "right of the lone rock (needs Mach Bike)" },
          { x: 2, y: 8, name: "Super Potion", note: "hidden — southwest of the ladders (needs Mach Bike)" },
        ],
        trainers: [
          { x: 5, y: 2, note: "Ruin Maniac Omari — Sandshrew Lv 15" },
          { x: 13, y: 2, note: "Hiker Davian — Geodude Lv 15" },
        ],
        notes: "All of B2F's items need the Mach Bike to cross the cracked floors.",
      },
    ],
  },
  {
    game: "Pokémon Omega Ruby & Alpha Sapphire",
    dungeon: "Meteor Falls",
    walkthrough: [
      "1. Enter from Route 114; grab the Full Heal on the hill north of the entrance and the Moon Stone on the west-side hill.",
      "2. Check the patch of land east of the waterfall with the Dowsing Machine for a hidden Great Ball (Surf).",
      "3. Surf across the water to the north side and climb down the ladder into the inner cave (B1F).",
      "4. Story: team up with Brendan/May for a multi battle against Tabitha (OR) / Shelly (AS) and a Grunt over the Meteorite.",
      "5. Work the western ledges for the Aerodactylite (and the hidden Super Repel beneath it), then climb the waterfall with Waterfall.",
      "6. In the back chamber, pick up TM02 (Dragon Claw) and the hidden Star Piece — Bagon's only habitat is here.",
      "7. From the back chamber, ladders lead back up to the main room's hills: a PP Max on the southeasternmost hill and a hidden Stardust atop the large waterfall (both need Surf + Waterfall).",
      "8. Delta Episode: meet Zinnia's grandmother at the back of 1F; after the episode she gives you Salamencite and teaches Dragon Ascent to Rayquaza.",
    ],
    floors: [
      {
        name: "1F — Entrance Chamber",
        grid: [
          "######################",
          "#....I...............#",
          "#....................#",
          "#.................I..#",
          "#..I..........S......#",
          "#..........I.........#",
          "#....................#",
          "#....................#",
          "#.................I..#",
          "#....................#",
          "#....................#",
          "#.........E..........#",
          "######################",
        ],
        items: [
          { x: 5, y: 1, name: "Full Heal", note: "hill north of the Route 114 entrance" },
          { x: 3, y: 4, name: "Moon Stone", note: "west-side hill in the main chamber" },
          { x: 18, y: 3, name: "Stardust", note: "hidden — top of the large waterfall (needs Surf + Waterfall)" },
          { x: 11, y: 5, name: "Salamencite", note: "from Zinnia's grandmother after the Delta Episode" },
          { x: 18, y: 8, name: "Great Ball", note: "hidden — patch of land east of the main room waterfall (needs Surf)" },
        ],
        trainers: [],
        notes: "Surf is needed to cross the water to the inner cave.",
      },
      {
        name: "B1F — Inner Cave",
        grid: [
          "######################",
          "#S...................#",
          "#....................#",
          "#..........S.........#",
          "#....................#",
          "#....................#",
          "#...I......T....I....#",
          "#...I................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 4, y: 6, name: "Aerodactylite", note: "down the western ledges (needs Surf + Waterfall)" },
          { x: 4, y: 7, name: "Super Repel", note: "hidden — underneath the Aerodactylite" },
          { x: 16, y: 6, name: "Star Piece", note: "hidden — west of the rock by the back-room entrance" },
        ],
        trainers: [
          { x: 11, y: 6, note: "Tabitha (OR) / Shelly (AS) & Grunt — story multi battle alongside Brendan/May" },
        ],
        notes: "Climb the waterfall (needs Waterfall) to reach the back chamber.",
      },
      {
        name: "B1F — Back Chamber",
        grid: [
          "######################",
          "#.........I..........#",
          "#....................#",
          "#..S..............S..#",
          "#....................#",
          "#....................#",
          "#......T.............#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 10, y: 1, name: "TM02 (Dragon Claw)", note: "dead-end back room (needs Surf + Waterfall)" },
          { x: 18, y: 3, name: "PP Max", note: "southeasternmost hill of the main room, via the inner cave (needs Surf + Waterfall)" },
        ],
        trainers: [
          { x: 7, y: 6, note: "Dragon Tamer Nicolas — rematchable (may reward a Full Restore)" },
        ],
        notes: "Bagon appears only in this back chamber (Lv 37–40).",
      },
    ],
  },
  {
    game: "Pokémon Omega Ruby & Alpha Sapphire",
    dungeon: "Team Aqua/Magma Hideout (Lilycove)",
    walkthrough: [
      "1. Surf northeast from Lilycove City to the cove entrance (only opens after the submarine is stolen in Slateport).",
      "2. 1F: ride the east warp pad to the small storage room for a Nugget, then warp back.",
      "3. Beat the two Grunts, take the southeast warp to the break room for a Full Restore, then the stairs down to B1F.",
      "4. B1F: grab the Escape Rope by the vending machine; use the northeast teleporter in the meteorite lab to reach the library's Max Elixir.",
      "5. Take the southeast teleporter in the Aqua/Magma Suit lab to Courtney's/Matt's room for TM97 (Dark Pulse).",
      "6. Use the southwest teleporter in the Suit lab to reach the submarine dock's east side for a PP Max, plus the Max Revive in the southeast corner.",
      "7. Navigate the teleporter maze to the leader's room: the Master Ball is the top item of the cluster — the other two 'items' are Lv 50 Electrode traps!",
      "8. Delta Episode: return during the Delta Episode; after Zinnia takes the Key Stone, Courtney (OR) / Shelly (AS) hands you Cameruptite / Sharpedonite.",
      "9. Surf east to Route 124, now unblocked, toward Mossdeep City.",
    ],
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#E.........S.........#",
          "#....................#",
          "#....T........T......#",
          "#....................#",
          "#.........S..........#",
          "#....I...............#",
          "#....................#",
          "#....................#",
          "#.........S..........#",
          "######################",
        ],
        items: [
          { x: 5, y: 6, name: "Nugget", note: "small storage room via the east warp pad" },
          { x: 14, y: 2, name: "Max Elixir", note: "library, via the B1F meteorite lab's northeast teleporter" },
          { x: 14, y: 8, name: "Full Restore", note: "break room, via the southeast warp pad" },
        ],
        trainers: [
          { x: 5, y: 3, note: "Team Aqua/Magma Grunt — Lv 35" },
          { x: 14, y: 3, note: "Team Aqua/Magma Grunt — Lv 35–37" },
        ],
        notes:
          "Two Grunts block deeper access until the submarine is stolen in Slateport City. Drinks vending machine by the B1F stairs (cheaper than usual).",
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#.........S..........#",
          "#....I...............#",
          "#....................#",
          "#.........S..........#",
          "#....................#",
          "#..T................T#",
          "#....................#",
          "#....I....S....I.....#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 5, y: 2, name: "Escape Rope", note: "by the vending machine near the stairs" },
          { x: 5, y: 8, name: "Nest Ball", note: "left of the Aqua/Magma Suit" },
          { x: 15, y: 8, name: "TM97 (Dark Pulse)", note: "Courtney's/Matt's room, via the Suit lab's southeast teleporter" },
        ],
        trainers: [
          { x: 3, y: 6, note: "Team Aqua/Magma Grunt — Lv 34–37" },
          { x: 18, y: 6, note: "Team Aqua/Magma Grunt — Lv 37" },
        ],
      },
      {
        name: "Warp Hallway",
        grid: [
          "######################",
          "#.........S..........#",
          "#....................#",
          "#....S..........S....#",
          "#....................#",
          "#.........S..........#",
          "#....................#",
          "#....S..........S....#",
          "#....................#",
          "######################",
        ],
        items: [],
        trainers: [],
        notes: "Teleporter maze leading to the leader's room — the pads shuffle you between 1F, B1F, and the submarine dock.",
      },
      {
        name: "Submarine Room",
        grid: [
          "######################",
          "#....................#",
          "#..I.............I...#",
          "#....................#",
          "#.......T......T.....#",
          "#....................#",
          "#....................#",
          "#....................#",
          "#....................#",
          "######################",
        ],
        items: [
          { x: 3, y: 2, name: "PP Max", note: "east side of the dock, via the Suit lab's southwest teleporter" },
          { x: 17, y: 2, name: "Max Revive", note: "southeast corner of the dock" },
        ],
        trainers: [
          { x: 8, y: 4, note: "Team Aqua/Magma Grunt — Lv 37" },
          { x: 15, y: 4, note: "Team Aqua/Magma Grunts — horde battle, five Poochyena Lv 18" },
        ],
        notes: "Tentacool and Wailmer can be fished/surfed in the dock water.",
      },
      {
        name: "Archie's Room",
        grid: [
          "##################",
          "#....I....I......#",
          "#................#",
          "#.......T........#",
          "#................#",
          "#....I....I......#",
          "#................#",
          "##################",
        ],
        items: [
          { x: 5, y: 1, name: "Electrode", note: "FAKE ITEM — top-left of the cluster, Lv 50 battle!" },
          { x: 10, y: 1, name: "Master Ball", note: "top-right of the item cluster, past the teleporter maze" },
          { x: 5, y: 5, name: "Nugget", note: "bottom-left of the item cluster" },
          { x: 10, y: 5, name: "Electrode", note: "FAKE ITEM — bottom-right of the cluster, Lv 50 battle!" },
          { x: 8, y: 3, name: "Sharpedonite (AS) / Cameruptite (OR)", note: "from Archie/Maxie via Shelly/Tabitha after the Delta Episode" },
        ],
        trainers: [
          { x: 8, y: 3, note: "Courtney (OR) / Matt (AS) — admin; the leader has left with the submarine" },
        ],
        notes:
          "VERSION DIFFERENCES: Team Aqua occupies it in Alpha Sapphire, Team Magma in Omega Ruby (grunts, admin, and leader swapped). Unlike R/S, the entrance never seals — you can return freely.",
      },
    ],
  },
  {
    game: "Pokémon Omega Ruby & Alpha Sapphire",
    dungeon: "Victory Road",
    walkthrough: [
      "1. Surf north from Ever Grande City to the cavern entrance; bring Surf and Strength (Waterfall helps).",
      "2. 1F: push the boulder north into the hole with Strength, cross the bridge for a Full Heal, and beat Ace Trainer Albert.",
      "3. Grab the hidden Max Repel by the lone rock east of the stairs, beat Ace Trainer Hope, then take the ladder down.",
      "4. B1F: Ultra Ball in the hidden rock by the ladder; PP Up in the NE corner behind two boulders (Strength); TM35 (Flamethrower) north of Expert Theodore behind boulders.",
      "5. Full Restore northwest of Ace Trainer Vito; loop back via 1F's northeast bridge for the Max Elixir; climb the stairs to 2F.",
      "6. 2F: hidden Iron west of the southern bridge; TM81 (X-Scissor) atop the southern waterfall (Surf + Waterfall).",
      "7. Beat Wally for the Dawn Stone, then exit to Ever Grande City and the Pokémon League.",
    ],
    floors: [
      {
        name: "1F — Interior",
        grid: [
          "######################",
          "#....................#",
          "#....T...............#",
          "#.............I......#",
          "#....................#",
          "#..T.................#",
          "#....................#",
          "#.................I..#",
          "#.........S..........#",
          "#....................#",
          "#....I.............T.#",
          "######################",
        ],
        items: [
          { x: 14, y: 3, name: "Full Heal", note: "across the bridge above Ace Trainer Albert (needs Surf)" },
          { x: 18, y: 7, name: "Max Repel", note: "hidden — lone rock east of the stairs to Ace Trainer Hope (needs Surf)" },
          { x: 5, y: 10, name: "Elixir", note: "hidden — west of the northernmost bridge, by a big rock (needs Surf)" },
        ],
        trainers: [
          { x: 5, y: 2, note: "Ace Trainer Albert" },
          { x: 3, y: 5, note: "Ace Trainer Hope" },
          { x: 19, y: 10, note: "Street Thug Regan" },
        ],
        notes: "Surf needed for most items; Strength for the boulder-into-hole puzzle.",
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#..I......S..........#",
          "#.................I..#",
          "#....................#",
          "#..IT........T.......#",
          "#....................#",
          "#....................#",
          "#..I.................#",
          "#.............I......#",
          "#.................S..#",
          "######################",
        ],
        items: [
          { x: 3, y: 1, name: "Ultra Ball", note: "hidden — small rock left of the ladder (needs Surf)" },
          { x: 18, y: 2, name: "PP Up", note: "NE corner behind two boulders (needs Surf + Strength)" },
          { x: 3, y: 4, name: "Full Restore", note: "west-central area, NW of Ace Trainer Vito" },
          { x: 3, y: 7, name: "TM35 (Flamethrower)", note: "north of Expert Theodore, behind two boulders (needs Strength)" },
          { x: 14, y: 8, name: "Max Elixir", note: "west end of the NE bridge, looped via 1F (needs Surf)" },
        ],
        trainers: [
          { x: 4, y: 4, note: "Expert Theodore" },
          { x: 13, y: 4, note: "Ace Trainer Vito" },
        ],
        notes: "Two exits on B1F lead outside to Ever Grande City; one side path reportedly holds TM29 (Psychic) — unverified.",
      },
      {
        name: "2F",
        grid: [
          "####################",
          "#.........S........#",
          "#..................#",
          "#..I...............#",
          "#..................#",
          "#.............I....#",
          "#..................#",
          "#....T.............#",
          "#..................#",
          "####################",
        ],
        items: [
          { x: 3, y: 3, name: "Iron", note: "hidden — west of the southern bridge" },
          { x: 14, y: 5, name: "TM81 (X-Scissor)", note: "atop the southern waterfall (needs Surf + Waterfall)" },
          { x: 5, y: 7, name: "Dawn Stone", note: "from Wally after defeating him (needs Surf + Strength to reach)" },
        ],
        trainers: [
          { x: 5, y: 7, note: "Wally — final rival battle; gives a Dawn Stone afterwards" },
        ],
        notes: "The exit leads out to Ever Grande City and the Pokémon League.",
      },
    ],
  },
];
