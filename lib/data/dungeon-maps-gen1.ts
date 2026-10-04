// Dungeon maps for Generation I Kanto games.
// Schematic layouts: readable approximations, NOT pixel-perfect.
// Item placements researched from Bulbapedia dungeon item tables.
// Grid legend: '#' wall, '.' walkable, 'S' stairs/ladder, 'I' item,
// 'T' trainer, 'E' entrance, 'X' exit/goal.
// Coordinates are 0-indexed: x = column, y = row; they match the grid.

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

export const DUNGEON_MAPS_GEN1: DungeonMap[] = [
  // ==================== POKEMON RED, BLUE & YELLOW ====================
  {
    game: "Pokémon Red, Blue & Yellow",
    dungeon: "Mt. Moon",
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#....I.......S....SI.#",
          "#.T..................#",
          "#.....#########......#",
          "#.I...#.......#..T...#",
          "#.....#.......#......#",
          "#.....#...T...#I.I...#",
          "#.T...#.......#......#",
          "#.....####.####..TT..#",
          "#..I........II.......#",
          "#.........E........S.#",
          "######################",
        ],
        items: [
          { x: 5, y: 1, name: "TM12 (Water Gun) — southwest corner" },
          { x: 2, y: 4, name: "Potion — southwest area" },
          { x: 12, y: 9, name: "Potion — south area, near the Super Nerd" },
          { x: 15, y: 6, name: "Rare Candy — near the southeast corner" },
          { x: 19, y: 1, name: "Escape Rope — east area, northeast of the Rare Candy" },
          { x: 3, y: 9, name: "Moon Stone (hidden) — northwest area" }
        ],
        trainers: [
          { x: 2, y: 2, note: "Bug Catcher — Weedle, Kakuna Lv.11" },
          { x: 2, y: 7, note: "Super Nerd — Magnemite, Voltorb Lv.11" },
          { x: 17, y: 4, note: "Lass — Clefairy Lv.14" },
          { x: 10, y: 6, note: "Youngster — Rattata x2, Zubat Lv.10" },
          { x: 18, y: 8, note: "Hiker — Geodude x2, Onix Lv.10" }
        ]
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#S.................S.#",
          "#....................#",
          "#..#####......#####..#",
          "#..#####..S...#####..#",
          "#....................#",
          "#....................#",
          "#..#####......#####..#",
          "#..#####......#####..#",
          "#S.................S.#",
          "######################",
        ],
        items: [],
        trainers: [],
        notes: "Connector tunnels only — no items and no trainers here in Red/Blue/Yellow."
      },
      {
        name: "B2F",
        grid: [
          "######################",
          "#..I......SI.....I...#",
          "#....................#",
          "#..#####..#####..###.#",
          "#..#...#..#...#..#...#",
          "#..#.TT#..#.T.#..#TT.#",
          "#..#...#..#...#..#...#",
          "#..#####..#####..###.#",
          "#....................#",
          "#..I..........T...I..#",
          "#........S...........#",
          "######################",
        ],
        items: [
          { x: 3, y: 1, name: "HP Up — closed-off east room (easternmost ladder)" },
          { x: 11, y: 1, name: "TM01 (Mega Punch) — middle ladder room" },
          { x: 17, y: 1, name: "Ether (hidden) — middle ladder room" },
          { x: 3, y: 9, name: "Moon Stone (hidden) — southeast of the Super Nerd" },
          { x: 18, y: 9, name: "Dome Fossil OR Helix Fossil — your pick after beating the Super Nerd" }
        ],
        trainers: [
          { x: 6, y: 5, note: "Rocket Grunt — Sandshrew, Rattata, Zubat Lv.11" },
          { x: 12, y: 5, note: "Rocket Grunt — Zubat, Ekans Lv.12" },
          { x: 18, y: 5, note: "Rocket Grunt — Raticate Lv.16 (RB only)" },
          { x: 14, y: 9, note: "Super Nerd — Grimer, Voltorb, Koffing Lv.12 (holds the fossils)" }
        ],
        notes: "Fossil choice: Helix OR Dome — the Super Nerd keeps the other. Yellow only: Jessie & James ambush you after the fossil choice (Ekans, Meowth, Koffing Lv.14)."
      }
    ],
    walkthrough: [
      "1. Enter from Route 3 (south entrance); the floor is a big open cavern.",
      "2. Head northwest past the Bug Catcher and grab TM12 (Water Gun) in the southwest corner, plus a Potion and the hidden Moon Stone nearby.",
      "3. Work east across 1F, beating the Lass, Super Nerd, Youngster and Hiker; grab the Rare Candy near the southeast corner and the Escape Rope in the east.",
      "4. Take any of the north ladders down to B1F — it is just connector tunnels — and continue down to B2F.",
      "5. On B2F, clear the Team Rocket Grunts in the closed-off rooms: the easternmost room holds an HP Up, the middle room holds TM01 (Mega Punch) and a hidden Ether.",
      "6. Beat the Super Nerd at the exit side and choose ONE fossil: Dome or Helix (he keeps the other).",
      "7. In Yellow only, Jessie & James ambush you right after the fossil choice.",
      "8. Take the east ladder up to B1F, then up again to 1F near the Cerulean (east) exit — you emerge on Route 4."
    ]
  },
  {
    game: "Pokémon Red, Blue & Yellow",
    dungeon: "Rock Tunnel",
    floors: [
      {
        name: "1F",
        grid: [
          "#######################",
          "#E...................##",
          "#..T.........TT......##",
          "#.....######.........S#",
          "#.....#....#...TT....##",
          "#..T..#....#..........#",
          "#.....#....#.....T...##",
          "#.....######..........#",
          "#..........T.........##",
          "#.....T..........TT..##",
          "#....................##",
          "#...................S##",
          "#######################",
        ],
        items: [],
        trainers: [
          { x: 3, y: 2, note: "PokeManiac — Cubone, Slowpoke Lv.23" },
          { x: 13, y: 2, note: "PokeManiac — Slowpoke Lv.25" },
          { x: 3, y: 5, note: "Jr. Trainer — Oddish, Bulbasaur Lv.22" },
          { x: 15, y: 4, note: "PokeManiac — Charmander, Cubone Lv.22" },
          { x: 17, y: 6, note: "Hiker — Geodude Lv.25" },
          { x: 6, y: 9, note: "Hiker — Machop, Onix Lv.20" },
          { x: 11, y: 8, note: "Hiker — Geodude, Machop Lv.19" },
          { x: 18, y: 9, note: "Hiker — Onix x2, Geodude Lv.20" }
        ],
        notes: "Pitch black without Flash. The Gen I originals have NO item balls in Rock Tunnel — items were added in the remakes."
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#S...................#",
          "#....................#",
          "#..T......####...T...#",
          "#..........####......#",
          "#..####..........T...#",
          "#..####..............#",
          "#......T........####.#",
          "#..............####..#",
          "#..T.................#",
          "#...................E#",
          "######################",
        ],
        items: [],
        trainers: [
          { x: 3, y: 3, note: "Hiker — Geodude x2, Graveler Lv.21" },
          { x: 17, y: 3, note: "Jr. Trainer — Jigglypuff, Pidgey, Meowth Lv.21" },
          { x: 17, y: 5, note: "PokeManiac — Slowpoke x3 Lv.20" },
          { x: 7, y: 7, note: "Jr. Trainer — Bellsprout, Clefairy Lv.22" },
          { x: 3, y: 9, note: "Jr. Trainer — Meowth, Oddish, Pidgey Lv.20" }
        ],
        notes: "The south exit leads back out to Route 10, just north of Lavender Town."
      }
    ],
    walkthrough: [
      "1. Enter from the north (Route 10, by the Pokemon Center). The tunnel is pitch black — teach Flash to a Pokemon first.",
      "2. Work through the winding 1F tunnels, beating the PokeManiacs, Hikers and Jr. Trainers as you go.",
      "3. Take the ladders down to B1F and keep pushing south through more Hikers and Jr. Trainers.",
      "4. Exit at the south end of B1F to reach the rest of Route 10, which leads to Lavender Town.",
      "5. Note: there are no item pickups in the original Red/Blue/Yellow version of this tunnel."
    ]
  },
  {
    game: "Pokémon Red, Blue & Yellow",
    dungeon: "Pokémon Tower",
    floors: [
      {
        name: "1F",
        grid: [
          "####################",
          "#..................#",
          "#..................#",
          "#..................#",
          "#........S.........#",
          "#..................#",
          "#..................#",
          "#........E.........#",
          "####################",
        ],
        items: [],
        trainers: [],
        notes: "Lobby with the 'Do you believe in ghosts?' girl. No wild encounters or items on 1F-2F."
      },
      {
        name: "2F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#.......T..........#",
          "#..................#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [],
        trainers: [
          { x: 8, y: 3, note: "Rival Blue — ambush battle on your way up" }
        ]
      },
      {
        name: "3F",
        grid: [
          "####################",
          "#...I....S.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......T...........#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 4, y: 1, name: "Escape Rope — north area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Gastly Lv.23" },
          { x: 14, y: 3, note: "Channeler — Gastly Lv.22" },
          { x: 7, y: 5, note: "Channeler — Gastly Lv.24" }
        ],
        notes: "Wild Gastly/Haunter appear as unidentifiable ghosts without the Silph Scope — your Pokemon will be too scared to move."
      },
      {
        name: "4F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..T.....I.....T...#",
          "#..................#",
          "#..I..........T....#",
          "#..................#",
          "#........S....I....#",
          "####################",
        ],
        items: [
          { x: 9, y: 3, name: "Elixir — southeast of the center" },
          { x: 3, y: 5, name: "Awakening — southwest of the center" },
          { x: 14, y: 7, name: "HP Up — south area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Gastly Lv.23" },
          { x: 15, y: 3, note: "Channeler — Haunter Lv.25" },
          { x: 14, y: 5, note: "Channeler — Gastly Lv.24" }
        ]
      },
      {
        name: "5F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......I...........#",
          "#..I...............#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 7, y: 5, name: "Elixer (hidden) — near the west staircase" },
          { x: 3, y: 6, name: "Nugget — southwest area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Gastly Lv.24" },
          { x: 14, y: 3, note: "Channeler — Haunter Lv.25" }
        ],
        notes: "The middle of the floor is a wild-Pokemon-free healing spot (white magic)."
      },
      {
        name: "6F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......X...........#",
          "#..I...............#",
          "#..I......S........#",
          "####################",
        ],
        items: [
          { x: 3, y: 6, name: "X Accuracy — southwest of the stairs" },
          { x: 3, y: 7, name: "Rare Candy — west area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Haunter Lv.26" },
          { x: 14, y: 3, note: "Channeler — Gastly Lv.24" }
        ],
        notes: "The ghost of Marowak blocks the stairs — you need the Silph Scope (from the Celadon Rocket Hideout) to identify and battle it."
      },
      {
        name: "7F",
        grid: [
          "####################",
          "#..................#",
          "#....T....T....T...#",
          "#..................#",
          "#........XI........#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 10, y: 4, name: "Poke Flute — from Mr. Fuji after the rescue" }
        ],
        trainers: [
          { x: 5, y: 2, note: "Rocket Grunt — Zubat, Zubat Lv.25" },
          { x: 10, y: 2, note: "Rocket Grunt — Raticate, Hypno Lv.28" },
          { x: 15, y: 2, note: "Rocket Grunt — Cubone, Drowzee, Marowak Lv.32" }
        ],
        notes: "Yellow: Jessie & James hold Mr. Fuji instead of the grunts."
      }
    ],
    walkthrough: [
      "1. Enter the tower in Lavender Town — 1F is a quiet lobby with no encounters.",
      "2. Climb to 2F, where your rival Blue ambushes you for a battle.",
      "3. Push up through 3F-4F: fight Channelers and grab the Escape Rope (3F), plus the Elixir, Awakening and HP Up (4F).",
      "4. On 5F, rest at the healing spot in the middle, then grab the Nugget and the hidden Elixer.",
      "5. IMPORTANT: you need the Silph Scope from the Celadon Rocket Hideout, or the ghosts are unbeatable and your Pokemon will be too scared to move.",
      "6. On 6F, grab the X Accuracy and Rare Candy, then use the Silph Scope to reveal and defeat the ghost of Marowak blocking the stairs.",
      "7. On 7F, defeat the Team Rocket Grunts (Jessie & James in Yellow) to free Mr. Fuji.",
      "8. Mr. Fuji gives you the Poke Flute — use it to wake the Snorlax blocking Routes 12 and 16."
    ]
  },
  {
    game: "Pokémon Red, Blue & Yellow",
    dungeon: "Silph Co.",
    floors: [
      {
        name: "1F",
        grid: [
          "##################",
          "#................#",
          "#..####....####..#",
          "#..####....####..#",
          "#................#",
          "#.......S........#",
          "#................#",
          "#.......E........#",
          "##################",
        ],
        items: [],
        trainers: [],
        notes: "Lobby. A Rocket Grunt guards the door until you rescue Mr. Fuji. Take the stairs or warp panels up."
      },
      {
        name: "2F",
        grid: [
          "##################",
          "#..I......S......#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.........#",
          "#................#",
          "#..T......S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "TM36 (Selfdestruct) — from the woman hiding in the northwest room" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Rocket Grunt — Golbat, Zubat x3, Raticate Lv.25" },
          { x: 12, y: 3, note: "Scientist — Magnemite, Voltorb, Magneton Lv.28" },
          { x: 7, y: 5, note: "Rocket Grunt — Cubone, Zubat Lv.29" },
          { x: 3, y: 7, note: "Scientist — Grimer, Weezing, Koffing, Weezing Lv.26" }
        ]
      },
      {
        name: "3F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..T........II...#",
          "#................#",
          "#.......T........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 13, y: 3, name: "Hyper Potion — northeast of the Scientist" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Rocket Grunt — Raticate, Hypno, Raticate Lv.28" },
          { x: 8, y: 5, note: "Scientist — Electrode, Weezing Lv.29" }
        ]
      },
      {
        name: "4F",
        grid: [
          "##################",
          "#..I...S.....T...#",
          "#..I.............#",
          "#..I.............#",
          "#................#",
          "#.....T..........#",
          "#................#",
          "#..T......S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Full Heal — west storage room" },
          { x: 3, y: 2, name: "Escape Rope — west storage room" },
          { x: 3, y: 3, name: "Max Revive — west storage room" }
        ],
        trainers: [
          { x: 13, y: 1, note: "Rocket Grunt — Ekans, Zubat, Cubone Lv.28" },
          { x: 6, y: 5, note: "Rocket Grunt — Machop, Drowzee Lv.29" },
          { x: 3, y: 7, note: "Scientist — Electrode Lv.33" }
        ]
      },
      {
        name: "5F",
        grid: [
          "##################",
          "#..I......S...I..#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.....I...#",
          "#................#",
          "#..TI.....S......#",
          "##################",
        ],
        items: [
          { x: 13, y: 5, name: "Card Key — east of the southernmost Rocket Grunt (unlocks the security doors)" },
          { x: 3, y: 1, name: "Protein — northwest room" },
          { x: 14, y: 1, name: "Elixer (hidden) — on a plant east of the Scientist" },
          { x: 4, y: 7, name: "TM09 (Take Down) — southwest area" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Rocket Grunt — Hypno Lv.33" },
          { x: 12, y: 3, note: "Juggler — Kadabra, Mr. Mime Lv.29" },
          { x: 7, y: 5, note: "Scientist — Magneton, Koffing, Weezing, Magnemite Lv.26" },
          { x: 3, y: 7, note: "Rocket Grunt — Arbok Lv.33" }
        ],
        notes: "The Card Key is the key to the whole building — grab it before exploring further."
      },
      {
        name: "6F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..I...T....T...I#",
          "#................#",
          "#......T.........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 3, name: "X Accuracy — southwest room" },
          { x: 16, y: 3, name: "HP Up — southwest room" }
        ],
        trainers: [
          { x: 7, y: 3, note: "Rocket Grunt — Machop, Machoke Lv.29" },
          { x: 12, y: 3, note: "Rocket Grunt — Zubat x2, Golbat Lv.28" },
          { x: 7, y: 5, note: "Scientist — Voltorb, Koffing, Magneton, Magnemite, Koffing Lv.25" }
        ]
      },
      {
        name: "7F",
        grid: [
          "##################",
          "#..I......S......#",
          "#................#",
          "#..T........T...I#",
          "#................#",
          "#......T.....T...#",
          "#................#",
          "#..XI.....S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Calcium — northwest of the Scientist" },
          { x: 16, y: 3, name: "TM03 (Swords Dance) — eastern room" },
          { x: 4, y: 7, name: "Lapras (gift, Lv.15) — from the Silph employee" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Rocket Grunt — Cubone x2 Lv.29" },
          { x: 12, y: 3, note: "Rocket Grunt — Raticate, Arbok, Koffing, Golbat Lv.26" },
          { x: 7, y: 5, note: "Scientist — Electrode, Muk Lv.29" },
          { x: 13, y: 5, note: "Rival Blue — showdown battle" }
        ]
      },
      {
        name: "8F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [],
        trainers: [
          { x: 3, y: 3, note: "Rocket Grunt — Raticate, Zubat, Golbat, Rattata Lv.26" },
          { x: 12, y: 3, note: "Rocket Grunt — Weezing, Golbat, Koffing Lv.28" },
          { x: 7, y: 5, note: "Scientist — Grimer, Electrode Lv.29" }
        ],
        notes: "No item pickups on 8F in Red/Blue/Yellow."
      },
      {
        name: "9F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.....I...#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 13, y: 5, name: "Max Potion (hidden) — on a bed, south and west of the nurse" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Rocket Grunt — Golbat, Drowzee, Hypno Lv.28" },
          { x: 12, y: 3, note: "Rocket Grunt — Drowzee, Grimer, Machop Lv.28" },
          { x: 7, y: 5, note: "Scientist — Voltorb, Koffing, Magneton Lv.28" }
        ],
        notes: "The bed in the corner fully heals your party — no need to leave the building."
      },
      {
        name: "10F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..I...T....I..II#",
          "#................#",
          "#......T.........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 3, name: "Rare Candy — southwest room" },
          { x: 12, y: 3, name: "Carbos — southwest room" },
          { x: 15, y: 3, name: "TM26 (Earthquake) — southwest room" }
        ],
        trainers: [
          { x: 7, y: 3, note: "Scientist — Magnemite, Koffing Lv.29" },
          { x: 7, y: 5, note: "Rocket Grunt — Machoke Lv.33" }
        ]
      },
      {
        name: "11F",
        grid: [
          "##################",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#.......T........#",
          "#................#",
          "#.......XI.......#",
          "#................#",
          "##################",
        ],
        items: [
          { x: 9, y: 6, name: "Master Ball — from the president after defeating Giovanni" }
        ],
        trainers: [
          { x: 3, y: 2, note: "Rocket Grunt — Rattata x2, Zubat, Rattata, Ekans Lv.25" },
          { x: 12, y: 2, note: "Rocket Grunt — Cubone, Drowzee, Marowak Lv.32" },
          { x: 8, y: 4, note: "Giovanni — final showdown (board room)" }
        ]
      }
    ],
    walkthrough: [
      "1. Enter 1F in Saffron City (the Rocket guard is gone once Mr. Fuji is rescued) and work upward.",
      "2. On 2F, talk to the woman hiding in the northwest room for TM36 (Selfdestruct), and beat the Rockets and Scientists.",
      "3. On 3F, grab the Hyper Potion northeast of the Scientist.",
      "4. On 4F, loot the west storage room: Full Heal, Escape Rope and Max Revive.",
      "5. On 5F, the Card Key is the priority — it is east of the southernmost Rocket Grunt. Also grab the Protein, hidden Elixer and TM09 (Take Down).",
      "6. Use the Card Key on the locked doors and ride warp panels upward; clear 6F (X Accuracy, HP Up).",
      "7. On 7F, battle your rival Blue, grab Calcium and TM03 (Swords Dance), and accept the gift Lapras (Lv.15).",
      "8. Rest at the healing bed on 9F (southwest corner), grab the hidden Max Potion, and sweep 10F for the Rare Candy, Carbos and TM26 (Earthquake).",
      "9. On 11F, fight through the last Rockets to Giovanni in the board room and beat him.",
      "10. Talk to the president — he gives you the Master Ball. Team Rocket withdraws from the building."
    ]
  },
  {
    game: "Pokémon Red, Blue & Yellow",
    dungeon: "Victory Road",
    floors: [
      {
        name: "1F",
        grid: [
          "#######################",
          "#.........I....I......#",
          "#....................##",
          "#..T......####...T...##",
          "#..........####......##",
          "#..####........T.....##",
          "#..####..........##..##",
          "#......T........##...##",
          "#....................##",
          "#..T................S##",
          "#.........E..........##",
          "#######################",
        ],
        items: [
          { x: 10, y: 1, name: "Rare Candy — north area of the floor" },
          { x: 15, y: 1, name: "TM43 (Sky Attack) — north area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Black Belt — Machoke Lv.43" },
          { x: 17, y: 3, note: "Tamer — Rhyhorn Lv.44" },
          { x: 7, y: 7, note: "PokeManiac — Charmeleon Lv.40" },
          { x: 3, y: 9, note: "Cooltrainer — Exeggutor Lv.42" }
        ],
        notes: "Strength boulder puzzles block the way — push boulders onto the switches to lower the barriers."
      },
      {
        name: "2F",
        grid: [
          "######################",
          "#S....I..............#",
          "#....................#",
          "#..T......####...T...#",
          "#.....I...####..II...#",
          "#..####........T.....#",
          "#..####..........##..#",
          "#......T....I...##.II#",
          "#....................#",
          "#..T..I..............#",
          "#...................S#",
          "######################",
        ],
        items: [
          { x: 6, y: 4, name: "TM05 (Mega Kick) — southwest of the Black Belt" },
          { x: 16, y: 4, name: "Full Heal — southwest of the Tamer" },
          { x: 12, y: 7, name: "TM17 (Submission) — northeast area of the floor" },
          { x: 6, y: 1, name: "Guard Spec. — northwest area of the floor" },
          { x: 19, y: 7, name: "Ultra Ball (hidden) — on a rock east of the Poke Maniac" },
          { x: 6, y: 9, name: "Full Restore (hidden) — on a rock west of the ladder by the exit" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Black Belt — Machop, Machoke Lv.40" },
          { x: 17, y: 3, note: "Tamer — Persian, Golduck Lv.44" },
          { x: 15, y: 5, note: "PokeManiac — Kangaskhan Lv.42" },
          { x: 7, y: 7, note: "Cooltrainer — Cloyster Lv.43" },
          { x: 3, y: 9, note: "Juggler — Drowzee, Hypno Lv.41" }
        ]
      },
      {
        name: "3F",
        grid: [
          "#######################",
          "#S......II.....I.....X#",
          "#....................##",
          "#..T......####...T...##",
          "#..........####......##",
          "#..####........T.....##",
          "#..####..........##..##",
          "#......T........##...##",
          "#....................##",
          "#..T.................##",
          "#....................##",
          "#######################",
        ],
        items: [
          { x: 9, y: 1, name: "Max Revive — northeast area of the floor" },
          { x: 15, y: 1, name: "TM47 (Explosion) — northwest area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Cooltrainer — Sandslash Lv.42" },
          { x: 17, y: 3, note: "Cooltrainer — Slowbro Lv.44" },
          { x: 7, y: 7, note: "Tamer — Rhyhorn x2 Lv.43" },
          { x: 3, y: 9, note: "Black Belt — Machoke x2 Lv.43" }
        ],
        notes: "Moltres (Lv.50) waits in the northwest — bring Ultra Balls. The east exit leads to the Indigo Plateau."
      }
    ],
    walkthrough: [
      "1. Enter from Route 23 in the south — you need all 8 badges and a Pokemon with Strength.",
      "2. On 1F, push the boulder onto the floor switch to drop the barrier; grab the Rare Candy and TM43 (Sky Attack) in the north area.",
      "3. Climb to 2F and work the Strength puzzles past Black Belts, Tamers and Cooltrainers; collect TM05 (Mega Kick), Full Heal, TM17 (Submission), Guard Spec. and the two hidden items.",
      "4. On 3F, grab the Max Revive and TM47 (Explosion).",
      "5. Optional: catch Moltres (Lv.50) in the northwest of 3F before leaving.",
      "6. Exit east to the Indigo Plateau and the Pokemon League."
    ]
  },
  // ==================== POKEMON FIRERED & LEAFGREEN ====================
  {
    game: "Pokémon FireRed & LeafGreen",
    dungeon: "Mt. Moon",
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#....I.......S....SI.#",
          "#.T..................#",
          "#.....#########......#",
          "#.I...#.......#..T...#",
          "#.....#.......#......#",
          "#..I..#...T...#I.I...#",
          "#.T...#.......#......#",
          "#.....####.####..TT..#",
          "#..I........II.......#",
          "#.........E........S.#",
          "######################",
        ],
        items: [
          { x: 5, y: 1, name: "TM09 (Bullet Seed) — southwest area, southeast of Bug Catcher Kent" },
          { x: 3, y: 6, name: "Parlyz Heal — southwest area, northwest of Bug Catcher Kent" },
          { x: 12, y: 9, name: "Potion — south area, northwest of Super Nerd Jovan" },
          { x: 15, y: 6, name: "Rare Candy — near the southeast corner" },
          { x: 19, y: 1, name: "Escape Rope — east area, northeast of the Rare Candy" },
          { x: 3, y: 9, name: "Moon Stone (hidden) — northwest area" }
        ],
        trainers: [
          { x: 2, y: 2, note: "Bug Catcher Kent — Weedle, Kakuna Lv.11" },
          { x: 2, y: 7, note: "Super Nerd Jovan — Magnemite, Voltorb Lv.11" },
          { x: 17, y: 4, note: "Lass Iris — Clefairy Lv.14" },
          { x: 10, y: 6, note: "Youngster Josh — Rattata x2, Zubat Lv.10" },
          { x: 18, y: 8, note: "Hiker Marcos — Geodude x2, Onix Lv.10" }
        ],
        notes: "A fossil-hunting friend of Brock digs in the northeast corner (Fame Checker info)."
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#S.................S.#",
          "#....................#",
          "#..#####..I...#####..#",
          "#..#####..S...#####..#",
          "#....................#",
          "#......I.............#",
          "#..#####......#####..#",
          "#..#####......#####..#",
          "#S.................S.#",
          "######################",
        ],
        items: [
          { x: 10, y: 3, name: "TinyMushroom x3 (hidden, recurring) — on the rocks" },
          { x: 7, y: 6, name: "Big Mushroom x3 (hidden, recurring) — on the rocks" }
        ],
        trainers: [],
        notes: "Check the rocks with the Itemfinder — the mushrooms regrow over time."
      },
      {
        name: "B2F",
        grid: [
          "######################",
          "#..I......SI.....I...#",
          "#....................#",
          "#..#####..#####..###.#",
          "#..#...#..#...#..#...#",
          "#..#.TT#..#.T.#..#TT.#",
          "#..#...#..#...#..#...#",
          "#..#####..#####..###.#",
          "#.....I..............#",
          "#..I.......I..T...I..#",
          "#........S...........#",
          "######################",
        ],
        items: [
          { x: 3, y: 1, name: "Star Piece — closed-off east room (easternmost ladder)" },
          { x: 11, y: 1, name: "TM46 (Thief) — middle ladder room" },
          { x: 17, y: 1, name: "Ether (hidden) — middle ladder room" },
          { x: 3, y: 9, name: "Moon Stone (hidden) — southeast of the Super Nerd" },
          { x: 6, y: 8, name: "Antidote — southwest of the ladder near the northwest corner" },
          { x: 11, y: 9, name: "Revive — north of the center ladder to B1F" },
          { x: 18, y: 9, name: "Dome Fossil OR Helix Fossil — your pick after beating the Super Nerd" }
        ],
        trainers: [
          { x: 6, y: 5, note: "Team Rocket Grunt — Sandshrew, Rattata, Zubat Lv.11" },
          { x: 12, y: 5, note: "Team Rocket Grunt — Zubat, Ekans Lv.11" },
          { x: 18, y: 5, note: "Team Rocket Grunt — Rattata, Sandshrew Lv.13" },
          { x: 14, y: 9, note: "Super Nerd Miguel — Grimer, Voltorb, Koffing Lv.12 (holds the fossils)" }
        ],
        notes: "Fossil choice: Helix OR Dome — Miguel keeps the other. Revive it later at the Cinnabar Lab."
      }
    ],
    walkthrough: [
      "1. Enter from Route 3 (south); sweep the 1F cavern for TM09 (Bullet Seed), Parlyz Heal, Potion, Rare Candy, Escape Rope and the hidden Moon Stone.",
      "2. Beat the Bug Catchers, Lasses, Youngster Josh, Super Nerd Jovan and Hiker Marcos on your way north.",
      "3. Drop down the ladders to B1F and use the Itemfinder on the rocks for hidden TinyMushrooms and Big Mushrooms.",
      "4. Continue down to B2F and clear the Team Rocket Grunts in the three closed-off rooms.",
      "5. Loot the east room (Star Piece), the middle room (TM46 Thief + hidden Ether), and grab the Antidote, Revive and hidden Moon Stone.",
      "6. Defeat Super Nerd Miguel and choose ONE fossil — Dome or Helix — then exit east to Route 4."
    ]
  },
  {
    game: "Pokémon FireRed & LeafGreen",
    dungeon: "Rock Tunnel",
    floors: [
      {
        name: "1F",
        grid: [
          "#######################",
          "#E....II.............S#",
          "#..T.........TT......##",
          "#.....######.........S#",
          "#.....#....#...TT....##",
          "#..T..#....#...I..I..##",
          "#.....#....#.....T...##",
          "#.....######..........#",
          "#..........T.....II..##",
          "#.....T..........TT..##",
          "#....................##",
          "#...................S##",
          "#######################",
        ],
        items: [
          { x: 7, y: 1, name: "Repel — northeast of the room at the north entrance" },
          { x: 15, y: 5, name: "Escape Rope — southeast corner of the northeast section" },
          { x: 18, y: 8, name: "Pearl — northwest of Picnicker Ariana" }
        ],
        trainers: [
          { x: 3, y: 2, note: "PokeManiac Ashton — Cubone, Slowpoke Lv.23" },
          { x: 13, y: 2, note: "Hiker Allen — Geodude Lv.25" },
          { x: 3, y: 5, note: "Picnicker Martha — Oddish, Bulbasaur Lv.22" },
          { x: 15, y: 4, note: "PokeManiac Steve — Charmander, Cubone Lv.22" },
          { x: 17, y: 6, note: "Hiker Eric — Machop, Onix Lv.20" },
          { x: 6, y: 9, note: "Hiker Lenny — Geodude, Machop, Geodude x2 Lv.19" },
          { x: 11, y: 8, note: "Hiker Oliver — Onix x2, Geodude Lv.20" },
          { x: 18, y: 9, note: "Hiker Lucas — Geodude, Graveler Lv.21" }
        ],
        notes: "Pitch black without Flash. New layout vs. the originals, with item balls added."
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#S...................#",
          "#....................#",
          "#..T......####...T...#",
          "#..........####..I...#",
          "#..####..........T...#",
          "#..####..............#",
          "#..I...T........####.#",
          "#..............####..#",
          "#..T.................#",
          "#...................E#",
          "######################",
        ],
        items: [
          { x: 3, y: 7, name: "Revive — southwest corner (from the northeasternmost 1F ladder)" },
          { x: 17, y: 4, name: "Max Ether — northeast of Hiker Dudley" }
        ],
        trainers: [
          { x: 3, y: 3, note: "PokeManiac Winston — Slowpoke Lv.25" },
          { x: 17, y: 3, note: "Hiker Dudley — Geodude x2, Graveler Lv.21" },
          { x: 17, y: 5, note: "PokeManiac Cooper — Slowpoke x3 Lv.20" },
          { x: 7, y: 7, note: "Picnicker Sofia — Jigglypuff, Pidgey, Meowth Lv.21" },
          { x: 3, y: 9, note: "Picnicker Leah — Bellsprout, Clefairy Lv.22" }
        ],
        notes: "A Youngster in the northwest teaches Rock Slide to a compatible Pokemon."
      }
    ],
    walkthrough: [
      "1. Enter from the north (Route 10, by the Pokemon Center) and use Flash — the tunnel is pitch black.",
      "2. Head east first for the Repel, beat PokeManiac Ashton, then take the northeast ladder down to B1F.",
      "3. On B1F go southwest past PokeManiac Winston to the dead-end Revive, then loop northeast beating the other trainers.",
      "4. Climb back up to 1F (west section), head southeast past Hikers Lenny and Oliver, grab the Escape Rope, and beat Hiker Lucas.",
      "5. Take the ladder down to B1F (northwest), beat Picnicker Sofia, visit the Rock Slide tutor Youngster, and grab the Max Ether north of Hiker Dudley.",
      "6. Climb the final northwest ladder to 1F (south), beat Picnickers Leah, Ariana and Dana, grab the Pearl, and exit southwest to Lavender Town."
    ]
  },
  {
    game: "Pokémon FireRed & LeafGreen",
    dungeon: "Pokémon Tower",
    floors: [
      {
        name: "1F",
        grid: [
          "####################",
          "#..................#",
          "#..................#",
          "#..................#",
          "#........S.........#",
          "#..................#",
          "#..................#",
          "#........E.........#",
          "####################",
        ],
        items: [],
        trainers: [],
        notes: "Lobby. No encounters or items on 1F-2F."
      },
      {
        name: "2F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#.......T..........#",
          "#..................#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [],
        trainers: [
          { x: 8, y: 3, note: "Rival Blue — ambush battle on your way up" }
        ]
      },
      {
        name: "3F",
        grid: [
          "####################",
          "#...I....S.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......T...........#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 4, y: 1, name: "Escape Rope — north area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Gastly Lv.18" },
          { x: 14, y: 3, note: "Channeler — Gastly Lv.19" },
          { x: 7, y: 5, note: "Channeler — Gastly Lv.18" }
        ],
        notes: "Ghosts are unidentifiable without the Silph Scope (from the Celadon Rocket Hideout)."
      },
      {
        name: "4F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..T.....I.....T...#",
          "#..................#",
          "#..I..........T....#",
          "#..................#",
          "#........S....I....#",
          "####################",
        ],
        items: [
          { x: 9, y: 3, name: "Elixir — southeast of the center" },
          { x: 3, y: 5, name: "Awakening — southwest of the center" },
          { x: 14, y: 7, name: "Great Ball — south area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Gastly Lv.19" },
          { x: 15, y: 3, note: "Channeler — Haunter Lv.20" },
          { x: 14, y: 5, note: "Channeler — Gastly Lv.18" }
        ]
      },
      {
        name: "5F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......I.....II....#",
          "#..I..........T....#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 7, y: 5, name: "Cleanse Tag — center of the healing area" },
          { x: 3, y: 6, name: "Nugget — southwest area of the floor" },
          { x: 13, y: 5, name: "Big Mushroom (hidden) — near Channeler Ruth" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler Ruth — Gastly Lv.19" },
          { x: 14, y: 3, note: "Channeler — Haunter Lv.20" },
          { x: 14, y: 6, note: "Channeler — Gastly Lv.19" }
        ],
        notes: "The healing spot in the middle is safe from wild encounters."
      },
      {
        name: "6F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......X...........#",
          "#..I...............#",
          "#..I......S........#",
          "####################",
        ],
        items: [
          { x: 3, y: 6, name: "X Accuracy — southwest of the stairs" },
          { x: 3, y: 7, name: "Rare Candy — west area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Channeler — Haunter Lv.21" },
          { x: 14, y: 3, note: "Channeler — Gastly Lv.19" }
        ],
        notes: "The ghost of Marowak blocks the stairs — reveal it with the Silph Scope and defeat it."
      },
      {
        name: "7F",
        grid: [
          "####################",
          "#..................#",
          "#....T....T....T...#",
          "#..................#",
          "#.......IXI........#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 8, y: 4, name: "Poke Flute — from Mr. Fuji after the rescue" },
          { x: 10, y: 4, name: "Soothe Bell (hidden) — use the Itemfinder where Mr. Fuji stood" }
        ],
        trainers: [
          { x: 5, y: 2, note: "Team Rocket Grunt — Cubone, Zubat Lv.25" },
          { x: 10, y: 2, note: "Team Rocket Grunt — Raticate, Hypno Lv.28" },
          { x: 15, y: 2, note: "Team Rocket Grunt — Haunter, Gengar Lv.30" }
        ]
      }
    ],
    walkthrough: [
      "1. Enter the tower in Lavender Town — 1F is a quiet lobby.",
      "2. On 2F, your rival Blue ambushes you for a battle.",
      "3. Climb through 3F-4F, beating Channelers; grab the Escape Rope (3F) and the Elixir, Awakening and Great Ball (4F).",
      "4. On 5F, rest at the healing spot, pick up the Cleanse Tag and Nugget, and Itemfinder the hidden Big Mushroom near Channeler Ruth.",
      "5. IMPORTANT: without the Silph Scope from the Celadon Rocket Hideout, the ghosts cannot be identified and your Pokemon will be too scared to move.",
      "6. On 6F, grab the X Accuracy and Rare Candy, then reveal and defeat the ghost of Marowak blocking the stairs.",
      "7. On 7F, beat the three Team Rocket Grunts to free Mr. Fuji.",
      "8. Mr. Fuji gives you the Poke Flute — wake the Snorlax on Routes 12 and 16. Then Itemfinder the exact spot where Fuji stood for a hidden Soothe Bell."
    ]
  },
  {
    game: "Pokémon FireRed & LeafGreen",
    dungeon: "Silph Co.",
    floors: [
      {
        name: "1F",
        grid: [
          "##################",
          "#................#",
          "#..####....####..#",
          "#..####....####..#",
          "#................#",
          "#.......S........#",
          "#................#",
          "#.......E........#",
          "##################",
        ],
        items: [],
        trainers: [],
        notes: "Lobby. The Rocket guard naps at the door once Mr. Fuji is rescued."
      },
      {
        name: "2F",
        grid: [
          "##################",
          "#..I......S......#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.....I...#",
          "#................#",
          "#..T......S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Thunder Wave (move tutor) — from the woman hiding in the northwest room" },
          { x: 13, y: 5, name: "Ultra Ball (hidden) — on the southern plant in the southwest office" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Golbat, Zubat x3, Raticate Lv.25" },
          { x: 12, y: 3, note: "Scientist Jerry — Magnemite, Voltorb, Magneton Lv.28" },
          { x: 7, y: 5, note: "Team Rocket Grunt — Cubone, Zubat Lv.29" },
          { x: 3, y: 7, note: "Scientist Connor — Grimer, Weezing, Koffing, Weezing Lv.26" }
        ]
      },
      {
        name: "3F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..T........II...#",
          "#..........I.....#",
          "#.......T........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 13, y: 3, name: "Hyper Potion — northeast of the Scientist" },
          { x: 11, y: 4, name: "Protein (hidden) — on the center plant of the three plants, southeast area" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Raticate, Hypno, Raticate Lv.28" },
          { x: 8, y: 5, note: "Scientist Jose — Electrode, Weezing Lv.29" }
        ]
      },
      {
        name: "4F",
        grid: [
          "##################",
          "#..I...S.....T..I#",
          "#..I.............#",
          "#..I.............#",
          "#.............I..#",
          "#.....T..........#",
          "#................#",
          "#..T......S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Full Heal — west storage room" },
          { x: 3, y: 2, name: "Escape Rope — west storage room" },
          { x: 3, y: 3, name: "Max Revive — west storage room" },
          { x: 16, y: 1, name: "TM41 (Torment) — southeast area" },
          { x: 14, y: 4, name: "Iron (hidden) — on the southernmost plant, southeast area" }
        ],
        trainers: [
          { x: 13, y: 1, note: "Team Rocket Grunt — Ekans, Zubat, Cubone Lv.28" },
          { x: 6, y: 5, note: "Team Rocket Grunt — Machop, Drowzee Lv.29" },
          { x: 3, y: 7, note: "Scientist Rodney — Electrode Lv.33" }
        ]
      },
      {
        name: "5F",
        grid: [
          "##################",
          "#..I......S...I..#",
          "#.............I..#",
          "#..T........T....#",
          "#................#",
          "#......T.....I...#",
          "#................#",
          "#..TI.....S..I...#",
          "##################",
        ],
        items: [
          { x: 13, y: 5, name: "Card Key — east of the southernmost Rocket Grunt" },
          { x: 3, y: 1, name: "Protein — northwest room" },
          { x: 4, y: 7, name: "TM01 (Focus Punch) — southwest room" },
          { x: 14, y: 1, name: "PP Up (hidden) — on the plant south of the stairs to 6F" },
          { x: 14, y: 2, name: "Elixir (hidden) — on the southern plant in the center area" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Hypno Lv.33" },
          { x: 12, y: 3, note: "Juggler Dalton — Kadabra, Mr. Mime Lv.29" },
          { x: 7, y: 5, note: "Scientist Beau — Magneton, Magnemite, Koffing, Weezing Lv.26" },
          { x: 3, y: 7, note: "Team Rocket Grunt — Arbok Lv.33" }
        ],
        notes: "The Card Key opens the building's security doors — get it before exploring upward."
      },
      {
        name: "6F",
        grid: [
          "##################",
          "#..I....S.....I..#",
          "#................#",
          "#..I...T....T...I#",
          "#................#",
          "#......T.........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 3, name: "X Accuracy — southwest room" },
          { x: 16, y: 3, name: "HP Up — southwest room" },
          { x: 3, y: 1, name: "Carbos (hidden) — on the western plant, northwest area" },
          { x: 14, y: 1, name: "X Special — southwest room" }
        ],
        trainers: [
          { x: 7, y: 3, note: "Team Rocket Grunt — Machop, Machoke Lv.29" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Zubat x2, Golbat Lv.28" },
          { x: 7, y: 5, note: "Scientist Taylor — Voltorb, Koffing, Magneton, Magnemite, Koffing Lv.25" }
        ]
      },
      {
        name: "7F",
        grid: [
          "##################",
          "#..I......S......#",
          "#................#",
          "#..T........T...I#",
          "#.............I..#",
          "#......T.....T...#",
          "#................#",
          "#.TXI.....S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Calcium — northwest of the Scientist" },
          { x: 16, y: 3, name: "TM08 (Bulk Up) — eastern room" },
          { x: 14, y: 4, name: "Zinc (hidden) — on the southern plant, east area" },
          { x: 4, y: 7, name: "Lapras (gift, Lv.25) — from the Silph employee" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Cubone x2 Lv.29" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Raticate, Zubat, Golbat, Rattata Lv.26" },
          { x: 7, y: 5, note: "Scientist Joshua — Electrode, Muk Lv.29" },
          { x: 13, y: 5, note: "Team Rocket Grunt — Sandshrew, Sandslash Lv.29" },
          { x: 2, y: 7, note: "Rival Blue — showdown battle" }
        ]
      },
      {
        name: "8F",
        grid: [
          "##################",
          "#.......S.....I..#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.....II..#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 14, y: 1, name: "Iron — east of the beds south of the elevator" },
          { x: 14, y: 5, name: "Nugget (hidden) — on the northern plant, east area" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Raticate, Golbat, Arbok, Koffing Lv.26" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Weezing, Golbat, Koffing Lv.28" },
          { x: 7, y: 5, note: "Scientist Parker — Grimer, Electrode Lv.29" }
        ]
      },
      {
        name: "9F",
        grid: [
          "##################",
          "#.......S........#",
          "#..I.............#",
          "#..T........T....#",
          "#................#",
          "#......T.....I...#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 2, name: "Max Potion (hidden) — one square east of the boxes" },
          { x: 13, y: 5, name: "Calcium (hidden) — on the eastern plant, northwest area" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Golbat, Drowzee, Hypno Lv.28" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Drowzee, Grimer, Machop Lv.28" },
          { x: 7, y: 5, note: "Scientist Ed — Voltorb, Magneton, Koffing Lv.28" }
        ],
        notes: "The bed in the corner fully heals your party."
      },
      {
        name: "10F",
        grid: [
          "##################",
          "#.......S.....II.#",
          "#................#",
          "#..I...T....I....#",
          "#.............I..#",
          "#......T.........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 3, name: "Rare Candy — southwest room" },
          { x: 12, y: 3, name: "Carbos — southwest room" },
          { x: 15, y: 1, name: "Ultra Ball — southwest area" },
          { x: 14, y: 4, name: "HP Up (hidden) — on the plant, eastern area" }
        ],
        trainers: [
          { x: 7, y: 3, note: "Team Rocket Grunt — Machoke Lv.33" },
          { x: 7, y: 5, note: "Scientist Travis — Magnemite, Koffing Lv.29" }
        ]
      },
      {
        name: "11F",
        grid: [
          "##################",
          "#..............I.#",
          "#..T........T....#",
          "#................#",
          "#.......T.....I..#",
          "#................#",
          "#.......XI.......#",
          "#................#",
          "##################",
        ],
        items: [
          { x: 9, y: 6, name: "Master Ball — from the president after defeating Giovanni" },
          { x: 15, y: 1, name: "Zinc — one square north of the southeast corner" },
          { x: 14, y: 4, name: "Revive (hidden) — on the center plant, south area" }
        ],
        trainers: [
          { x: 3, y: 2, note: "Team Rocket Grunt — Rattata, Zubat, Ekans, Rattata x2 Lv.25" },
          { x: 12, y: 2, note: "Team Rocket Grunt — Cubone, Drowzee, Marowak Lv.32" },
          { x: 8, y: 4, note: "Giovanni — final showdown (board room)" }
        ]
      }
    ],
    walkthrough: [
      "1. Enter 1F in Saffron City (the Rocket guard naps once Mr. Fuji is rescued) and work upward.",
      "2. On 2F, talk to the woman hiding in the northwest room to have Thunder Wave taught, Itemfinder the hidden Ultra Ball in the southwest office, and beat the Rockets and Scientists.",
      "3. On 3F, grab the Hyper Potion and the hidden Protein on the center plant.",
      "4. On 4F, loot the west storage room (Full Heal, Escape Rope, Max Revive), plus TM41 (Torment) and the hidden Iron in the southeast.",
      "5. On 5F, the Card Key is the priority — east of the southernmost Rocket Grunt. Also grab the Protein, TM01 (Focus Punch), and the hidden PP Up and Elixir.",
      "6. Use the Card Key on the security doors and warp upward; sweep 6F (X Accuracy, HP Up, hidden Carbos, X Special).",
      "7. On 7F, battle your rival Blue, grab Calcium, TM08 (Bulk Up) and the hidden Zinc, and accept the gift Lapras (Lv.25).",
      "8. Clear 8F (Iron, hidden Nugget), rest at the 9F healing bed, and grab the hidden Max Potion and Calcium.",
      "9. Sweep 10F: Rare Candy, Carbos, Ultra Ball and the hidden HP Up.",
      "10. On 11F, fight the last Rockets to Giovanni in the board room and defeat him.",
      "11. Talk to the president for the Master Ball, plus the Zinc and hidden Revive. Team Rocket withdraws."
    ]
  },
  {
    game: "Pokémon FireRed & LeafGreen",
    dungeon: "Victory Road",
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#.........I....I...I.#",
          "#.............I......#",
          "#..T......####...T...#",
          "#..........####......#",
          "#..####........T.....#",
          "#..####..........##..#",
          "#......T........##...#",
          "#....................#",
          "#..T................S#",
          "#.........E..........#",
          "######################",
        ],
        items: [
          { x: 10, y: 1, name: "Rare Candy — north area of the floor" },
          { x: 15, y: 1, name: "TM02 (Dragon Claw) — north area of the floor" },
          { x: 19, y: 1, name: "Ultra Ball (hidden) — on a rock near the center" },
          { x: 14, y: 2, name: "Full Restore (hidden) — on the rock two squares east of TM02" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Cooltrainer Naomi — Persian, Ponyta, Rapidash, Vulpix, Ninetales Lv.42" },
          { x: 17, y: 3, note: "Cooltrainer Rolando — Raticate, Ivysaur, Wartortle, Charmeleon, Charizard Lv.42" },
          { x: 7, y: 7, note: "PokéManiac Dawson — Charmeleon, Lapras, Lickitung Lv.40" },
          { x: 3, y: 9, note: "Cooltrainer George — Exeggutor, Sandslash, Cloyster, Electrode, Arcanine Lv.42" }
        ],
        notes: "Strength boulder puzzles block the way — push boulders onto the switches to lower the barriers."
      },
      {
        name: "2F",
        grid: [
          "######################",
          "#S....I..............#",
          "#....................#",
          "#..T......####...T...#",
          "#.....I...####.......#",
          "#..####..II....T.....#",
          "#..####..........##..#",
          "#......T....I...##...#",
          "#....................#",
          "#..T.................#",
          "#...................S#",
          "######################",
        ],
        items: [
          { x: 6, y: 4, name: "TM37 (Sandstorm) — southwest of Black Belt Daisuke" },
          { x: 9, y: 5, name: "Full Heal — southwest of the Tamer" },
          { x: 12, y: 7, name: "TM07 (Hail) — northeast area of the floor" },
          { x: 6, y: 1, name: "Guard Spec. — northwest area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Black Belt Daisuke — Machoke, Machop, Machoke Lv.43" },
          { x: 17, y: 3, note: "Tamer Vincent — Persian, Golduck Lv.44" },
          { x: 15, y: 5, note: "Juggler Nelson — Drowzee, Hypno, Kadabra x2 Lv.41" },
          { x: 7, y: 7, note: "Cooltrainer Alexa — Clefairy, Jigglypuff, Persian, Dewgong, Chansey Lv.42" },
          { x: 3, y: 9, note: "Juggler Gregory — Mr. Mime Lv.48" }
        ]
      },
      {
        name: "3F",
        grid: [
          "#######################",
          "#S......II.....I.....X#",
          "#....................##",
          "#..T......####...T...##",
          "#..........####......##",
          "#..####........T...T.##",
          "#..####..........##..##",
          "#......T........##...##",
          "#....................##",
          "#..T.................##",
          "#....................##",
          "#######################",
        ],
        items: [
          { x: 9, y: 1, name: "Max Revive — northeast area of the floor" },
          { x: 15, y: 1, name: "TM50 (Overheat) — northwest area of the floor" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Cooltrainer Colby — Kingler, Poliwhirl, Tentacruel, Seadra, Blastoise Lv.41-43" },
          { x: 17, y: 3, note: "Cooltrainer Caroline — Bellsprout, Weepinbell, Victreebel, Paras, Parasect Lv.42" },
          { x: 19, y: 5, note: "Cool Couple Ray & Tyra — Nidoking, Nidoqueen Lv.45" },
          { x: 7, y: 7, note: "Tamer — Rhyhorn line Lv.43" },
          { x: 3, y: 9, note: "Black Belt — Machoke line Lv.43" }
        ],
        notes: "A move tutor at the very end teaches Double-Edge. Moltres's old crater is here — it moved to Mt. Ember. The east exit leads to the Indigo Plateau."
      }
    ],
    walkthrough: [
      "1. Enter from Route 23 in the south — you need all 8 badges and Strength.",
      "2. On 1F, solve the boulder-and-switch puzzles past the Cooltrainers; grab the Rare Candy, TM02 (Dragon Claw), and the hidden Ultra Ball and Full Restore.",
      "3. Climb to 2F and work through Black Belt Daisuke, Tamer Vincent and the Jugglers; collect TM37 (Sandstorm), Full Heal, TM07 (Hail) and Guard Spec.",
      "4. On 3F, grab the Max Revive and TM50 (Overheat), and visit the Double-Edge move tutor at the very end.",
      "5. Exit east to the Indigo Plateau and the Pokemon League."
    ]
  },
  {
    game: "Pokémon FireRed & LeafGreen",
    dungeon: "Kindle Road & Mt. Ember",
    floors: [
      {
        name: "Kindle Road",
        grid: [
          "########################",
          "#......................#",
          "#..T.......T.......T...#",
          "#......................#",
          "#......T.......T.......#",
          "#......................#",
          "#..T...............T...#",
          "#......................#",
          "#.........E............#",
          "########################",
        ],
        items: [],
        trainers: [
          { x: 3, y: 2, note: "Crush Girl — Hitmonlee line Lv.36" },
          { x: 11, y: 2, note: "Black Belt — Machop line Lv.36" },
          { x: 19, y: 2, note: "Bird Keeper — Fearow Lv.37" },
          { x: 7, y: 4, note: "Picnicker — Ponyta Lv.36" },
          { x: 15, y: 4, note: "Crush Girl — Hitmonchan Lv.37" },
          { x: 3, y: 6, note: "Hiker — Geodude line Lv.37" },
          { x: 19, y: 6, note: "Ranger — Exeggutor Lv.38" }
        ],
        notes: "The grassy western path is packed with trainers and wild Ponyta/Rapidash. Ember Spa (north): the old man gives HM06 Rock Smash, and the hot spring heals your party."
      },
      {
        name: "Mt. Ember Exterior",
        grid: [
          "######################",
          "#.........S..........#",
          "#....................#",
          "#..T.......II.....T..#",
          "#....................#",
          "#......T.......T.....#",
          "#....................#",
          "#..I.............I...#",
          "#....................#",
          "#.........E..........#",
          "######################",
        ],
        items: [
          { x: 11, y: 3, name: "Dire Hit — northeast of the grass, east side" },
          { x: 3, y: 7, name: "Ultra Ball x2 (hidden) — near Ranger Logan, dead-end west path" },
          { x: 17, y: 7, name: "Fire Stone x2 (hidden) — in a rock near the Ultra Balls (needs Strength + Rock Smash)" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Pokémon Ranger Beth — Bellsprout, Gloom x2 Lv.38" },
          { x: 18, y: 3, note: "Crush Girl Jocelyn — Hitmonchan x2 Lv.38" },
          { x: 7, y: 5, note: "Pokémon Ranger Logan — Exeggcute Lv.37, Exeggutor Lv.40" }
        ],
        notes: "A Hiker near the entrance teaches Explosion to a compatible Pokemon. Two Team Rocket Grunts lurk east (they only battle after the National Dex)."
      },
      {
        name: "Summit Path",
        grid: [
          "####################",
          "#........E.........#",
          "#..................#",
          "#..####....####....#",
          "#..####....####....#",
          "#..................#",
          "#....####..####....#",
          "#....####..####....#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [],
        trainers: [],
        notes: "Straightforward tunnels through the volcano — wild Machop, Geodude and Machoke."
      },
      {
        name: "Summit",
        grid: [
          "####################",
          "#..................#",
          "#......IXX.........#",
          "#..................#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 7, y: 2, name: "Moltres (Lv.50) — roosting at the summit" }
        ],
        trainers: [],
        notes: "Use Strength to clear the boulder field northward to reach Moltres. If it flees, it respawns when you leave the area."
      },
      {
        name: "Ruby Path",
        grid: [
          "####################",
          "#........E.........#",
          "#..................#",
          "#..T..........T....#",
          "#..................#",
          "#......####........#",
          "#......####..II....#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 13, y: 6, name: "Ruby — in the Braille room past the Rocket Grunts (needs Strength)" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Cubone, Marowak Lv.37" },
          { x: 14, y: 3, note: "Team Rocket Grunt — Rattata, Raticate, Sandshrew, Sandslash Lv.35" }
        ],
        notes: "POST-GAME: only after the National Dex + talking to Celio. The previous room has a Braille alphabet aid; the Ruby room reads 'Everything has meaning...' Give it to Celio on One Island."
      }
    ],
    walkthrough: [
      "1. Take the ferry to One Island (post-Elite Four), meet Celio, and head north up Kindle Road.",
      "2. Fight through the trainer-packed grassy path to Ember Spa; the old man between the waterfalls gives you HM06 Rock Smash, and the spring heals your party.",
      "3. Cross to Mt. Ember's exterior: battle Rangers Beth and Logan plus Crush Girl Jocelyn, and grab the Dire Hit, the hidden Ultra Balls and the hidden Fire Stones (Strength + Rock Smash needed).",
      "4. Have the Hiker near the entrance teach Explosion to a compatible Pokemon, then head inside.",
      "5. Follow the summit path tunnels east and up, Strength-pushing boulders aside, to the summit.",
      "6. Battle and catch Moltres (Lv.50) at the crater — Water and Electric moves, plus Sleep/Paralysis, make it far easier.",
      "7. POST-GAME: with the National Dex, return and beat the two Team Rocket Grunts to open the Ruby path; read the Braille and take the Ruby back to Celio."
    ]
  },
  // ==================== POKEMON LET'S GO, PIKACHU! & LET'S GO, EEVEE! ====================
  {
    game: "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!",
    dungeon: "Mt. Moon",
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#....I.......S....SI.#",
          "#.T...............I..#",
          "#.....#########......#",
          "#.I...#.......#..T...#",
          "#.....#.......#......#",
          "#..I..#...T...#I.I...#",
          "#.T...#.......#..I...#",
          "#.....####.####..TT..#",
          "#.TI.....I..II.....TT#",
          "#.........E........S.#",
          "######################",
        ],
        items: [
          { x: 5, y: 1, name: "Potion — southwest area" },
          { x: 3, y: 6, name: "Great Ball x5 — near Bug Catcher Kent" },
          { x: 15, y: 6, name: "Ether — near the southeast corner" },
          { x: 12, y: 9, name: "Awakening — near Super Nerd Jovan" },
          { x: 19, y: 1, name: "Repel — east area" },
          { x: 17, y: 7, name: "Stardust (hidden, daily) — in a crater, northeast corner" },
          { x: 3, y: 9, name: "Pearl — northwest area" },
          { x: 9, y: 9, name: "Poke Ball — from the man near the northwest ladder if you hold fewer than 10" }
        ],
        trainers: [
          { x: 2, y: 2, note: "Bug Catcher Kent — Butterfree Lv.7" },
          { x: 2, y: 7, note: "Super Nerd Jovan — Grimer Lv.10" },
          { x: 17, y: 4, note: "Lass Evelyn — Bellsprout Lv.8" },
          { x: 10, y: 6, note: "Youngster Robby — Mankey Lv.8" },
          { x: 18, y: 8, note: "Lass Miriam — Clefairy Lv.8" },
          { x: 19, y: 9, note: "Youngster Josh — Sandshrew Lv.8" },
          { x: 2, y: 9, note: "Hiker Marcos — Geodude x2 Lv.10" }
        ]
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#S.................S.#",
          "#....................#",
          "#..#####......#####..#",
          "#..#####..S...#####..#",
          "#....................#",
          "#......I.............#",
          "#..#####......#####..#",
          "#..#####......#####..#",
          "#S.................S.#",
          "######################",
        ],
        items: [
          { x: 7, y: 6, name: "Big Mushroom (hidden, daily) — west of the second crater" }
        ],
        trainers: [],
        notes: "Walking Paras/Parasect can dig up Tiny Mushrooms here."
      },
      {
        name: "B2F",
        grid: [
          "######################",
          "#..I......S......I...#",
          "#....................#",
          "#..#####..#####..###.#",
          "#..#...#..#...#..#...#",
          "#..#.TT#..#.T.#..#TT.#",
          "#..#...#..#...#..#...#",
          "#..#####..#####..###.#",
          "#.....I......I...I...#",
          "#..I.......I..T...I..#",
          "#........S...........#",
          "######################",
        ],
        items: [
          { x: 3, y: 1, name: "Rare Candy — closed-off east room (easternmost ladder)" },
          { x: 17, y: 1, name: "Moon Stone (hidden, daily) — in a crater, east room" },
          { x: 11, y: 9, name: "Revive — north of the center ladder to B1F" },
          { x: 3, y: 9, name: "Potion — northeast of the Team Rocket Grunt" },
          { x: 6, y: 8, name: "Revive — southeast of the Grunt in the west area" },
          { x: 13, y: 8, name: "Nugget — middle ladder room plateau" },
          { x: 17, y: 8, name: "Moon Stone (hidden, daily) — closed room past the north-of-entrance ladder" },
          { x: 18, y: 9, name: "Dome Fossil OR Helix Fossil — your pick after beating the Super Nerd" }
        ],
        trainers: [
          { x: 6, y: 5, note: "Team Rocket Grunt — Rattata Lv.9" },
          { x: 12, y: 5, note: "Team Rocket Grunt — Drowzee Lv.9" },
          { x: 18, y: 5, note: "Team Rocket Grunt — Zubat Lv.9" },
          { x: 14, y: 9, note: "Super Nerd Miguel — Voltorb, Magnemite Lv.10 (holds the fossils)" }
        ],
        notes: "Fossil choice: Helix OR Dome — Miguel keeps the other. Revive it at the Cinnabar Lab."
      }
    ],
    walkthrough: [
      "1. Enter from Route 3 (south); sweep 1F for the Potion, Great Ball x5, Ether, Awakening, Repel, Pearl, hidden Stardust and the man's Poke Ball gift.",
      "2. Beat the Bug Catchers, Lasses, Youngsters, Super Nerd Jovan and Hiker Marcos on the way north.",
      "3. Drop to B1F for the hidden daily Big Mushroom, then down to B2F.",
      "4. Clear the three Team Rocket Grunts in the closed-off rooms and loot the Rare Candy, Nugget, Revives, Potion and hidden Moon Stones.",
      "5. Defeat Super Nerd Miguel and choose ONE fossil — Dome or Helix — then exit east to Route 4."
    ]
  },
  {
    game: "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!",
    dungeon: "Rock Tunnel",
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#E....II...........I.S",
          "#..T.........TT......#",
          "#.....######.........S",
          "#.....#....#...TT....#",
          "#..T..#....#...I..I..#",
          "#.....#....#.....T...#",
          "#.....######....I.I..#",
          "#..........T....II...#",
          "#.....T..........TT..#",
          "#..I.................#",
          "#.............I.....S#",
          "######################",
        ],
        items: [
          { x: 7, y: 1, name: "Repel — northeast of the room at the north entrance" },
          { x: 15, y: 5, name: "Escape Rope — southeast corner of the northeast section" },
          { x: 16, y: 7, name: "Super Potion — north of the rock formation, southeast corner" },
          { x: 16, y: 8, name: "Stardust — north end of the second-easternmost room, southeast" },
          { x: 3, y: 10, name: "Pearl — southwest corner" },
          { x: 14, y: 11, name: "Revive (hidden, daily) — on a rock west of the southern entrance" },
          { x: 19, y: 1, name: "Poke Ball — from the man near the ladder if you hold fewer than 10" }
        ],
        trainers: [
          { x: 3, y: 2, note: "Poke Maniac Ashton — Slowpoke Lv.23" },
          { x: 13, y: 2, note: "Poke Maniac Winston — Kangaskhan Lv.23" },
          { x: 3, y: 5, note: "Black Belt Dudley — Onix Lv.24" },
          { x: 15, y: 4, note: "Hiker Allen — Geodude, Onix, Graveler Lv.23" },
          { x: 17, y: 6, note: "Black Belt Eric — Mankey, Poliwhirl Lv.24" },
          { x: 11, y: 8, note: "Camper Lenny — Growlithe Lv.22" },
          { x: 6, y: 9, note: "Hiker Oliver — Onix, Sandslash Lv.23" },
          { x: 18, y: 9, note: "Hiker Claus — Machop, Rhyhorn Lv.23" }
        ],
        notes: "Strong Push lights nothing here — the tunnel is naturally lit in Let's Go. Walking Rock-types can dig Tiny/Big Mushrooms and Fire/Thunder Stones from the rocks."
      },
      {
        name: "B1F",
        grid: [
          "######################",
          "#S...................#",
          "#....................#",
          "#..T......####...T.II#",
          "#..........####......#",
          "#..####..........T.II#",
          "#..####............I.#",
          "#..I...T....I...####.#",
          "#..............####..#",
          "#..TI.......T........#",
          "#.......T...........E#",
          "######################",
        ],
        items: [
          { x: 3, y: 7, name: "Revive — southwest corner (from the northeasternmost 1F ladder)" },
          { x: 19, y: 3, name: "Great Ball x3 — northeast corner" },
          { x: 19, y: 5, name: "Full Heal — northeast corner of the northeast section" },
          { x: 4, y: 9, name: "Super Potion — southwest corner of the northeast section" },
          { x: 19, y: 6, name: "Super Potion (hidden, daily) — on a rock along the east wall, northeast of Black Belt Dudley" },
          { x: 12, y: 7, name: "Dire Hit — northeast of Black Belt Dudley" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Poke Maniac Cooper — Ivysaur Lv.23" },
          { x: 17, y: 3, note: "Ace Trainer Sofia — Vulpix Lv.24, Kadabra Lv.25" },
          { x: 17, y: 5, note: "Ace Trainer Charlie — Diglett Lv.24, Flareon Lv.25" },
          { x: 7, y: 7, note: "Black Belt Steve — Machop x2 Lv.24" },
          { x: 3, y: 9, note: "Picnicker Leah — Nidorina Lv.22" },
          { x: 12, y: 9, note: "Camper Leroy — Nidorino Lv.22" },
          { x: 8, y: 10, note: "Picnicker Dana — Meowth, Vulpix Lv.22" }
        ]
      }
    ],
    walkthrough: [
      "1. Enter from the north (Route 10, by the Pokemon Center) — the tunnel is lit, no Flash needed.",
      "2. Head east for the Repel, beat Poke Maniac Ashton, then take the northeast ladder down to B1F.",
      "3. On B1F, loop the northeast section: beat the Ace Trainers and Poke Maniac Cooper, and grab the Great Ball x3, Full Heal, Super Potions and Dire Hit.",
      "4. Take the southwest Revive, then climb back to 1F and push south through the Black Belts, Hikers and Campers.",
      "5. Grab the Escape Rope, Super Potion, Stardust and Pearl along the way, then exit at the south end to Route 10 and Lavender Town."
    ]
  },
  {
    game: "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!",
    dungeon: "Pokémon Tower",
    floors: [
      {
        name: "1F",
        grid: [
          "####################",
          "#..................#",
          "#..................#",
          "#..................#",
          "#........S....I....#",
          "#..................#",
          "#..................#",
          "#........E.........#",
          "####################",
        ],
        items: [
          { x: 14, y: 4, name: "Formal Set — from the old lady" }
        ],
        trainers: [],
        notes: "Lobby. In Let's Go, touching a ghost sends you back to 1F — you cannot battle them."
      },
      {
        name: "2F",
        grid: [
          "####################",
          "#........S....I....#",
          "#..................#",
          "#.......TI.........#",
          "#..................#",
          "#..I...............#",
          "#................II#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 14, y: 1, name: "X Attack — northeast of the stairs to 3F" },
          { x: 3, y: 5, name: "Elixir — southwest corner" },
          { x: 17, y: 6, name: "Pearl (hidden, daily) — on the easternmost tombstone, south wall" },
          { x: 9, y: 3, name: "Pikachu Candy x5 / Eevee Candy x5 — reward for beating Coach Trainer Holly" }
        ],
        trainers: [
          { x: 8, y: 3, note: "Coach Trainer Holly — rewards Pikachu/Eevee Candy x5" }
        ]
      },
      {
        name: "3F",
        grid: [
          "####################",
          "#...I....S........I#",
          "#..................#",
          "#..................#",
          "#........I.........#",
          "#..................#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 4, y: 1, name: "Awakening — against the northern wall" },
          { x: 9, y: 4, name: "Super Potion — middle of the floor" },
          { x: 18, y: 1, name: "Star Piece (hidden, daily) — northeast corner" }
        ],
        trainers: [],
        notes: "No trainer battles here — just dodge the roaming ghosts (touching one returns you to 1F)."
      },
      {
        name: "4F",
        grid: [
          "####################",
          "#........S........I#",
          "#..................#",
          "#......I....II.....#",
          "#..................#",
          "#..I...............#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 7, y: 3, name: "Escape Rope — middle of a ring of tombstones near the stairs" },
          { x: 12, y: 3, name: "Full Heal — north of the stairs to 3F" },
          { x: 3, y: 5, name: "TM04 (Teleport) — southwest of the center" },
          { x: 18, y: 1, name: "Super Potion (hidden, daily) — northeast corner" }
        ],
        trainers: []
      },
      {
        name: "5F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..I...............#",
          "#..................#",
          "#..................#",
          "#..I.............II#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 3, y: 3, name: "Nugget — northwest corner" },
          { x: 3, y: 6, name: "Ice Stone — southwest corner" },
          { x: 17, y: 6, name: "Big Pearl (hidden, daily) — on the tombstone, southeast corner" }
        ],
        trainers: []
      },
      {
        name: "6F",
        grid: [
          "####################",
          "#........S.........#",
          "#..................#",
          "#..I...............#",
          "#..I......X........#",
          "#..I...............#",
          "#.....I............#",
          "#..I......S....I...#",
          "####################",
        ],
        items: [
          { x: 3, y: 3, name: "Hyper Potion — northwest corner" },
          { x: 3, y: 4, name: "PP Up (hidden, daily) — on the wall south of the northwest corner" },
          { x: 3, y: 5, name: "Ultra Ball x3 — north of the stairs to 5F" },
          { x: 3, y: 7, name: "Revive — south of the stairs to 5F" },
          { x: 6, y: 6, name: "Rare Candy — west of the stairs to 7F (needs Silph Scope)" }
        ],
        trainers: [],
        notes: "The ghost of Marowak haunts the stairs — her Cubone child climbs up and reunites with her, setting her spirit free."
      },
      {
        name: "7F",
        grid: [
          "####################",
          "#..................#",
          "#..................#",
          "#..................#",
          "#.......TXI........#",
          "#..................#",
          "#........S.........#",
          "####################",
        ],
        items: [
          { x: 10, y: 4, name: "Poke Flute — from Mr. Fuji after the rescue" }
        ],
        trainers: [
          { x: 8, y: 4, note: "Trace stalls Archer here so you can reach Mr. Fuji" }
        ],
        notes: "Jessie & James are knocked out at the entrance; Trace holds off Archer on 7F."
      }
    ],
    walkthrough: [
      "1. Enter the tower in Lavender Town — grab the Formal Set from the old lady on 1F.",
      "2. On 2F, beat Coach Trainer Holly for Pikachu/Eevee Candy x5, and grab the X Attack, Elixir and hidden Pearl.",
      "3. Climb through 3F-4F, dodging the roaming ghosts (touching one sends you back to 1F — they cannot be battled). Grab the Awakening, Super Potions, hidden Star Piece, Escape Rope, Full Heal and TM04 (Teleport).",
      "4. On 5F, collect the Nugget, Ice Stone and hidden Big Pearl.",
      "5. On 6F, loot the Hyper Potion, Ultra Ball x3, Revive, hidden PP Up and Rare Candy, then watch the Cubone child reunite with the ghost of Marowak on the stairs.",
      "6. On 7F, Trace stalls Archer while you free Mr. Fuji from Jessie & James.",
      "7. Mr. Fuji gives you the Poke Flute — wake the Snorlax blocking Routes 12 and 16."
    ]
  },
  {
    game: "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!",
    dungeon: "Silph Co.",
    floors: [
      {
        name: "1F",
        grid: [
          "##################",
          "#.......I........#",
          "#..####....####..#",
          "#..####....####..#",
          "#................#",
          "#.......S....T...#",
          "#................#",
          "#.......E........#",
          "##################",
        ],
        items: [
          { x: 8, y: 1, name: "X Sp. Atk — between the fountains" }
        ],
        trainers: [
          { x: 13, y: 5, note: "Blue — challenges you and Trace together" }
        ],
        notes: "Jessie & James are knocked out at the entrance. Ride the elevator or take the stairs up."
      },
      {
        name: "2F",
        grid: [
          "##################",
          "#..I......S......#",
          "#................#",
          "#..T........T....#",
          "#.............I..#",
          "#......T.....II..#",
          "#..I.............#",
          "#..T......S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "TM42 (Self-Destruct) — from the woman in the northwest room" },
          { x: 3, y: 6, name: "Super Potion — west area of the floor" },
          { x: 14, y: 4, name: "X Attack — southeast area of the floor" },
          { x: 14, y: 5, name: "Fresh Water x3 (hidden) — on the water dispenser, south area" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Raticate Lv.33" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Koffing x3 Lv.33" },
          { x: 7, y: 5, note: "Scientist Jerry — Electabuzz Lv.35" },
          { x: 3, y: 7, note: "Scientist Connor — Weezing Lv.35" }
        ]
      },
      {
        name: "3F",
        grid: [
          "##################",
          "#..I.....S.......#",
          "#................#",
          "#..T........II..I#",
          "#................#",
          "#.......T....I...#",
          "#................#",
          "#..I.....S.......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Max Lure — first room to the west" },
          { x: 13, y: 3, name: "Hyper Potion — northeast of the Scientist" },
          { x: 16, y: 3, name: "X Sp. Def — eastern room" },
          { x: 3, y: 7, name: "Silver Razz Berry x3 (hidden, daily) — on the plants, northwest corner" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Scientist Jose — Grimer, Magmar Lv.35" },
          { x: 8, y: 5, note: "Team Rocket Grunt — Haunter Lv.33" }
        ]
      },
      {
        name: "4F",
        grid: [
          "##################",
          "#..I...S.....T..I#",
          "#..I.............#",
          "#..I.............#",
          "#..I..........I..#",
          "#.....T..........#",
          "#................#",
          "#..T......S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Full Heal — west storage room" },
          { x: 3, y: 2, name: "Escape Rope — west storage room" },
          { x: 3, y: 3, name: "Star Piece — west storage room" },
          { x: 3, y: 4, name: "Great Ball x5 — west storage room" },
          { x: 14, y: 4, name: "Revive — west storage room" },
          { x: 16, y: 1, name: "Dire Hit — southeast area" }
        ],
        trainers: [
          { x: 13, y: 1, note: "Team Rocket Grunt — Koffing, Electrode Lv.33" },
          { x: 6, y: 5, note: "Team Rocket Grunt — Rattata, Grimer Lv.33" },
          { x: 3, y: 7, note: "Scientist Rodney — Voltorb x2, Electrode Lv.35" }
        ]
      },
      {
        name: "5F",
        grid: [
          "##################",
          "#..I......S...I..#",
          "#................#",
          "#..T........T.II.#",
          "#................#",
          "#......T.....I...#",
          "#..I.............#",
          "#..TI.....S..IT..#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Max Ether — northwest room" },
          { x: 4, y: 7, name: "TM54 (Flash Cannon) — southwest room" },
          { x: 3, y: 6, name: "Poke Ball x5 — southwest room" },
          { x: 14, y: 3, name: "Nugget — narrow corridor in the east" },
          { x: 13, y: 5, name: "Guard Spec. — middle room" },
          { x: 14, y: 1, name: "Silver Nanab Berry x3 (hidden, daily) — plants west of the elevator" },
          { x: 13, y: 7, name: "Card Key — from Trace after the Multi Battle vs. Archer and a Rocket Grunt" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Juggler Dalton — Hypno, Haunter, Kadabra Lv.34" },
          { x: 12, y: 3, note: "Scientist Beau — Muk Lv.35" },
          { x: 7, y: 5, note: "Team Rocket Grunt — Ekans, Hypno Lv.33" },
          { x: 3, y: 7, note: "Team Rocket Grunt — Zubat, Arbok Lv.33" },
          { x: 14, y: 7, note: "Archer (& Grunt) — Multi Battle with Trace (yields the Card Key)" }
        ]
      },
      {
        name: "6F",
        grid: [
          "##################",
          "#.......S.....I..#",
          "#.............I..#",
          "#..T...II...T....#",
          "#................#",
          "#......T.....II..#",
          "#..I.............#",
          "#..I.....S.......#",
          "##################",
        ],
        items: [
          { x: 8, y: 3, name: "X Sp. Atk — central room" },
          { x: 3, y: 6, name: "Super Potion — next to the southernmost plant" },
          { x: 3, y: 7, name: "Hyper Potion — southwest room" },
          { x: 14, y: 1, name: "Fresh Water x3 (hidden) — on the dispenser, northwest room" },
          { x: 14, y: 2, name: "PP Up — eastern corridor" },
          { x: 14, y: 5, name: "Max Repel — southwest room" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Meowth, Raticate Lv.33" },
          { x: 12, y: 3, note: "Scientist Taylor — Magnemite x2, Magmar Lv.35" },
          { x: 7, y: 5, note: "Team Rocket Grunt — Raticate, Golbat Lv.33" }
        ]
      },
      {
        name: "7F",
        grid: [
          "##################",
          "#..I......S......#",
          "#................#",
          "#..T........T...I#",
          "#.............I..#",
          "#......T.....II..#",
          "#.............I..#",
          "#.TXI.....S......#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "PP Up — west area of the floor" },
          { x: 16, y: 3, name: "TM34 (Dragon Pulse) — eastern room" },
          { x: 14, y: 4, name: "Nanab Berry x3 (hidden, daily) — southernmost plant, central hallway" },
          { x: 14, y: 5, name: "Rare Candy — room south of the counter" },
          { x: 14, y: 6, name: "Smart Candy x3 — southeast corner" },
          { x: 4, y: 7, name: "Lapras (gift, Lv.34) — from the Silph employee" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Zubat, Golbat Lv.33" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Voltorb x3 Lv.33" },
          { x: 7, y: 5, note: "Scientist Joshua — Koffing, Magneton Lv.35" },
          { x: 2, y: 7, note: "Trace — stalls Archer here while you go up" }
        ]
      },
      {
        name: "8F",
        grid: [
          "##################",
          "#..I.....S....II.#",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#......T.....I...#",
          "#..............II#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 1, name: "Revive — near the northwest corner" },
          { x: 14, y: 1, name: "X Attack — north of the northern plant, eastern room" },
          { x: 15, y: 6, name: "Silver Razz Berry x3 (hidden, daily) — on the plant, southeast corner" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Grimer, Koffing Lv.33" },
          { x: 12, y: 3, note: "Team Rocket Grunt — Gastly, Persian Lv.33" },
          { x: 7, y: 5, note: "Scientist Parker — Electrode, Porygon Lv.35" }
        ]
      },
      {
        name: "9F",
        grid: [
          "##################",
          "#.......S........#",
          "#................#",
          "#..T........T.II.#",
          "#.............I..#",
          "#......T.....II..#",
          "#..I..........I..#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 14, y: 3, name: "Ultra Ball x3 — on a shelf, southern room" },
          { x: 14, y: 4, name: "Great Ball x3 — on a shelf, southern room" },
          { x: 14, y: 5, name: "Poke Ball x3 — southern room" },
          { x: 3, y: 6, name: "Revive — between the beds, southwest corner" },
          { x: 14, y: 6, name: "Elixir (hidden, daily) — between the northern two beds" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Team Rocket Grunt — Persian Lv.33" },
          { x: 12, y: 3, note: "Scientist Ed — Weezing, Electabuzz, Electrode Lv.35" },
          { x: 7, y: 5, note: "Team Rocket Grunt — Koffing, Haunter Lv.33" }
        ],
        notes: "The bed in the corner fully heals your party."
      },
      {
        name: "10F",
        grid: [
          "##################",
          "#.......S.....II.#",
          "#..I.............#",
          "#..I...T....I...I#",
          "#................#",
          "#......T.........#",
          "#................#",
          "#.......S........#",
          "##################",
        ],
        items: [
          { x: 3, y: 3, name: "Rare Candy — southwest room" },
          { x: 12, y: 3, name: "Max Revive — southwest room" },
          { x: 15, y: 1, name: "X Accuracy (hidden, daily) — on a box, northeast room" },
          { x: 16, y: 3, name: "TM37 (Flamethrower) — southwest room" },
          { x: 3, y: 2, name: "Full Heal — northwest area" }
        ],
        trainers: [
          { x: 7, y: 3, note: "Team Rocket Grunt — Voltorb, Raticate Lv.33" },
          { x: 7, y: 5, note: "Scientist Travis — Grimer, Muk Lv.35" }
        ]
      },
      {
        name: "11F",
        grid: [
          "##################",
          "#................#",
          "#..T........T....#",
          "#................#",
          "#.......T.....I..#",
          "#................#",
          "#.......XI.......#",
          "#................#",
          "##################",
        ],
        items: [
          { x: 9, y: 6, name: "Master Ball — from the president after defeating Giovanni" },
          { x: 14, y: 4, name: "Max Elixir — near the southeast corner" }
        ],
        trainers: [
          { x: 3, y: 2, note: "Team Rocket Grunt — Drowzee, Zubat, Golbat Lv.33" },
          { x: 12, y: 2, note: "Rocket Sister — Arbok line Lv.33" },
          { x: 8, y: 4, note: "Giovanni — final showdown (board room)" }
        ]
      }
    ],
    walkthrough: [
      "1. Enter 1F in Saffron City — Jessie & James are already knocked out at the door. Blue challenges you and Trace together right away.",
      "2. On 2F, talk to the woman in the northwest room for TM42 (Self-Destruct), and sweep the Rockets and Scientists for the Super Potion, X Attack and hidden Fresh Waters.",
      "3. On 3F, grab the Hyper Potion, Max Lure, X Sp. Def and the hidden Silver Razz Berries.",
      "4. On 4F, loot the west storage room (Full Heal, Escape Rope, Star Piece, Great Ball x5, Revive) plus the Dire Hit.",
      "5. On 5F, team up with Trace for the Multi Battle against Archer and a Rocket Grunt — winning gets you the Card Key. Also grab Max Ether, TM54 (Flash Cannon), Poke Ball x5, Nugget and Guard Spec.",
      "6. Use the Card Key and ride up; sweep 6F (X Sp. Atk, Super Potion, hidden Fresh Waters, PP Up, Hyper Potion, Max Repel).",
      "7. On 7F, grab the PP Up, TM34 (Dragon Pulse), Rare Candy, Smart Candy x3 and hidden Nanab Berries, accept the gift Lapras (Lv.34), and let Trace stall Archer.",
      "8. Clear 8F-9F (Revives, Ultra Ball x3, Elixir, X Attacks) and rest at the 9F healing bed.",
      "9. Sweep 10F: Rare Candy, Max Revive, TM37 (Flamethrower), hidden X Accuracy and Full Heal.",
      "10. On 11F, beat the last Rockets to Giovanni in the board room and defeat him.",
      "11. Talk to the president for the Master Ball. Team Rocket withdraws from the building."
    ]
  },
  {
    game: "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!",
    dungeon: "Victory Road",
    floors: [
      {
        name: "1F",
        grid: [
          "######################",
          "#........I......II...#",
          "#..T..........TT.....#",
          "#.....#####..........#",
          "#.....#...#..I.......#",
          "#..T..#...#.....TT...#",
          "#.....#####..........#",
          "#........IT..........#",
          "#..T..........TT.....#",
          "#....................#",
          "#.........E.........S#",
          "######################",
        ],
        items: [
          { x: 9, y: 1, name: "Leaf Stone — northwest area" },
          { x: 17, y: 1, name: "TM56 (Stealth Rock) — northwest area" },
          { x: 13, y: 4, name: "Ultra Ball x3 — plateau northwest of the central mound" },
          { x: 9, y: 7, name: "Candy x10 — reward for defeating Coach Trainer Alemana" }
        ],
        trainers: [
          { x: 10, y: 7, note: "Coach Trainer Alemana — Ditto Lv.49 (rewards Candy x10)" },
          { x: 3, y: 2, note: "Ace Trainer Naomi — Kangaskhan Lv.47, Venusaur Lv.48" },
          { x: 14, y: 2, note: "Ace Trainer Rolando — Rapidash Lv.47, Starmie Lv.47, Victreebel Lv.48" },
          { x: 3, y: 5, note: "Juggler Nelson — Hypno, Slowbro Lv.46" },
          { x: 17, y: 5, note: "Black Belt Daisuke — Hitmonlee, Poliwrath Lv.47" },
          { x: 3, y: 8, note: "Tamer Vincent — Primeape, Tauros Lv.47" },
          { x: 14, y: 8, note: "Juggler Gregory — Mr. Mime, Alakazam Lv.46" }
        ]
      },
      {
        name: "2F",
        grid: [
          "######################",
          "#S...................#",
          "#....................#",
          "#..T......####...T...#",
          "#....I....####.I.I...#",
          "#..####.......T......#",
          "#..####..II.....####.#",
          "#......T........####.#",
          "#......TXI....II.....#",
          "#..T.................#",
          "#...................S#",
          "######################",
        ],
        items: [
          { x: 5, y: 4, name: "TM45 (Solar Beam) — southwest of Officer Jenny" },
          { x: 15, y: 4, name: "Full Restore — north of Officer Jenny" },
          { x: 9, y: 6, name: "TM49 (Superpower) — northeasternmost of the floor" },
          { x: 15, y: 8, name: "PP Max — south of Moltres's spot" },
          { x: 9, y: 8, name: "Moltres (Lv.50) — roosting on 2F" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Ace Trainer George — Scyther Lv.48, Marowak Lv.47" },
          { x: 17, y: 3, note: "Ace Trainer Alexa — Dragonair Lv.47, Wigglytuff Lv.47, Hitmonchan Lv.48" },
          { x: 14, y: 5, note: "Ace Trainer Colby — Electrode Lv.47, Kingler Lv.47, Pidgeot Lv.47, Rhydon Lv.48" },
          { x: 7, y: 7, note: "Ace Trainer Caroline — Jynx Lv.47, Golbat Lv.47, Arcanine Lv.48" },
          { x: 3, y: 9, note: "Poke Maniac Dawson — Lickitung Lv.46, Onix Lv.46, Blastoise Lv.46" },
          { x: 7, y: 8, note: "Officer Jenny — heals your party (northeast of the exit)" }
        ],
        notes: "Moltres roosts on 2F here (Lv.50). Officer Jenny near the exit fully heals your party."
      },
      {
        name: "3F",
        grid: [
          "######################",
          "#S...I...........II.X#",
          "#....................#",
          "#..T......####...T...#",
          "#..........####......#",
          "#..####...II...T.....#",
          "#..####..........##..#",
          "#..I...T........##.II#",
          "#....................#",
          "#..TI.........TT.....#",
          "#........I...........#",
          "######################",
        ],
        items: [
          { x: 5, y: 1, name: "Max Revive — easternmost pocket of the floor" },
          { x: 18, y: 1, name: "TM51 (Blizzard) — west pocket near the entrance" },
          { x: 11, y: 5, name: "Fresh Water (hidden) — on the tree of the center-north island" },
          { x: 3, y: 7, name: "Max Potion — westernmost pocket of the floor" },
          { x: 19, y: 7, name: "Full Restore — northernmost pocket of the floor" },
          { x: 9, y: 10, name: "Golden Nanab Berry x5 — northernmost pocket of the floor" },
          { x: 4, y: 9, name: "TM39 (Outrage) — reward for defeating Coach Trainer Ryan" }
        ],
        trainers: [
          { x: 3, y: 3, note: "Ace Trainer — Dragonair line Lv.47" },
          { x: 17, y: 3, note: "Ace Trainer — Exeggutor line Lv.47" },
          { x: 15, y: 5, note: "Ace Trainer — Chansey line Lv.48" },
          { x: 7, y: 7, note: "Ace Trainer — Rhydon line Lv.48" },
          { x: 3, y: 9, note: "Coach Trainer Ryan — Primeape Lv.48, Gyarados Lv.48, Arcanine Lv.48, Tauros Lv.49 (rewards TM39 Outrage)" },
          { x: 14, y: 9, note: "Ace Trainer — Magneton line Lv.48" }
        ]
      }
    ],
    walkthrough: [
      "1. Enter from the Reception Gate — you need all 8 badges and both Fly and Surf.",
      "2. On 1F, beat Coach Trainer Alemana (Ditto Lv.49) for Candy x10, and loot the Leaf Stone, TM56 (Stealth Rock) and Ultra Ball x3.",
      "3. Climb to 2F and sweep the Ace Trainers, Poke Maniac Dawson and Juggler Gregory; grab TM45 (Solar Beam), Full Restore, TM49 (Superpower) and PP Max.",
      "4. Battle and catch Moltres (Lv.50) roosting on 2F, then let Officer Jenny heal your party by the exit.",
      "5. On 3F, beat Coach Trainer Ryan (Primeape/Gyarados/Arcanine/Tauros) for TM39 (Outrage), and loot the Max Revive, TM51 (Blizzard), Max Potion, Full Restore, Golden Nanab Berries and hidden Fresh Water.",
      "6. Exit east to the Indigo Plateau — the Elite Four await."
    ]
  }
];
