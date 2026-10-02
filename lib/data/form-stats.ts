/**
 * Base stats for Mega Evolutions, keyed by form name.
 *
 * Order: [HP, Attack, Defense, Sp. Atk, Sp. Def, Speed].
 * Sourced from PokéAPI on 2026-10-01 (per-form /pokemon/ endpoints).
 * Gigantamax forms share their base species’ stats, so they are not listed.
 * Regional forms are intentionally not listed (not modeled).
 */

export const FORM_STATS: Record<string, [number, number, number, number, number, number]> = {
  "Mega Abomasnow": [90, 132, 105, 132, 105, 30],
  "Mega Absol": [65, 150, 60, 115, 60, 115],
  "Mega Aerodactyl": [80, 135, 85, 70, 95, 150],
  "Mega Aggron": [70, 140, 230, 60, 80, 50],
  "Mega Alakazam": [55, 50, 65, 175, 105, 150],
  "Mega Altaria": [75, 110, 110, 110, 105, 80],
  "Mega Ampharos": [90, 95, 105, 165, 110, 45],
  "Mega Audino": [103, 60, 126, 80, 126, 50],
  "Mega Banette": [64, 165, 75, 93, 83, 75],
  "Mega Beedrill": [65, 150, 40, 15, 80, 145],
  "Mega Blastoise": [79, 103, 120, 135, 115, 78],
  "Mega Blaziken": [80, 160, 80, 130, 80, 100],
  "Mega Camerupt": [70, 120, 100, 145, 105, 20],
  "Mega Charizard X": [78, 130, 111, 130, 85, 100],
  "Mega Charizard Y": [78, 104, 78, 159, 115, 100],
  "Mega Diancie": [50, 160, 110, 160, 110, 110],
  "Mega Gallade": [68, 165, 95, 65, 115, 110],
  "Mega Garchomp": [108, 170, 115, 120, 95, 92],
  "Mega Gardevoir": [68, 85, 65, 165, 135, 100],
  "Mega Gengar": [60, 65, 80, 170, 95, 130],
  "Mega Glalie": [80, 120, 80, 120, 80, 100],
  "Mega Gyarados": [95, 155, 109, 70, 130, 81],
  "Mega Heracross": [80, 185, 115, 40, 105, 75],
  "Mega Houndoom": [75, 90, 90, 140, 90, 115],
  "Mega Kangaskhan": [105, 125, 100, 60, 100, 100],
  "Mega Latias": [80, 100, 120, 140, 150, 110],
  "Mega Latios": [80, 130, 100, 160, 120, 110],
  "Mega Lopunny": [65, 136, 94, 54, 96, 135],
  "Mega Lucario": [70, 145, 88, 140, 70, 112],
  "Mega Manectric": [70, 75, 80, 135, 80, 135],
  "Mega Mawile": [50, 105, 125, 55, 95, 50],
  "Mega Medicham": [60, 100, 85, 80, 85, 100],
  "Mega Metagross": [80, 145, 150, 105, 110, 110],
  "Mega Mewtwo X": [106, 190, 100, 154, 100, 130],
  "Mega Mewtwo Y": [106, 150, 70, 194, 120, 140],
  "Mega Pidgeot": [83, 80, 80, 135, 80, 121],
  "Mega Pinsir": [65, 155, 120, 65, 90, 105],
  "Mega Sableye": [50, 85, 125, 85, 115, 20],
  "Mega Salamence": [95, 145, 130, 120, 90, 120],
  "Mega Sceptile": [70, 110, 75, 145, 85, 145],
  "Mega Scizor": [70, 150, 140, 65, 100, 75],
  "Mega Sharpedo": [70, 140, 70, 110, 65, 105],
  "Mega Slowbro": [95, 75, 180, 130, 80, 30],
  "Mega Steelix": [75, 125, 230, 55, 95, 30],
  "Mega Swampert": [100, 150, 110, 95, 110, 70],
  "Mega Tyranitar": [100, 164, 150, 95, 120, 71],
  "Mega Venusaur": [80, 100, 123, 122, 120, 80],
};
