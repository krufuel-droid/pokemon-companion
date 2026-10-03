/**
 * Gym leader teams for battle prep.
 *
 * Keyed by the exact game titles in `POKEMON_GAMES` (lib/data/games.ts);
 * each game's array follows the guide "Path" order (lib/data/guides.ts),
 * and each entry's `gym` name matches the tracker's challenge name exactly
 * so the gym-run tracker and guide pages can look teams up by name.
 *
 * Each team is the leader's MAIN-STORY team. Version differences
 * (version-exclusive leaders/aces) and notable rematch changes are
 * described in `note`. Trial captains (Alola) list the Totem Pokémon battle
 * instead of a trainer team, since that's the trial's battle.
 *
 * Data verified October 2026 against Psypoke's gym leader guides
 * (psypokes.com/{bw,bw2,oras,lgpe,rs,dp,platinum,hgss,frlg,gsc}/gymelites.php
 * and the HGSS/GSC Kanto leader pages), the Pokémon Wiki (Fandom) trainer
 * tables for RBY/XY/Alola trials, Game8 (SV), Gamerant (SwSh), RPG Site
 * (BDSP), GamesRadar (HGSS Kanto levels), and walkthrough/video sources for
 * HGSS Kanto movesets — species, levels, moves, abilities, and held items.
 * Where a leader's exact gen-4+ moveset couldn't be sourced, the prior
 * generation's verified moveset is used (noted in the final report).
 */

/** One Pokémon to catch before a gym/league battle that beats the specialty. */
export interface CounterPick {
  /** Display name, e.g. "Mankey". */
  species: string;
  /** National Pokédex id — links to /pokedex/{id} and builds the sprite URL. */
  id: number;
  /** Where to catch it in this game, before the battle. */
  location: string;
  /** One-line reason, e.g. "Fighting beats Rock". */
  why: string;
  /** Sprite override for alternate forms. */
  sprite?: string;
}

export interface GymTeamMember {  /** Display name, e.g. "Miltank" or "Alolan Raticate". */
  species: string;
  /** National Pokédex id — links to /pokedex/{id} and builds the sprite URL. */
  id: number;
  level: number;
  /** The 2–4 most notable moves for battle prep. */
  moves: string[];
  /** Notable ability (signature or battle-relevant). */
  ability?: string;
  /** Notable held item (e.g. Sitrus Berry, Lum Berry). */
  item?: string;
  /** Sprite override for alternate forms (regional forms etc.). */
  sprite?: string;
}

export interface GymTeam {
  /**
   * Matches the guide path milestone / tracker challenge name exactly,
   * e.g. "Cortondo Gym", "Stow-on-Side Stadium", "Verdant Cavern Trial".
   */
  gym: string;
  leader: string;
  /** Badge awarded (or Z-Crystal for Alolan trials). */
  badge: string;
  /** Leader's specialty type, e.g. "Bug". */
  specialty: string;
  team: GymTeamMember[];
  /** Version differences, rematch notes, totem allies, etc. */
  note?: string;
  /** One catchable-before counter-pick for battle prep. */
  counterPick?: CounterPick;
}

/** All gym/trial teams, keyed by exact game title from POKEMON_GAMES. */
const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/** Sprite URL for a team member: form override or the app's standard sprite URL. */
export function gymMemberSprite(member: GymTeamMember): string {
  return member.sprite ?? `${SPRITE_BASE}/${member.id}.png`;
}

/** Showdown (Smogon-style) sprite for a regional form, matching lib/data/forms.ts. */
export const showdownSprite = (name: string) =>
  `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`;

export const GYM_TEAMS: Record<string, GymTeam[]> = {
  "Pokémon Scarlet & Violet": [
    {
      gym: "Cortondo Gym",
      leader: "Katy",
      badge: "Gym Badge",
      specialty: "Bug",
      team: [
        { species: "Nymble", id: 919, level: 14, moves: ["Double Kick", "Struggle Bug"] },
        { species: "Tarountula", id: 917, level: 14, moves: ["Bug Bite", "Assurance"] },
        { species: "Teddiursa", id: 216, level: 15, moves: ["Fury Cutter", "Fury Swipes"] },
      ],
      note: "Teddiursa Terastallizes into a pure Bug type.",
    
      counterPick: { species: "Fletchling", id: 661, location: "South Province (Area One) near Cortondo — very common", why: "Flying-type Fletchling resists Bug and its Flying moves shred Katy's Bug team (evolves into Talonflame)." },},
    {
      gym: "Artazon Gym",
      leader: "Brassius",
      badge: "Gym Badge",
      specialty: "Grass",
      team: [
        { species: "Petilil", id: 548, level: 16, moves: ["Sleep Powder", "Mega Drain"] },
        { species: "Smoliv", id: 928, level: 16, moves: ["Tackle", "Razor Leaf"] },
        { species: "Sudowoodo", id: 185, level: 17, moves: ["Trailblaze", "Rock Throw"] },
      ],
      note: "Sudowoodo Terastallizes into a pure Grass type.",
    
      counterPick: { species: "Charcadet", id: 935, location: "East Province (Area One) near Artazon — common", why: "Fire-type Charcadet resists Grass and its Fire moves melt Brassius's Grass team (evolves into Armarouge/Ceruledge)." },},
    {
      gym: "Levincia Gym",
      leader: "Iono",
      badge: "Gym Badge",
      specialty: "Electric",
      team: [
        { species: "Wattrel", id: 940, level: 23, moves: ["Pluck", "Quick Attack", "Spark"] },
        { species: "Bellibolt", id: 939, level: 23, moves: ["Spark", "Water Gun"] },
        { species: "Luxio", id: 404, level: 23, moves: ["Spark", "Bite"] },
        { species: "Mismagius", id: 429, level: 24, moves: ["Confuse Ray", "Charge Beam", "Hex"] },
      ],
      note: "Mismagius Terastallizes into a pure Electric type.",
    
      counterPick: { species: "Bunnelby", id: 659, location: "East Province (Area One/Two) fields around Levincia — common", why: "Evolve into Diggersby: Ground typing is immune to Electric and Ground moves hit Iono's Electric team super-effectively." },},
    {
      gym: "Cascarrafa Gym",
      leader: "Kofu",
      badge: "Gym Badge",
      specialty: "Water",
      team: [
        { species: "Veluza", id: 976, level: 29, moves: ["Slash", "Pluck", "Aqua Cutter"] },
        { species: "Wugtrio", id: 961, level: 29, moves: ["Mud-Slap", "Water Pulse", "Headbutt"] },
        { species: "Crabominable", id: 740, level: 30, moves: ["Crabhammer", "Rock Smash", "Slam"] },
      ],
      note: "Crabominable Terastallizes into a pure Water type.",
    
      counterPick: { species: "Petilil", id: 548, location: "West Province (Area One) fields near Cascarrafa — common", why: "Grass-type Petilil resists Water and its Grass moves hit Kofu's Water team super-effectively." },},
    {
      gym: "Medali Gym",
      leader: "Larry",
      badge: "Gym Badge",
      specialty: "Normal",
      team: [
        { species: "Komala", id: 775, level: 35, moves: ["Yawn", "Sucker Punch", "Slam"] },
        { species: "Dudunsparce", id: 982, level: 35, moves: ["Glare", "Drill Run", "Hyper Drill"] },
        { species: "Staraptor", id: 398, level: 36, moves: ["Facade", "Aerial Ace"] },
      ],
      note: "Staraptor Terastallizes into a pure Normal type.",
    
      counterPick: { species: "Flamigo", id: 973, location: "West Province (Area Three) — flocks around Medali", why: "Fighting-type Flamigo's Fighting moves hit Larry's Normal team super-effectively." },},
    {
      gym: "Montenevera Gym",
      leader: "Ryme",
      badge: "Gym Badge",
      specialty: "Ghost",
      team: [
        { species: "Mimikyu", id: 778, level: 41, moves: ["Shadow Sneak", "Slash", "Light Screen"] },
        { species: "Banette", id: 354, level: 41, moves: ["Icy Wind", "Sucker Punch", "Shadow Sneak"] },
        { species: "Greavard", id: 971, level: 41, moves: ["Play Rough", "Crunch", "Phantom Force"] },
        {
          species: "Toxtricity (Low-Key)",
          id: 849,
          level: 42,
          moves: ["Discharge", "Hex", "Hyper Voice"],
          sprite: showdownSprite("toxtricity-lowkey"),
        },
      ],
      note: "Double battle. Toxtricity Terastallizes into a pure Ghost type.",
    
      counterPick: { species: "Greavard", id: 971, location: "Around Montenevera at night — common", why: "Ghost-type Greavard's Ghost moves hit Ryme's Ghost team super-effectively; catch one right outside town." },},
    {
      gym: "Alfornada Gym",
      leader: "Tulip",
      badge: "Gym Badge",
      specialty: "Psychic",
      team: [
        { species: "Farigiraf", id: 981, level: 44, moves: ["Crunch", "Zen Headbutt", "Reflect"] },
        { species: "Gardevoir", id: 282, level: 44, moves: ["Psychic", "Dazzling Gleam", "Energy Ball"] },
        { species: "Espathra", id: 956, level: 44, moves: ["Psychic", "Quick Attack", "Shadow Ball"] },
        { species: "Florges", id: 671, level: 45, moves: ["Psychic", "Dazzling Gleam", "Petal Blizzard"] },
      ],
      note: "Florges Terastallizes into a pure Psychic type.",
    
      counterPick: { species: "Tarountula", id: 917, location: "South Province — very common, including around Alfornada", why: "Bug-type Tarountula's Bug moves hit Tulip's Psychic team super-effectively (evolves into Spidops)." },},
    {
      gym: "Glaseado Gym",
      leader: "Grusha",
      badge: "Gym Badge",
      specialty: "Ice",
      team: [
        { species: "Frosmoth", id: 873, level: 47, moves: ["Blizzard", "Bug Buzz", "Tailwind"] },
        { species: "Beartic", id: 614, level: 47, moves: ["Aqua Jet", "Icicle Crash", "Earthquake"] },
        { species: "Cetitan", id: 975, level: 47, moves: ["Icicle Spear", "Liquidation", "Ice Shard"] },
        { species: "Altaria", id: 334, level: 48, moves: ["Ice Beam", "Dragon Pulse", "Moonblast", "Hurricane"] },
      ],
      note: "Altaria Terastallizes into a pure Ice type.",
    
      counterPick: { species: "Capsakid", id: 951, location: "North Province (Area One/Two) on Glaseado Mountain — common", why: "Fire-type Capsakid resists Ice and its Fire moves melt Grusha's Ice team (evolves into Scovillain with a Fire Stone)." },},
  ],
  "Pokémon Sword & Shield": [
    {
      gym: "Turffield Stadium",
      leader: "Milo",
      badge: "Grass Badge",
      specialty: "Grass",
      team: [
        { species: "Gossifleur", id: 829, level: 19, moves: ["Magical Leaf"] },
        { species: "Eldegoss", id: 830, level: 20, moves: ["Magical Leaf", "Leafage"] },
      ],
    
      counterPick: { species: "Rookidee", id: 821, location: "Route 1 — very common early catch", why: "Flying-type Rookidee resists Grass and its Flying moves hit Milo's Grass team super-effectively." },},
    {
      gym: "Hulbury Stadium",
      leader: "Nessa",
      badge: "Water Badge",
      specialty: "Water",
      team: [
        { species: "Goldeen", id: 118, level: 22, moves: ["Water Pulse"] },
        { species: "Arrokuda", id: 846, level: 23, moves: ["Aqua Jet", "Whirlpool"] },
        { species: "Drednaw", id: 834, level: 24, moves: ["Razor Shell", "Headbutt"] },
      ],
      note: "Drednaw Gigantamaxes.",
    
      counterPick: { species: "Yamper", id: 835, location: "Route 4 — common", why: "Electric-type Yamper's Electric moves hit Nessa's Water team super-effectively." },},
    {
      gym: "Motostoke Stadium",
      leader: "Kabu",
      badge: "Fire Badge",
      specialty: "Fire",
      team: [
        { species: "Ninetales", id: 38, level: 25, moves: ["Fire Spin", "Will-O-Wisp"] },
        { species: "Arcanine", id: 59, level: 25, moves: ["Flame Wheel"] },
        { species: "Centiskorch", id: 851, level: 27, moves: ["Flame Wheel", "Coil"] },
      ],
      note: "Centiskorch Gigantamaxes.",
    
      counterPick: { species: "Chewtle", id: 833, location: "Route 4 / Galar Mine No. 2", why: "Water-type Chewtle resists Fire and its Water moves hit Kabu's Fire team super-effectively (evolves into Drednaw)." },},
    {
      gym: "Stow-on-Side Stadium",
      leader: "Bea / Allister",
      badge: "Fighting Badge / Ghost Badge",
      specialty: "Fighting / Ghost",
      team: [
        { species: "Hitmontop", id: 237, level: 34, moves: ["Triple Kick", "Revenge"] },
        { species: "Pangoro", id: 675, level: 34, moves: ["Night Slash"] },
        { species: "Sirfetch'd", id: 865, level: 35, moves: ["Revenge", "Brutal Swing"] },
        { species: "Machamp", id: 68, level: 36, moves: ["Revenge", "Strength"] },
      ],
      note:
        "Sword: Bea (Fighting) as listed; Machamp Gigantamaxes. Shield: Allister (Ghost) — Galarian Yamask 34 [Brutal Swing, Hex], Mimikyu 34 [Slash, Shadow Sneak], Cursola 35 [Ancient Power], Gengar 36 [Payback, Venoshock, Hypnosis]; Gengar Gigantamaxes.",
    
      counterPick: { species: "Impidimp", id: 859, location: "Glimwood Tangle — off Route 6, reachable before the gym", why: "Dark/Fairy Impidimp covers both versions: Fairy moves shred Bea's Fighting team and resist Fighting; Dark moves shred Allister's Ghost team and resist Ghost." },},
    {
      gym: "Ballonlea Stadium",
      leader: "Opal",
      badge: "Fairy Badge",
      specialty: "Fairy",
      team: [
        {
          species: "Galarian Weezing",
          id: 110,
          level: 36,
          moves: ["Sludge"],
          sprite: showdownSprite("weezing-galar"),
        },
        { species: "Mawile", id: 303, level: 36, moves: ["Crunch", "Draining Kiss"] },
        { species: "Togekiss", id: 468, level: 37, moves: ["Draining Kiss", "Ancient Power"] },
        { species: "Alcremie", id: 869, level: 38, moves: ["Draining Kiss", "Sweet Kiss"] },
      ],
      note: "Alcremie Gigantamaxes.",
    
      counterPick: { species: "Toxel", id: 848, location: "Route 7 — on the path to Ballonlea", why: "Poison-type Toxel's Poison moves hit Opal's Fairy team super-effectively." },},
    {
      gym: "Circhester Stadium",
      leader: "Gordie / Melony",
      badge: "Rock Badge / Ice Badge",
      specialty: "Rock / Ice",
      team: [
        { species: "Barbaracle", id: 689, level: 40, moves: ["Rock Tomb", "Shell Smash"] },
        { species: "Shuckle", id: 213, level: 40, moves: ["Stone Edge"] },
        { species: "Stonjourner", id: 874, level: 41, moves: ["Body Slam"] },
        { species: "Coalossal", id: 839, level: 42, moves: ["Heat Crash", "Stealth Rock"] },
      ],
      note:
        "Sword: Gordie (Rock) as listed; Coalossal Gigantamaxes. Shield: Melony (Ice) — Frosmoth 40 [Bug Buzz, Hail], Galarian Darmanitan 40 [Icicle Crash, Fire Fang, Headbutt], Eiscue 41 [Freeze-Dry], Lapras 42 [Ice Beam, Sing, Surf]; Lapras Gigantamaxes.",
    
      counterPick: { species: "Cufant", id: 878, location: "Route 8 — on the path to Circhester", why: "Steel-type Cufant resists both Rock and Ice and its Steel moves hit Gordie's Rock team and Melony's Ice team super-effectively." },},
    {
      gym: "Spikemuth Gym",
      leader: "Piers",
      badge: "Dark Badge",
      specialty: "Dark",
      team: [
        { species: "Scrafty", id: 560, level: 44, moves: ["Brick Break", "Payback"] },
        { species: "Malamar", id: 687, level: 45, moves: ["Payback", "Night Slash"] },
        { species: "Skuntank", id: 435, level: 45, moves: ["Snarl", "Sucker Punch", "Toxic"] },
        { species: "Obstagoon", id: 862, level: 46, moves: ["Shadow Claw", "Throat Chop", "Counter"] },
      ],
      note: "No Dynamax allowed in Spikemuth.",
    
      counterPick: { species: "Machop", id: 66, location: "Route 9 / Wild Area (Dusty Bowl)", why: "Fighting-type Machop's Fighting moves hit Piers's Dark team super-effectively." },},
    {
      gym: "Hammerlocke Stadium",
      leader: "Raihan",
      badge: "Dragon Badge",
      specialty: "Dragon",
      team: [
        { species: "Gigalith", id: 526, level: 46, moves: ["Rock Blast", "Body Press"] },
        { species: "Sandaconda", id: 844, level: 46, moves: ["Fire Fang", "Earth Power"] },
        { species: "Flygon", id: 330, level: 47, moves: ["Thunder Punch", "Crunch"] },
        { species: "Duraludon", id: 884, level: 48, moves: ["Iron Head", "Stone Edge"] },
      ],
      note: "Double battle. Duraludon Gigantamaxes.",
    
      counterPick: { species: "Galarian Darumaka", id: 554, location: "Route 8 — common in the cold stretch", why: "Ice-type Galarian Darumaka's Ice moves hit Raihan's Dragon team (and Flygon/Sandaconda) super-effectively; evolves into the hard-hitting Galarian Darmanitan." },},
  ],
  "Pokémon Brilliant Diamond & Shining Pearl": [
    {
      gym: "Oreburgh Gym",
      leader: "Roark",
      badge: "Coal Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 12, moves: ["Stealth Rock", "Defense Curl", "Rollout"] },
        { species: "Onix", id: 95, level: 12, moves: ["Stealth Rock", "Rock Throw", "Bind"] },
        { species: "Cranidos", id: 408, level: 14, moves: ["Headbutt", "Bulldoze", "Leer"] },
      ],
    
      counterPick: { species: "Chimchar", id: 390, location: "Starter choice in Twinleaf Town", why: "Fighting (as Monferno/Infernape) hits Rock super-effectively and resists Rock." },},
    {
      gym: "Eterna Gym",
      leader: "Gardenia",
      badge: "Forest Badge",
      specialty: "Grass",
      team: [
        { species: "Cherubi", id: 420, level: 19, moves: ["Grass Knot", "Growth", "Dazzling Gleam", "Safeguard"] },
        { species: "Turtwig", id: 387, level: 19, moves: ["Grass Knot", "Razor Leaf", "Reflect", "Work Up"], item: "Miracle Seed" },
        { species: "Roserade", id: 407, level: 22, moves: ["Grass Knot", "Petal Blizzard", "Poison Sting", "Stun Spore"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Ponyta", id: 77, location: "Route 206", why: "Fire hits Grass super-effectively; Ponyta/Rapidash burns through Gardenia's team." },},
    {
      gym: "Hearthome Gym",
      leader: "Fantina",
      badge: "Relic Badge",
      specialty: "Ghost",
      team: [
        { species: "Drifblim", id: 426, level: 32, moves: ["Strength Sap", "Hex", "Fly", "Will-O-Wisp"], item: "Zoom Lens" },
        { species: "Gengar", id: 94, level: 34, moves: ["Shadow Claw", "Confuse Ray", "Sludge Bomb", "Dazzling Gleam"], item: "Colbur Berry" },
        { species: "Mismagius", id: 429, level: 36, moves: ["Confuse Ray", "Phantom Force", "Magical Leaf", "Dazzling Gleam"], item: "Expert Belt" },
      ],
    
      counterPick: { species: "Gastly", id: 92, location: "Old Chateau in Eterna Forest (night)", why: "Ghost hits Ghost super-effectively; Gastly/Haunter's Shadow Ball sweeps Fantina's Ghost team." },},
    {
      gym: "Veilstone Gym",
      leader: "Maylene",
      badge: "Cobble Badge",
      specialty: "Fighting",
      team: [
        { species: "Meditite", id: 307, level: 27, moves: ["Drain Punch", "Light Screen", "Flash", "Bulk Up"], item: "Light Clay" },
        { species: "Machoke", id: 67, level: 27, moves: ["Low Sweep", "Knock Off", "Rock Tomb", "Bulldoze"], item: "Expert Belt" },
        { species: "Lucario", id: 448, level: 30, moves: ["Drain Punch", "Screech", "Metal Claw", "Bulk Up"], item: "Big Root" },
      ],
    
      counterPick: { species: "Staravia", id: 397, location: "Route 209 (or raise a Starly from Route 201)", why: "Flying hits Fighting super-effectively; Staravia's Aerial Ace beats Maylene's Meditite and Machoke." },},
    {
      gym: "Pastoria Gym",
      leader: "Crasher Wake",
      badge: "Fen Badge",
      specialty: "Water",
      team: [
        { species: "Gyarados", id: 130, level: 27, moves: ["Brine", "Ice Fang", "Crunch", "Flail"], item: "Wide Lens" },
        { species: "Quagsire", id: 195, level: 27, moves: ["Rain Dance", "Haze", "Mud Shot", "Scald"], item: "Damp Rock" },
        { species: "Floatzel", id: 419, level: 30, moves: ["Brine", "Ice Fang", "Bite", "Aqua Jet"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Roselia", id: 315, location: "Route 212", why: "Grass hits Water super-effectively (4x vs Quagsire) and resists Water; Roselia walls Crasher Wake's team." },},
    {
      gym: "Canalave Gym",
      leader: "Byron",
      badge: "Mine Badge",
      specialty: "Steel",
      team: [
        { species: "Bronzor", id: 436, level: 36, moves: ["Confuse Ray", "Sandstorm", "Trick Room", "Flash Cannon"] },
        { species: "Steelix", id: 208, level: 36, moves: ["Thunder Fang", "Earthquake", "Sandstorm", "Gyro Ball"], item: "Soft Sand" },
        { species: "Bastiodon", id: 411, level: 39, moves: ["Iron Defense", "Thunderbolt", "Stone Edge", "Flash Cannon"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Ponyta", id: 77, location: "Route 211 (east of Eterna)", why: "Fire hits Steel super-effectively; Rapidash's Fire STAB beats Byron's Magneton, Steelix and Bastiodon." },},
    {
      gym: "Snowpoint Gym",
      leader: "Candice",
      badge: "Icicle Badge",
      specialty: "Ice",
      team: [
        { species: "Snover", id: 459, level: 38, moves: ["Mist", "Razor Leaf", "Water Pulse", "Avalanche"], item: "Icy Rock" },
        { species: "Sneasel", id: 215, level: 38, moves: ["Metal Claw", "Hone Claws", "Dig", "Avalanche"], item: "Chople Berry" },
        { species: "Medicham", id: 308, level: 40, moves: ["Ice Punch", "Bulk Up", "Brick Break", "Rock Slide"], item: "Expert Belt" },
        { species: "Abomasnow", id: 460, level: 42, moves: ["Aurora Veil", "Giga Drain", "Earthquake", "Blizzard"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Rapidash", id: 78, location: "Route 215 (as Ponyta)", why: "Fire hits Ice super-effectively (4x vs Snover/Abomasnow); Rapidash outspeeds and burns Candice's team." },},
    {
      gym: "Sunyshore Gym",
      leader: "Volkner",
      badge: "Beacon Badge",
      specialty: "Electric",
      team: [
        { species: "Raichu", id: 26, level: 46, moves: ["Nuzzle", "Volt Switch", "Surf", "Charge Beam"], item: "Shuca Berry" },
        { species: "Ambipom", id: 424, level: 47, moves: ["Fake Out", "Thunderbolt", "Double Hit", "Last Resort"], item: "Chople Berry" },
        { species: "Octillery", id: 224, level: 47, moves: ["Octazooka", "Focus Energy", "Aurora Beam", "Charge Beam"], item: "Expert Belt" },
        { species: "Luxray", id: 405, level: 49, moves: ["Thunder Fang", "Ice Fang", "Crunch", "Iron Tail"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Gastrodon", id: 423, location: "Route 212 (as Shellos)", why: "Ground hits Electric super-effectively and Gastrodon is immune to Electric; Earthquake sweeps Volkner." },},
  ],
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!": [
    {
      gym: "Pewter Gym",
      leader: "Brock",
      badge: "Boulder Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 11, moves: ["Tackle"] },
        { species: "Onix", id: 95, level: 12, moves: ["Headbutt", "Bind", "Rock Throw"] },
      ],
    
      counterPick: { species: "Bellsprout", id: 69, location: "Route 2 (Let's Go, Eevee!; Oddish in Let's Go, Pikachu!)", why: "Grass-type Vine Whip shreds Brock's Rock/Ground team. (Mankey on Route 22 is Pikachu-version only, so not picked for the combined entry.)" },},
    {
      gym: "Cerulean Gym",
      leader: "Misty",
      badge: "Cascade Badge",
      specialty: "Water",
      team: [
        { species: "Psyduck", id: 54, level: 18, moves: ["Confusion", "Water Gun"] },
        { species: "Starmie", id: 121, level: 19, moves: ["Scald", "Swift", "Psywave"] },
      ],
    
      counterPick: { species: "Pikachu", id: 25, location: "Viridian Forest (wild catch, not the partner)", why: "Electric Thunderbolt shreds Misty's Water team." },},
    {
      gym: "Vermilion Gym",
      leader: "Lt. Surge",
      badge: "Thunder Badge",
      specialty: "Electric",
      team: [
        { species: "Voltorb", id: 100, level: 25, moves: ["Thunderbolt", "Swift", "Light Screen"] },
        { species: "Magnemite", id: 81, level: 25, moves: ["Thunderbolt", "Sonic Boom"] },
        { species: "Raichu", id: 26, level: 26, moves: ["Thunderbolt", "Quick Attack", "Double Kick"] },
      ],
    
      counterPick: { species: "Diglett", id: 50, location: "Diglett's Cave", why: "Ground-type Dig is super-effective vs Lt. Surge's Electric team and immune to Electric attacks." },},
    {
      gym: "Celadon Gym",
      leader: "Erika",
      badge: "Rainbow Badge",
      specialty: "Grass",
      team: [
        { species: "Tangela", id: 114, level: 33, moves: ["Mega Drain", "Sleep Powder", "Bind"] },
        { species: "Weepinbell", id: 70, level: 33, moves: ["Mega Drain", "Poison Jab"] },
        { species: "Vileplume", id: 45, level: 34, moves: ["Mega Drain", "Moonblast"] },
      ],
    
      counterPick: { species: "Doduo", id: 84, location: "Route 16 (west of Celadon City)", why: "Doduo's high Attack and Flying moves (Drill Peck) hit far harder than Pidgeotto against Erika's Grass team." },},
    {
      gym: "Fuchsia Gym",
      leader: "Koga",
      badge: "Soul Badge",
      specialty: "Poison",
      team: [
        { species: "Weezing", id: 110, level: 43, moves: ["Toxic", "Sludge Bomb", "Explosion"] },
        { species: "Muk", id: 89, level: 43, moves: ["Withdraw", "Toxic", "Sludge Bomb", "Moonblast"] },
        { species: "Golbat", id: 42, level: 43, moves: ["Toxic", "Protect", "Fly", "Leech Life"] },
        { species: "Venomoth", id: 49, level: 44, moves: ["Sludge Bomb", "Protect", "Psychic", "Bug Buzz"] },
      ],
    
      counterPick: { species: "Drowzee", id: 96, location: "Route 11", why: "Psychic-type Confusion hits Koga's Poison team super-effectively." },},
    {
      gym: "Saffron Gym",
      leader: "Sabrina",
      badge: "Marsh Badge",
      specialty: "Psychic",
      team: [
        { species: "Mr. Mime", id: 122, level: 43, moves: ["Psychic", "Reflect", "Light Screen", "Double Slap"] },
        { species: "Slowbro", id: 80, level: 43, moves: ["Psychic", "Yawn", "Surf", "Calm Mind"] },
        { species: "Jynx", id: 124, level: 34, moves: ["Psychic", "Lovely Kiss", "Ice Punch"] },
        { species: "Alakazam", id: 65, level: 44, moves: ["Psychic", "Night Shade"] },
      ],
    
      counterPick: { species: "Kadabra", id: 64, location: "Routes 24-25 (catch Abra, evolves at Lv. 16)", why: "Psychic resists Sabrina's Psychic attacks and outspeeds her team." },},
    {
      gym: "Cinnabar Gym",
      leader: "Blaine",
      badge: "Volcano Badge",
      specialty: "Fire",
      team: [
        { species: "Magmar", id: 126, level: 47, moves: ["Flamethrower", "Low Kick", "Confuse Ray"] },
        { species: "Rapidash", id: 78, level: 47, moves: ["Flare Blitz", "Quick Attack", "Fury Attack"] },
        { species: "Ninetales", id: 38, level: 47, moves: ["Fire Blast", "Quick Attack"] },
        { species: "Arcanine", id: 59, level: 48, moves: ["Flare Blitz", "Outrage", "Crunch"] },
      ],
    
      counterPick: { species: "Gyarados", id: 130, location: "Magikarp swimming near Vermilion City (evolves at Lv. 20)", why: "Water/Flying Gyarados soaks Blaine's Fire team — Surf and Hydro Pump hit massively." },},
    {
      gym: "Viridian Gym",
      leader: "Giovanni",
      badge: "Earth Badge",
      specialty: "Ground",
      team: [
        { species: "Dugtrio", id: 51, level: 49, moves: ["Slash", "Sucker Punch", "Earthquake"] },
        { species: "Nidoqueen", id: 31, level: 49, moves: ["Super Fang", "Earthquake", "Crunch"] },
        { species: "Nidoking", id: 34, level: 49, moves: ["Megahorn", "Earthquake", "Poison Jab", "Horn Drill"] },
        { species: "Rhydon", id: 112, level: 50, moves: ["Earthquake", "Rock Slide", "Megahorn"] },
      ],
    
      counterPick: { species: "Articuno", id: 144, location: "Seafoam Islands (Surf, reachable before Giovanni)", why: "Ice-type Blizzard shreds Giovanni's Ground team." },},
  ],
  "Pokémon Sun & Moon": [
    {
      gym: "Verdant Cavern Trial",
      leader: "Ilima",
      badge: "Normalium Z",
      specialty: "Normal",
      team: [
        {
          species: "Totem Gumshoos",
          id: 735,
          level: 12,
          moves: ["Bite", "Leer", "Scary Face", "Super Fang"],
          ability: "Adaptability",
          item: "Pecha Berry",
        },
      ],
      note: "Sun: Totem Gumshoos as listed. Moon: Totem Alolan Raticate 12 (Gluttony, Pecha Berry) [Bite, Tail Whip, Scary Face, Tackle]. Defense +1 aura; calls Yungoos (Sun) or Alolan Rattata (Moon) as allies.",
    
      counterPick: { species: "Makuhita", id: 296, location: "Route 2", why: "Fighting-type Arm Thrust hits Totem Gumshoos (Normal) super-effectively" },},
    {
      gym: "Melemele Grand Trial",
      leader: "Hala",
      badge: "Fightinium Z",
      specialty: "Fighting",
      team: [
        { species: "Mankey", id: 56, level: 14, moves: ["Karate Chop", "Pursuit", "Focus Energy"], ability: "Anger Point" },
        { species: "Makuhita", id: 296, level: 14, moves: ["Arm Thrust", "Sand Attack", "Fake Out"], ability: "Thick Fat" },
        { species: "Crabrawler", id: 739, level: 15, moves: ["Pursuit", "Power-Up Punch", "Leer"], ability: "Iron Fist", item: "Fightinium Z" },
      ],
    
      counterPick: { species: "Oricorio", id: 741, location: "Melemele Meadow", why: "Flying-type Air Cutter/Peck hits Hala's Fighting-types super-effectively" },},
    {
      gym: "Brooklet Hill Trial",
      leader: "Lana",
      badge: "Waterium Z",
      specialty: "Water",
      team: [
        {
          species: "Totem Wishiwashi (School)",
          id: 746,
          level: 20,
          moves: ["Soak", "Water Gun", "Growl", "Rain Dance"],
          ability: "Schooling",
          item: "Sitrus Berry",
          sprite: showdownSprite("wishiwashi-school"),
        },
      ],
      note: "Defense +1 aura; calls Wishiwashi or Alomomola as allies.",
    
      counterPick: { species: "Charjabug", id: 737, location: "Route 1 (as Grubbin)", why: "Electric-type Spark hits Totem Araquanid (Water/Bug) super-effectively" },},
    {
      gym: "Wela Volcano Park Trial",
      leader: "Kiawe",
      badge: "Firium Z",
      specialty: "Fire",
      team: [
        {
          species: "Totem Salazzle",
          id: 758,
          level: 22,
          moves: ["Toxic", "Torment", "Flame Burst", "Venom Drench"],
          ability: "Corrosion",
          item: "Petaya Berry",
        },
      ],
      note: "Special Defense +1 aura; calls Salandit as allies.",
    
      counterPick: { species: "Rockruff", id: 744, location: "Route 1", why: "Rock-type Rock Throw hits Totem Salazzle (Poison/Fire) super-effectively" },},
    {
      gym: "Lush Jungle Trial",
      leader: "Mallow",
      badge: "Grassium Z",
      specialty: "Grass",
      team: [
        {
          species: "Totem Lurantis",
          id: 754,
          level: 24,
          moves: ["Solar Blade", "X-Scissor", "Razor Leaf", "Synthesis"],
          ability: "Leaf Guard",
          item: "Power Herb",
        },
      ],
      note: "Speed +2 aura; calls Trumbeak or Castform as allies.",
    
      counterPick: { species: "Salandit", id: 757, location: "Wela Volcano Park", why: "Fire-type Incinerate hits Totem Lurantis (Grass) super-effectively" },},
    {
      gym: "Akala Grand Trial",
      leader: "Olivia",
      badge: "Rockium Z",
      specialty: "Rock",
      team: [
        { species: "Nosepass", id: 299, level: 26, moves: ["Spark", "Thunder Wave", "Rock Slide"] },
        { species: "Boldore", id: 525, level: 26, moves: ["Rock Blast", "Mud-Slap", "Headbutt"], ability: "Sturdy" },
        {
          species: "Lycanroc (Midnight)",
          id: 745,
          level: 27,
          moves: ["Bite", "Rock Throw"],
          item: "Rockium Z",
          sprite: showdownSprite("lycanroc-midnight"),
        },
      ],
    
      counterPick: { species: "Wishiwashi", id: 746, location: "Melemele Sea (fishing)", why: "Water-type Water Gun/Brine hits Olivia's Rock-types super-effectively" },},
    {
      gym: "Hokulani Observatory Trial",
      leader: "Sophocles",
      badge: "Electrium Z",
      specialty: "Electric",
      team: [
        {
          species: "Totem Vikavolt",
          id: 738,
          level: 29,
          moves: ["Charge", "Bug Bite", "Vice Grip", "Spark"],
          ability: "Levitate",
          item: "Occa Berry",
        },
      ],
      note: "All stats +1 aura; calls Charjabug as allies.",
    
      counterPick: { species: "Lycanroc", id: 745, location: "Route 1 (as Rockruff)", why: "Rock-type Rock Throw hits Totem Vikavolt (Bug/Electric) super-effectively" },},
    {
      gym: "Thrifty Megamart Trial",
      leader: "Acerola",
      badge: "Ghostium Z",
      specialty: "Ghost",
      team: [
        {
          species: "Totem Mimikyu",
          id: 778,
          level: 33,
          moves: ["Mimic", "Shadow Claw", "Play Rough", "Astonish"],
          ability: "Disguise",
          item: "Lum Berry",
        },
      ],
      note: "All stats +1 aura; calls Haunter or Gengar as allies.",
    
      counterPick: { species: "Gastly", id: 92, location: "Hau'oli Cemetery", why: "Ghost-type Astonish/Night Shade hits Totem Mimikyu (Ghost/Fairy) super-effectively" },},
    {
      gym: "Ula'ula Grand Trial",
      leader: "Nanu",
      badge: "Darkinium Z",
      specialty: "Dark",
      team: [
        { species: "Sableye", id: 302, level: 38, moves: ["Power Gem", "Shadow Ball", "Fake Out"], ability: "Keen Eye" },
        { species: "Krokorok", id: 552, level: 38, moves: ["Crunch", "Assurance", "Swagger", "Earthquake"], ability: "Intimidate" },
        {
          species: "Alolan Persian",
          id: 53,
          level: 39,
          moves: ["Power Gem", "Fake Out", "Dark Pulse"],
          ability: "Fur Coat",
          item: "Darkinium Z",
          sprite: showdownSprite("persian-alola"),
        },
      ],
    
      counterPick: { species: "Crabrawler", id: 739, location: "Route 10", why: "Fighting-type Brick Break hits Nanu's Dark-types super-effectively" },},
    {
      gym: "Poni Grand Trial",
      leader: "Hapu",
      badge: "Groundium Z",
      specialty: "Ground",
      team: [
        {
          species: "Alolan Dugtrio",
          id: 51,
          level: 47,
          moves: ["Iron Head", "Earthquake", "Sucker Punch", "Sandstorm"],
          sprite: showdownSprite("dugtrio-alola"),
        },
        { species: "Gastrodon", id: 423, level: 47, moves: ["Muddy Water", "Mud Bomb", "Recover"] },
        { species: "Flygon", id: 330, level: 47, moves: ["Earth Power", "Dragon Breath"] },
        { species: "Mudsdale", id: 750, level: 48, moves: ["Heavy Slam", "Earthquake", "Double Kick", "Counter"], ability: "Stamina", item: "Groundium Z" },
      ],
    
      counterPick: { species: "Sandslash (Alolan)", id: 28, location: "Mount Lanakila (as Alolan Sandshrew)", why: "Ice-type Ice Shard/Powder Snow hits Hapu's Ground-types super-effectively" },},
  ],
  "Pokémon Ultra Sun & Ultra Moon": [
    {
      gym: "Verdant Cavern Trial",
      leader: "Ilima",
      badge: "Normalium Z",
      specialty: "Normal",
      team: [
        {
          species: "Totem Gumshoos",
          id: 735,
          level: 12,
          moves: ["Bite", "Tackle", "Scary Face", "Super Fang"],
          ability: "Adaptability",
          item: "Pecha Berry",
        },
      ],
      note: "Ultra Sun: Totem Gumshoos as listed. Ultra Moon: Totem Alolan Raticate 12 (Gluttony, Pecha Berry) [Bite, Super Fang, Scary Face, Fury Swipes]. Defense +1 aura; calls Yungoos (Sun) or Alolan Rattata (Moon) as allies.",
    
      counterPick: { species: "Makuhita", id: 296, location: "Route 2", why: "Fighting-type Arm Thrust hits Totem Raticate-Alola (Dark/Normal) super-effectively on both types" },},
    {
      gym: "Melemele Grand Trial",
      leader: "Hala",
      badge: "Fightinium Z",
      specialty: "Fighting",
      team: [
        { species: "Machop", id: 66, level: 15, moves: ["Karate Chop", "Revenge", "Focus Energy"], ability: "Guts" },
        { species: "Makuhita", id: 296, level: 15, moves: ["Arm Thrust", "Sand Attack", "Fake Out"], ability: "Thick Fat" },
        { species: "Crabrawler", id: 739, level: 16, moves: ["Pursuit", "Power-Up Punch", "Leer"], ability: "Iron Fist", item: "Fightinium Z" },
      ],
    
      counterPick: { species: "Oricorio", id: 741, location: "Melemele Meadow", why: "Flying-type Air Cutter/Peck hits Hala's Fighting-types super-effectively" },},
    {
      gym: "Brooklet Hill Trial",
      leader: "Lana",
      badge: "Waterium Z",
      specialty: "Water",
      team: [
        {
          species: "Totem Araquanid",
          id: 752,
          level: 20,
          moves: ["Bubble Beam", "Aurora Beam"],
          ability: "Water Bubble",
          item: "Wacan Berry",
        },
      ],
      note: "Speed +1 aura; calls Masquerain or Dewpider as allies.",
    
      counterPick: { species: "Charjabug", id: 737, location: "Route 1 (as Grubbin)", why: "Electric-type Spark hits Totem Araquanid (Water/Bug) super-effectively" },},
    {
      gym: "Wela Volcano Park Trial",
      leader: "Kiawe",
      badge: "Firium Z",
      specialty: "Fire",
      team: [
        {
          species: "Totem Alolan Marowak",
          id: 105,
          level: 22,
          moves: ["Hex", "Flame Wheel", "Brick Break", "Detect"],
          ability: "Rock Head",
          item: "Thick Club",
          sprite: showdownSprite("marowak-alola"),
        },
      ],
      note: "Speed +2 aura; calls Salazzle as allies.",
    
      counterPick: { species: "Rockruff", id: 744, location: "Route 1", why: "Rock-type Rock Throw hits Totem Salazzle (Poison/Fire) super-effectively" },},
    {
      gym: "Lush Jungle Trial",
      leader: "Mallow",
      badge: "Grassium Z",
      specialty: "Grass",
      team: [
        {
          species: "Totem Lurantis",
          id: 754,
          level: 24,
          moves: ["Solar Blade", "Low Sweep", "Synthesis"],
          ability: "Leaf Guard",
          item: "Power Herb",
        },
      ],
      note: "Calls Kecleon or Comfey as allies.",
    
      counterPick: { species: "Salandit", id: 757, location: "Wela Volcano Park", why: "Fire-type Incinerate hits Totem Lurantis (Grass) super-effectively" },},
    {
      gym: "Akala Grand Trial",
      leader: "Olivia",
      badge: "Rockium Z",
      specialty: "Rock",
      team: [
        { species: "Anorith", id: 347, level: 27, moves: ["Bug Bite", "Smack Down", "Metal Claw"], ability: "Battle Armor" },
        { species: "Lileep", id: 345, level: 27, moves: ["Giga Drain", "Ancient Power", "Brine"], ability: "Suction Cups" },
        {
          species: "Lycanroc (Midnight)",
          id: 745,
          level: 28,
          moves: ["Bite", "Rock Throw"],
          ability: "Vital Spirit",
          item: "Rockium Z",
          sprite: showdownSprite("lycanroc-midnight"),
        },
      ],
    
      counterPick: { species: "Wishiwashi", id: 746, location: "Melemele Sea (fishing)", why: "Water-type Water Gun/Brine hits Olivia's Rock-types super-effectively" },},
    {
      gym: "Hokulani Observatory Trial",
      leader: "Sophocles",
      badge: "Electrium Z",
      specialty: "Electric",
      team: [
        {
          species: "Totem Togedemaru",
          id: 777,
          level: 33,
          moves: ["Zing Zap", "Iron Head", "Spiky Shield", "Bounce"],
          ability: "Sturdy",
          item: "Sitrus Berry",
        },
      ],
      note: "Defense +2 aura; calls Skarmory or Dedenne as allies.",
    
      counterPick: { species: "Lycanroc", id: 745, location: "Route 1 (as Rockruff)", why: "Rock-type Rock Throw hits Totem Vikavolt (Bug/Electric) super-effectively" },},
    {
      gym: "Thrifty Megamart Trial",
      leader: "Acerola",
      badge: "Ghostium Z",
      specialty: "Ghost",
      team: [
        {
          species: "Totem Mimikyu",
          id: 778,
          level: 35,
          moves: ["Leech Life", "Shadow Claw", "Play Rough", "Slash"],
          ability: "Disguise",
          item: "Lum Berry",
        },
      ],
      note: "All stats +1 aura; calls Banette or Jellicent as allies.",
    
      counterPick: { species: "Gastly", id: 92, location: "Hau'oli Cemetery", why: "Ghost-type Astonish/Night Shade hits Totem Mimikyu (Ghost/Fairy) super-effectively" },},
    {
      gym: "Ula'ula Grand Trial",
      leader: "Nanu",
      badge: "Darkinium Z",
      specialty: "Dark",
      team: [
        { species: "Sableye", id: 302, level: 43, moves: ["Fake Out", "Shadow Ball", "Power Gem"] },
        { species: "Krokorok", id: 552, level: 43, moves: ["Earthquake", "Crunch", "Swagger"], ability: "Intimidate" },
        {
          species: "Alolan Persian",
          id: 53,
          level: 44,
          moves: ["Fake Out", "Power Gem", "Dark Pulse"],
          ability: "Fur Coat",
          item: "Darkinium Z",
          sprite: showdownSprite("persian-alola"),
        },
      ],
    
      counterPick: { species: "Crabrawler", id: 739, location: "Route 10", why: "Fighting-type Brick Break hits Nanu's Dark-types super-effectively" },},
    {
      gym: "Vast Poni Canyon Trial",
      leader: "Totem Kommo-o",
      badge: "—",
      specialty: "Dragon",
      team: [
        {
          species: "Totem Kommo-o",
          id: 784,
          level: 49,
          moves: ["Dragon Claw", "Drain Punch", "Thunder Punch", "Poison Jab"],
          ability: "Overcoat",
          item: "Roseli Berry",
        },
      ],
      note: "No trial captain and no Z-Crystal for this trial; calls Scizor or Noivern as allies.",
    
      counterPick: { species: "Mimikyu", id: 778, location: "Thrifty Megamart", why: "Ghost/Fairy: Play Rough hits Totem Kommo-o (Dragon/Fighting) super-effectively; immune to Dragon and Fighting" },},
    {
      gym: "Poni Grand Trial",
      leader: "Hapu",
      badge: "Groundium Z",
      specialty: "Ground",
      team: [
        { species: "Golurk", id: 623, level: 53, moves: ["Earthquake", "Shadow Punch", "Hammer Arm", "Stealth Rock"] },
        { species: "Gastrodon", id: 423, level: 53, moves: ["Muddy Water", "Mud Bomb", "Recover"] },
        { species: "Flygon", id: 330, level: 53, moves: ["Earth Power", "Dragon Breath"] },
        { species: "Mudsdale", id: 750, level: 54, moves: ["Earthquake", "Heavy Slam", "Double Kick", "Payback"], item: "Groundium Z" },
      ],
    
      counterPick: { species: "Sandslash (Alolan)", id: 28, location: "Mount Lanakila (as Alolan Sandshrew)", why: "Ice-type Ice Shard/Powder Snow hits Hapu's Ground-types super-effectively" },},
  ],
  "Pokémon X & Y": [
    {
      gym: "Santalune Gym",
      leader: "Viola",
      badge: "Bug Badge",
      specialty: "Bug",
      team: [
        { species: "Surskit", id: 283, level: 10, moves: ["Bubble", "Water Sport", "Quick Attack"], ability: "Swift Swim" },
        { species: "Vivillon", id: 666, level: 12, moves: ["Tackle", "Harden", "Infestation"], ability: "Compound Eyes" },
      ],
    
      counterPick: { species: "Fletchling", id: 661, location: "Route 2", why: "Flying-type Peck/Gust shreds Viola's Bug team" },},
    {
      gym: "Cyllage Gym",
      leader: "Grant",
      badge: "Cliff Badge",
      specialty: "Rock",
      team: [
        { species: "Amaura", id: 698, level: 25, moves: ["Thunder Wave", "Aurora Beam", "Rock Tomb"] },
        { species: "Tyrunt", id: 696, level: 25, moves: ["Stomp", "Rock Tomb"] },
      ],
    
      counterPick: { species: "Pancham", id: 674, location: "Route 5", why: "Fighting-type Karate Chop hits Grant's Rock-types super-effectively" },},
    {
      gym: "Shalour Gym",
      leader: "Korrina",
      badge: "Rumble Badge",
      specialty: "Fighting",
      team: [
        { species: "Machoke", id: 67, level: 28, moves: ["Power-Up Punch", "Leer", "Rock Tomb"], ability: "Guts" },
        { species: "Mienfoo", id: 619, level: 29, moves: ["Double Slap", "Power-Up Punch", "Fake Out"], ability: "Inner Focus" },
        { species: "Hawlucha", id: 701, level: 32, moves: ["Hone Claws", "Flying Press", "Power-Up Punch"], ability: "Unburden" },
        { species: "Lucario", id: 448, level: 32, moves: ["Power-Up Punch", "Swords Dance", "Bone Rush", "Metal Sound"], item: "Lucarionite" },
      ],
      note: "Lucario Mega Evolves.",
    
      counterPick: { species: "Espurr", id: 677, location: "Route 6", why: "Psychic-type Psybeam hits Korrina's Fighting-types super-effectively" },},
    {
      gym: "Coumarine Gym",
      leader: "Ramos",
      badge: "Plant Badge",
      specialty: "Grass",
      team: [
        { species: "Jumpluff", id: 189, level: 30, moves: ["Grass Knot", "Leech Seed", "Acrobatics"], ability: "Chlorophyll" },
        { species: "Weepinbell", id: 70, level: 31, moves: ["Acid", "Grass Knot", "Gastro Acid", "Poison Powder"], ability: "Chlorophyll" },
        { species: "Gogoat", id: 673, level: 34, moves: ["Take Down", "Bulldoze", "Grass Knot"], ability: "Sap Sipper" },
      ],
    
      counterPick: { species: "Litleo", id: 667, location: "Route 22", why: "Fire-type Ember/Incinerate shreds Ramos's Grass team" },},
    {
      gym: "Lumiose Gym",
      leader: "Clemont",
      badge: "Voltage Badge",
      specialty: "Electric",
      team: [
        { species: "Emolga", id: 587, level: 35, moves: ["Volt Switch", "Aerial Ace", "Quick Attack"], ability: "Static" },
        { species: "Magneton", id: 82, level: 35, moves: ["Electric Terrain", "Thunderbolt", "Mirror Shot"], ability: "Sturdy" },
        { species: "Heliolisk", id: 695, level: 37, moves: ["Quick Attack", "Grass Knot", "Thunderbolt"], ability: "Dry Skin" },
      ],
    
      counterPick: { species: "Diggersby", id: 660, location: "Route 2 (as Bunnelby)", why: "Ground-type immune to Electric; Bulldoze/Mud Shot hits Clemont's team super-effectively" },},
    {
      gym: "Laverre Gym",
      leader: "Valerie",
      badge: "Fairy Badge",
      specialty: "Fairy",
      team: [
        { species: "Mawile", id: 303, level: 38, moves: ["Iron Defense", "Feint Attack", "Crunch"], ability: "Hyper Cutter" },
        { species: "Mr. Mime", id: 122, level: 38, moves: ["Psychic", "Light Screen", "Reflect", "Dazzling Gleam"], ability: "Soundproof" },
        { species: "Sylveon", id: 700, level: 42, moves: ["Charm", "Swift", "Quick Attack", "Dazzling Gleam"], ability: "Cute Charm" },
      ],
    
      counterPick: { species: "Honedge", id: 679, location: "Route 6", why: "Steel-type Flash Cannon/Iron Head hits Valerie's Fairy-types super-effectively" },},
    {
      gym: "Anistar Gym",
      leader: "Olympia",
      badge: "Psychic Badge",
      specialty: "Psychic",
      team: [
        { species: "Sigilyph", id: 561, level: 44, moves: ["Light Screen", "Psychic", "Reflect", "Air Slash"], ability: "Magic Guard" },
        { species: "Slowking", id: 199, level: 45, moves: ["Calm Mind", "Yawn", "Psychic", "Power Gem"], ability: "Oblivious" },
        { species: "Meowstic", id: 678, level: 48, moves: ["Fake Out", "Shadow Ball", "Calm Mind", "Psychic"], ability: "Infiltrator" },
      ],
      note: "Meowstic is female (Infiltrator).",
    
      counterPick: { species: "Pangoro", id: 675, location: "Route 5 (as Pancham)", why: "Dark-type Crunch/Night Slash hits Olympia's Psychic-types super-effectively" },},
    {
      gym: "Snowbelle Gym",
      leader: "Wulfric",
      badge: "Iceberg Badge",
      specialty: "Ice",
      team: [
        { species: "Abomasnow", id: 460, level: 56, moves: ["Ice Shard", "Ice Beam", "Energy Ball"], ability: "Snow Warning" },
        { species: "Cryogonal", id: 615, level: 55, moves: ["Ice Beam", "Confuse Ray", "Flash Cannon", "Hail"], ability: "Levitate" },
        { species: "Avalugg", id: 713, level: 59, moves: ["Avalanche", "Crunch", "Curse", "Gyro Ball"], ability: "Ice Body" },
      ],
    
      counterPick: { species: "Hawlucha", id: 701, location: "Route 10", why: "Fighting-type Karate Chop/Brick Break hits Wulfric's Ice-types super-effectively" },},
  ],
  "Pokémon Omega Ruby & Alpha Sapphire": [
    {
      gym: "Rustboro Gym",
      leader: "Roxanne",
      badge: "Stone Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 12, moves: ["Tackle", "Defense Curl", "Rock Tomb"], ability: "Sturdy" },
        { species: "Nosepass", id: 299, level: 14, moves: ["Tackle", "Harden", "Rock Tomb"], ability: "Magnet Pull" },
      ],
    
      counterPick: { species: "Mudkip", id: 258, location: "Starter choice in Littleroot Town", why: "Water hits Rock super-effectively and resists Rock; Mudkip's line solos Roxanne." },},
    {
      gym: "Dewford Gym",
      leader: "Brawly",
      badge: "Knuckle Badge",
      specialty: "Fighting",
      team: [
        { species: "Machop", id: 66, level: 14, moves: ["Leer", "Karate Chop", "Seismic Toss", "Bulk Up"], ability: "Guts" },
        { species: "Makuhita", id: 296, level: 16, moves: ["Arm Thrust", "Knock Off", "Sand Attack", "Bulk Up"], ability: "Guts" },
      ],
    
      counterPick: { species: "Taillow", id: 276, location: "Route 104 (before taking the boat to Dewford)", why: "Flying hits Fighting super-effectively; Taillow outspeeds Brawly's Machop/Makuhita." },},
    {
      gym: "Mauville Gym",
      leader: "Wattson",
      badge: "Dynamo Badge",
      specialty: "Electric",
      team: [
        { species: "Magnemite", id: 81, level: 19, moves: ["Thunder Wave", "Tackle", "Volt Switch"], ability: "Sturdy" },
        { species: "Voltorb", id: 100, level: 19, moves: ["Rollout", "Charge", "Volt Switch"], ability: "Soundproof" },
        { species: "Magneton", id: 82, level: 21, moves: ["Supersonic", "Magnet Bomb", "Volt Switch"], ability: "Magnet Pull" },
      ],
    
      counterPick: { species: "Geodude", id: 74, location: "Granite Cave (Dewford)", why: "Ground hits Electric super-effectively and Geodude is immune to Electric moves; walls Wattson." },},
    {
      gym: "Lavaridge Gym",
      leader: "Flannery",
      badge: "Heat Badge",
      specialty: "Fire",
      team: [
        { species: "Slugma", id: 218, level: 26, moves: ["Overheat", "Rock Throw", "Light Screen", "Sunny Day"], ability: "Flame Body" },
        { species: "Numel", id: 322, level: 26, moves: ["Earth Power", "Lava Plume", "Amnesia", "Sunny Day"], ability: "Simple" },
        { species: "Torkoal", id: 324, level: 28, moves: ["Overheat", "Body Slam", "Curse", "Sunny Day"], ability: "White Smoke" },
      ],
    
      counterPick: { species: "Numel", id: 322, location: "Route 112 (by the cable car to Mt. Chimney)", why: "Ground hits Fire super-effectively and resists Fire; Numel/Camerupt handles Flannery's team." },},
    {
      gym: "Petalburg Gym",
      leader: "Norman",
      badge: "Balance Badge",
      specialty: "Normal",
      team: [
        { species: "Slaking", id: 289, level: 28, moves: ["Encore", "Retaliate", "Yawn", "Feint Attack"], ability: "Truant" },
        { species: "Vigoroth", id: 288, level: 28, moves: ["Fury Swipes", "Feint Attack", "Retaliate", "Encore"], ability: "Vital Spirit" },
        { species: "Slaking", id: 289, level: 30, moves: ["Chip Away", "Swagger", "Retaliate", "Feint Attack"], ability: "Truant" },
      ],
    
      counterPick: { species: "Makuhita", id: 296, location: "Route 112", why: "Fighting hits Normal super-effectively; Makuhita's Fighting STAB breaks through Norman's Slaking line." },},
    {
      gym: "Fortree Gym",
      leader: "Winona",
      badge: "Feather Badge",
      specialty: "Flying",
      team: [
        { species: "Swellow", id: 277, level: 33, moves: ["Quick Attack", "Aerial Ace", "Double Team", "Endeavor"], ability: "Guts" },
        { species: "Pelipper", id: 279, level: 33, moves: ["Water Pulse", "Roost", "Protect", "Aerial Ace"], ability: "Keen Eye" },
        { species: "Skarmory", id: 227, level: 33, moves: ["Sand Attack", "Air Cutter", "Steel Wing", "Aerial Ace"], ability: "Keen Eye" },
        { species: "Altaria", id: 334, level: 35, moves: ["Earthquake", "Dragon Breath", "Cotton Guard", "Roost"], ability: "Natural Cure" },
      ],
    
      counterPick: { species: "Electrike", id: 309, location: "Route 110", why: "Electric hits Flying super-effectively across Winona's whole team." },},
    {
      gym: "Mossdeep Gym",
      leader: "Tate and Liza",
      badge: "Mind Badge",
      specialty: "Psychic",
      team: [
        { species: "Lunatone", id: 337, level: 45, moves: ["Light Screen", "Psychic", "Hypnosis", "Calm Mind"], ability: "Levitate" },
        { species: "Solrock", id: 338, level: 45, moves: ["Sunny Day", "Rock Slide", "Psychic", "Solar Beam"], ability: "Levitate" },
      ],
      note: "Double battle.",
    
      counterPick: { species: "Mightyena", id: 262, location: "Route 102 (as Poochyena)", why: "Dark hits Psychic super-effectively; Bite/Crunch from Mightyena beats Tate & Liza's Solrock and Lunatone." },},
    {
      gym: "Sootopolis Gym",
      leader: "Wallace",
      badge: "Rain Badge",
      specialty: "Water",
      team: [
        { species: "Luvdisc", id: 370, level: 44, moves: ["Water Pulse", "Attract", "Sweet Kiss", "Draining Kiss"], ability: "Swift Swim" },
        { species: "Whiscash", id: 340, level: 44, moves: ["Mud Sport", "Waterfall", "Zen Headbutt", "Earthquake"], ability: "Oblivious" },
        { species: "Sealeo", id: 364, level: 44, moves: ["Encore", "Body Slam", "Aurora Beam", "Waterfall"], ability: "Thick Fat" },
        { species: "Seaking", id: 119, level: 44, moves: ["Aqua Ring", "Rain Dance", "Waterfall", "Horn Drill"], ability: "Swift Swim" },
        { species: "Milotic", id: 350, level: 46, moves: ["Hydro Pump", "Disarming Voice", "Recover", "Ice Beam"], ability: "Marvel Scale" },
      ],
    
      counterPick: { species: "Tropius", id: 357, location: "Route 119", why: "Grass hits Water super-effectively and resists Water; covers Juan's Water team (Wallace is champion in ORAS)." },},
  ],
  "Pokémon Black & White": [
    {
      gym: "Striaton Gym",
      leader: "Chili / Cilan / Cress",
      badge: "Trio Badge",
      specialty: "Fire / Grass / Water",
      team: [
        { species: "Lillipup", id: 506, level: 12, moves: ["Bite", "Work Up"] },
        { species: "Pansear", id: 513, level: 14, moves: ["Incinerate", "Work Up"] },
      ],
      note: "The leader depends on your starter: Chili (Pansear, Fire) if you picked Snivy, Cilan (Pansage 14, Grass) if you picked Tepig, Cress (Panpour 14, Water) if you picked Oshawott.",
    
      counterPick: { species: "Pansear", id: 513, location: "Dreamyard (gift)", why: "Given in the Dreamyard — whichever monkey you receive (Pansear vs Cilan, Panpour vs Chili, Pansage vs Cress) is super-effective against the leader your starter is weak to" },},
    {
      gym: "Nacrene Gym",
      leader: "Lenora",
      badge: "Basic Badge",
      specialty: "Normal",
      team: [
        { species: "Herdier", id: 507, level: 18, moves: ["Take Down", "Bite", "Retaliate", "Leer"] },
        { species: "Watchog", id: 505, level: 20, moves: ["Leer", "Crunch", "Retaliate", "Hypnosis"] },
      ],
    
      counterPick: { species: "Timburr", id: 532, location: "Pinwheel Forest", why: "Fighting-type Low Kick/Karate Chop hits Lenora's Normal-types super-effectively" },},
    {
      gym: "Castelia Gym",
      leader: "Burgh",
      badge: "Insect Badge",
      specialty: "Bug",
      team: [
        { species: "Whirlipede", id: 544, level: 21, moves: ["Poison Tail", "Struggle Bug", "Pursuit", "Screech"] },
        { species: "Dwebble", id: 557, level: 21, moves: ["Smack Down", "Struggle Bug", "Faint Attack", "Sand-Attack"] },
        { species: "Leavanny", id: 542, level: 23, moves: ["Razor Leaf", "Struggle Bug", "String Shot", "Protect"] },
      ],
    
      counterPick: { species: "Darumaka", id: 554, location: "Route 4", why: "Fire-type Fire Punch/Incinerate shreds Burgh's Bug team" },},
    {
      gym: "Nimbasa Gym",
      leader: "Elesa",
      badge: "Bolt Badge",
      specialty: "Electric",
      team: [
        { species: "Emolga", id: 587, level: 25, moves: ["Pursuit", "Quick Attack", "Volt Switch", "Aerial Ace"] },
        { species: "Emolga", id: 587, level: 25, moves: ["Pursuit", "Quick Attack", "Volt Switch", "Aerial Ace"] },
        { species: "Zebstrika", id: 523, level: 27, moves: ["Quick Attack", "Spark", "Volt Switch", "Flame Charge"] },
      ],
    
      counterPick: { species: "Drilbur", id: 529, location: "Wellspring Cave", why: "Ground-type immune to Electric and hits Elesa's team super-effectively with Dig" },},
    {
      gym: "Driftveil Gym",
      leader: "Clay",
      badge: "Quake Badge",
      specialty: "Ground",
      team: [
        { species: "Krokorok", id: 552, level: 29, moves: ["Crunch", "Swagger", "Bulldoze", "Torment"] },
        { species: "Palpitoad", id: 536, level: 29, moves: ["Muddy Water", "Aqua Ring", "Bulldoze", "Bubble Beam"] },
        { species: "Excadrill", id: 530, level: 31, moves: ["Slash", "Rock Slide", "Bulldoze", "Hone Claws"] },
      ],
    
      counterPick: { species: "Ducklett", id: 580, location: "Route 6", why: "Water/Flying: Water Gun/Bubble Beam hits Clay's Ground-types super-effectively and it's immune to Ground" },},
    {
      gym: "Mistralton Gym",
      leader: "Skyla",
      badge: "Jet Badge",
      specialty: "Flying",
      team: [
        { species: "Swoobat", id: 528, level: 33, moves: ["Heart Stamp", "Amnesia", "Acrobatics", "Assurance"] },
        { species: "Unfezant", id: 521, level: 33, moves: ["Quick Attack", "Air Slash", "Leer", "Razor Wind"] },
        { species: "Swanna", id: 581, level: 35, moves: ["Aqua Ring", "Aerial Ace", "Air Slash", "Bubble Beam"] },
      ],
    
      counterPick: { species: "Joltik", id: 595, location: "Chargestone Cave", why: "Electric-type Electroweb/Thunder Wave hits Skyla's Flying-types super-effectively and resists Flying" },},
    {
      gym: "Icirrus Gym",
      leader: "Brycen",
      badge: "Freeze Badge",
      specialty: "Ice",
      team: [
        { species: "Vanillish", id: 583, level: 37, moves: ["Mirror Shot", "Acid Armor", "Frost Breath", "Astonish"] },
        { species: "Cryogonal", id: 615, level: 37, moves: ["Reflect", "Aurora Beam", "Frost Breath", "Rapid Spin"] },
        { species: "Beartic", id: 614, level: 39, moves: ["Slash", "Brine", "Icicle Crash", "Swagger"] },
      ],
    
      counterPick: { species: "Sawk", id: 539, location: "Pinwheel Forest", why: "Fighting-type Brick Break hits Brycen's Ice-types super-effectively (Throh in White Version)" },},
    {
      gym: "Opelucid Gym",
      leader: "Drayden / Iris",
      badge: "Legend Badge",
      specialty: "Dragon",
      team: [
        { species: "Fraxure", id: 611, level: 41, moves: ["Dragon Dance", "Dragon Rage", "Dragon Tail", "Assurance"] },
        { species: "Druddigon", id: 621, level: 41, moves: ["Chip Away", "Revenge", "Dragon Tail", "Night Slash"] },
        { species: "Haxorus", id: 612, level: 43, moves: ["Dragon Dance", "Slash", "Dragon Tail", "Assurance"] },
      ],
      note: "Black: Drayden. White: Iris. Same team in both versions.",
    
      counterPick: { species: "Cryogonal", id: 615, location: "Twist Mountain", why: "Ice-type Ice Beam shreds Drayden/Iris's Dragon-types super-effectively" },},
  ],
  "Pokémon Black 2 & White 2": [
    {
      gym: "Aspertia Gym",
      leader: "Cheren",
      badge: "Basic Badge",
      specialty: "Normal",
      team: [
        { species: "Patrat", id: 504, level: 11, moves: ["Work Up", "Bite", "Tackle"] },
        { species: "Lillipup", id: 506, level: 13, moves: ["Work Up", "Bite", "Tackle"] },
      ],
    
      counterPick: { species: "Riolu", id: 447, location: "Floccesy Ranch", why: "Fighting-type Force Palm hits Cheren's Normal-types super-effectively" },},
    {
      gym: "Virbank Gym",
      leader: "Roxie",
      badge: "Toxic Badge",
      specialty: "Poison",
      team: [
        { species: "Koffing", id: 109, level: 16, moves: ["Smog", "Assurance", "Tackle"] },
        { species: "Whirlipede", id: 544, level: 18, moves: ["Venoshock", "Poison Sting", "Protect", "Pursuit"] },
      ],
    
      counterPick: { species: "Sandile", id: 551, location: "Route 4", why: "Ground-type Bulldoze hits Roxie's Poison-types super-effectively" },},
    {
      gym: "Castelia Gym",
      leader: "Burgh",
      badge: "Insect Badge",
      specialty: "Bug",
      team: [
        { species: "Swadloon", id: 541, level: 22, moves: ["Struggle Bug", "Razor Leaf", "String Shot"] },
        { species: "Dwebble", id: 557, level: 22, moves: ["Struggle Bug", "Smack Down", "Faint Attack", "Rock Polish"] },
        { species: "Leavanny", id: 542, level: 24, moves: ["Struggle Bug", "Razor Leaf", "Cut", "String Shot"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Darumaka", id: 554, location: "Route 4", why: "Fire-type Fire Punch/Incinerate shreds Burgh's Bug team" },},
    {
      gym: "Nimbasa Gym",
      leader: "Elesa",
      badge: "Bolt Badge",
      specialty: "Electric",
      team: [
        { species: "Emolga", id: 587, level: 28, moves: ["Volt Switch", "Quick Attack", "Pursuit"] },
        { species: "Flaaffy", id: 180, level: 28, moves: ["Volt Switch", "Take Down", "Thunder Wave"] },
        { species: "Zebstrika", id: 523, level: 30, moves: ["Volt Switch", "Flame Charge", "Quick Attack", "Pursuit"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Drilbur", id: 529, location: "Route 4 / Desert Resort", why: "Ground-type immune to Electric and hits Elesa's team super-effectively with Dig" },},
    {
      gym: "Driftveil Gym",
      leader: "Clay",
      badge: "Quake Badge",
      specialty: "Ground",
      team: [
        { species: "Krokorok", id: 552, level: 31, moves: ["Bulldoze", "Crunch", "Sand Tomb", "Torment"] },
        { species: "Sandslash", id: 28, level: 31, moves: ["Bulldoze", "Crush Claw", "Rollout", "Fury Cutter"] },
        { species: "Excadrill", id: 530, level: 33, moves: ["Bulldoze", "Metal Claw", "Slash", "Rock Slide"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Ducklett", id: 580, location: "Route 6", why: "Water/Flying: Bubble Beam hits Clay's Ground-types super-effectively and it's immune to Ground" },},
    {
      gym: "Mistralton Gym",
      leader: "Skyla",
      badge: "Jet Badge",
      specialty: "Flying",
      team: [
        { species: "Swoobat", id: 528, level: 37, moves: ["Acrobatics", "Heart Stamp", "Assurance", "Attract"] },
        { species: "Skarmory", id: 227, level: 37, moves: ["Air Cutter", "Steel Wing", "Fury Attack", "Agility"] },
        { species: "Swanna", id: 581, level: 39, moves: ["Air Slash", "Bubble Beam", "Roost", "Feather Dance"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Joltik", id: 595, location: "Chargestone Cave", why: "Electric-type Electroweb/Thunder Wave hits Skyla's Flying-types super-effectively and resists Flying" },},
    {
      gym: "Opelucid Gym",
      leader: "Drayden",
      badge: "Legend Badge",
      specialty: "Dragon",
      team: [
        { species: "Druddigon", id: 621, level: 46, moves: ["Dragon Tail", "Revenge", "Slash", "Crunch"] },
        { species: "Flygon", id: 330, level: 46, moves: ["Dragon Tail", "Crunch", "Earth Power", "Rock Slide"] },
        { species: "Haxorus", id: 612, level: 48, moves: ["Dragon Tail", "Slash", "Assurance", "Dragon Dance"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Cryogonal", id: 615, location: "Twist Mountain", why: "Ice-type Ice Beam shreds Drayden's Dragon-types super-effectively" },},
    {
      gym: "Humilau Gym",
      leader: "Marlon",
      badge: "Wave Badge",
      specialty: "Water",
      team: [
        { species: "Carracosta", id: 565, level: 49, moves: ["Scald", "Smack Down", "Crunch", "Shell Smash"] },
        { species: "Wailord", id: 321, level: 49, moves: ["Scald", "Rollout", "Bounce", "Amnesia"] },
        { species: "Jellicent", id: 593, level: 51, moves: ["Scald", "Ominous Wind", "Brine", "Recover"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Zebstrika", id: 523, location: "Route 3 (as Blitzle)", why: "Electric-type Discharge hits Marlon's Water-types super-effectively" },},
  ],
  "Pokémon Diamond & Pearl": [
    {
      gym: "Oreburgh Gym",
      leader: "Roark",
      badge: "Coal Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 12, moves: ["Rock Throw", "Stealth Rock"] },
        { species: "Onix", id: 95, level: 12, moves: ["Rock Throw", "Screech", "Stealth Rock"] },
        { species: "Cranidos", id: 408, level: 14, moves: ["Headbutt", "Pursuit", "Leer"] },
      ],
    
      counterPick: { species: "Chimchar", id: 390, location: "Starter choice in Twinleaf Town", why: "Fighting (as Monferno/Infernape) hits Rock super-effectively and resists Rock; Fire also covers." },},
    {
      gym: "Eterna Gym",
      leader: "Gardenia",
      badge: "Forest Badge",
      specialty: "Grass",
      team: [
        { species: "Cherubi", id: 420, level: 19, moves: ["Grass Knot", "Leech Seed", "Safeguard", "Growth"] },
        { species: "Turtwig", id: 387, level: 19, moves: ["Grass Knot", "Razor Leaf", "Withdraw", "Reflect"] },
        { species: "Roserade", id: 407, level: 22, moves: ["Grass Knot", "Magical Leaf", "Poison Sting", "Stun Spore"] },
      ],
    
      counterPick: { species: "Ponyta", id: 77, location: "Route 206", why: "Fire hits Grass super-effectively; Ponyta/Rapidash burns through Gardenia's Turtwig, Cherrim and Roserade." },},
    {
      gym: "Veilstone Gym",
      leader: "Maylene",
      badge: "Cobble Badge",
      specialty: "Fighting",
      team: [
        { species: "Meditite", id: 307, level: 27, moves: ["Drain Punch", "Confusion", "Detect", "Meditate"] },
        { species: "Machoke", id: 67, level: 27, moves: ["Brick Break", "Leer", "Foresight", "Rock Tomb"] },
        { species: "Lucario", id: 448, level: 30, moves: ["Drain Punch", "Metal Claw", "Bone Rush", "Force Palm"] },
      ],
    
      counterPick: { species: "Staravia", id: 397, location: "Route 209 (or raise a Starly from Route 201)", why: "Flying hits Fighting super-effectively; Staravia's Wing Attack/Aerial Ace beats Maylene's Meditite and Machoke." },},
    {
      gym: "Pastoria Gym",
      leader: "Crasher Wake",
      badge: "Fen Badge",
      specialty: "Water",
      team: [
        { species: "Gyarados", id: 130, level: 27, moves: ["Brine", "Bite", "Dragon Rage", "Swagger"] },
        { species: "Quagsire", id: 195, level: 27, moves: ["Slam", "Mud Bomb", "Mud Sport", "Tail Whip"] },
        { species: "Floatzel", id: 419, level: 30, moves: ["Brine", "Ice Fang", "Pursuit", "Swift"] },
      ],
    
      counterPick: { species: "Roselia", id: 315, location: "Route 212", why: "Grass hits Water super-effectively (4x vs Quagsire) and resists Water; Roselia walls Crasher Wake's team." },},
    {
      gym: "Hearthome Gym",
      leader: "Fantina",
      badge: "Relic Badge",
      specialty: "Ghost",
      team: [
        { species: "Drifblim", id: 426, level: 32, moves: ["Ominous Wind", "Gust", "Astonish", "Minimize"] },
        { species: "Gengar", id: 94, level: 34, moves: ["Shadow Claw", "Poison Jab", "Confuse Ray", "Spite"] },
        { species: "Mismagius", id: 429, level: 36, moves: ["Shadow Ball", "Psybeam", "Magical Leaf", "Confuse Ray"] },
      ],
    
      counterPick: { species: "Gastly", id: 92, location: "Old Chateau in Eterna Forest (night)", why: "Ghost hits Ghost super-effectively; Gastly/Haunter's Shadow Ball sweeps Fantina's Ghost team." },},
    {
      gym: "Canalave Gym",
      leader: "Byron",
      badge: "Mine Badge",
      specialty: "Steel",
      team: [
        { species: "Bronzor", id: 436, level: 36, moves: ["Flash Cannon", "Extrasensory", "Confuse Ray", "Hypnosis"] },
        { species: "Steelix", id: 208, level: 36, moves: ["Gyro Ball", "Dragon Breath", "Ice Fang", "Sandstorm"] },
        { species: "Bastiodon", id: 411, level: 39, moves: ["Flash Cannon", "Ancient Power", "Iron Defense", "Rest"] },
      ],
    
      counterPick: { species: "Ponyta", id: 77, location: "Route 211 (east of Eterna)", why: "Fire hits Steel super-effectively; Rapidash's Fire STAB beats Byron's Magneton, Steelix and Bastiodon." },},
    {
      gym: "Snowpoint Gym",
      leader: "Candice",
      badge: "Icicle Badge",
      specialty: "Ice",
      team: [
        { species: "Snover", id: 459, level: 38, moves: ["Razor Leaf", "Avalanche", "Ingrain", "Leer"] },
        { species: "Sneasel", id: 215, level: 38, moves: ["Faint Attack", "Slash", "Taunt", "Avalanche"] },
        { species: "Medicham", id: 308, level: 40, moves: ["Force Palm", "Bulk Up", "Detect", "Ice Punch"] },
        { species: "Abomasnow", id: 460, level: 42, moves: ["Wood Hammer", "Swagger", "Grass Whistle", "Avalanche"] },
      ],
    
      counterPick: { species: "Rapidash", id: 78, location: "Route 215 (as Ponyta)", why: "Fire hits Ice super-effectively (4x vs Snover/Abomasnow); Rapidash outspeeds and burns Candice's team." },},
    {
      gym: "Sunyshore Gym",
      leader: "Volkner",
      badge: "Beacon Badge",
      specialty: "Electric",
      team: [
        { species: "Raichu", id: 26, level: 46, moves: ["Charge Beam", "Brick Break", "Light Screen", "Thunder Wave"] },
        { species: "Ambipom", id: 424, level: 47, moves: ["Shock Wave", "Nasty Plot", "Agility", "Baton Pass"] },
        { species: "Octillery", id: 224, level: 48, moves: ["Charge Beam", "Octazooka", "Aurora Beam", "Bullet Seed"] },
        { species: "Luxray", id: 405, level: 49, moves: ["Charge Beam", "Thunder Wave", "Thunder Fang", "Crunch"] },
      ],
    
      counterPick: { species: "Gastrodon", id: 423, location: "Route 212 (as Shellos)", why: "Ground hits Electric super-effectively and Gastrodon is immune to Electric; Earthquake sweeps Volkner." },},
  ],
  "Pokémon Platinum": [
    {
      gym: "Oreburgh Gym",
      leader: "Roark",
      badge: "Coal Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 12, moves: ["Rock Throw", "Stealth Rock"] },
        { species: "Onix", id: 95, level: 12, moves: ["Rock Throw", "Screech", "Stealth Rock"] },
        { species: "Cranidos", id: 408, level: 14, moves: ["Headbutt", "Pursuit", "Leer"] },
      ],
    
      counterPick: { species: "Chimchar", id: 390, location: "Starter choice in Twinleaf Town", why: "Fighting (as Monferno/Infernape) hits Rock super-effectively and resists Rock." },},
    {
      gym: "Eterna Gym",
      leader: "Gardenia",
      badge: "Forest Badge",
      specialty: "Grass",
      team: [
        { species: "Turtwig", id: 387, level: 20, moves: ["Grass Knot", "Razor Leaf", "Sunny Day", "Reflect"] },
        { species: "Cherrim", id: 421, level: 20, moves: ["Grass Knot", "Leech Seed", "Magical Leaf", "Safeguard"] },
        { species: "Roserade", id: 407, level: 22, moves: ["Grass Knot", "Magical Leaf", "Poison Sting", "Stun Spore"] },
      ],
    
      counterPick: { species: "Ponyta", id: 77, location: "Route 206", why: "Fire hits Grass super-effectively; Ponyta/Rapidash burns through Gardenia's team." },},
    {
      gym: "Hearthome Gym",
      leader: "Fantina",
      badge: "Relic Badge",
      specialty: "Ghost",
      team: [
        { species: "Duskull", id: 355, level: 24, moves: ["Will-O-Wisp", "Pursuit", "Shadow Sneak", "Future Sight"] },
        { species: "Haunter", id: 93, level: 24, moves: ["Shadow Claw", "Sucker Punch", "Hypnosis", "Confuse Ray"] },
        { species: "Mismagius", id: 429, level: 26, moves: ["Shadow Ball", "Psybeam", "Magical Leaf", "Confuse Ray"] },
      ],
    
      counterPick: { species: "Gastly", id: 92, location: "Old Chateau in Eterna Forest (night)", why: "Ghost hits Ghost super-effectively; Gastly/Haunter's Shadow Ball sweeps Fantina's Ghost team." },},
    {
      gym: "Veilstone Gym",
      leader: "Maylene",
      badge: "Cobble Badge",
      specialty: "Fighting",
      team: [
        { species: "Meditite", id: 307, level: 28, moves: ["Drain Punch", "Confusion", "Rock Tomb", "Fake Out"] },
        { species: "Machoke", id: 67, level: 29, moves: ["Karate Chop", "Rock Tomb", "Strength", "Focus Energy"] },
        { species: "Lucario", id: 448, level: 32, moves: ["Drain Punch", "Force Palm", "Metal Claw", "Bone Rush"] },
      ],
    
      counterPick: { species: "Staravia", id: 397, location: "Route 209 (or raise a Starly from Route 201)", why: "Flying hits Fighting super-effectively; Staravia's Aerial Ace beats Maylene's Meditite and Machoke." },},
    {
      gym: "Pastoria Gym",
      leader: "Crasher Wake",
      badge: "Fen Badge",
      specialty: "Water",
      team: [
        { species: "Gyarados", id: 130, level: 33, moves: ["Waterfall", "Brine", "Bite", "Twister"] },
        { species: "Quagsire", id: 195, level: 34, moves: ["Mud Shot", "Rock Tomb", "Water Pulse", "Yawn"] },
        { species: "Floatzel", id: 419, level: 37, moves: ["Brine", "Ice Fang", "Crunch", "Aqua Jet"] },
      ],
    
      counterPick: { species: "Roselia", id: 315, location: "Route 212", why: "Grass hits Water super-effectively (4x vs Quagsire) and resists Water; Roselia walls Crasher Wake's team." },},
    {
      gym: "Canalave Gym",
      leader: "Byron",
      badge: "Mine Badge",
      specialty: "Steel",
      team: [
        { species: "Magneton", id: 82, level: 37, moves: ["Flash Cannon", "Thunderbolt", "Tri Attack", "Metal Sound"] },
        { species: "Steelix", id: 208, level: 38, moves: ["Flash Cannon", "Ice Fang", "Earthquake", "Sandstorm"] },
        { species: "Bastiodon", id: 411, level: 41, moves: ["Metal Burst", "Stone Edge", "Iron Defense", "Taunt"] },
      ],
    
      counterPick: { species: "Ponyta", id: 77, location: "Route 211 (east of Eterna)", why: "Fire hits Steel super-effectively; Rapidash's Fire STAB beats Byron's Magneton, Steelix and Bastiodon." },},
    {
      gym: "Snowpoint Gym",
      leader: "Candice",
      badge: "Icicle Badge",
      specialty: "Ice",
      team: [
        { species: "Sneasel", id: 215, level: 40, moves: ["Slash", "Aerial Ace", "Faint Attack", "Ice Shard"] },
        { species: "Piloswine", id: 221, level: 40, moves: ["Avalanche", "Stone Edge", "Earthquake", "Hail"] },
        { species: "Abomasnow", id: 460, level: 42, moves: ["Avalanche", "Wood Hammer", "Water Pulse", "Focus Blast"] },
        { species: "Froslass", id: 478, level: 44, moves: ["Blizzard", "Double Team", "Shadow Ball", "Psychic"] },
      ],
    
      counterPick: { species: "Rapidash", id: 78, location: "Route 215 (as Ponyta)", why: "Fire hits Ice super-effectively (4x vs Snover/Abomasnow); Rapidash outspeeds and burns Candice's team." },},
    {
      gym: "Sunyshore Gym",
      leader: "Volkner",
      badge: "Beacon Badge",
      specialty: "Electric",
      team: [
        { species: "Jolteon", id: 135, level: 46, moves: ["Thunder Wave", "Charge Beam", "Iron Tail", "Quick Attack"] },
        { species: "Raichu", id: 26, level: 46, moves: ["Charge Beam", "Focus Blast", "Signal Beam", "Quick Attack"] },
        { species: "Luxray", id: 405, level: 48, moves: ["Ice Fang", "Thunder Fang", "Crunch", "Fire Fang"] },
        { species: "Electivire", id: 466, level: 50, moves: ["Thunder Punch", "Fire Punch", "Quick Attack", "Giga Impact"] },
      ],
    
      counterPick: { species: "Gastrodon", id: 423, location: "Route 212 (as Shellos)", why: "Ground hits Electric super-effectively and Gastrodon is immune to Electric; Earthquake sweeps Volkner." },},
  ],
  "Pokémon HeartGold & SoulSilver": [
    {
      gym: "Violet Gym",
      leader: "Falkner",
      badge: "Zephyr Badge",
      specialty: "Flying",
      team: [
        { species: "Pidgey", id: 16, level: 9, moves: ["Tackle", "Sand-Attack"], ability: "Keen Eye" },
        { species: "Pidgeotto", id: 17, level: 13, moves: ["Tackle", "Roost", "Gust"], ability: "Keen Eye" },
      ],
    
      counterPick: { species: "Mareep", id: 179, location: "Route 32 (south of Violet City)", why: "Electric Thundershock shreds Falkner's Flying team." },},
    {
      gym: "Azalea Gym",
      leader: "Bugsy",
      badge: "Hive Badge",
      specialty: "Bug",
      team: [
        { species: "Scyther", id: 123, level: 17, moves: ["Quick Attack", "Leer", "U-Turn", "Focus Energy"], ability: "Technician", item: "Sitrus Berry" },
        { species: "Kakuna", id: 14, level: 15, moves: ["Poison Sting"] },
        { species: "Metapod", id: 11, level: 15, moves: ["Tackle"] },
      ],
    
      counterPick: { species: "Pidgey", id: 16, location: "Route 29", why: "Flying-type Gust is super-effective vs Bugsy's Bug team." },},
    {
      gym: "Goldenrod Gym",
      leader: "Whitney",
      badge: "Plain Badge",
      specialty: "Normal",
      team: [
        { species: "Clefairy", id: 35, level: 17, moves: ["Double Slap", "Mimic", "Encore", "Metronome"], ability: "Cute Charm" },
        { species: "Miltank", id: 241, level: 19, moves: ["Rollout", "Attract", "Stomp", "Milk Drink"], ability: "Scrappy", item: "Lum Berry" },
      ],
    
      counterPick: { species: "Gastly", id: 92, location: "Sprout Tower (night)", why: "Ghost-type is completely immune to Whitney's Normal-type attacks; Hypnosis plus Lick chips through Miltank." },},
    {
      gym: "Ecruteak Gym",
      leader: "Morty",
      badge: "Fog Badge",
      specialty: "Ghost",
      team: [
        { species: "Gastly", id: 92, level: 21, moves: ["Lick", "Spite", "Mean Look", "Curse"] },
        { species: "Haunter", id: 93, level: 21, moves: ["Hypnosis", "Dream Eater", "Curse", "Nightmare"] },
        { species: "Gengar", id: 94, level: 25, moves: ["Hypnosis", "Shadow Ball", "Mean Look", "Sucker Punch"], ability: "Levitate", item: "Sitrus Berry" },
        { species: "Haunter", id: 93, level: 23, moves: ["Curse", "Mean Look", "Sucker Punch", "Night Shade"] },
      ],
    
      counterPick: { species: "Haunter", id: 93, location: "Sprout Tower (night; Gastly evolves at Lv. 25)", why: "Ghost-type attacks hit Morty's Ghosts super-effectively." },},
    {
      gym: "Cianwood Gym",
      leader: "Chuck",
      badge: "Storm Badge",
      specialty: "Fighting",
      team: [
        { species: "Primeape", id: 57, level: 29, moves: ["Leer", "Double Team", "Focus Punch", "Rock Slide"], ability: "Vital Spirit" },
        { species: "Poliwrath", id: 62, level: 31, moves: ["Hypnosis", "Surf", "Focus Punch", "Body Slam"], ability: "Water Absorb", item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Natu", id: 177, location: "Ruins of Alph", why: "Psychic/Flying: Confusion and Peck shred Chuck's Fighting team." },},
    {
      gym: "Olivine Gym",
      leader: "Jasmine",
      badge: "Mineral Badge",
      specialty: "Steel",
      team: [
        { species: "Magnemite", id: 81, level: 30, moves: ["Thunderbolt", "Supersonic", "Sonic Boom", "Thunder Wave"], ability: "Magnet Pull" },
        { species: "Magnemite", id: 81, level: 30, moves: ["Thunderbolt", "Supersonic", "Sonic Boom", "Thunder Wave"], ability: "Sturdy" },
        { species: "Steelix", id: 208, level: 35, moves: ["Screech", "Sandstorm", "Rock Throw", "Iron Tail"], ability: "Sturdy", item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Growlithe", id: 58, location: "Routes 36-37", why: "Fire-type Ember hits Jasmine's Steel-types super-effectively." },},
    {
      gym: "Mahogany Gym",
      leader: "Pryce",
      badge: "Glacier Badge",
      specialty: "Ice",
      team: [
        { species: "Seel", id: 86, level: 30, moves: ["Snore", "Hail", "Icy Wind", "Rest"], ability: "Thick Fat" },
        { species: "Dewgong", id: 87, level: 32, moves: ["Sleep Talk", "Ice Shard", "Aurora Beam", "Rest"], ability: "Thick Fat" },
        { species: "Piloswine", id: 221, level: 34, moves: ["Hail", "Ice Fang", "Mud Bomb", "Blizzard"], ability: "Snow Cloak", item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Machop", id: 66, location: "Route 42", why: "Fighting-type Karate Chop shreds Pryce's Ice team." },},
    {
      gym: "Blackthorn Gym",
      leader: "Clair",
      badge: "Rising Badge",
      specialty: "Dragon",
      team: [
        { species: "Gyarados", id: 130, level: 38, moves: ["Twister", "Dragon Rage", "Bite", "Dragon Pulse"], ability: "Intimidate" },
        { species: "Dragonair", id: 148, level: 38, moves: ["Thunder Wave", "Fire Blast", "Slam", "Dragon Pulse"], ability: "Shed Skin" },
        { species: "Dragonair", id: 148, level: 38, moves: ["Thunder Wave", "Aqua Tail", "Slam", "Dragon Pulse"], ability: "Shed Skin" },
        { species: "Kingdra", id: 230, level: 41, moves: ["SmokeScreen", "Hydro Pump", "Hyper Beam", "Dragon Pulse"], ability: "Sniper", item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Swinub", id: 220, location: "Ice Path", why: "Ice-type Powder Snow hits Clair's Dragonairs 4x super-effectively (neutral vs Kingdra)." },},
    {
      gym: "Pewter Gym",
      leader: "Brock",
      badge: "Boulder Badge",
      specialty: "Rock",
      team: [
        { species: "Graveler", id: 75, level: 51, moves: ["Earthquake", "Defense Curl", "Rock Slide", "Rollout"] },
        { species: "Rhyhorn", id: 111, level: 51, moves: ["Sandstorm", "Scary Face", "Earthquake", "Horn Drill"] },
        { species: "Kabutops", id: 141, level: 52, moves: ["Aqua Jet", "Rock Slide", "Endure", "Giga Drain"] },
        { species: "Omastar", id: 139, level: 53, moves: ["Ancient Power", "Brine", "Protect", "Spike Cannon"] },
        { species: "Onix", id: 95, level: 54, moves: ["Iron Tail", "Rock Slide", "Screech", "Sandstorm"], item: "Sitrus Berry" },
      ],
      note: "Kanto gym teams reuse the GSC species at higher levels; moves verified for HGSS.",
    
      counterPick: { species: "Diglett", id: 50, location: "Diglett's Cave", why: "Ground-type Dig hits Brock's Rock-types super-effectively." },},
    {
      gym: "Cerulean Gym",
      leader: "Misty",
      badge: "Cascade Badge",
      specialty: "Water",
      team: [
        { species: "Quagsire", id: 195, level: 49, moves: ["Earthquake", "Surf", "Amnesia"] },
        { species: "Golduck", id: 55, level: 49, moves: ["Surf", "Psychic", "Disable"] },
        { species: "Lapras", id: 131, level: 52, moves: ["Surf", "Blizzard", "Perish Song", "Rain Dance"] },
        { species: "Starmie", id: 121, level: 54, moves: ["Surf", "Ice Beam", "Recover", "Confuse Ray"] },
      ],
    
      counterPick: { species: "Pikachu", id: 25, location: "Viridian Forest", why: "Electric Thunderbolt shreds Misty's Water team." },},
    {
      gym: "Vermilion Gym",
      leader: "Lt. Surge",
      badge: "Thunder Badge",
      specialty: "Electric",
      team: [
        { species: "Electrode", id: 101, level: 47, moves: ["Explosion", "Swift", "Screech"] },
        { species: "Electrode", id: 101, level: 47, moves: ["Explosion", "Swift", "Screech"] },
        { species: "Magneton", id: 82, level: 47, moves: ["Zap Cannon", "Swift", "Lock-On"] },
        { species: "Raichu", id: 26, level: 51, moves: ["Thunderbolt", "Thunder Wave", "Thunder"] },
        { species: "Electabuzz", id: 125, level: 53, moves: ["Thunder Punch", "Thunder", "Light Screen"] },
      ],
    
      counterPick: { species: "Geodude", id: 74, location: "Route 9 (east of Cerulean, reachable before the gym)", why: "Ground-type Magnitude hits Lt. Surge's Electric team super-effectively and resists Electric." },},
    {
      gym: "Celadon Gym",
      leader: "Erika",
      badge: "Rainbow Badge",
      specialty: "Grass",
      team: [
        { species: "Jumpluff", id: 189, level: 51, moves: ["Giga Drain", "Leech Seed", "Cotton Spore"] },
        { species: "Tangela", id: 114, level: 52, moves: ["Giga Drain", "Sleep Powder", "Bind"] },
        { species: "Victreebel", id: 71, level: 56, moves: ["Razor Leaf", "Sunny Day", "Acid"] },
        { species: "Bellossom", id: 182, level: 56, moves: ["Solar Beam", "Petal Dance", "Sunny Day"] },
      ],
    
      counterPick: { species: "Doduo", id: 84, location: "Route 16 (west of Celadon City)", why: "Doduo's high Attack and Flying moves (Drill Peck) hit far harder than Pidgeotto against Erika's Grass team." },},
    {
      gym: "Fuchsia Gym",
      leader: "Janine",
      badge: "Soul Badge",
      specialty: "Poison",
      team: [
        { species: "Weezing", id: 110, level: 44, moves: ["Sludge Bomb", "Explosion", "Toxic"] },
        { species: "Ariados", id: 168, level: 47, moves: ["Night Shade", "Giga Drain", "Scary Face"] },
        { species: "Ariados", id: 168, level: 47, moves: ["Night Shade", "Giga Drain", "Scary Face"] },
        { species: "Crobat", id: 169, level: 47, moves: ["Wing Attack", "Confuse Ray", "Supersonic"] },
        { species: "Venomoth", id: 49, level: 50, moves: ["Psychic", "Gust", "Double Team"], item: "Sitrus Berry" },
      ],
    
      counterPick: { species: "Drowzee", id: 96, location: "Route 11", why: "Psychic-type Confusion hits Janine's Poison team super-effectively." },},
    {
      gym: "Saffron Gym",
      leader: "Sabrina",
      badge: "Marsh Badge",
      specialty: "Psychic",
      team: [
        { species: "Mr. Mime", id: 122, level: 53, moves: ["Psychic", "Reflect", "Baton Pass"] },
        { species: "Espeon", id: 196, level: 53, moves: ["Psychic", "Swift", "Quick Attack"] },
        { species: "Alakazam", id: 65, level: 55, moves: ["Psychic", "Recover", "Future Sight"] },
      ],
    
      counterPick: { species: "Haunter", id: 93, location: "Rock Tunnel", why: "Ghost-type attacks hit Sabrina's Psychic-types super-effectively." },},
    {
      gym: "Cinnabar Gym",
      leader: "Blaine",
      badge: "Volcano Badge",
      specialty: "Fire",
      team: [
        { species: "Magmar", id: 126, level: 54, moves: ["Fire Punch", "Thunder Punch", "Confuse Ray"] },
        { species: "Magcargo", id: 219, level: 54, moves: ["Flamethrower", "Rock Slide", "Smog"] },
        { species: "Rapidash", id: 78, level: 59, moves: ["Fire Blast", "Fire Spin", "Fury Attack"] },
      ],
    
      counterPick: { species: "Gyarados", id: 130, location: "Old Rod almost anywhere (catch Magikarp, evolves at Lv. 20)", why: "Water/Flying Gyarados soaks Blaine's Fire team — Surf and Hydro Pump hit massively." },},
    {
      gym: "Viridian Gym",
      leader: "Blue",
      badge: "Earth Badge",
      specialty: "Mixed",
      team: [
        { species: "Gyarados", id: 130, level: 52, moves: ["Dragon Dance", "Waterfall"] },
        { species: "Exeggutor", id: 103, level: 55, moves: ["Hypnosis", "Leaf Storm"] },
        { species: "Machamp", id: 68, level: 56, moves: ["Dynamic Punch"] },
        { species: "Arcanine", id: 59, level: 58, moves: ["Extreme Speed", "Flare Blitz"] },
        { species: "Rhydon", id: 112, level: 58, moves: ["Stone Edge", "Thunder Fang"] },
        { species: "Pidgeot", id: 18, level: 60, moves: ["Air Slash", "Mirror Move"] },
      ],
    
      counterPick: { species: "Zapdos", id: 145, location: "Power Plant", why: "Thunderbolt plus Drill Peck covers Blue's mixed team." },},
  ],
  "Pokémon Ruby, Sapphire & Emerald": [
    {
      gym: "Rustboro Gym",
      leader: "Roxanne",
      badge: "Stone Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 14, moves: ["Tackle", "Defense Curl", "Rock Throw", "Rock Tomb"] },
        { species: "Nosepass", id: 299, level: 15, moves: ["Tackle", "Harden", "Rock Throw", "Rock Tomb"] },
      ],
      note: "Emerald: Geodude 12 ×2, Nosepass 15.",
    
      counterPick: { species: "Mudkip", id: 258, location: "Starter choice in Littleroot Town", why: "Water hits Rock super-effectively and resists Rock; Mudkip's line solos Roxanne." },},
    {
      gym: "Dewford Gym",
      leader: "Brawly",
      badge: "Knuckle Badge",
      specialty: "Fighting",
      team: [
        { species: "Machop", id: 66, level: 17, moves: ["Bulk Up", "Leer", "Karate Chop", "Seismic Toss"] },
        { species: "Makuhita", id: 296, level: 18, moves: ["Bulk Up", "Knock Off", "Arm Thrust", "Sand-Attack"] },
      ],
      note: "Emerald: Machop 16, Meditite 16, Makuhita 19.",
    
      counterPick: { species: "Taillow", id: 276, location: "Route 104 (before taking the boat to Dewford)", why: "Flying hits Fighting super-effectively; Taillow outspeeds Brawly's Machop/Makuhita." },},
    {
      gym: "Mauville Gym",
      leader: "Wattson",
      badge: "Dynamo Badge",
      specialty: "Electric",
      team: [
        { species: "Magnemite", id: 81, level: 22, moves: ["Thundershock", "Supersonic", "Sonic Boom", "Thunder Wave"] },
        { species: "Voltorb", id: 100, level: 20, moves: ["Rollout", "Spark", "Sonic Boom", "Selfdestruct"] },
        { species: "Magneton", id: 82, level: 23, moves: ["Shock Wave", "Supersonic", "Sonic Boom", "Thunder Wave"] },
      ],
      note: "Emerald: Voltorb 20, Electrike 20, Magneton 22, Manectric 24.",
    
      counterPick: { species: "Geodude", id: 74, location: "Granite Cave (Dewford)", why: "Ground hits Electric super-effectively and Geodude is immune to Electric moves; walls Wattson." },},
    {
      gym: "Lavaridge Gym",
      leader: "Flannery",
      badge: "Heat Badge",
      specialty: "Fire",
      team: [
        { species: "Slugma", id: 218, level: 26, moves: ["Overheat", "Smog", "Light Screen", "Sunny Day"] },
        { species: "Slugma", id: 218, level: 26, moves: ["Flamethrower", "Rock Slide", "Light Screen", "Sunny Day"] },
        { species: "Torkoal", id: 324, level: 28, moves: ["Overheat", "Body Slam", "Flail", "Attract"] },
      ],
      note: "Emerald: Slugma 24, Numel 24, Camerupt 26, Torkoal 29.",
    
      counterPick: { species: "Numel", id: 322, location: "Route 112 (by the cable car to Mt. Chimney)", why: "Ground hits Fire super-effectively and resists Fire; Numel/Camerupt handles Flannery's Slugma, Numel and Torkoal." },},
    {
      gym: "Petalburg Gym",
      leader: "Norman",
      badge: "Balance Badge",
      specialty: "Normal",
      team: [
        { species: "Slaking", id: 289, level: 28, moves: ["Encore", "Facade", "Yawn", "Feint Attack"] },
        { species: "Vigoroth", id: 288, level: 30, moves: ["Slash", "Feint Attack", "Facade", "Encore"] },
        { species: "Slaking", id: 289, level: 31, moves: ["Focus Punch", "Slack Off", "Facade", "Feint Attack"] },
      ],
    
      counterPick: { species: "Makuhita", id: 296, location: "Route 112", why: "Fighting hits Normal super-effectively; Makuhita's Fighting STAB breaks through Norman's Slaking line." },},
    {
      gym: "Fortree Gym",
      leader: "Winona",
      badge: "Feather Badge",
      specialty: "Flying",
      team: [
        { species: "Swellow", id: 277, level: 31, moves: ["Quick Attack", "Aerial Ace", "Double Team", "Endeavor"] },
        { species: "Pelipper", id: 279, level: 30, moves: ["Water Gun", "Supersonic", "Protect", "Aerial Ace"] },
        { species: "Skarmory", id: 227, level: 32, moves: ["Sand-Attack", "Fury Attack", "Steel Wing", "Aerial Ace"] },
        { species: "Altaria", id: 334, level: 33, moves: ["Earthquake", "Dragon Breath", "Dragon Dance", "Aerial Ace"] },
      ],
      note: "Emerald: Swablu 29, Tropius 29, Pelipper 30, Skarmory 31, Altaria 33.",
    
      counterPick: { species: "Electrike", id: 309, location: "Route 110", why: "Electric hits Flying super-effectively across Winona's whole team (Pelipper, Swellow, Skarmory, Tropius, Altaria)." },},
    {
      gym: "Mossdeep Gym",
      leader: "Tate and Liza",
      badge: "Mind Badge",
      specialty: "Psychic",
      team: [
        { species: "Lunatone", id: 337, level: 42, moves: ["Light Screen", "Psychic", "Hypnosis", "Calm Mind"] },
        { species: "Solrock", id: 338, level: 42, moves: ["Sunny Day", "Solar Beam", "Psychic", "Flamethrower"] },
      ],
      note: "Double battle.",
    
      counterPick: { species: "Mightyena", id: 262, location: "Route 102 (as Poochyena)", why: "Dark hits Psychic super-effectively; Bite/Crunch from Mightyena beats Tate & Liza's Solrock and Lunatone." },},
    {
      gym: "Sootopolis Gym",
      leader: "Wallace",
      badge: "Rain Badge",
      specialty: "Water",
      team: [
        { species: "Luvdisc", id: 370, level: 40, moves: ["Flail", "Attract", "Sweet Kiss", "Water Pulse"] },
        { species: "Sealeo", id: 364, level: 40, moves: ["Encore", "Body Slam", "Aurora Beam", "Water Pulse"] },
        { species: "Seaking", id: 119, level: 42, moves: ["Horn Drill", "Fury Attack", "Rain Dance", "Water Pulse"] },
        { species: "Whiscash", id: 340, level: 42, moves: ["Amnesia", "Rain Dance", "Earthquake", "Water Pulse"] },
        { species: "Milotic", id: 350, level: 43, moves: ["Recover", "Twister", "Ice Beam", "Water Pulse"] },
      ],
      note: "Emerald: Juan replaces Wallace — Luvdisc 41, Whiscash 41, Sealeo 43, Crawdaunt 43, Kingdra 46.",
    
      counterPick: { species: "Tropius", id: 357, location: "Route 119", why: "Grass hits Water super-effectively and resists Water; covers Wallace (Ruby/Sapphire) and Juan (Emerald)." },},
  ],
  "Pokémon FireRed & LeafGreen": [
    {
      gym: "Pewter Gym",
      leader: "Brock",
      badge: "Boulder Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 12, moves: ["Tackle", "Defense Curl"] },
        { species: "Onix", id: 95, level: 14, moves: ["Tackle", "Harden", "Bind", "Rock Tomb"] },
      ],
    
      counterPick: { species: "Mankey", id: 56, location: "Route 22 (west of Viridian City)", why: "Fighting-type Low Kick/Karate Chop hits Brock's Rock-types super-effectively." },},
    {
      gym: "Cerulean Gym",
      leader: "Misty",
      badge: "Cascade Badge",
      specialty: "Water",
      team: [
        { species: "Staryu", id: 120, level: 18, moves: ["Tackle", "Harden", "Recover", "Water Pulse"] },
        { species: "Starmie", id: 121, level: 21, moves: ["Rapid Spin", "Swift", "Recover", "Water Pulse"] },
      ],
    
      counterPick: { species: "Pikachu", id: 25, location: "Viridian Forest", why: "Electric Thunderbolt shreds Misty's Water team." },},
    {
      gym: "Vermilion Gym",
      leader: "Lt. Surge",
      badge: "Thunder Badge",
      specialty: "Electric",
      team: [
        { species: "Voltorb", id: 100, level: 21, moves: ["Shock Wave", "Tackle", "Screech", "Sonic Boom"] },
        { species: "Pikachu", id: 25, level: 18, moves: ["Shock Wave", "Thunder Wave", "Quick Attack", "Double Team"] },
        { species: "Raichu", id: 26, level: 24, moves: ["Shock Wave", "Thunder Wave", "Quick Attack", "Double Team"] },
      ],
    
      counterPick: { species: "Diglett", id: 50, location: "Diglett's Cave (entrance on Route 11, east of Vermilion)", why: "Ground-type Dig is super-effective vs Lt. Surge's Electric team and immune to Electric attacks." },},
    {
      gym: "Celadon Gym",
      leader: "Erika",
      badge: "Rainbow Badge",
      specialty: "Grass",
      team: [
        { species: "Victreebel", id: 71, level: 29, moves: ["Stun Spore", "Acid", "Poison Powder", "Giga Drain"] },
        { species: "Tangela", id: 114, level: 24, moves: ["Poison Powder", "Constrict", "Ingrain", "Giga Drain"] },
        { species: "Vileplume", id: 45, level: 29, moves: ["Sleep Powder", "Acid", "Stun Spore", "Giga Drain"] },
      ],
    
      counterPick: { species: "Doduo", id: 84, location: "Route 16 (west of Celadon City)", why: "Doduo's high Attack and Flying moves (Drill Peck) hit far harder than Pidgeotto against Erika's Grass team." },},
    {
      gym: "Fuchsia Gym & Safari Zone",
      leader: "Koga",
      badge: "Soul Badge",
      specialty: "Poison",
      team: [
        { species: "Koffing", id: 109, level: 37, moves: ["Selfdestruct", "Sludge", "Smokescreen", "Toxic"] },
        { species: "Muk", id: 89, level: 39, moves: ["Minimize", "Sludge", "Acid Armor", "Toxic"] },
        { species: "Koffing", id: 109, level: 37, moves: ["Selfdestruct", "Sludge", "Smokescreen", "Toxic"] },
        { species: "Weezing", id: 110, level: 43, moves: ["Tackle", "Sludge", "Smokescreen", "Toxic"] },
      ],
    
      counterPick: { species: "Drowzee", id: 96, location: "Route 11", why: "Psychic-type Confusion hits Koga's Poison team super-effectively." },},
    {
      gym: "Saffron Gym",
      leader: "Sabrina",
      badge: "Marsh Badge",
      specialty: "Psychic",
      team: [
        { species: "Kadabra", id: 64, level: 38, moves: ["Psybeam", "Reflect", "Future Sight", "Calm Mind"] },
        { species: "Mr. Mime", id: 122, level: 37, moves: ["Barrier", "Psybeam", "Baton Pass", "Calm Mind"] },
        { species: "Venomoth", id: 49, level: 38, moves: ["Psybeam", "Gust", "Leech Life", "Supersonic"] },
        { species: "Alakazam", id: 65, level: 43, moves: ["Psychic", "Recover", "Future Sight", "Calm Mind"] },
      ],
    
      counterPick: { species: "Kadabra", id: 64, location: "Routes 24-25 (catch Abra, evolves at Lv. 16)", why: "High Special plus Psychic STAB resists Sabrina's Psychic assault and outspeeds her team." },},
    {
      gym: "Cinnabar Gym",
      leader: "Blaine",
      badge: "Volcano Badge",
      specialty: "Fire",
      team: [
        { species: "Growlithe", id: 58, level: 42, moves: ["Bite", "Roar", "Take Down", "Fire Blast"] },
        { species: "Ponyta", id: 77, level: 40, moves: ["Stomp", "Bounce", "Fire Spin", "Fire Blast"] },
        { species: "Rapidash", id: 78, level: 42, moves: ["Stomp", "Bounce", "Fire Spin", "Fire Blast"] },
        { species: "Arcanine", id: 59, level: 47, moves: ["Bite", "Roar", "Take Down", "Fire Blast"] },
      ],
    
      counterPick: { species: "Gyarados", id: 130, location: "Old Rod in Vermilion City (catch Magikarp, evolves at Lv. 20)", why: "Water/Flying Gyarados soaks Blaine's Fire team — Surf and Hydro Pump hit massively." },},
    {
      gym: "Viridian Gym",
      leader: "Giovanni",
      badge: "Earth Badge",
      specialty: "Ground",
      team: [
        { species: "Rhyhorn", id: 111, level: 45, moves: ["Take Down", "Rock Blast", "Scary Face", "Earthquake"] },
        { species: "Dugtrio", id: 51, level: 42, moves: ["Slash", "Sand Tomb", "Mud-Slap", "Earthquake"] },
        { species: "Nidoqueen", id: 31, level: 43, moves: ["Double Kick", "Earthquake", "Poison Sting", "Body Slam"] },
        { species: "Nidoking", id: 34, level: 45, moves: ["Double Kick", "Earthquake", "Poison Sting", "Thrash"] },
        { species: "Rhydon", id: 112, level: 50, moves: ["Take Down", "Rock Blast", "Scary Face", "Earthquake"] },
      ],
    
      counterPick: { species: "Vaporeon", id: 134, location: "Eevee gift in Celadon City + Water Stone from the Dept. Store", why: "Surf washes away Giovanni's Ground team." },},
  ],
  "Pokémon Gold, Silver & Crystal": [
    {
      gym: "Violet Gym",
      leader: "Falkner",
      badge: "Zephyr Badge",
      specialty: "Flying",
      team: [
        { species: "Pidgey", id: 16, level: 7, moves: ["Tackle", "Mud-Slap"] },
        { species: "Pidgeotto", id: 17, level: 9, moves: ["Tackle", "Mud-Slap", "Gust"] },
      ],
    
      counterPick: { species: "Mareep", id: 179, location: "Route 32 (south of Violet City)", why: "Electric Thundershock shreds Falkner's Flying team." },},
    {
      gym: "Azalea Gym",
      leader: "Bugsy",
      badge: "Hive Badge",
      specialty: "Bug",
      team: [
        { species: "Metapod", id: 11, level: 14, moves: ["Tackle", "String Shot", "Harden"] },
        { species: "Kakuna", id: 14, level: 14, moves: ["Poison Sting", "String Shot", "Harden"] },
        { species: "Scyther", id: 123, level: 16, moves: ["Quick Attack", "Leer", "Fury Cutter"] },
      ],
    
      counterPick: { species: "Pidgey", id: 16, location: "Route 29", why: "Flying-type Gust is super-effective vs Bugsy's Bug team." },},
    {
      gym: "Goldenrod Gym",
      leader: "Whitney",
      badge: "Plain Badge",
      specialty: "Normal",
      team: [
        { species: "Clefairy", id: 35, level: 18, moves: ["Double Slap", "Mimic", "Encore", "Metronome"] },
        { species: "Miltank", id: 241, level: 20, moves: ["Rollout", "Attract", "Stomp", "Milk Drink"] },
      ],
    
      counterPick: { species: "Gastly", id: 92, location: "Sprout Tower (night)", why: "Ghost-type is completely immune to Whitney's Normal-type attacks; Hypnosis plus Lick chips through Miltank." },},
    {
      gym: "Ecruteak Gym",
      leader: "Morty",
      badge: "Fog Badge",
      specialty: "Ghost",
      team: [
        { species: "Gastly", id: 92, level: 21, moves: ["Lick", "Spite", "Mean Look", "Curse"] },
        { species: "Haunter", id: 93, level: 21, moves: ["Hypnosis", "Mimic", "Curse", "Night Shade"] },
        { species: "Gengar", id: 94, level: 25, moves: ["Hypnosis", "Shadow Ball", "Mean Look", "Dream Eater"] },
        { species: "Haunter", id: 93, level: 23, moves: ["Spite", "Mean Look", "Mimic", "Night Shade"] },
      ],
    
      counterPick: { species: "Haunter", id: 93, location: "Sprout Tower (night; Gastly evolves at Lv. 25)", why: "Ghost-type Lick/Shadow Ball hits Morty's Ghosts super-effectively." },},
    {
      gym: "Cianwood Gym",
      leader: "Chuck",
      badge: "Storm Badge",
      specialty: "Fighting",
      team: [
        { species: "Primeape", id: 57, level: 27, moves: ["Leer", "Rage", "Karate Chop", "Fury Swipes"] },
        { species: "Poliwrath", id: 62, level: 30, moves: ["Hypnosis", "Mind Reader", "Surf", "Dynamic Punch"] },
      ],
    
      counterPick: { species: "Natu", id: 177, location: "Ruins of Alph", why: "Psychic/Flying: Confusion and Peck shred Chuck's Fighting team." },},
    {
      gym: "Olivine Gym",
      leader: "Jasmine",
      badge: "Mineral Badge",
      specialty: "Steel",
      team: [
        { species: "Magnemite", id: 81, level: 30, moves: ["Thunderbolt", "Supersonic", "Sonic Boom", "Thunder Wave"] },
        { species: "Magnemite", id: 81, level: 30, moves: ["Thunderbolt", "Supersonic", "Sonic Boom", "Thunder Wave"] },
        { species: "Steelix", id: 208, level: 35, moves: ["Screech", "Sunny Day", "Rock Throw", "Iron Tail"] },
      ],
    
      counterPick: { species: "Growlithe", id: 58, location: "Routes 36-37", why: "Fire-type Ember hits Jasmine's Steel-types super-effectively." },},
    {
      gym: "Mahogany Gym",
      leader: "Pryce",
      badge: "Glacier Badge",
      specialty: "Ice",
      team: [
        { species: "Seel", id: 86, level: 27, moves: ["Headbutt", "Icy Wind", "Aurora Beam", "Rest"] },
        { species: "Dewgong", id: 87, level: 29, moves: ["Headbutt", "Icy Wind", "Aurora Beam", "Rest"] },
        { species: "Piloswine", id: 221, level: 31, moves: ["Icy Wind", "Fury Attack", "Mist", "Blizzard"] },
      ],
    
      counterPick: { species: "Machop", id: 66, location: "Route 42", why: "Fighting-type Karate Chop shreds Pryce's Ice team." },},
    {
      gym: "Blackthorn Gym",
      leader: "Clair",
      badge: "Rising Badge",
      specialty: "Dragon",
      team: [
        { species: "Dragonair", id: 148, level: 37, moves: ["Thunder Wave", "Surf", "Slam", "Dragon Breath"] },
        { species: "Dragonair", id: 148, level: 37, moves: ["Thunder Wave", "Thunderbolt", "Slam", "Dragon Breath"] },
        { species: "Dragonair", id: 148, level: 37, moves: ["Thunder Wave", "Ice Beam", "Slam", "Dragon Breath"] },
        { species: "Kingdra", id: 230, level: 40, moves: ["SmokeScreen", "Surf", "Hyper Beam", "Dragon Breath"] },
      ],
    
      counterPick: { species: "Swinub", id: 220, location: "Ice Path", why: "Ice-type Powder Snow hits Clair's Dragonairs 4x super-effectively (neutral vs Kingdra)." },},
  ],
  "Pokémon Red, Blue & Yellow": [
    {
      gym: "Pewter Gym",
      leader: "Brock",
      badge: "Boulder Badge",
      specialty: "Rock",
      team: [
        { species: "Geodude", id: 74, level: 12, moves: ["Tackle", "Defense Curl"] },
        { species: "Onix", id: 95, level: 14, moves: ["Tackle", "Bide", "Screech", "Bind"] },
      ],
      note: "Yellow: Geodude 10, Onix 12.",
    
      counterPick: { species: "Bulbasaur", id: 1, location: "Starter choice in Pallet Town", why: "Grass-type Vine Whip hits Brock's Rock/Ground team super-effectively and resists Rock Tomb." },},
    {
      gym: "Cerulean Gym",
      leader: "Misty",
      badge: "Cascade Badge",
      specialty: "Water",
      team: [
        { species: "Staryu", id: 120, level: 18, moves: ["Tackle", "Harden", "Water Gun"] },
        { species: "Starmie", id: 121, level: 21, moves: ["Tackle", "Harden", "Water Gun", "Bubble Beam"] },
      ],
    
      counterPick: { species: "Pikachu", id: 25, location: "Viridian Forest (starter in Yellow)", why: "Electric Thunderbolt shreds Misty's Water team." },},
    {
      gym: "Vermilion Gym",
      leader: "Lt. Surge",
      badge: "Thunder Badge",
      specialty: "Electric",
      team: [
        { species: "Voltorb", id: 100, level: 21, moves: ["Tackle", "Screech", "Sonic Boom"] },
        { species: "Pikachu", id: 25, level: 18, moves: ["Thunder Shock", "Growl", "Thunder Wave", "Quick Attack"] },
        { species: "Raichu", id: 26, level: 24, moves: ["Thunder Shock", "Growl", "Thunderbolt"] },
      ],
      note: "Yellow: solo Raichu 28 [Thunderbolt, Mega Punch, Mega Kick, Growl].",
    
      counterPick: { species: "Diglett", id: 50, location: "Diglett's Cave (entrance on Route 11, east of Vermilion)", why: "Ground-type Dig is super-effective vs Lt. Surge's Electric team and immune to Electric attacks." },},
    {
      gym: "Celadon Gym",
      leader: "Erika",
      badge: "Rainbow Badge",
      specialty: "Grass",
      team: [
        { species: "Victreebel", id: 71, level: 29, moves: ["Razor Leaf", "Wrap", "Poison Powder", "Sleep Powder"] },
        { species: "Tangela", id: 114, level: 24, moves: ["Constrict", "Bind"] },
        { species: "Vileplume", id: 45, level: 29, moves: ["Petal Dance", "Poison Powder", "Mega Drain", "Sleep Powder"] },
      ],
      note: "Yellow: Tangela 30, Weepinbell 32, Gloom 32.",
    
      counterPick: { species: "Doduo", id: 84, location: "Route 16 (west of Celadon City)", why: "Doduo's high Attack and Flying moves (Drill Peck) hit far harder than Pidgeotto against Erika's Grass team." },},
    {
      gym: "Fuchsia Gym & Safari Zone",
      leader: "Koga",
      badge: "Soul Badge",
      specialty: "Poison",
      team: [
        { species: "Koffing", id: 109, level: 37, moves: ["Tackle", "Smog", "Sludge", "Smokescreen"] },
        { species: "Koffing", id: 109, level: 37, moves: ["Tackle", "Smog", "Sludge", "Smokescreen"] },
        { species: "Muk", id: 89, level: 39, moves: ["Disable", "Poison Gas", "Minimize", "Sludge"] },
        { species: "Weezing", id: 110, level: 43, moves: ["Smog", "Sludge", "Toxic", "Selfdestruct"] },
      ],
      note: "Yellow: Venonat 44, Venonat 46, Venonat 48, Venomoth 50.",
    
      counterPick: { species: "Drowzee", id: 96, location: "Route 11", why: "Psychic-type Confusion hits Koga's Poison team super-effectively." },},
    {
      gym: "Saffron Gym",
      leader: "Sabrina",
      badge: "Marsh Badge",
      specialty: "Psychic",
      team: [
        { species: "Kadabra", id: 64, level: 38, moves: ["Disable", "Psybeam", "Recover", "Psychic"] },
        { species: "Venomoth", id: 49, level: 37, moves: ["Poison Powder", "Leech Life", "Stun Spore", "Psybeam"] },
        { species: "Mr. Mime", id: 122, level: 38, moves: ["Confusion", "Barrier", "Light Screen", "Double Slap"] },
        { species: "Alakazam", id: 65, level: 43, moves: ["Psybeam", "Recover", "Psywave", "Reflect"] },
      ],
      note: "Yellow: Abra 50, Kadabra 50, Alakazam 50.",
    
      counterPick: { species: "Kadabra", id: 64, location: "Routes 24-25 (catch Abra, evolves at Lv. 16)", why: "High Special plus Psychic STAB resists Sabrina's Psychic assault and outspeeds her team." },},
    {
      gym: "Cinnabar Gym",
      leader: "Blaine",
      badge: "Volcano Badge",
      specialty: "Fire",
      team: [
        { species: "Growlithe", id: 58, level: 42, moves: ["Ember", "Leer", "Take Down", "Agility"] },
        { species: "Ponyta", id: 77, level: 40, moves: ["Tail Whip", "Stomp", "Growl", "Fire Spin"] },
        { species: "Rapidash", id: 78, level: 42, moves: ["Tail Whip", "Stomp", "Growl", "Fire Spin"] },
        { species: "Arcanine", id: 59, level: 47, moves: ["Roar", "Ember", "Fire Blast", "Take Down"] },
      ],
      note: "Yellow: Ninetales 48, Rapidash 50, Arcanine 54.",
    
      counterPick: { species: "Gyarados", id: 130, location: "Old Rod in Vermilion City (catch Magikarp, evolves at Lv. 20)", why: "Water/Flying Gyarados soaks Blaine's Fire team — Surf and Hydro Pump hit massively." },},
    {
      gym: "Viridian Gym",
      leader: "Giovanni",
      badge: "Earth Badge",
      specialty: "Ground",
      team: [
        { species: "Rhyhorn", id: 111, level: 45, moves: ["Stomp", "Tail Whip", "Fury Attack", "Horn Drill"] },
        { species: "Dugtrio", id: 51, level: 42, moves: ["Growl", "Dig", "Sand Attack", "Slash"] },
        { species: "Nidoqueen", id: 31, level: 44, moves: ["Scratch", "Tail Whip", "Body Slam", "Poison Sting"] },
        { species: "Nidoking", id: 34, level: 45, moves: ["Tackle", "Horn Attack", "Poison Sting", "Thrash"] },
        { species: "Rhydon", id: 112, level: 50, moves: ["Stomp", "Tail Whip", "Fissure", "Horn Drill"] },
      ],
      note: "Yellow: Dugtrio 50, Persian 53, Nidoqueen 53, Nidoking 55, Rhydon 55.",
    
      counterPick: { species: "Vaporeon", id: 134, location: "Eevee gift in Celadon City + Water Stone from the Dept. Store", why: "Surf washes away Giovanni's Ground team." },},
  ],
};

/** All teams for a game, in path order — null when the game has no team data. */
export function getGymTeamsForGame(game: string): GymTeam[] | null {
  return GYM_TEAMS[game] ?? null;
}

/** The team for one challenge (matched by the guide/tracker challenge name). */
export function getGymTeamForChallenge(
  game: string,
  challengeName: string,
): GymTeam | null {
  const teams = GYM_TEAMS[game];
  if (!teams) return null;
  return teams.find((t) => t.gym === challengeName) ?? null;
}
