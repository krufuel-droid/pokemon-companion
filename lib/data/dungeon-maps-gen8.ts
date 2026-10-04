// Gen 8 dungeon maps: Pokémon Sword & Shield and Pokémon Legends: Arceus.
// Schematic layouts — readable approximations, not pixel-perfect.
// Grid legend: '#' wall, '.' walkable, 'S' stairs/ladder/lift,
// 'I' item, 'T' trainer (or legendary encounter in Legends: Arceus),
// 'E' entrance, 'X' exit. Coordinates are 0-indexed (x = column, y = row).

export interface DungeonMapItem { x: number; y: number; name: string }
export interface DungeonMapTrainer { x: number; y: number; note: string }
export interface DungeonFloor {
  name: string;
  grid: string[];
  items: DungeonMapItem[];
  trainers: DungeonMapTrainer[];
  notes?: string;
}
export interface DungeonMap {
  game: string;
  dungeon: string;
  floors: DungeonFloor[];
  walkthrough: string[];
}

export const DUNGEON_MAPS_GEN8: DungeonMap[] = [
  {
    game: "Pokémon Sword & Shield",
    dungeon: "Galar Mine No. 2",
    floors: [
    {
      name: "1F",
      grid: [
        "######################",
        "################I#####",
        "################.#####",
        "#########I######.#####",
        "#########.#####.....##",
        "#########.#####.T...TI",
        "#######..T..T.......##",
        "#######.###I..#...I.##",
        "#######.#####.#......X",
        "E...T...#####.########",
        "#############I########",
        "######################"
      ],
      items: [
      { x: 4, y: 9, name: "Bede's League Card — given by Bede after defeating him" },
      { x: 9, y: 3, name: "Dusk Ball ×3 — alcove just past Worker Francis" },
      { x: 11, y: 7, name: "Grip Claw — small west-jutting alcove south of the second pool" },
      { x: 18, y: 7, name: "Star Piece (hidden) — by the gem-filled mine cart in the large chamber" },
      { x: 13, y: 10, name: "Soft Sand (hidden) — by the gem cart at the end of the far west dead-end" },
      { x: 21, y: 5, name: "TM49 (Sand Tomb) — end of the east dead-end passage" },
      { x: 16, y: 1, name: "TM53 (Mud Shot) — across the ponds; needs the upgraded Rotom Bike" },
      ],
      trainers: [
      { x: 4, y: 9, note: "Rival Bede — Solosis 21, Gothita 22, Hatenna 23, Galarian Ponyta 22" },
      { x: 9, y: 6, note: "Worker Francis — Carkol 21" },
      { x: 12, y: 6, note: "Worker Yvonne — Roggenrola 20, Timburr 21" },
      { x: 16, y: 5, note: "Team Yell Grunts — double battle WITH Hop (Thievul 21 / Linoone 22, Liepard 22 / Pancham 21)" },
      { x: 20, y: 5, note: "Rail Staff Vincent — Drilbur 22, Onix 23" },
      ],
      notes: "Wild Stunfisk disguise themselves as Poké Balls on the cave floor. Kabu appears near the exit for a story scene (no battle).",
    },
    ],
    walkthrough: [
      "1. Enter from Hulbury (west entrance) — Bede challenges you almost immediately; beat him to receive Bede's League Card.",
      "2. Head east to Worker Francis; battle him, then grab the 3 Dusk Balls in the alcove just past him.",
      "3. Continue east to Worker Yvonne; battle her, then check the small west-jutting alcove to the south for a Grip Claw.",
      "4. Push east into the large chamber — Team Yell grunts block the path, so team up with Hop for a double battle.",
      "5. After the battle, check by the gem-filled mine cart for a hidden Star Piece, then detour down the far west dead-end for a hidden Soft Sand.",
      "6. Head to the east dead-end; battle Rail Staff Vincent, then grab TM49 (Sand Tomb) at the end of the passage.",
      "7. Back in the main chamber, take the north branch past the ponds — with an upgraded Rotom Bike you can surf across to TM53 (Mud Shot).",
      "8. Return south, watch the scene with Kabu, then exit east to Motostoke Outskirts.",
    ],
  },
  {
    game: "Pokémon Sword & Shield",
    dungeon: "Glimwood Tangle",
    floors: [
    {
      name: "Forest Floor",
      grid: [
        "############X#########",
        "############.I########",
        "############T#########",
        "#########I#I.I########",
        "########..T..#########",
        "########.#I###########",
        "########.#############",
        "E....I...#############",
        "###.##################",
        "#IT.##################",
        "######################",
        "######################"
      ],
      items: [
      { x: 1, y: 9, name: "Bright Powder — end of the path south of Cook Derek" },
      { x: 5, y: 7, name: "Full Heal ×2 (hidden) — nook just east of the first crossroads" },
      { x: 9, y: 3, name: "Big Root — by the tree root off the eastern path" },
      { x: 10, y: 5, name: "TM24 (Snore) — dead end just west of the Daring Couple" },
      { x: 11, y: 3, name: "Hyper Potion ×2 — southwest of the northern exit" },
      { x: 13, y: 3, name: "Luminous Moss (hidden) — ledge along the path near Madame Judy" },
      { x: 13, y: 1, name: "TM56 (U-turn) — ledge at the end of the path near Madame Judy" },
      ],
      trainers: [
      { x: 2, y: 9, note: "Cook Derek — Milcery 33, Sinistea 33, Shiinotic 34" },
      { x: 10, y: 4, note: "Daring Couple Robert & Jacqueline — Ninetales 34, Kirlia 34" },
      { x: 12, y: 2, note: "Madame Judy — Indeedee 33 ×2" },
      ],
      notes: "Touch glowing mushrooms for light — two hide Impidimp (one near the entrance, one near Cook Derek's dead end); a wild Morgrem ambushes west of Madame Judy. Two Team Yell Grunts block the forest until Bede is beaten at Stow-on-Side.",
    },
    ],
    walkthrough: [
      "1. Enter from Stow-on-Side (west); at the first split, head west to battle Cook Derek (Milcery 33, Sinistea 33, Shiinotic 34).",
      "2. Continue south past Derek into the dark to find the Bright Powder at the path's end.",
      "3. Backtrack east: check the nook just east of the crossroads for 2 hidden Full Heals, then grab the Big Root by the tree root on the eastern path.",
      "4. Take the dead end just west of the Daring Couple for TM24 (Snore), then battle the couple (Ninetales 34, Kirlia 34).",
      "5. Head north up the path for 2 Hyper Potions, then drop south to battle Madame Judy (two Indeedee 33).",
      "6. Push west past Judy — a wild Morgrem ambushes from the grass — then climb the ledges: a hidden Luminous Moss on the lower ledge, TM56 (U-turn) on the upper ledge.",
      "7. Drop down and exit north to Ballonlea.",
    ],
  },
  {
    game: "Pokémon Sword & Shield",
    dungeon: "Rose Tower",
    floors: [
    {
      name: "Tower Garden",
      grid: [
        "######################",
        "######################",
        "######################",
        "######################",
        "##.........S.........#",
        "##...I.............I.#",
        "##.I..............I..#",
        "##...................#",
        "##.........I.........#",
        "##.........#.........#",
        "##.I.................#",
        "###########E##########"
      ],
      items: [
      { x: 11, y: 8, name: "TM93 (Eerie Impulse) — behind the big sign" },
      { x: 3, y: 6, name: "Electric Seed — west side of the yard" },
      { x: 5, y: 5, name: "Nugget (hidden) — west of the tower" },
      { x: 18, y: 6, name: "Cell Battery — east side of the yard" },
      { x: 19, y: 5, name: "PP Up (hidden) — east of the tower by the railings" },
      { x: 3, y: 10, name: "Rare Candy (hidden) — southwest corner grass" },
      ],
      trainers: [
      ],
      notes: "Marnie and Piers wait by the entrance; Hop joins you inside.",
    },
    {
      name: "Lobby & Lift",
      grid: [
        "######################",
        "######################",
        "######################",
        "######################",
        "######################",
        "######################",
        ".........#############",
        ".........#############",
        ".S...T.....T..T..T..S.",
        "######################"
      ],
      items: [
      ],
      trainers: [
      { x: 5, y: 8, note: "Macro Cosmos's Elijah — Durant 48 (guards the elevator)" },
      { x: 11, y: 8, note: "Macro Cosmos's Jane & Mateo — DOUBLE with Hop: Cufant 48, Bronzong 48" },
      { x: 14, y: 8, note: "Macro Cosmos's Kevin & Carla — DOUBLE with Hop: Klang 48, Mawile 48" },
      { x: 17, y: 8, note: "Macro Cosmos's Adalyn & Justin — DOUBLE with Hop: Steelix 49, Galarian Stunfisk 49" },
      ],
      notes: "Hop partners all three double battles and heals both teams between rounds.",
    },
    {
      name: "Top Floor — Roof",
      grid: [
        "######################",
        "######...........#####",
        "######...........#####",
        "######...........#####",
        "######.....T.....#####",
        "######...........#####",
        "######...........#####",
        "######...........#####",
        "######.....S.....#####",
        "######################"
      ],
      items: [
      ],
      trainers: [
      { x: 11, y: 4, note: "Macro Cosmos's Oleana — Froslass 50, Tsareena 50, Salazzle 50, Milotic 51, Garbodor 52 (Gigantamax)" },
      ],
      notes: "Rose and Leon appear on the roof after the battle.",
    },
    ],
    walkthrough: [
      "1. Arrive by monorail and sweep the garden first — grab TM93 (Eerie Impulse) behind the big sign.",
      "2. Check the west side of the yard for an Electric Seed and a hidden Nugget; check the east side for a Cell Battery and a hidden PP Up.",
      "3. Search the southwest corner grass for a hidden Rare Candy, then enter the tower.",
      "4. In the lobby, battle Macro Cosmos's Elijah (Durant 48) to clear the elevator.",
      "5. Ride the lift with Hop: win three double battles — Jane & Mateo, Kevin & Carla, then Adalyn & Justin — with Hop healing your team between rounds.",
      "6. At the top floor, face Oleana (Froslass, Tsareena, Salazzle, Milotic, G-Max Garbodor), who guards the roof.",
      "7. After the battle, watch the scene with Rose and Leon on the roof.",
    ],
  },
  {
    game: "Pokémon Sword & Shield",
    dungeon: "Energy Plant",
    floors: [
    {
      name: "Energy Plant",
      grid: [
        "######################",
        "###########.##########",
        "#########..S..########",
        "########.......#######",
        "########.......#######",
        "#######....T....######",
        "########.......#######",
        "########.......#######",
        "#########.....########",
        "###########.##########",
        "###########S##########",
        "######################"
      ],
      items: [
      ],
      trainers: [
      { x: 11, y: 5, note: "Macro Cosmos's Chairman Rose — Escavalier 55, Ferrothorn 55, Klinklang 56, Perrserker 55, Copperajah 57 (Gigantamax)" },
      ],
      notes: "Single circular chamber — no items. Hop waits by the entrance lift.",
    },
    {
      name: "Tower Summit",
      grid: [
        "######################",
        "#######.........######",
        "#######.........######",
        "#######.........######",
        "#######....T....######",
        "#######.........######",
        "#######.........######",
        "#######.........######",
        "#######....S....######",
        "######################"
      ],
      items: [
      ],
      trainers: [
      { x: 11, y: 4, note: "Eternatus Lv.60 — scripted battle; Poké Balls cannot be used, just knock it out" },
      ],
      notes: "Post-game: Sordward (Sword) / Shielbert (Shield) waits in the Energy Plant below with Lv.64 teams; the summit later hosts Zacian (Sword) / Zamazenta (Shield) at Lv.70.",
    },
    ],
    walkthrough: [
      "1. Take the lift down from Hammerlocke Stadium into the plant's circular chamber — Hop is already waiting.",
      "2. Cross the chamber and confront Chairman Rose: Escavalier, Ferrothorn, Klinklang, Perrserker, and a Gigantamax Copperajah.",
      "3. After the battle, take the lift up to the Tower Summit.",
      "4. At the summit, battle Eternatus (Lv.60) — Poké Balls won't work here, so just knock it out.",
      "5. Post-game: return to the plant to battle Sordward (Sword) or Shielbert (Shield) and their Lv.64 teams.",
    ],
  },
  {
    game: "Pokémon Sword & Shield",
    dungeon: "Route 10 (Victory Road)",
    floors: [
    {
      name: "Route 10",
      grid: [
        "###########X##########",
        "###########.##########",
        "###########..I########",
        "###########.##########",
        "###########T.I########",
        "##########I...########",
        "#########T.TT.########",
        "#########.T..T########",
        "###########T##########",
        "###########..I########",
        "###########.##########",
        "###########T##########",
        "###########..I########",
        "###########.##########",
        "##########I.##########",
        "###########E##########"
      ],
      items: [
      { x: 10, y: 14, name: "X Attack ×2 (hidden) — by the wooden cart in front of White Hill Station" },
      { x: 13, y: 12, name: "Max Revive — tall grass southeast of the station" },
      { x: 13, y: 9, name: "Comet Shard (hidden) — by a snowy rock in the northeast" },
      { x: 10, y: 5, name: "PP Up (hidden) — west of the Pokémon Camp" },
      { x: 13, y: 4, name: "Power Herb — behind the red sign, end of the southeast path" },
      { x: 13, y: 2, name: "TM98 (Stomping Tantrum) — cliff east of the top of the slope down to Wyndon" },
      ],
      trainers: [
      { x: 11, y: 11, note: "Doctor Graham — Gardevoir 45" },
      { x: 11, y: 8, note: "Hiker Douglas — Steelix 45, Mudsdale 45" },
      { x: 9, y: 6, note: "Office Worker Ronald — Weavile 45, Claydol 45" },
      { x: 13, y: 7, note: "Cabbie Geoffrey — Corviknight 45, Flygon 46" },
      { x: 10, y: 7, note: "Postman Harper — Pelipper 46, Noctowl 46" },
      { x: 12, y: 6, note: "Hiker Donald — Gigalith 46, Rhydon 46" },
      { x: 11, y: 6, note: "Gentleman Glenn — Galarian Darmanitan 46, Falinks 46, Grapploct 46" },
      { x: 11, y: 4, note: "Interviewers Gillian & Cam — Heliolisk 46, Noivern 47, Klinklang 46, Togedemaru 47" },
      ],
      notes: "Galar has no traditional Victory Road — this snowy climb from White Hill Station to Wyndon is its equivalent. A wandering Abomasnow lurks by the Trainer Tips sign and a Beartic east of the camp.",
    },
    ],
    walkthrough: [
      "1. Exit White Hill Station onto the snowy route; check by the wooden cart for 2 hidden X Attacks.",
      "2. Head into the tall grass to the east for a Max Revive, then battle Doctor Graham on the path.",
      "3. Climb the slope, checking the snowy rock to the right for a hidden Comet Shard, then battle Hiker Douglas at the top.",
      "4. Cross the plateau, battling Office Worker Ronald, Cabbie Geoffrey, Postman Harper, Hiker Donald, and Gentleman Glenn.",
      "5. Pass the Pokémon Camp — check the ground west of it for a hidden PP Up.",
      "6. Take the southeast branch behind the red sign for a Power Herb, then battle the Interviewers on the way back.",
      "7. Continue to the top of the slope; take the cliff path east for TM98 (Stomping Tantrum).",
      "8. Descend the final slope north into Wyndon.",
    ],
  },
  {
    game: "Pokémon Legends: Arceus",
    dungeon: "Snowpoint Temple",
    floors: [
    {
      name: "1F — Statue Hall",
      grid: [
        "######################",
        "###########S##########",
        "###########.##########",
        "#####.............####",
        "#####...#.....#...####",
        "#####...#.....#...####",
        "#####...#.....#...####",
        "#####...#.....#...####",
        "#####S............####",
        "#####.............####",
        "#####......E......####",
        "######################"
      ],
      items: [
      ],
      trainers: [
      ],
      notes: "Statues bear Rock, Ice, and Steel symbols (Regirock, Regice, Registeel) — study each floor's pattern to unlock the way up. Strong wild Pokémon roam this floor; the upper galleries have none.",
    },
    {
      name: "2F — Upper Gallery",
      grid: [
        "######################",
        "########...S...#######",
        "########.......#######",
        "########.......#######",
        "########.#.#.#.#######",
        "########.......#######",
        "########...S...#######",
        "######################"
      ],
      items: [
      ],
      trainers: [
      ],
      notes: "Triangle statue arrangement.",
    },
    {
      name: "3F — Upper Gallery",
      grid: [
        "######################",
        "########...S...#######",
        "########.......#######",
        "########...#...#######",
        "########.#...#.#######",
        "########.......#######",
        "########...S...#######",
        "######################"
      ],
      items: [
      ],
      trainers: [
      ],
      notes: "Cross statue arrangement.",
    },
    {
      name: "4F — Upper Gallery",
      grid: [
        "######################",
        "########...S...#######",
        "########.......#######",
        "########.#...#.#######",
        "########.......#######",
        "########.#...#.#######",
        "########...S...#######",
        "######################"
      ],
      items: [
      ],
      trainers: [
      ],
      notes: "Ring statue arrangement.",
    },
    {
      name: "Roof",
      grid: [
        "######################",
        "######################",
        "########.......#######",
        "########...I...#######",
        "########.......#######",
        "########.......#######",
        "########...S...#######",
        "######################"
      ],
      items: [
      { x: 11, y: 3, name: "Sky Plate — reward from Braviary (Mission 12: The Slumbering Lord of the Tundra)" },
      ],
      trainers: [
      ],
      notes: "Braviary joins as a ride Pokémon here.",
    },
    {
      name: "B1F — Sealed Chamber",
      grid: [
        "######################",
        "########...I...#######",
        "########...T...#######",
        "########.......#######",
        "###########.##########",
        "##########...#########",
        "##########...#########",
        "##########...#########",
        "##########.S.#########",
        "######################"
      ],
      items: [
      { x: 11, y: 1, name: "Blank Plate — reward for catching Regigigas (Mission 24: The Plate of Snowpoint Temple)" },
      ],
      trainers: [
      { x: 11, y: 2, note: "Regigigas Lv.70 — the great door needs the Icicle, Stone, and Iron Plates" },
      ],
      notes: "No trainer battles in Hisui — T marks the legendary encounter. Icicle Plate: quelling Avalugg (story); Stone Plate: Alpha Vespiquen; Iron Plate: Heatran (post-game).",
    },
    ],
    walkthrough: [
      "1. Enter the temple in the Alabaster Icelands during Mission 12; climb the main hall past the parallel rows of Rock, Ice, and Steel statues.",
      "2. Study each statue's symbol and observe them in the pattern the floor demands to unlock the gate north.",
      "3. Climb through 2F, 3F, and 4F, solving each gallery's statue arrangement to open the next stairway (no wild Pokémon spawn up here).",
      "4. Reach the roof and meet Sabi's Braviary — gain Braviary as a ride Pokémon and receive the Sky Plate.",
      "5. Post-game (Mission 24): take the stairs down from the main hall to the great sealed door.",
      "6. Offer the Icicle, Stone, and Iron Plates to open the door and descend into the chamber.",
      "7. Battle and catch Regigigas (Lv.70) to earn the Blank Plate.",
    ],
  },
  {
    game: "Pokémon Legends: Arceus",
    dungeon: "Temple of Sinnoh",
    floors: [
    {
      name: "Temple Steps",
      grid: [
        "######################",
        "######################",
        "#######....S....######",
        "#######.#.....#.######",
        "#######.#.....#.######",
        "##########...#########",
        "##########....########",
        "##########...I########",
        "##########...#########",
        "##########.E.#########"
      ],
      items: [
      { x: 13, y: 7, name: "Old Verse 11 — dig spot just right of the steps" },
      ],
      trainers: [
      ],
      notes: "Statues of the ten noble and ride Pokémon line the entrance.",
    },
    {
      name: "Temple Interior",
      grid: [
        "######################",
        "########...T...#######",
        "########...I...#######",
        "##########...#########",
        "##########...#########",
        "##########...#########",
        "##########...#########",
        "##########...#########",
        "##########.S.#########",
        "######################"
      ],
      items: [
      { x: 11, y: 2, name: "Ultra Ball ×10 — handed to you by Commander Kamado; not a ground pickup" },
      ],
      trainers: [
      { x: 11, y: 1, note: "Dialga (Diamond Clan) / Palkia (Pearl Clan) Lv.65 — must be caught; a KO sends you back to the entrance" },
      ],
      notes: "Post-game: return with all 17 plates to battle Volo at the summit, then face Arceus (Lv.75, Mission 27: The Deified Pokémon). The ruined temple becomes Spear Pillar in the present day.",
    },
    ],
    walkthrough: [
      "1. Climb from the Summit Camp to the temple steps; check the dig spot right of the steps for Old Verse 11.",
      "2. Pass the statues of the ten noble and ride Pokémon and enter the temple corridor.",
      "3. Walk the statue-lined corridor to the altar where Kamado, Adaman, and Irida wait.",
      "4. Accept 10 Ultra Balls from Kamado, then face Dialga (Diamond Clan) / Palkia (Pearl Clan) as it bursts from the rift — you must catch it; a KO returns you to the entrance.",
      "5. Post-game: return with all 17 plates to battle Volo at the summit, then challenge Arceus (Mission 27).",
    ],
  },
];
