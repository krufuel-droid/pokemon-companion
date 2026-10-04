/**
 * Pokémon League teams for battle prep: Elite Four + Champion (+ bonus
 * super-bosses like Red).
 *
 * Keyed by the exact game titles in `POKEMON_GAMES` (lib/data/games.ts),
 * matching the keys of GYM_TEAMS in lib/data/gym-teams.ts. Team members
 * reuse the GymTeamMember shape (species, id, level, moves, ability,
 * item, sprite override).
 *
 * Each team is the MAIN-STORY lineup. Version differences, rematch
 * changes, and format notes (e.g. Galar's Champion Cup, BW's N/Ghetsis
 * finale) live in `note` fields.
 */

import type { CounterPick, GymTeamMember } from "./gym-teams";
import { showdownSprite } from "./gym-teams";

export interface EliteFourMember {
  name: string;
  /** Specialty type, e.g. "Ice". */
  specialty: string;
  team: GymTeamMember[];
  note?: string;
  /** One catchable-before counter-pick for battle prep. */
  counterPick?: CounterPick;
}

export interface LeagueChampion {
  name: string;
  /** e.g. "Top Champion" — shown next to the name when present. */
  title?: string;
  team: GymTeamMember[];
  note?: string;
  /** One catchable-before counter-pick for battle prep. */
  counterPick?: CounterPick;
}

export interface BonusBattle {
  /**
   * Substring matched (case-insensitive) against the guide/tracker
   * challenge name, e.g. "Red" matches "Red atop Mt. Silver".
   */
  name: string;
  /** Display heading, e.g. "Red — Mt. Silver". */
  heading: string;
  team: GymTeamMember[];
  note?: string;
  /** One catchable-before counter-pick for battle prep. */
  counterPick?: CounterPick;
}

export interface LeagueData {
  /** The four members in challenge order. Empty when the game has no
   * traditional Elite Four (e.g. Galar's Champion Cup) — see `note`. */
  eliteFour: EliteFourMember[];
  champion: LeagueChampion;
  /** Alternate champion for version-split leagues (e.g. Wallace in Emerald). */
  altChampion?: LeagueChampion;
  /** Post-game super-bosses surfaced on matching challenge names. */
  bonusBattles?: BonusBattle[];
  note?: string;
}

/** All league teams, keyed by exact game title from POKEMON_GAMES. */
export const ELITE_FOUR_TEAMS: Record<string, LeagueData> = {
  "Pokémon Scarlet & Violet": {
    eliteFour: [
    {
      name: "Rika", specialty: "Ground",
      team: [
      { species: "Whiscash", id: 340, level: 57, moves: ["Muddy Water", "Earth Power", "Blizzard", "Future Sight"] },
      { species: "Camerupt", id: 323, level: 57, moves: ["Earth Power", "Fire Blast", "Flash Cannon", "Yawn"] },
      { species: "Donphan", id: 232, level: 57, moves: ["Earthquake", "Stone Edge", "Iron Head", "Poison Jab"] },
      { species: "Dugtrio", id: 51, level: 57, moves: ["Earthquake", "Rock Slide", "Sucker Punch", "Sandstorm"] },
      { species: "Clodsire", id: 963, level: 58, moves: ["Earthquake", "Liquidation", "Toxic", "Protect"] }
    ],
      note: "Clodsire Terastallizes into pure Ground type.",
    
      counterPick: { species: "Dondozo", id: 977, location: "Casseroya Lake — high-level spawns, catchable pre-league", why: "Water-type Dondozo's Water moves drown Rika's Ground team super-effectively, and it's bulky enough to take her hits." },},
    {
      name: "Poppy", specialty: "Steel",
      team: [
      { species: "Copperajah", id: 879, level: 58, moves: ["High Horsepower", "Play Rough", "Heavy Slam", "Stealth Rock"] },
      { species: "Magnezone", id: 462, level: 58, moves: ["Flash Cannon", "Tri Attack", "Discharge", "Light Screen"] },
      { species: "Bronzong", id: 437, level: 58, moves: ["Earthquake", "Iron Head", "Zen Headbutt", "Rock Blast"], ability: "Levitate" },
      { species: "Corviknight", id: 823, level: 58, moves: ["Brave Bird", "Iron Head", "Iron Defense", "Body Press"] },
      { species: "Tinkaton", id: 959, level: 59, moves: ["Gigaton Hammer", "Play Rough", "Brick Break", "Stone Edge"], ability: "Mold Breaker" }
    ],
      note: "Tinkaton Terastallizes into pure Steel type. Bronzong's Levitate makes it immune to Ground moves.",
    
      counterPick: { species: "Charcadet", id: 935, location: "East Province (Area One) — evolve into Armarouge (Scarlet) / Ceruledge (Violet)", why: "Fire-type Armarouge/Ceruledge melts Poppy's all-Steel team super-effectively across the board." },},
    {
      name: "Larry", specialty: "Flying",
      team: [
      { species: "Tropius", id: 357, level: 59, moves: ["Air Slash", "Solar Beam", "Dragon Pulse", "Sunny Day"] },
      { species: "Oricorio", id: 741, level: 59, moves: ["Revelation Dance", "Air Slash", "Teeter Dance", "Icy Wind"] },
      { species: "Altaria", id: 334, level: 59, moves: ["Moonblast", "Flamethrower", "Ice Beam", "Dragon Pulse"] },
      { species: "Staraptor", id: 398, level: 59, moves: ["Facade", "Brave Bird", "Close Combat", "Thief"] },
      { species: "Flamigo", id: 973, level: 60, moves: ["Brave Bird", "Close Combat", "Throat Chop", "Liquidation"] }
    ],
      note: "Oricorio is in Pom-Pom (Electric) style. Flamigo Terastallizes into pure Flying type. Tropius opens with Sunny Day + Solar Beam.",
    
      counterPick: { species: "Cetitan", id: 975, location: "Glaseado Mountain — common", why: "Ice-type Cetitan's Ice moves hit Larry's Flying team super-effectively — 4x against Altaria and Tropius." },},
    {
      name: "Hassel", specialty: "Dragon",
      team: [
      { species: "Noivern", id: 715, level: 60, moves: ["Dragon Pulse", "Hyper Voice", "Air Slash", "Super Fang"] },
      { species: "Haxorus", id: 612, level: 60, moves: ["Dragon Claw", "Crunch", "Iron Head", "Rock Tomb"] },
      { species: "Dragalge", id: 691, level: 60, moves: ["Sludge Bomb", "Dragon Pulse", "Hydro Pump", "Thunderbolt"] },
      { species: "Flapple", id: 841, level: 60, moves: ["Dragon Rush", "Seed Bomb", "Aerial Ace", "Leech Seed"] },
      { species: "Baxcalibur", id: 997, level: 61, moves: ["Icicle Crash", "Brick Break", "Glaive Rush", "Ice Shard"] }
    ],
      note: "Baxcalibur Terastallizes into pure Dragon type. Dragalge's Sludge Bomb and Haxorus's Iron Head punish Fairy-type answers.",
    
      counterPick: { species: "Tinkatink", id: 957, location: "South Province (Area Three/Four) ruins — evolve into Tinkaton", why: "Fairy/Steel Tinkaton is immune to Dragon moves and its Fairy attacks hit Hassel's Dragon team super-effectively." },}
    ],
    champion:     {
      name: "Geeta",
      note: "Geeta's Glimmora is her FINAL Pokémon (she opens with Espathra) and the one she Terastallizes — Tera Rock. Espathra's Opportunist ability punishes the player for using stat boosts; Kingambit's Supreme Overlord grows stronger as her team faints.",
      team: [
      { species: "Espathra", id: 956, level: 61, moves: ["Lumina Crash", "Dazzling Gleam", "Quick Attack", "Reflect"], ability: "Opportunist" },
      { species: "Gogoat", id: 673, level: 61, moves: ["Horn Leech", "Zen Headbutt", "Play Rough", "Bulk Up"] },
      { species: "Veluza", id: 976, level: 61, moves: ["Aqua Jet", "Liquidation", "Psycho Cut", "Ice Fang"] },
      { species: "Avalugg", id: 713, level: 61, moves: ["Avalanche", "Crunch", "Earthquake", "Body Press"] },
      { species: "Kingambit", id: 983, level: 61, moves: ["Iron Head", "Kowtow Cleave", "Zen Headbutt", "Stone Edge"], ability: "Supreme Overlord" },
      { species: "Glimmora", id: 970, level: 62, moves: ["Tera Blast", "Sludge Wave", "Earth Power", "Dazzling Gleam"] }
    ],
    
      counterPick: { species: "Slither Wing", id: 988, location: "Area Zero (Scarlet — Violet players: Iron Moth, also Area Zero)", why: "Bug/Fighting Slither Wing's Bug moves hit Geeta's Espathra, Gogoat, Veluza and Kingambit super-effectively." },},
    note: "The Paldea Elite Four must be battled in a fixed order (Rika → Poppy → Larry → Hassel) before facing Top Champion Geeta. Each Elite Four ace and Geeta's Glimmora Terastallize; each member's team carries a single-type Tera theme (Ground / Steel / Flying / Dragon / Rock) that boosts rather than changes their typing.",
  },
  "Pokémon Sword & Shield": {
    eliteFour: [],
    champion:     {
      name: "Leon",
      note: "Team shown is the variant when the player chose Scorbunny (Leon's two variable slots are Mr. Rime + Inteleon). If the player chose Sobble, those slots are Rhyperior (64) + Rillaboom (64); if Grookey, Seismitoad (64) + Cinderace (64). Leon Gigantamaxes his Charizard. Aegislash's King's Shield punishes physical attackers.",
      team: [
      { species: "Aegislash", id: 681, level: 62, moves: ["King's Shield", "Shadow Ball", "Sacred Sword", "Flash Cannon"] },
      { species: "Dragapult", id: 887, level: 62, moves: ["Shadow Ball", "Flamethrower", "Thunderbolt", "Dragon Breath"] },
      { species: "Haxorus", id: 612, level: 63, moves: ["Poison Jab", "Iron Tail", "Outrage", "Earthquake"] },
      { species: "Mr. Rime", id: 866, level: 64, moves: ["Teeter Dance", "Psychic", "Freeze-Dry", "Thunderbolt"] },
      { species: "Inteleon", id: 818, level: 64, moves: ["Snipe Shot", "Dark Pulse", "Mud Shot", "Tearful Look"] },
      { species: "Charizard", id: 6, level: 65, moves: ["Fire Blast", "Air Slash", "Solar Beam", "Ancient Power"] }
    ],
    
      counterPick: { species: "Morpeko", id: 877, location: "Route 7 — common", why: "Electric/Dark Morpeko covers Leon's team: Dark moves hit Aegislash, Dragapult and Mr. Rime super-effectively, Electric moves hit Charizard super-effectively." },},
    bonusBattles: [
    {
      name: "Hop (Champion Cup semifinal)", heading: "Hop (Champion Cup semifinal)",
      team: [
      { species: "Dubwool", id: 832, level: 48, moves: ["Cotton Guard", "Reversal", "Body Slam", "Zen Headbutt"] },
      { species: "Snorlax", id: 143, level: 47, moves: ["Hammer Arm"] },
      { species: "Corviknight", id: 823, level: 48, moves: ["Drill Peck"] },
      { species: "Pincurchin", id: 871, level: 47, moves: [] },
      { species: "Rillaboom", id: 812, level: 49, moves: [] }
    ],
      note: "Hop's starter is the one weak to the player's: Rillaboom if the player chose Scorbunny, Cinderace if Sobble, Inteleon if Grookey. He Dynamaxes his starter. Full movesets for Snorlax, Corviknight, Pincurchin and his starter could not be fully verified — only the listed moves were confirmed.",
    
      counterPick: { species: "Falinks", id: 870, location: "Route 8 — common", why: "Fighting-type Falinks's Fighting moves smash Hop's Dubwool, Snorlax and Pincurchin super-effectively." },},
    {
      name: "Raihan (Champion Cup finals)", heading: "Raihan (Champion Cup finals)",
      team: [
      { species: "Torkoal", id: 324, level: 53, moves: ["Lava Plume", "Body Press", "Solar Beam", "Yawn"], ability: "Drought" },
      { species: "Goodra", id: 706, level: 54, moves: ["Rain Dance", "Surf", "Thunder", "Muddy Water"] },
      { species: "Turtonator", id: 776, level: 54, moves: ["Sunny Day", "Dragon Pulse", "Shell Trap", "Fire Blast"] },
      { species: "Flygon", id: 330, level: 54, moves: ["Sandstorm", "Dragon Claw", "Earthquake", "Crunch"] },
      { species: "Duraludon", id: 884, level: 55, moves: ["Dragon Claw", "Body Press", "Stone Edge", "Iron Head"] }
    ],
      note: "Singles format (his gym battle was doubles). Leads with Torkoal's Drought sun; Gigantamaxes Duraludon. Each of his first four Pokémon sets a different weather (sun / rain / sun / sandstorm).",
    
      counterPick: { species: "Drednaw", id: 834, location: "Evolve Chewtle (Route 2/4, fishing spots)", why: "Water/Rock Drednaw: Water moves hit Gigalith, Sandaconda and Torkoal super-effectively; Rock coverage handles the rest." },},
    ],
    note: "Galar has NO traditional Elite Four. The League challenge is the Champion Cup tournament at Wyndon Stadium: semifinals vs Marnie (Dark) and Hop (rival, starter-dependent), then the finals bracket — Bede interrupts to challenge for a finals spot, then the player faces three gym leaders in sequence (Nessa → Bea in Sword / Allister in Shield → Raihan), and finally the Championship Match vs Champion Leon. Leon's Charizard Gigantamaxes.",
  },
  "Pokémon Brilliant Diamond & Shining Pearl": {
    eliteFour: [
    {
      name: "Aaron", specialty: "Bug",
      team: [
      { species: "Dustox", id: 269, level: 53, moves: ["Bug Buzz", "Toxic"], item: "Black Sludge" },
      { species: "Beautifly", id: 267, level: 53, moves: ["Bug Buzz", "Quiver Dance"] },
      { species: "Vespiquen", id: 416, level: 54, moves: ["Attack Order", "Acrobatics"] },
      { species: "Heracross", id: 214, level: 54, moves: ["Facade", "Earthquake"], ability: "Guts", item: "Flame Orb" },
      { species: "Drapion", id: 452, level: 57, moves: ["Cross Poison", "Earthquake"] }
    ],
    
      counterPick: { species: "Rapidash", id: 78, location: "Route 215 (as Ponyta)", why: "Fire hits Bug super-effectively and Rapidash resists Bug; Rapidash handles Aaron's Dustox, Beautifly, Vespiquen and Heracross." },},
    {
      name: "Bertha", specialty: "Ground",
      team: [
      { species: "Quagsire", id: 195, level: 55, moves: ["Earthquake", "Recover"], item: "Leftovers" },
      { species: "Whiscash", id: 340, level: 55, moves: ["Hydro Pump", "Ice Beam"], item: "Rindo Berry" },
      { species: "Sudowoodo", id: 185, level: 56, moves: ["Head Smash", "Sucker Punch"], item: "Sitrus Berry" },
      { species: "Golem", id: 76, level: 56, moves: ["Earthquake", "Stone Edge"], ability: "Sturdy", item: "Soft Sand" },
      { species: "Hippowdon", id: 450, level: 59, moves: ["Earthquake", "Ice Fang"], item: "Chesto Berry" }
    ],
    
      counterPick: { species: "Roserade", id: 407, location: "Route 212 (as Roselia; evolves with a Shiny Stone from Iron Island)", why: "Grass hits Ground super-effectively (4x vs Quagsire, Whiscash and Golem); Roserade sweeps Bertha." },},
    {
      name: "Flint", specialty: "Fire",
      team: [
      { species: "Rapidash", id: 78, level: 58, moves: ["Flame Charge", "Poison Jab"], item: "Wide Lens" },
      { species: "Drifblim", id: 426, level: 58, moves: ["Will-O-Wisp", "Strength Sap"], item: "Sitrus Berry" },
      { species: "Steelix", id: 208, level: 57, moves: ["Fire Fang", "Thunder Fang"], item: "Life Orb" },
      { species: "Lopunny", id: 428, level: 57, moves: ["High Jump Kick", "Fire Punch"], item: "Leftovers" },
      { species: "Infernape", id: 392, level: 61, moves: ["Close Combat", "Mach Punch"], item: "Focus Sash" }
    ],
    
      counterPick: { species: "Gastrodon", id: 423, location: "Route 212 (as Shellos)", why: "Water hits Fire super-effectively and resists Fire; Surf (+ Earthquake for Steelix) beats Flint's team." },},
    {
      name: "Lucian", specialty: "Psychic",
      team: [
      { species: "Mr. Mime", id: 122, level: 59, moves: ["Psychic", "Dazzling Gleam"], item: "Light Clay" },
      { species: "Girafarig", id: 203, level: 59, moves: ["Psychic", "Thunderbolt"] },
      { species: "Medicham", id: 308, level: 60, moves: ["High Jump Kick", "Zen Headbutt"] },
      { species: "Alakazam", id: 65, level: 60, moves: ["Psychic", "Nasty Plot"], ability: "Magic Guard" },
      { species: "Bronzong", id: 437, level: 63, moves: ["Gyro Ball", "Earthquake"] }
    ],
    
      counterPick: { species: "Drapion", id: 452, location: "Route 214/215 (as Skorupi; evolves at Lv. 40)", why: "Dark hits Psychic super-effectively and resists Psychic; Drapion's Crunch beats Lucian's team (Mr. Mime is Psychic/Fairy here, still neutral-or-better)." },}
    ],
    champion:     {
      name: "Cynthia",
      team: [
      { species: "Spiritomb", id: 442, level: 61, moves: ["Shadow Ball", "Dark Pulse"] },
      { species: "Roserade", id: 407, level: 60, moves: ["Sludge Bomb", "Energy Ball"] },
      { species: "Gastrodon", id: 423, level: 60, moves: ["Scald", "Earthquake"] },
      { species: "Lucario", id: 448, level: 63, moves: ["Aura Sphere", "Nasty Plot"] },
      { species: "Milotic", id: 350, level: 63, moves: ["Scald", "Ice Beam", "Recover"], item: "Flame Orb" },
      { species: "Garchomp", id: 445, level: 66, moves: ["Swords Dance", "Earthquake", "Dragon Claw"], item: "Yache Berry" }
    ],
    
      counterPick: { species: "Garchomp", id: 445, location: "Wayward Cave (as Gible; hidden entrance under Cycling Road)", why: "Fast Dragon/Ground attacker; Earthquake hits Lucario, Dragon Claw hits her Garchomp super-effectively, Crunch covers Spiritomb." },},
    note: "BDSP keeps DP's species and levels (except Bertha's Sudowoodo, Lv. 56 instead of 57) but revamps movesets with competitive sets, EVs and held items. Mr. Mime is Psychic/Fairy in BDSP. Milotic's Flame Orb activates Marvel Scale.",
  },
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!": {
    eliteFour: [
    {
      name: "Lorelei", specialty: "Ice",
      team: [
      { species: "Dewgong", id: 87, level: 51, moves: ["Aqua Jet", "Ice Shard", "Waterfall"] },
      { species: "Jynx", id: 124, level: 51, moves: ["Lovely Kiss", "Psychic", "Blizzard"] },
      { species: "Cloyster", id: 91, level: 51, moves: ["Hydro Pump", "Ice Beam", "Spike Cannon"] },
      { species: "Slowbro", id: 80, level: 51, moves: ["Surf", "Psychic", "Flamethrower"] },
      { species: "Lapras", id: 131, level: 52, moves: ["Hydro Pump", "Blizzard", "Dragon Pulse"] }
    ],
    
      counterPick: { species: "Flareon", id: 136, location: "Eevee gift in Celadon City + Fire Stone from the Dept. Store", why: "Fire Blast melts Lorelei's Ice team." },},
    {
      name: "Bruno", specialty: "Fighting",
      team: [
      { species: "Onix", id: 95, level: 52, moves: ["Stealth Rock", "Earthquake", "Iron Tail"] },
      { species: "Hitmonchan", id: 107, level: 52, moves: ["Thunder Punch", "Ice Punch", "Fire Punch"] },
      { species: "Hitmonlee", id: 106, level: 52, moves: ["Brick Break", "Rock Slide", "Feint"] },
      { species: "Poliwrath", id: 62, level: 52, moves: ["Superpower", "Waterfall", "Body Slam"] },
      { species: "Machamp", id: 68, level: 53, moves: ["Superpower", "Rock Slide", "Earthquake"] }
    ],
    
      counterPick: { species: "Alakazam", id: 65, location: "Routes 24-25 (catch Abra, evolves to Kadabra at Lv. 16)", why: "Psychic STAB shreds Bruno's Fighting team." },},
    {
      name: "Agatha", specialty: "Ghost",
      team: [
      { species: "Arbok", id: 24, level: 53, moves: ["Glare", "Crunch", "Poison Jab"] },
      { species: "Gengar", id: 94, level: 53, moves: ["Shadow Ball", "Sludge Bomb", "Will-O-Wisp"] },
      { species: "Golbat", id: 42, level: 53, moves: ["Air Slash", "Crunch", "Quick Attack"] },
      { species: "Weezing", id: 110, level: 53, moves: ["Sludge Bomb", "Thunderbolt", "Shadow Ball"] },
      { species: "Gengar", id: 94, level: 54, moves: ["Shadow Ball", "Sludge Bomb", "Dazzling Gleam"] }
    ],
    
      counterPick: { species: "Alakazam", id: 65, location: "Routes 24-25 (catch Abra, evolves to Kadabra at Lv. 16)", why: "Psychic hits Agatha's Poison-types super-effectively and outspeeds her Ghosts." },},
    {
      name: "Lance", specialty: "Dragon",
      team: [
      { species: "Seadra", id: 117, level: 54, moves: ["Hydro Pump", "Dragon Pulse", "Hyper Beam"] },
      { species: "Aerodactyl", id: 142, level: 54, moves: ["Rock Slide", "Earthquake", "Hyper Beam"] },
      { species: "Gyarados", id: 130, level: 54, moves: ["Waterfall", "Hyper Beam", "Iron Tail"] },
      { species: "Charizard", id: 6, level: 54, moves: ["Air Slash", "Dragon Pulse", "Hyper Beam"] },
      { species: "Dragonite", id: 149, level: 55, moves: ["Outrage", "Fire Punch", "Hyper Beam"] }
    ],
    
      counterPick: { species: "Articuno", id: 144, location: "Seafoam Islands (Surf, reachable before the League)", why: "Ice Beam/Blizzard shreds Lance's Dragon/Flying team." },}
    ],
    champion:     {
      name: "Trace",
      team: [
      { species: "Pidgeot", id: 18, level: 56, moves: ["Air Slash", "Heat Wave", "Quick Attack"] },
      { species: "Vileplume", id: 45, level: 56, moves: ["Solar Beam", "Sludge Bomb", "Reflect"] },
      { species: "Marowak", id: 105, level: 56, moves: ["Bonemerang", "Fire Punch", "Brick Break"] },
      { species: "Rapidash", id: 78, level: 56, moves: ["Flare Blitz", "Poison Jab", "Quick Attack"] },
      { species: "Slowbro", id: 80, level: 56, moves: ["Psychic", "Surf", "Fire Blast"] },
      { species: "Jolteon", id: 135, level: 57, moves: ["Thunder", "Pin Missile", "Quick Attack"] }
    ],
    
      counterPick: { species: "Zapdos", id: 145, location: "Power Plant (Surf down Routes 9-10)", why: "Thunderbolt plus Drill Peck covers Trace's Water- and Flying-types across his mixed team." },},
    note: "CORRECTION: Blue is NOT the Champion in Let's Go Pikachu/Eevee — the rival Trace is the Champion you face after the Elite Four (verified via Bulbapedia plot summary and Psypoke's LGPE guide, which lists 'Champion: Trace'). Blue appears in the story (Pewter City, Silph Co. battle) and becomes the post-game Viridian City Gym Leader with Tauros, Gyarados, Aerodactyl, Alakazam, Exeggutor and Charizard (all mid-60s; moves not verified). Trace's 6th Pokémon is version-dependent: Jolteon 57 (Thunder, Quick Attack, Pin Missile) in Let's Go, Pikachu!; Raichu 57 (Thunder, Quick Attack, Iron Tail) in Let's Go, Eevee!. One guide (Eurogamer) listed Trace's Pidgeot as 'Mega Pidgeot', but Psypoke's moveset data shows no Mega Evolution — treated as a regular Pidgeot. LGPE has no abilities. Rematch teams (all ~10 levels higher, Lance's Dragonite Mega Evolves) not included.",
  },
  "Pokémon Sun & Moon": {
    eliteFour: [
    {
      name: "Hala", specialty: "Fighting",
      team: [
      { species: "Hariyama", id: 297, level: 54, moves: ["Fake Out", "Close Combat"] },
      { species: "Primeape", id: 57, level: 54, moves: ["Cross Chop", "Outrage"] },
      { species: "Bewear", id: 760, level: 54, moves: ["Hammer Arm", "Brutal Swing"], ability: "Fluffy" },
      { species: "Poliwrath", id: 62, level: 54, moves: ["Waterfall", "Submission"] },
      { species: "Crabominable", id: 740, level: 55, moves: ["Ice Hammer", "Close Combat"], ability: "Iron Fist", item: "Fightinium Z" }
    ],
    
      counterPick: { species: "Toucannon", id: 733, location: "Route 1 (as Pikipek)", why: "Flying-type Beak Blast hits his Fighting-types super-effectively" },},
    {
      name: "Olivia", specialty: "Rock",
      team: [
      { species: "Relicanth", id: 369, level: 54, moves: ["Hydro Pump", "Ancient Power"] },
      { species: "Carbink", id: 703, level: 54, moves: ["Power Gem", "Moonblast"] },
      { species: "Golem", id: 76, level: 54, moves: ["Rock Blast", "Thunder Punch"], ability: "Sturdy" },
      { species: "Probopass", id: 476, level: 54, moves: ["Power Gem", "Earth Power"] },
      { species: "Lycanroc", id: 745, level: 55, moves: ["Stone Edge", "Crunch"], item: "Rockium Z" }
    ],
    
      counterPick: { species: "Tsareena", id: 763, location: "Royal Avenue (as Bounsweet)", why: "Grass-type Razor Leaf hits her Rock-types super-effectively" },},
    {
      name: "Acerola", specialty: "Ghost",
      team: [
      { species: "Sableye", id: 302, level: 54, moves: ["Shadow Claw", "Zen Headbutt", "Fake Out"] },
      { species: "Drifblim", id: 426, level: 54, moves: ["Ominous Wind", "Shadow Ball"] },
      { species: "Dhelmise", id: 781, level: 54, moves: ["Shadow Ball", "Energy Ball"], ability: "Steelworker" },
      { species: "Froslass", id: 478, level: 54, moves: ["Blizzard", "Shadow Ball", "Ice Shard"] },
      { species: "Palossand", id: 770, level: 55, moves: ["Shadow Ball", "Earth Power", "Giga Drain"], ability: "Water Compaction", item: "Ghostium Z" }
    ],
    
      counterPick: { species: "Raticate (Alolan)", id: 20, location: "Route 1 (as Alolan Rattata)", why: "Dark-type Crunch/Bite hits her Ghost-types super-effectively" },},
    {
      name: "Kahili", specialty: "Flying",
      team: [
      { species: "Skarmory", id: 227, level: 54, moves: ["Steel Wing", "Slash"], ability: "Sturdy" },
      { species: "Crobat", id: 169, level: 54, moves: ["Air Slash", "Poison Fang"] },
      { species: "Oricorio", id: 741, level: 54, moves: ["Revelation Dance", "Air Slash"], ability: "Dancer" },
      { species: "Mandibuzz", id: 630, level: 54, moves: ["Brave Bird", "Bone Rush"] },
      { species: "Toucannon", id: 733, level: 55, moves: ["Beak Blast", "Rock Blast", "Bullet Seed"], ability: "Skill Link", item: "Flyinium Z" }
    ],
    
      counterPick: { species: "Magnezone", id: 462, location: "Mount Hokulani (as Magnemite)", why: "Electric/Steel: Thunderbolt hits her Flying-types super-effectively and Steel resists Flying" },}
    ],
    champion:     {
      name: "Professor Kukui",
      note: "Kukui is the final opponent but not officially Champion — the player becomes Alola's first Champion by beating him. His 6th Pokémon varies with your starter: Incineroar (shown, if you chose Rowlet), Primarina (if Litten), Decidueye (if Popplio), each holding the matching Z-Crystal.",
      team: [
      { species: "Lycanroc (Midday Form)", id: 745, level: 57, moves: ["Stone Edge", "Accelerock", "Crunch"], sprite: showdownSprite("lycanroc-midday") },
      { species: "Alolan Ninetales", id: 38, level: 56, moves: ["Blizzard", "Dazzling Gleam", "Ice Shard"], sprite: showdownSprite("ninetales-alola") },
      { species: "Braviary", id: 628, level: 56, moves: ["Brave Bird", "Crush Claw"] },
      { species: "Magnezone", id: 462, level: 56, moves: ["Thunderbolt", "Flash Cannon", "Thunder Wave"] },
      { species: "Snorlax", id: 143, level: 56, moves: ["Body Slam", "Crunch", "Heavy Slam"] },
      { species: "Incineroar", id: 727, level: 58, moves: ["Flare Blitz", "Darkest Lariat", "Cross Chop"], item: "Firium Z" }
    ],
    
      counterPick: { species: "Crabominable", id: 740, location: "Route 10 (as Crabrawler)", why: "Fighting hits Lycanroc, Snorlax and Magnezone super-effectively; Ice hits Braviary super-effectively" },},
    note: "Alola's Elite Four can be challenged in any order; listed in default chamber order (Hala, Olivia, Acerola, Kahili).",
  },
  "Pokémon Ultra Sun & Ultra Moon": {
    eliteFour: [
    {
      name: "Molayne", specialty: "Steel",
      team: [
      { species: "Klefki", id: 707, level: 56, moves: ["Flash Cannon", "Thunder Wave", "Spikes"], ability: "Prankster" },
      { species: "Bisharp", id: 625, level: 56, moves: ["Night Slash", "Iron Head", "X-Scissor"], ability: "Defiant" },
      { species: "Magnezone", id: 462, level: 56, moves: ["Flash Cannon", "Thunderbolt"] },
      { species: "Metagross", id: 376, level: 56, moves: ["Meteor Mash", "Bullet Punch", "Zen Headbutt"] },
      { species: "Alolan Dugtrio", id: 51, level: 57, moves: ["Earthquake", "Iron Head", "Sucker Punch"], ability: "Tangling Hair", item: "Steelium Z", sprite: showdownSprite("dugtrio-alola") }
    ],
    
      counterPick: { species: "Salazzle", id: 758, location: "Wela Volcano Park (as Salandit)", why: "Fire/Poison: Flamethrower hits his Steel-types super-effectively" },},
    {
      name: "Olivia", specialty: "Rock",
      team: [
      { species: "Armaldo", id: 348, level: 56, moves: ["Rock Blast", "X-Scissor"] },
      { species: "Cradily", id: 346, level: 56, moves: ["Rock Tomb", "Energy Ball"] },
      { species: "Gigalith", id: 526, level: 56, moves: ["Stone Edge", "Earthquake"], ability: "Sand Stream" },
      { species: "Probopass", id: 476, level: 56, moves: ["Power Gem", "Earth Power"] },
      { species: "Lycanroc", id: 745, level: 57, moves: ["Stone Edge", "Crunch", "Counter"], item: "Rockium Z" }
    ],
    
      counterPick: { species: "Tsareena", id: 763, location: "Royal Avenue (as Bounsweet)", why: "Grass-type Razor Leaf hits her Rock-types super-effectively" },},
    {
      name: "Acerola", specialty: "Ghost",
      team: [
      { species: "Banette", id: 354, level: 56, moves: ["Shadow Claw", "Sucker Punch"] },
      { species: "Drifblim", id: 426, level: 56, moves: ["Ominous Wind", "Shadow Ball"] },
      { species: "Dhelmise", id: 781, level: 56, moves: ["Shadow Ball", "Energy Ball"], ability: "Steelworker" },
      { species: "Froslass", id: 478, level: 56, moves: ["Blizzard", "Shadow Ball", "Ice Shard"] },
      { species: "Palossand", id: 770, level: 57, moves: ["Shadow Ball", "Earth Power", "Giga Drain"], ability: "Water Compaction", item: "Ghostium Z" }
    ],
    
      counterPick: { species: "Raticate (Alolan)", id: 20, location: "Route 1 (as Alolan Rattata)", why: "Dark-type Crunch/Bite hits her Ghost-types super-effectively" },},
    {
      name: "Kahili", specialty: "Flying",
      team: [
      { species: "Braviary", id: 628, level: 56, moves: ["Brave Bird", "Crush Claw"], ability: "Sheer Force" },
      { species: "Hawlucha", id: 701, level: 56, moves: ["Flying Press", "Throat Chop"], ability: "Mold Breaker" },
      { species: "Oricorio", id: 741, level: 56, moves: ["Revelation Dance", "Air Slash"], ability: "Dancer" },
      { species: "Mandibuzz", id: 630, level: 56, moves: ["Brave Bird", "Bone Rush"] },
      { species: "Toucannon", id: 733, level: 57, moves: ["Beak Blast", "Rock Blast", "Bullet Seed"], ability: "Skill Link", item: "Flyinium Z" }
    ],
    
      counterPick: { species: "Magnezone", id: 462, location: "Mount Hokulani (as Magnemite)", why: "Electric/Steel: Thunderbolt hits her Flying-types super-effectively and Steel resists Flying" },}
    ],
    champion:     {
      name: "Hau",
      note: "Deviation from brief: USUM's final main-story battle is vs rival Hau at the League, NOT Kukui (Kukui only appears in title defense: Lv. 68-69 team of Dusk Lycanroc, Alolan Ninetales, Braviary, Magnezone, Snorlax + starter evo). Hau's ace and Eeveelution vary with your starter — shown is the Rowlet-player path (Primarina + Flareon); Litten-player path gets Decidueye + Vaporeon; Popplio-player path gets Incineroar + Leafeon.",
      team: [
      { species: "Alolan Raichu", id: 26, level: 59, moves: ["Thunderbolt", "Psychic", "Focus Blast"], ability: "Surge Surfer", sprite: showdownSprite("raichu-alola") },
      { species: "Flareon", id: 136, level: 58, moves: ["Flare Blitz", "Quick Attack"] },
      { species: "Tauros", id: 128, level: 58, moves: ["Earthquake", "Zen Headbutt", "Double-Edge"], ability: "Intimidate" },
      { species: "Noivern", id: 715, level: 58, moves: ["Dragon Pulse", "Air Slash", "Dark Pulse"], ability: "Infiltrator" },
      { species: "Crabominable", id: 740, level: 59, moves: ["Ice Hammer", "Stone Edge"], ability: "Iron Fist" },
      { species: "Primarina", id: 730, level: 60, moves: ["Sparkling Aria", "Moonblast", "Hyper Voice"], item: "Waterium Z" }
    ],
    
      counterPick: { species: "Lycanroc", id: 745, location: "Route 1 (as Rockruff)", why: "Rock-type Stone Edge hits Flareon, Noivern and Crabominable super-effectively" },},
  },
  "Pokémon X & Y": {
    eliteFour: [
    {
      name: "Malva", specialty: "Fire",
      team: [
      { species: "Pyroar", id: 668, level: 63, moves: ["Hyper Voice", "Flamethrower"] },
      { species: "Torkoal", id: 324, level: 63, moves: ["Flame Wheel", "Earthquake", "Stone Edge"] },
      { species: "Chandelure", id: 609, level: 63, moves: ["Flamethrower", "Shadow Ball"], ability: "Flame Body" },
      { species: "Talonflame", id: 663, level: 65, moves: ["Brave Bird", "Flare Blitz", "Flame Charge"], ability: "Flame Body" }
    ],
    
      counterPick: { species: "Clawitzer", id: 693, location: "Route 8 (as Clauncher, fishing)", why: "Water-type Water Pulse hits her Fire-types super-effectively" },},
    {
      name: "Siebold", specialty: "Water",
      team: [
      { species: "Clawitzer", id: 693, level: 63, moves: ["Water Pulse", "Aura Sphere", "Dragon Pulse"], ability: "Mega Launcher" },
      { species: "Starmie", id: 121, level: 63, moves: ["Surf", "Psychic", "Dazzling Gleam"] },
      { species: "Gyarados", id: 130, level: 63, moves: ["Waterfall", "Earthquake", "Dragon Dance"], ability: "Intimidate" },
      { species: "Barbaracle", id: 689, level: 65, moves: ["Razor Shell", "Stone Edge", "Cross Chop"], ability: "Tough Claws" }
    ],
    
      counterPick: { species: "Heliolisk", id: 695, location: "Route 9 (as Helioptile)", why: "Electric-type Thunderbolt/Parabolic Charge hits his Water-types super-effectively" },},
    {
      name: "Wikstrom", specialty: "Steel",
      team: [
      { species: "Klefki", id: 707, level: 63, moves: ["Dazzling Gleam", "Flash Cannon", "Spikes"], ability: "Prankster" },
      { species: "Probopass", id: 476, level: 63, moves: ["Power Gem", "Earth Power", "Flash Cannon"] },
      { species: "Scizor", id: 212, level: 63, moves: ["Bullet Punch", "Iron Head", "X-Scissor"], ability: "Technician" },
      { species: "Aegislash", id: 681, level: 65, moves: ["King's Shield", "Shadow Claw", "Iron Head", "Sacred Sword"], ability: "Stance Change" }
    ],
    
      counterPick: { species: "Golett", id: 622, location: "Route 10", why: "Ground/Ghost: Bulldoze hits his Steel-types super-effectively" },},
    {
      name: "Drasna", specialty: "Dragon",
      team: [
      { species: "Dragalge", id: 691, level: 63, moves: ["Sludge Bomb", "Dragon Pulse", "Thunderbolt"] },
      { species: "Altaria", id: 334, level: 63, moves: ["Dragon Pulse", "Moonblast"] },
      { species: "Druddigon", id: 621, level: 63, moves: ["Dragon Tail", "Revenge"], ability: "Rough Skin" },
      { species: "Noivern", id: 715, level: 65, moves: ["Dragon Pulse", "Air Slash", "Flamethrower", "Super Fang"], ability: "Frisk" }
    ],
    
      counterPick: { species: "Sylveon", id: 700, location: "Route 10 (as Eevee)", why: "Fairy-type Draining Kiss/Moonblast hits her Dragons super-effectively and is immune to Dragon" },}
    ],
    champion:     {
      name: "Diantha",
      note: "Gardevoir holds Gardevoirite and Mega Evolves (Pixilate-boosted Hyper Voice is its signature threat; listed moveset is the base-form set).",
      team: [
      { species: "Hawlucha", id: 701, level: 64, moves: ["Flying Press", "X-Scissor", "Poison Jab"] },
      { species: "Tyrantrum", id: 697, level: 65, moves: ["Head Smash", "Dragon Claw", "Earthquake"], ability: "Strong Jaw" },
      { species: "Aurorus", id: 699, level: 65, moves: ["Blizzard", "Thunder"], ability: "Refrigerate" },
      { species: "Gourgeist", id: 711, level: 65, moves: ["Phantom Force", "Seed Bomb", "Shadow Sneak"] },
      { species: "Goodra", id: 706, level: 66, moves: ["Dragon Pulse", "Fire Blast", "Focus Blast"] },
      { species: "Gardevoir", id: 282, level: 68, moves: ["Moonblast", "Psychic", "Thunderbolt", "Shadow Ball"], ability: "Trace", item: "Gardevoirite" }
    ],
    
      counterPick: { species: "Klefki", id: 707, location: "Route 16", why: "Steel-type Flash Cannon hits Tyrantrum, Aurorus and Mega Gardevoir super-effectively; Fairy is immune to Goodra's Dragon moves" },},
    note: "Kalos Elite Four can be challenged in any order; listed in the game's default chamber order (Malva, Siebold, Wikstrom, Drasna).",
  },
  "Pokémon Omega Ruby & Alpha Sapphire": {
    eliteFour: [
    {
      name: "Sidney", specialty: "Dark",
      team: [
      { species: "Mightyena", id: 262, level: 50, moves: ["Crunch", "Sucker Punch"], ability: "Intimidate" },
      { species: "Shiftry", id: 275, level: 50, moves: ["Leaf Blade", "Extrasensory"] },
      { species: "Cacturne", id: 332, level: 50, moves: ["Needle Arm", "Spiky Shield"] },
      { species: "Sharpedo", id: 319, level: 50, moves: ["Crunch", "Aqua Jet"], ability: "Rough Skin" },
      { species: "Absol", id: 359, level: 52, moves: ["Night Slash", "Psycho Cut"], ability: "Super Luck" }
    ],
    
      counterPick: { species: "Breloom", id: 286, location: "Route 114 (as Shroomish)", why: "Fighting hits Dark super-effectively; Breloom's Fighting STAB sweeps Sidney's all-Dark team." },},
    {
      name: "Phoebe", specialty: "Ghost",
      team: [
      { species: "Dusclops", id: 356, level: 51, moves: ["Shadow Punch", "Curse"] },
      { species: "Banette", id: 354, level: 51, moves: ["Shadow Ball", "Will-O-Wisp"] },
      { species: "Sableye", id: 302, level: 51, moves: ["Shadow Claw", "Foul Play"], ability: "Prankster" },
      { species: "Banette", id: 354, level: 51, moves: ["Shadow Ball", "Psychic"] },
      { species: "Dusknoir", id: 477, level: 53, moves: ["Hex", "Ice Punch"] }
    ],
    
      counterPick: { species: "Absol", id: 359, location: "Route 120", why: "Dark hits Ghost super-effectively and resists Ghost; Absol handles Phoebe's Dusclops, Banette and Sableye." },},
    {
      name: "Glacia", specialty: "Ice",
      team: [
      { species: "Glalie", id: 362, level: 52, moves: ["Ice Shard", "Crunch"] },
      { species: "Froslass", id: 478, level: 52, moves: ["Blizzard", "Ominous Wind"], ability: "Snow Cloak" },
      { species: "Glalie", id: 362, level: 52, moves: ["Freeze-Dry", "Ice Shard"] },
      { species: "Froslass", id: 478, level: 52, moves: ["Blizzard", "Shadow Ball"], ability: "Snow Cloak" },
      { species: "Walrein", id: 365, level: 54, moves: ["Blizzard", "Sheer Cold"], ability: "Thick Fat" }
    ],
    
      counterPick: { species: "Hariyama", id: 297, location: "Victory Road", why: "Fighting hits Ice super-effectively; Hariyama's bulk and Fighting STAB beat Glalie, Froslass and Walrein." },},
    {
      name: "Drake", specialty: "Dragon",
      team: [
      { species: "Altaria", id: 334, level: 53, moves: ["Dragon Pulse", "Moonblast"] },
      { species: "Flygon", id: 330, level: 53, moves: ["Earthquake", "Dragon Claw"] },
      { species: "Kingdra", id: 230, level: 53, moves: ["Dragon Pulse", "Ice Beam"] },
      { species: "Flygon", id: 330, level: 53, moves: ["Boomburst", "Dragon Pulse"] },
      { species: "Salamence", id: 373, level: 55, moves: ["Dragon Rush", "Thunder Fang"] }
    ],
    
      counterPick: { species: "Altaria", id: 334, location: "Route 114 (as Swablu; evolves at Lv. 35)", why: "Dragon hits Dragon super-effectively; Altaria's DragonBreath punishes Drake's Flygon, Kingdra and Salamence." },}
    ],
    champion:     {
      name: "Steven",
      team: [
      { species: "Skarmory", id: 227, level: 57, moves: ["Steel Wing", "Toxic"] },
      { species: "Claydol", id: 344, level: 57, moves: ["Earth Power", "Extrasensory"] },
      { species: "Aggron", id: 306, level: 57, moves: ["Stone Edge", "Earthquake"] },
      { species: "Cradily", id: 346, level: 57, moves: ["Giga Drain", "Ancient Power"] },
      { species: "Armaldo", id: 347, level: 57, moves: ["X-Scissor", "Rock Blast"] },
      { species: "Metagross", id: 376, level: 59, moves: ["Meteor Mash", "Bullet Punch", "Zen Headbutt"], item: "Metagrossite" }
    ],
    
      counterPick: { species: "Camerupt", id: 323, location: "Route 112 (as Numel; evolves at Lv. 33)", why: "Ground and Fire both hit Steel super-effectively; Earthquake + Flamethrower cover Skarmory, Aggron, Cradily, Armaldo and Metagross (including Mega Metagross)." },},
    note: "Same Elite Four species as RSE with updated movesets and higher levels. Steven's Lv. 59 Metagross holds Metagrossite and Mega Evolves. No other held items on first-challenge teams.",
  },
  "Pokémon Black & White": {
    eliteFour: [
    {
      name: "Shauntal", specialty: "Ghost",
      team: [
      { species: "Cofagrigus", id: 563, level: 48, moves: ["Shadow Ball", "Will-O-Wisp"], ability: "Mummy" },
      { species: "Jellicent", id: 593, level: 48, moves: ["Shadow Ball", "Surf", "Energy Ball"], ability: "Cursed Body" },
      { species: "Golurk", id: 623, level: 48, moves: ["Earthquake", "Shadow Punch"], ability: "Iron Fist" },
      { species: "Chandelure", id: 609, level: 50, moves: ["Shadow Ball", "Fire Blast", "Psychic"], ability: "Flame Body" }
    ],
    
      counterPick: { species: "Liepard", id: 510, location: "Route 2", why: "Dark-type Assurance/Night Slash hits her Ghost-types super-effectively" },},
    {
      name: "Grimsley", specialty: "Dark",
      team: [
      { species: "Scrafty", id: 560, level: 48, moves: ["Crunch", "Brick Break"], ability: "Moxie" },
      { species: "Krookodile", id: 553, level: 48, moves: ["Crunch", "Earthquake"], ability: "Intimidate" },
      { species: "Liepard", id: 510, level: 48, moves: ["Night Slash", "Fake Out"] },
      { species: "Bisharp", id: 625, level: 50, moves: ["Night Slash", "X-Scissor"], ability: "Defiant" }
    ],
    
      counterPick: { species: "Cobalion", id: 638, location: "Mistralton Cave", why: "Fighting/Steel: Sacred Sword hits his Dark-types super-effectively and Steel resists Dark" },},
    {
      name: "Caitlin", specialty: "Psychic",
      team: [
      { species: "Reuniclus", id: 579, level: 48, moves: ["Psychic", "Focus Blast"], ability: "Magic Guard" },
      { species: "Musharna", id: 518, level: 48, moves: ["Psychic", "Shadow Ball"] },
      { species: "Sigilyph", id: 561, level: 48, moves: ["Psychic", "Air Slash", "Ice Beam"], ability: "Wonder Skin" },
      { species: "Gothitelle", id: 576, level: 50, moves: ["Psychic", "Shadow Ball", "Calm Mind"] }
    ],
    
      counterPick: { species: "Pawniard", id: 624, location: "Route 9", why: "Dark/Steel: Night Slash hits her Psychic-types super-effectively and Steel resists Psychic" },},
    {
      name: "Marshal", specialty: "Fighting",
      team: [
      { species: "Throh", id: 538, level: 48, moves: ["Storm Throw", "Stone Edge"], ability: "Guts" },
      { species: "Sawk", id: 539, level: 48, moves: ["Karate Chop", "Stone Edge", "Retaliate"], ability: "Sturdy" },
      { species: "Conkeldurr", id: 534, level: 48, moves: ["Hammer Arm", "Stone Edge"], ability: "Sheer Force" },
      { species: "Mienshao", id: 620, level: 50, moves: ["Jump Kick", "U-turn", "Rock Slide"] }
    ],
    
      counterPick: { species: "Sigilyph", id: 561, location: "Desert Resort", why: "Psychic/Flying: Psybeam/Air Cutter hits his Fighting-types super-effectively and resists Fighting" },}
    ],
    champion:     {
      name: "N",
      note: "N uses Zekrom (Black) at Lv. 52; in White he uses Reshiram at Lv. 52 with Fusion Flare, Hyper Beam, Extrasensory, Reflect. Rest of team identical.",
      team: [
      { species: "Zekrom", id: 644, level: 52, moves: ["Fusion Bolt", "Giga Impact"], ability: "Teravolt" },
      { species: "Carracosta", id: 565, level: 50, moves: ["Waterfall", "Stone Edge"], ability: "Sturdy" },
      { species: "Vanilluxe", id: 584, level: 50, moves: ["Blizzard", "Frost Breath"], ability: "Ice Body" },
      { species: "Archeops", id: 567, level: 50, moves: ["Acrobatics", "Stone Edge", "Dragon Claw"], ability: "Defeatist" },
      { species: "Zoroark", id: 571, level: 50, moves: ["Night Slash", "Focus Blast", "Flamethrower"], ability: "Illusion" },
      { species: "Klinklang", id: 601, level: 50, moves: ["Thunderbolt", "Hyper Beam"], ability: "Plus" }
    ],
    
      counterPick: { species: "Conkeldurr", id: 534, location: "Pinwheel Forest (as Timburr)", why: "Fighting hits 5 of N's 6 super-effectively: Carracosta, Archeops, Vanilluxe, Klinklang, Zoroark" },},
    note: "BW has no traditional Champion battle: N defeats Champion Alder off-screen, then you face N at N's Castle, followed immediately by Ghetsis as the true final boss. Ghetsis's team: Cofagrigus 52 (Toxic, Protect, Psychic, Shadow Ball), Bouffalant 52 (Head Charge, Wild Charge, Poison Jab, Earthquake), Seismitoad 52 (Rain Dance, Sludge Wave, Muddy Water, Earthquake), Bisharp 52 (Stone Edge, Night Slash, Metal Burst, X-Scissor), Eelektross 52 (Wild Charge, Crunch, Flamethrower, Acrobatics), Hydreigon 54 (Fire Blast, Surf, Focus Blast, Dragon Pulse).",
  },
  "Pokémon Black 2 & White 2": {
    eliteFour: [
    {
      name: "Shauntal", specialty: "Ghost",
      team: [
      { species: "Cofagrigus", id: 563, level: 56, moves: ["Shadow Ball", "Will-O-Wisp"], ability: "Mummy" },
      { species: "Drifblim", id: 426, level: 56, moves: ["Shadow Ball", "Acrobatics", "Thunderbolt"] },
      { species: "Golurk", id: 623, level: 56, moves: ["Earthquake", "Shadow Punch", "Heavy Slam"], ability: "Iron Fist" },
      { species: "Chandelure", id: 609, level: 58, moves: ["Shadow Ball", "Fire Blast"], ability: "Flash Fire", item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Liepard", id: 510, location: "Route 2 (as Purrloin)", why: "Dark-type Night Slash hits her Ghost-types super-effectively" },},
    {
      name: "Grimsley", specialty: "Dark",
      team: [
      { species: "Liepard", id: 510, level: 56, moves: ["Night Slash", "Fake Out"] },
      { species: "Scrafty", id: 560, level: 56, moves: ["Crunch", "Brick Break"], ability: "Shed Skin" },
      { species: "Krookodile", id: 553, level: 56, moves: ["Crunch", "Earthquake"], ability: "Intimidate" },
      { species: "Bisharp", id: 625, level: 58, moves: ["Night Slash", "X-Scissor"], ability: "Defiant", item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Cobalion", id: 638, location: "Mistralton Cave", why: "Fighting/Steel: Sacred Sword hits his Dark-types super-effectively and Steel resists Dark" },},
    {
      name: "Caitlin", specialty: "Psychic",
      team: [
      { species: "Musharna", id: 518, level: 56, moves: ["Charge Beam", "Dream Eater"] },
      { species: "Sigilyph", id: 561, level: 56, moves: ["Psychic", "Shadow Ball", "Air Slash"], ability: "Wonder Skin" },
      { species: "Reuniclus", id: 579, level: 56, moves: ["Psychic", "Focus Blast", "Recover"], ability: "Overcoat" },
      { species: "Gothitelle", id: 576, level: 58, moves: ["Psychic", "Shadow Ball", "Calm Mind"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Pawniard", id: 624, location: "Route 11", why: "Dark/Steel: Night Slash hits her Psychic-types super-effectively and Steel resists Psychic" },},
    {
      name: "Marshal", specialty: "Fighting",
      team: [
      { species: "Throh", id: 538, level: 56, moves: ["Storm Throw", "Bulldoze"], ability: "Guts" },
      { species: "Sawk", id: 539, level: 56, moves: ["Brick Break", "Retaliate"], ability: "Sturdy" },
      { species: "Mienshao", id: 620, level: 56, moves: ["Hi Jump Kick", "U-turn"], ability: "Inner Focus" },
      { species: "Conkeldurr", id: 534, level: 58, moves: ["Hammer Arm", "Stone Edge", "Bulk Up"], ability: "Guts", item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Sigilyph", id: 561, location: "Desert Resort", why: "Psychic/Flying hits his Fighting-types super-effectively and resists Fighting" },}
    ],
    champion:     {
      name: "Iris",
      team: [
      { species: "Hydreigon", id: 635, level: 57, moves: ["Dragon Pulse", "Flamethrower", "Surf"], ability: "Levitate" },
      { species: "Druddigon", id: 621, level: 57, moves: ["Dragon Tail", "Rock Slide", "Flamethrower"], ability: "Sheer Force", item: "Life Orb" },
      { species: "Aggron", id: 304, level: 57, moves: ["Earthquake", "Double-Edge", "Rock Slide"], ability: "Rock Head" },
      { species: "Archeops", id: 567, level: 57, moves: ["Acrobatics", "Rock Slide", "Dragon Claw"], ability: "Defeatist" },
      { species: "Lapras", id: 131, level: 57, moves: ["Surf", "Ice Beam", "Thunderbolt"], ability: "Water Absorb" },
      { species: "Haxorus", id: 612, level: 59, moves: ["Dragon Dance", "Earthquake", "Dual Chop"], ability: "Mold Breaker", item: "Focus Sash" }
    ],
    
      counterPick: { species: "Beartic", id: 614, location: "Route 7 (as Cubchoo)", why: "Ice-type Icicle Crash hits her Dragons (Haxorus, Druddigon, Hydreigon, Archeops) super-effectively" },},
    note: "Levels shown are Normal mode. Easy Mode is 4 levels lower (52/52/52/54 for E4, Iris 53/55); Challenge Mode is 4 higher (60/60/60/62 for E4, Iris 61/63, and adds a 5th team member: Banette/Absol/Lucario/Metagross).",
  },
  "Pokémon Diamond & Pearl": {
    eliteFour: [
    {
      name: "Aaron", specialty: "Bug",
      team: [
      { species: "Dustox", id: 269, level: 53, moves: ["Bug Buzz", "Toxic"] },
      { species: "Beautifly", id: 267, level: 53, moves: ["Bug Buzz", "Psychic"] },
      { species: "Vespiquen", id: 416, level: 54, moves: ["Attack Order", "Power Gem"] },
      { species: "Heracross", id: 214, level: 54, moves: ["Close Combat", "Megahorn"] },
      { species: "Drapion", id: 452, level: 57, moves: ["Cross Poison", "X-Scissor"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Rapidash", id: 78, location: "Route 215 (as Ponyta)", why: "Fire hits Bug super-effectively; Rapidash's speed and Fire STAB handle Aaron's Dustox, Beautifly, Vespiquen and Heracross." },},
    {
      name: "Bertha", specialty: "Ground",
      team: [
      { species: "Quagsire", id: 195, level: 55, moves: ["Dig", "Sandstorm"] },
      { species: "Whiscash", id: 340, level: 55, moves: ["Aqua Tail", "Fissure"] },
      { species: "Sudowoodo", id: 185, level: 57, moves: ["Earthquake", "Sucker Punch"] },
      { species: "Golem", id: 76, level: 56, moves: ["Earthquake", "Gyro Ball"] },
      { species: "Hippowdon", id: 450, level: 59, moves: ["Earthquake", "Crunch"] }
    ],
    
      counterPick: { species: "Roserade", id: 407, location: "Route 212 (as Roselia; evolves with a Shiny Stone from Iron Island)", why: "Grass hits Ground super-effectively (4x vs Quagsire, Whiscash and Golem); Roserade sweeps Bertha." },},
    {
      name: "Flint", specialty: "Fire",
      team: [
      { species: "Rapidash", id: 78, level: 58, moves: ["Flare Blitz", "Sunny Day"] },
      { species: "Drifblim", id: 426, level: 58, moves: ["Will-O-Wisp", "Baton Pass"] },
      { species: "Steelix", id: 208, level: 57, moves: ["Fire Fang", "Screech"] },
      { species: "Lopunny", id: 428, level: 57, moves: ["Fire Punch", "Mirror Coat"] },
      { species: "Infernape", id: 392, level: 61, moves: ["Flare Blitz", "Earthquake"] }
    ],
    
      counterPick: { species: "Gastrodon", id: 423, location: "Route 212 (as Shellos)", why: "Water hits Fire super-effectively and resists Fire; Surf (+ Earthquake for Steelix) beats Flint's team." },},
    {
      name: "Lucian", specialty: "Psychic",
      team: [
      { species: "Mr. Mime", id: 122, level: 59, moves: ["Psychic", "Thunderbolt"] },
      { species: "Girafarig", id: 203, level: 59, moves: ["Psychic", "Crunch"] },
      { species: "Medicham", id: 308, level: 60, moves: ["Drain Punch", "Ice Punch"] },
      { species: "Alakazam", id: 65, level: 60, moves: ["Psychic", "Focus Blast"] },
      { species: "Bronzong", id: 437, level: 63, moves: ["Gyro Ball", "Earthquake"] }
    ],
    
      counterPick: { species: "Drapion", id: 452, location: "Route 214/215 (as Skorupi; evolves at Lv. 40)", why: "Dark hits Psychic super-effectively and resists Psychic; Drapion's Crunch beats Lucian's Mr. Mime, Girafarig, Medicham, Alakazam and Bronzong." },}
    ],
    champion:     {
      name: "Cynthia",
      team: [
      { species: "Spiritomb", id: 442, level: 61, moves: ["Dark Pulse", "Psychic"] },
      { species: "Roserade", id: 407, level: 60, moves: ["Energy Ball", "Sludge Bomb"] },
      { species: "Gastrodon", id: 423, level: 60, moves: ["Muddy Water", "Sludge Bomb"] },
      { species: "Lucario", id: 448, level: 63, moves: ["Aura Sphere", "Dragon Pulse"] },
      { species: "Milotic", id: 350, level: 63, moves: ["Surf", "Ice Beam"] },
      { species: "Garchomp", id: 445, level: 66, moves: ["Earthquake", "Dragon Rush"] }
    ],
    
      counterPick: { species: "Garchomp", id: 445, location: "Wayward Cave (as Gible; hidden entrance under Cycling Road)", why: "Fast Dragon/Ground attacker; Earthquake hits Lucario, Dragon Claw hits her Garchomp super-effectively, Crunch covers Spiritomb." },},
    note: "Aaron's Drapion holds a Sitrus Berry; no other notable held items on first-challenge teams.",
  },
  "Pokémon Platinum": {
    eliteFour: [
    {
      name: "Aaron", specialty: "Bug",
      team: [
      { species: "Yanmega", id: 469, level: 49, moves: ["Air Slash", "Bug Buzz"] },
      { species: "Scizor", id: 212, level: 49, moves: ["X-Scissor", "Iron Head"] },
      { species: "Vespiquen", id: 416, level: 50, moves: ["Attack Order", "Power Gem"] },
      { species: "Heracross", id: 214, level: 51, moves: ["Megahorn", "Close Combat"] },
      { species: "Drapion", id: 452, level: 53, moves: ["Cross Poison", "X-Scissor"] }
    ],
    
      counterPick: { species: "Rapidash", id: 78, location: "Route 215 (as Ponyta)", why: "Fire hits Bug super-effectively (4x vs Scizor); Rapidash handles Aaron's Yanmega, Scizor, Vespiquen and Heracross." },},
    {
      name: "Bertha", specialty: "Ground",
      team: [
      { species: "Whiscash", id: 340, level: 50, moves: ["Earth Power", "Aqua Tail"] },
      { species: "Gliscor", id: 472, level: 53, moves: ["Earthquake", "Ice Fang"] },
      { species: "Hippowdon", id: 450, level: 52, moves: ["Earthquake", "Stone Edge"] },
      { species: "Golem", id: 76, level: 52, moves: ["Earthquake", "Fire Punch"] },
      { species: "Rhyperior", id: 464, level: 55, moves: ["Earthquake", "Rock Wrecker"] }
    ],
    
      counterPick: { species: "Roserade", id: 407, location: "Route 212 (as Roselia; evolves with a Shiny Stone from Iron Island)", why: "Grass hits Ground super-effectively (4x vs Quagsire, Whiscash, Golem, Rhyperior); Roserade sweeps Bertha." },},
    {
      name: "Flint", specialty: "Fire",
      team: [
      { species: "Houndoom", id: 229, level: 52, moves: ["Flamethrower", "Dark Pulse"] },
      { species: "Flareon", id: 136, level: 55, moves: ["Overheat", "Will-O-Wisp"] },
      { species: "Rapidash", id: 78, level: 53, moves: ["Flare Blitz", "Sunny Day"] },
      { species: "Infernape", id: 392, level: 55, moves: ["Flare Blitz", "Mach Punch"] },
      { species: "Magmortar", id: 467, level: 57, moves: ["Flamethrower", "Thunderbolt"] }
    ],
    
      counterPick: { species: "Gastrodon", id: 423, location: "Route 212 (as Shellos)", why: "Water hits Fire super-effectively and resists Fire; Surf sweeps Flint's all-Fire Platinum team." },},
    {
      name: "Lucian", specialty: "Psychic",
      team: [
      { species: "Mr. Mime", id: 122, level: 53, moves: ["Psychic", "Thunderbolt"] },
      { species: "Espeon", id: 196, level: 55, moves: ["Psychic", "Shadow Ball"] },
      { species: "Bronzong", id: 437, level: 54, moves: ["Psychic", "Gyro Ball"] },
      { species: "Alakazam", id: 65, level: 56, moves: ["Psychic", "Focus Blast"] },
      { species: "Gallade", id: 475, level: 59, moves: ["Psycho Cut", "Leaf Blade"] }
    ],
    
      counterPick: { species: "Drapion", id: 452, location: "Route 214/215 (as Skorupi; evolves at Lv. 40)", why: "Dark hits Psychic super-effectively and resists Psychic; Drapion's Crunch beats Lucian's whole team." },}
    ],
    champion:     {
      name: "Cynthia",
      team: [
      { species: "Spiritomb", id: 442, level: 58, moves: ["Shadow Ball", "Dark Pulse"] },
      { species: "Roserade", id: 407, level: 58, moves: ["Energy Ball", "Sludge Bomb"] },
      { species: "Togekiss", id: 468, level: 60, moves: ["Air Slash", "Aura Sphere"] },
      { species: "Lucario", id: 448, level: 60, moves: ["Aura Sphere", "Extreme Speed"] },
      { species: "Milotic", id: 350, level: 58, moves: ["Surf", "Ice Beam"] },
      { species: "Garchomp", id: 445, level: 62, moves: ["Dragon Rush", "Earthquake"] }
    ],
    
      counterPick: { species: "Garchomp", id: 445, location: "Wayward Cave (as Gible; hidden entrance under Cycling Road)", why: "Fast Dragon/Ground attacker; Earthquake hits Lucario, Dragon Claw hits her Garchomp super-effectively, Crunch covers Spiritomb." },},
    note: "Platinum reworks every E4 team (new species, lower levels than DP) and Cynthia's team: Gastrodon is replaced by Togekiss; first-challenge Cynthia's Spiritomb knows Shadow Ball, Togekiss Shock Wave, Lucario Extreme Speed/Shadow Ball/Stone Edge, Milotic Dragon Pulse, Garchomp Flamethrower (all change on rematch).",
  },
  "Pokémon HeartGold & SoulSilver": {
    eliteFour: [
    {
      name: "Will", specialty: "Psychic",
      team: [
      { species: "Xatu", id: 178, level: 40, moves: ["Psychic", "Confuse Ray", "U-Turn"] },
      { species: "Jynx", id: 124, level: 41, moves: ["Lovely Kiss", "Psychic", "Ice Punch"] },
      { species: "Exeggutor", id: 103, level: 41, moves: ["Psychic", "Hypnosis", "Egg Bomb"] },
      { species: "Slowbro", id: 80, level: 41, moves: ["Psychic", "Amnesia", "Curse"] },
      { species: "Xatu", id: 178, level: 42, moves: ["Psychic", "Ominous Wind", "Aerial Ace"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Umbreon", id: 197, location: "Eevee gift from Bill in Goldenrod City (evolves with high friendship at night)", why: "Dark-type is immune to Psychic and Bite hits Will's Psychic team super-effectively." },},
    {
      name: "Koga", specialty: "Poison",
      team: [
      { species: "Ariados", id: 168, level: 40, moves: ["Poison Jab", "Giga Drain", "Baton Pass"] },
      { species: "Forretress", id: 205, level: 43, moves: ["Explosion", "Toxic Spikes", "Protect"] },
      { species: "Venomoth", id: 49, level: 41, moves: ["Psychic", "Toxic", "Supersonic"] },
      { species: "Muk", id: 89, level: 42, moves: ["Gunk Shot", "Minimize", "Toxic"], item: "Black Sludge" },
      { species: "Crobat", id: 169, level: 44, moves: ["Wing Attack", "Poison Fang", "Double Team"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Kadabra", id: 64, location: "Routes 34-35 (catch Abra, evolves at Lv. 16)", why: "Psychic STAB shreds Koga's Poison team." },},
    {
      name: "Bruno", specialty: "Fighting",
      team: [
      { species: "Hitmontop", id: 237, level: 42, moves: ["Dig", "Triple Kick", "Counter"] },
      { species: "Hitmonlee", id: 106, level: 42, moves: ["Hi Jump Kick", "Blaze Kick", "Swagger"] },
      { species: "Hitmonchan", id: 107, level: 42, moves: ["Thunder Punch", "Fire Punch", "Ice Punch"] },
      { species: "Onix", id: 95, level: 43, moves: ["Earthquake", "Rock Slide", "Dragon Breath"] },
      { species: "Machamp", id: 68, level: 46, moves: ["Cross Chop", "Revenge", "Rock Slide"], ability: "No Guard", item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Xatu", id: 178, location: "Ruins of Alph (Natu evolves at Lv. 25)", why: "Psychic/Flying coverage shreds Bruno's Fighting team." },},
    {
      name: "Karen", specialty: "Dark",
      team: [
      { species: "Umbreon", id: 197, level: 42, moves: ["Payback", "Confuse Ray", "Double Team"] },
      { species: "Gengar", id: 94, level: 45, moves: ["Focus Blast", "Destiny Bond", "Lick"] },
      { species: "Houndoom", id: 229, level: 47, moves: ["Dark Pulse", "Nasty Plot", "Flamethrower"], item: "Sitrus Berry" },
      { species: "Murkrow", id: 198, level: 44, moves: ["Sucker Punch", "Faint Attack", "Pluck"] },
      { species: "Vileplume", id: 45, level: 42, moves: ["Petal Dance", "Moonlight", "Stun Spore"] }
    ],
    
      counterPick: { species: "Machoke", id: 67, location: "Route 42 (Machop evolves at Lv. 28)", why: "Fighting-type Cross Chop hits Karen's Dark-types super-effectively." },}
    ],
    champion:     {
      name: "Lance",
      team: [
      { species: "Gyarados", id: 130, level: 46, moves: ["Waterfall", "Ice Fang", "Dragon Pulse"] },
      { species: "Charizard", id: 6, level: 48, moves: ["Air Slash", "Fire Fang", "Shadow Claw"] },
      { species: "Aerodactyl", id: 142, level: 48, moves: ["Rock Slide", "Thunder Fang", "Crunch"] },
      { species: "Dragonite", id: 149, level: 49, moves: ["Blizzard", "Dragon Rush", "Thunder Wave"] },
      { species: "Dragonite", id: 149, level: 49, moves: ["Thunder", "Dragon Rush", "Hyper Beam"] },
      { species: "Dragonite", id: 149, level: 50, moves: ["Outrage", "Fire Blast", "Hyper Beam"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Ampharos", id: 181, location: "Route 32 (Mareep evolves to Flaaffy at 15, Ampharos at 30)", why: "Thunderpunch/Thunderbolt shreds Lance's Gyarados, Charizard and Aerodactyl." },},
    bonusBattles: [
    {
      name: "Red", heading: "Red — Mt. Silver",
      team: [
      { species: "Pikachu", id: 25, level: 88, moves: ["Volt Tackle", "Thunderbolt", "Iron Tail"], item: "Light Ball" },
      { species: "Lapras", id: 131, level: 80, moves: ["Blizzard", "Brine", "Psychic"] },
      { species: "Snorlax", id: 143, level: 82, moves: ["Crunch", "Shadow Ball", "Giga Impact"] },
      { species: "Venusaur", id: 3, level: 84, moves: ["Frenzy Plant", "Sludge Bomb", "Sleep Powder"] },
      { species: "Charizard", id: 6, level: 84, moves: ["Blast Burn", "Air Slash", "Dragon Pulse"] },
      { species: "Blastoise", id: 9, level: 84, moves: ["Hydro Cannon", "Flash Cannon", "Focus Blast"] }
    ],
      note: "Mt. Silver post-game super-boss",
    
      counterPick: { species: "Ampharos", id: 181, location: "Route 32 (Mareep line; Mt. Silver area or earlier)", why: "Thunderbolt shreds Red's Lapras, Blastoise and Charizard; Electric resists his Pikachu's attacks." },},
    ],
    note: "First-battle (8-badge) teams; stronger rematch teams unlock after all 16 badges (not included). Each trainer carries 2 Full Restores (Lance 4).",
  },
  "Pokémon Ruby, Sapphire & Emerald": {
    eliteFour: [
    {
      name: "Sidney", specialty: "Dark",
      note: "Emerald: Crawdaunt 48 (Hyper Cutter; Surf, Swords Dance, Strength, Facade) replaces Sharpedo.",
      team: [
      { species: "Mightyena", id: 262, level: 46, moves: ["Crunch", "Take Down"], ability: "Intimidate" },
      { species: "Shiftry", id: 275, level: 48, moves: ["Extrasensory", "Fake Out"] },
      { species: "Cacturne", id: 332, level: 46, moves: ["Needle Arm", "Leech Seed"] },
      { species: "Sharpedo", id: 319, level: 48, moves: ["Crunch", "Surf"], ability: "Rough Skin" },
      { species: "Absol", id: 359, level: 49, moves: ["Swords Dance", "Slash", "Aerial Ace"] }
    ],
    
      counterPick: { species: "Breloom", id: 286, location: "Route 114 (as Shroomish)", why: "Fighting hits Dark super-effectively; Breloom's Fighting STAB sweeps Sidney's all-Dark team." },},
    {
      name: "Phoebe", specialty: "Ghost",
      team: [
      { species: "Dusclops", id: 356, level: 48, moves: ["Shadow Punch", "Curse"] },
      { species: "Banette", id: 354, level: 49, moves: ["Shadow Ball", "Will-O-Wisp"] },
      { species: "Sableye", id: 302, level: 50, moves: ["Shadow Ball", "Psychic"] },
      { species: "Banette", id: 354, level: 49, moves: ["Shadow Ball", "Psychic"] },
      { species: "Dusclops", id: 356, level: 51, moves: ["Shadow Ball", "Earthquake"] }
    ],
    
      counterPick: { species: "Absol", id: 359, location: "Route 120", why: "Dark hits Ghost super-effectively and resists Ghost; Absol's Bite/Crunch handles Phoebe's Dusclops, Banette and Sableye." },},
    {
      name: "Glacia", specialty: "Ice",
      team: [
      { species: "Glalie", id: 362, level: 50, moves: ["Ice Beam", "Crunch"] },
      { species: "Sealeo", id: 364, level: 50, moves: ["Surf", "Ice Ball"] },
      { species: "Sealeo", id: 364, level: 52, moves: ["Blizzard", "Dive"] },
      { species: "Glalie", id: 362, level: 52, moves: ["Ice Beam", "Shadow Ball"] },
      { species: "Walrein", id: 365, level: 53, moves: ["Blizzard", "Sheer Cold"] }
    ],
    
      counterPick: { species: "Hariyama", id: 297, location: "Victory Road", why: "Fighting hits Ice super-effectively; Hariyama's bulk and Fighting STAB beat Sealeo, Glalie and Walrein." },},
    {
      name: "Drake", specialty: "Dragon",
      note: "Emerald: Kingdra 53 (Swift Swim; SmokeScreen, Dragon Dance, Surf, Body Slam) replaces the second Flygon.",
      team: [
      { species: "Shelgon", id: 372, level: 52, moves: ["Dragon Claw", "Protect"] },
      { species: "Altaria", id: 334, level: 54, moves: ["Dragon Dance", "Dragon Breath"] },
      { species: "Flygon", id: 330, level: 53, moves: ["Dragon Breath", "Dig"] },
      { species: "Flygon", id: 330, level: 53, moves: ["Flamethrower", "Crunch"] },
      { species: "Salamence", id: 373, level: 55, moves: ["Dragon Claw", "Fly"] }
    ],
    
      counterPick: { species: "Altaria", id: 334, location: "Route 114 (as Swablu; evolves at Lv. 35)", why: "Dragon hits Dragon super-effectively; Altaria's DragonBreath punishes Drake's Shelgon, Flygon and Salamence." },}
    ],
    champion:     {
      name: "Steven",
      team: [
      { species: "Skarmory", id: 227, level: 57, moves: ["Aerial Ace", "Steel Wing"] },
      { species: "Aggron", id: 306, level: 56, moves: ["Earthquake", "Thunder"] },
      { species: "Claydol", id: 344, level: 55, moves: ["Earthquake", "Ancient Power"] },
      { species: "Cradily", id: 346, level: 56, moves: ["Giga Drain", "Sludge Bomb"] },
      { species: "Armaldo", id: 347, level: 56, moves: ["Ancient Power", "Aerial Ace"] },
      { species: "Metagross", id: 376, level: 58, moves: ["Meteor Mash", "Earthquake"] }
    ],
    
      counterPick: { species: "Camerupt", id: 323, location: "Route 112 (as Numel; evolves at Lv. 33)", why: "Ground and Fire both hit Steel super-effectively; Earthquake + Flamethrower cover Skarmory, Aggron, Cradily, Armaldo and Metagross." },},
    altChampion:     {
      name: "Wallace",
      note: "Pokémon Emerald — Wallace replaces Steven as Champion",
      team: [
      { species: "Wailord", id: 321, level: 57, moves: ["Water Spout", "Blizzard"] },
      { species: "Tentacruel", id: 73, level: 55, moves: ["Hydro Pump", "Sludge Bomb"] },
      { species: "Ludicolo", id: 272, level: 56, moves: ["Surf", "Giga Drain"], ability: "Swift Swim" },
      { species: "Whiscash", id: 340, level: 56, moves: ["Earthquake", "Surf"] },
      { species: "Gyarados", id: 130, level: 56, moves: ["Dragon Dance", "Earthquake"], ability: "Intimidate" },
      { species: "Milotic", id: 350, level: 58, moves: ["Surf", "Ice Beam", "Recover"], ability: "Marvel Scale", item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Tropius", id: 357, location: "Route 119", why: "Grass hits Water super-effectively (4x vs Whiscash) and resists Water; Tropius walls most of Wallace's team." },},
    note: "Teams shown are Ruby & Sapphire. In Emerald, Sidney's Sharpedo 48 becomes Crawdaunt 48 and Drake's second Flygon 53 becomes Kingdra 53 (see member notes), and each Elite Four ace holds a Sitrus Berry (Absol 49, Dusclops 51, Walrein 53, Salamence 55). Champion is Steven in Ruby & Sapphire, Wallace in Emerald (water specialist).",
  },
  "Pokémon FireRed & LeafGreen": {
    eliteFour: [
    {
      name: "Lorelei", specialty: "Ice",
      team: [
      { species: "Dewgong", id: 87, level: 52, moves: ["Surf", "Ice Beam", "Hail"] },
      { species: "Cloyster", id: 91, level: 51, moves: ["Dive", "Protect", "Spikes"] },
      { species: "Slowbro", id: 80, level: 52, moves: ["Surf", "Yawn", "Amnesia"] },
      { species: "Jynx", id: 124, level: 54, moves: ["Lovely Kiss", "Ice Punch", "Attract"] },
      { species: "Lapras", id: 131, level: 54, moves: ["Surf", "Ice Beam", "Confuse Ray"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Flareon", id: 136, location: "Eevee gift in Celadon City + Fire Stone from the Dept. Store", why: "Fire Blast melts Lorelei's Ice team." },},
    {
      name: "Bruno", specialty: "Fighting",
      team: [
      { species: "Onix", id: 95, level: 51, moves: ["Earthquake", "Rock Tomb", "Iron Tail"] },
      { species: "Hitmonchan", id: 107, level: 53, moves: ["Sky Uppercut", "Mach Punch", "Counter"] },
      { species: "Hitmonlee", id: 106, level: 53, moves: ["Mega Kick", "Brick Break", "Foresight"] },
      { species: "Onix", id: 95, level: 54, moves: ["Earthquake", "Iron Tail", "Sand Tomb"] },
      { species: "Machamp", id: 68, level: 56, moves: ["Cross Chop", "Bulk Up", "Rock Tomb"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Alakazam", id: 65, location: "Routes 24-25 (catch Abra, evolves to Kadabra at Lv. 16)", why: "Psychic STAB shreds Bruno's Fighting team." },},
    {
      name: "Agatha", specialty: "Ghost",
      team: [
      { species: "Gengar", id: 94, level: 54, moves: ["Shadow Punch", "Confuse Ray", "Toxic"] },
      { species: "Golbat", id: 42, level: 54, moves: ["Air Cutter", "Bite", "Poison Fang"] },
      { species: "Haunter", id: 93, level: 53, moves: ["Hypnosis", "Dream Eater", "Mean Look"] },
      { species: "Arbok", id: 24, level: 56, moves: ["Sludge Bomb", "Iron Tail", "Bite"] },
      { species: "Gengar", id: 94, level: 58, moves: ["Shadow Ball", "Hypnosis", "Sludge Bomb"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Alakazam", id: 65, location: "Routes 24-25 (catch Abra, evolves to Kadabra at Lv. 16)", why: "Psychic hits Agatha's Poison-types super-effectively and outspeeds her Ghosts." },},
    {
      name: "Lance", specialty: "Dragon",
      team: [
      { species: "Gyarados", id: 130, level: 56, moves: ["Hydro Pump", "Twister", "Bite"] },
      { species: "Dragonair", id: 148, level: 54, moves: ["Outrage", "Hyper Beam", "Safeguard"] },
      { species: "Dragonair", id: 148, level: 54, moves: ["Outrage", "Thunder Wave", "Safeguard"] },
      { species: "Aerodactyl", id: 142, level: 58, moves: ["Ancient Power", "Wing Attack", "Hyper Beam"] },
      { species: "Dragonite", id: 149, level: 60, moves: ["Outrage", "Hyper Beam", "Wing Attack"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Articuno", id: 144, location: "Seafoam Islands (Surf + Strength, reachable before the League)", why: "Ice Beam/Blizzard shreds Lance's Dragon/Flying team." },}
    ],
    champion:     {
      name: "Blue",
      team: [
      { species: "Pidgeot", id: 18, level: 59, moves: ["Aerial Ace", "Whirlwind", "Feather Dance"] },
      { species: "Alakazam", id: 65, level: 57, moves: ["Psychic", "Recover", "Reflect"] },
      { species: "Rhydon", id: 112, level: 59, moves: ["Earthquake", "Rock Tomb", "Take Down"] },
      { species: "Exeggutor", id: 103, level: 59, moves: ["Sleep Powder", "Giga Drain", "Egg Bomb"] },
      { species: "Gyarados", id: 130, level: 61, moves: ["Hydro Pump", "Thrash", "Bite"] },
      { species: "Charizard", id: 6, level: 63, moves: ["Fire Blast", "Aerial Ace", "Slash"], item: "Sitrus Berry" }
    ],
    
      counterPick: { species: "Zapdos", id: 145, location: "Power Plant (Surf down Routes 9-10)", why: "Thunderbolt plus Drill Peck covers Blue's Water- and Flying-types; huge Special stat." },},
    note: "First-battle (main story) teams; rematch teams not included. Each Elite Four member's ace holds a Sitrus Berry. Blue's team varies by the player's starter: shown is the player-chose-Bulbasaur variant (Blue has Charizard 63). Player-chose-Charmander variant: Pidgeot 59, Alakazam 57, Rhydon 59, Arcanine 59, Exeggutor 61, Blastoise 63. Player-chose-Squirtle variant: Pidgeot 59, Alakazam 57, Rhydon 59, Gyarados 59, Arcanine 61, Venusaur 63.",
  },
  "Pokémon Gold, Silver & Crystal": {
    eliteFour: [
    {
      name: "Will", specialty: "Psychic",
      team: [
      { species: "Xatu", id: 178, level: 40, moves: ["Psychic", "Confuse Ray", "Future Sight"] },
      { species: "Jynx", id: 124, level: 41, moves: ["Lovely Kiss", "Psychic", "Ice Punch"] },
      { species: "Slowbro", id: 80, level: 41, moves: ["Psychic", "Amnesia", "Curse"] },
      { species: "Exeggutor", id: 103, level: 41, moves: ["Psychic", "Leech Seed", "Egg Bomb"] },
      { species: "Xatu", id: 178, level: 42, moves: ["Psychic", "Confuse Ray", "Quick Attack"] }
    ],
    
      counterPick: { species: "Umbreon", id: 197, location: "Eevee gift from Bill in Goldenrod City (evolves with high friendship at night)", why: "Dark-type is immune to Psychic and Bite hits Will's Psychic team super-effectively." },},
    {
      name: "Koga", specialty: "Poison",
      team: [
      { species: "Ariados", id: 168, level: 40, moves: ["Giga Drain", "Baton Pass", "Spider Web"] },
      { species: "Forretress", id: 205, level: 43, moves: ["Explosion", "Spikes", "Protect"] },
      { species: "Muk", id: 89, level: 42, moves: ["Sludge Bomb", "Minimize", "Toxic"] },
      { species: "Venomoth", id: 49, level: 41, moves: ["Psychic", "Toxic", "Supersonic"] },
      { species: "Crobat", id: 169, level: 44, moves: ["Wing Attack", "Double Team", "Toxic"] }
    ],
    
      counterPick: { species: "Kadabra", id: 64, location: "Routes 34-35 (catch Abra, evolves at Lv. 16)", why: "Psychic STAB shreds Koga's Poison team." },},
    {
      name: "Bruno", specialty: "Fighting",
      team: [
      { species: "Hitmontop", id: 237, level: 42, moves: ["Dig", "Quick Attack", "Pursuit"] },
      { species: "Hitmonlee", id: 106, level: 42, moves: ["Hi Jump Kick", "Swagger", "Double Kick"] },
      { species: "Hitmonchan", id: 107, level: 42, moves: ["Thunder Punch", "Ice Punch", "Fire Punch"] },
      { species: "Onix", id: 95, level: 43, moves: ["Earthquake", "Rock Slide", "Sandstorm"] },
      { species: "Machamp", id: 68, level: 46, moves: ["Cross Chop", "Rock Slide", "Vital Throw"] }
    ],
    
      counterPick: { species: "Xatu", id: 178, location: "Ruins of Alph (Natu evolves at Lv. 25)", why: "Psychic/Flying coverage shreds Bruno's Fighting team." },},
    {
      name: "Karen", specialty: "Dark",
      team: [
      { species: "Umbreon", id: 197, level: 42, moves: ["Confuse Ray", "Feint Attack", "Mean Look"] },
      { species: "Vileplume", id: 45, level: 42, moves: ["Petal Dance", "Stun Spore", "Moonlight"] },
      { species: "Murkrow", id: 198, level: 44, moves: ["Quick Attack", "Pursuit", "Whirlwind"] },
      { species: "Gengar", id: 94, level: 45, moves: ["Destiny Bond", "Curse", "Lick"] },
      { species: "Houndoom", id: 229, level: 47, moves: ["Crunch", "Flamethrower", "Roar"] }
    ],
    
      counterPick: { species: "Machoke", id: 67, location: "Route 42 (Machop evolves at Lv. 28)", why: "Fighting-type Cross Chop hits Karen's Dark-types super-effectively." },}
    ],
    champion:     {
      name: "Lance",
      team: [
      { species: "Gyarados", id: 130, level: 44, moves: ["Surf", "Hyper Beam", "Rain Dance"] },
      { species: "Dragonite", id: 149, level: 47, moves: ["Blizzard", "Thunder Wave", "Twister"] },
      { species: "Aerodactyl", id: 142, level: 46, moves: ["Ancient Power", "Wing Attack", "Rock Slide"] },
      { species: "Charizard", id: 6, level: 46, moves: ["Flamethrower", "Wing Attack", "Slash"] },
      { species: "Dragonite", id: 149, level: 47, moves: ["Thunder", "Twister", "Hyper Beam"] },
      { species: "Dragonite", id: 149, level: 50, moves: ["Outrage", "Fire Blast", "Safeguard"] }
    ],
    
      counterPick: { species: "Ampharos", id: 181, location: "Route 32 (Mareep evolves to Flaaffy at 15, Ampharos at 30)", why: "Thunderpunch/Thunderbolt shreds Lance's Gyarados, Charizard and Aerodactyl." },},
  },
  "Pokémon Red, Blue & Yellow": {
    eliteFour: [
    {
      name: "Lorelei", specialty: "Ice",
      team: [
      { species: "Dewgong", id: 87, level: 54, moves: ["Aurora Beam", "Rest", "Take Down"] },
      { species: "Cloyster", id: 91, level: 53, moves: ["Clamp", "Aurora Beam", "Spike Cannon"] },
      { species: "Slowbro", id: 80, level: 54, moves: ["Water Gun", "Amnesia", "Withdraw"] },
      { species: "Jynx", id: 124, level: 56, moves: ["Ice Punch", "Body Slam", "Thrash"] },
      { species: "Lapras", id: 131, level: 56, moves: ["Blizzard", "Hydro Pump", "Confuse Ray"] }
    ],
    
      counterPick: { species: "Flareon", id: 136, location: "Eevee gift in Celadon City + Fire Stone from the Dept. Store", why: "Fire Blast melts Lorelei's Ice team." },},
    {
      name: "Bruno", specialty: "Fighting",
      team: [
      { species: "Onix", id: 95, level: 53, moves: ["Rock Throw", "Slam", "Rage"] },
      { species: "Hitmonchan", id: 107, level: 55, moves: ["Thunder Punch", "Ice Punch", "Fire Punch"] },
      { species: "Hitmonlee", id: 106, level: 55, moves: ["Hi Jump Kick", "Mega Kick", "Focus Energy"] },
      { species: "Onix", id: 95, level: 56, moves: ["Rock Throw", "Slam", "Rage"] },
      { species: "Machamp", id: 68, level: 58, moves: ["Fissure", "Submission", "Focus Energy"] }
    ],
    
      counterPick: { species: "Alakazam", id: 65, location: "Routes 24-25 (catch Abra, evolves to Kadabra at Lv. 16)", why: "Psychic STAB shreds Bruno's Fighting team." },},
    {
      name: "Agatha", specialty: "Ghost",
      team: [
      { species: "Gengar", id: 94, level: 56, moves: ["Hypnosis", "Dream Eater", "Night Shade"] },
      { species: "Golbat", id: 42, level: 56, moves: ["Confuse Ray", "Wing Attack", "Haze"] },
      { species: "Haunter", id: 93, level: 55, moves: ["Hypnosis", "Dream Eater", "Night Shade"] },
      { species: "Arbok", id: 24, level: 58, moves: ["Glare", "Bite", "Acid"] },
      { species: "Gengar", id: 94, level: 60, moves: ["Dream Eater", "Toxic", "Night Shade"] }
    ],
    
      counterPick: { species: "Alakazam", id: 65, location: "Routes 24-25 (catch Abra, evolves to Kadabra at Lv. 16)", why: "Psychic hits Agatha's Poison-types super-effectively and outspeeds her Ghosts." },},
    {
      name: "Lance", specialty: "Dragon",
      team: [
      { species: "Gyarados", id: 130, level: 58, moves: ["Hydro Pump", "Hyper Beam", "Dragon Rage"] },
      { species: "Dragonair", id: 148, level: 56, moves: ["Hyper Beam", "Dragon Rage", "Agility"] },
      { species: "Dragonair", id: 148, level: 56, moves: ["Hyper Beam", "Slam", "Dragon Rage"] },
      { species: "Aerodactyl", id: 142, level: 60, moves: ["Hyper Beam", "Take Down", "Bite"] },
      { species: "Dragonite", id: 149, level: 62, moves: ["Hyper Beam", "Barrier", "Agility"] }
    ],
    
      counterPick: { species: "Articuno", id: 144, location: "Seafoam Islands (Surf + Strength, reachable before the League)", why: "Ice Beam/Blizzard shreds Lance's Dragon/Flying team." },}
    ],
    champion:     {
      name: "Blue",
      team: [
      { species: "Pidgeot", id: 18, level: 61, moves: ["Wing Attack", "Mirror Move", "Sky Attack"] },
      { species: "Alakazam", id: 65, level: 59, moves: ["Psychic", "Recover", "Reflect"] },
      { species: "Rhydon", id: 112, level: 61, moves: ["Horn Drill", "Fury Attack", "Leer"] },
      { species: "Exeggutor", id: 103, level: 61, moves: ["Hypnosis", "Barrage", "Stomp"] },
      { species: "Gyarados", id: 130, level: 63, moves: ["Hydro Pump", "Hyper Beam", "Dragon Rage"] },
      { species: "Charizard", id: 6, level: 65, moves: ["Fire Blast", "Slash", "Fire Spin"] }
    ],
    
      counterPick: { species: "Zapdos", id: 145, location: "Power Plant (Surf down Routes 9-10)", why: "Thunderbolt plus Drill Peck covers Blue's Water- and Flying-types; huge Special stat." },},
    note: "Red/Blue teams shown. Blue's team varies by the player's starter: shown is the player-chose-Bulbasaur variant (Blue has Charizard). Player-chose-Charmander variant: Pidgeot 61, Alakazam 59, Rhydon 61, Arcanine 63, Exeggutor 61, Blastoise 65. Player-chose-Squirtle variant: Pidgeot 61, Alakazam 59, Rhydon 61, Gyarados 61, Arcanine 63, Venusaur 65. Yellow keeps the same species and levels but with different movesets (e.g. Agatha's Gengar 60 gets Psychic; Lance's Dragonite 62 gets Blizzard/Thunder/Fire Blast; Bruno's Onix gets Rock Slide/Earthquake). Yellow's Champion Blue is entirely different: Sandslash 61, Alakazam 59, Exeggutor 61, plus Cloyster 61/Ninetales 63/Jolteon 65, Magneton 61/Cloyster 63/Flareon 65, or Ninetales 61/Magneton 63/Vaporeon 65 depending on how his Eevee evolved (win both early rival battles = Jolteon, split = Flareon, lose both = Vaporeon).",
  },
};

/** League data for a game — null when the game has no league data. */
export function getLeagueForGame(game: string): LeagueData | null {
  return ELITE_FOUR_TEAMS[game] ?? null;
}

/**
 * Bonus super-boss for a challenge name (e.g. "Red atop Mt. Silver") —
 * null when the challenge isn't a bonus battle.
 */
export function getBonusBattleForChallenge(
  game: string,
  challengeName: string,
): BonusBattle | null {
  const league = ELITE_FOUR_TEAMS[game];
  if (!league?.bonusBattles) return null;
  const q = challengeName.toLowerCase();
  return (
    league.bonusBattles.find((b) => q.includes(b.name.toLowerCase())) ?? null
  );
}
