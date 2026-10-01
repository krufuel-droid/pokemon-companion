/**
 * Fetch the full National Pokédex (species 1–1025) from the public PokéAPI
 * and build two static JSON files consumed by lib/pokedex.ts:
 *   - data/pokedex-index.json  (lightweight list/search records)
 *   - data/pokedex-full.json   (complete species records)
 *
 * Plain Node 24 — no dependencies. Run once with:
 *   node scripts/fetch-pokedex.mjs
 *
 * This takes several minutes (~2050 API calls). If any species fails
 * after retries, the script exits nonzero and lists the failed IDs
 * instead of silently skipping.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");
const CONCURRENCY = 8;
const MAX_RETRIES = 3;

const VERSION_ORDER = [
  "red", "blue", "yellow",
  "gold", "silver", "crystal",
  "ruby", "sapphire", "emerald",
  "firered", "leafgreen",
  "diamond", "pearl", "platinum",
  "heartgold", "soulsilver",
  "black", "white",
  "black-2", "white-2",
  "x", "y",
  "omega-ruby", "alpha-sapphire",
  "sun", "moon",
  "ultra-sun", "ultra-moon",
  "lets-go-pikachu", "lets-go-eevee",
  "sword", "shield",
  "legends-arceus",
  "scarlet", "violet",
];

const VERSION_LABELS = {
  red: "Red",
  blue: "Blue",
  yellow: "Yellow",
  gold: "Gold",
  silver: "Silver",
  crystal: "Crystal",
  ruby: "Ruby",
  sapphire: "Sapphire",
  emerald: "Emerald",
  firered: "FireRed",
  leafgreen: "LeafGreen",
  diamond: "Diamond",
  pearl: "Pearl",
  platinum: "Platinum",
  heartgold: "HeartGold",
  soulsilver: "SoulSilver",
  black: "Black",
  white: "White",
  "black-2": "Black 2",
  "white-2": "White 2",
  x: "X",
  y: "Y",
  "omega-ruby": "Omega Ruby",
  "alpha-sapphire": "Alpha Sapphire",
  sun: "Sun",
  moon: "Moon",
  "ultra-sun": "Ultra Sun",
  "ultra-moon": "Ultra Moon",
  "lets-go-pikachu": "Let's Go Pikachu",
  "lets-go-eevee": "Let's Go Eevee",
  sword: "Sword",
  shield: "Shield",
  "legends-arceus": "Legends: Arceus",
  scarlet: "Scarlet",
  violet: "Violet",
};
const VERSION_RANK = new Map(VERSION_ORDER.map((v, i) => [v, i]));

/** Display names that need special handling beyond the default rule. */
const NAME_OVERRIDES = {
  "mr-mime": "Mr. Mime",
  "mr-rime": "Mr. Rime",
  "mime-jr": "Mime Jr.",
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z",
  "type-null": "Type: Null",
  flabebe: "Flabébé",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "tapu-koko": "Tapu Koko",
  "tapu-lele": "Tapu Lele",
  "tapu-bulu": "Tapu Bulu",
  "tapu-fini": "Tapu Fini",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function displayName(slug) {
  if (NAME_OVERRIDES[slug]) return NAME_OVERRIDES[slug];
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

async function fetchJson(url, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "pokemon-companion-data/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.warn(`  retry ${attempt}/${MAX_RETRIES} ${label}: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(500 * attempt);
    }
  }
  throw lastErr;
}

function cleanFlavorText(raw) {
  return raw.replace(/[\n\f]/g, " ").replace(/\s+/g, " ").trim();
}

function buildDexEntries(species) {
  const seen = new Set();
  const entries = [];
  for (const ft of species.flavor_text_entries ?? []) {
    if (ft.language?.name !== "en") continue;
    const game = ft.version?.name;
    if (!VERSION_RANK.has(game)) continue;
    const text = cleanFlavorText(ft.flavor_text ?? "");
    const key = `${game}||${text}`;
    if (!text || seen.has(key)) continue;
    seen.add(key);
    entries.push({ game, gameLabel: VERSION_LABELS[game], text });
  }
  entries.sort((a, b) => VERSION_RANK.get(a.game) - VERSION_RANK.get(b.game));
  return entries;
}

function buildEggMoves(pokemon) {
  const moves = new Set();
  for (const m of pokemon.moves ?? []) {
    const isEgg = (m.version_group_details ?? []).some(
      (vgd) => vgd.move_learn_method?.name === "egg"
    );
    if (isEgg) moves.add(displayName(m.move.name));
  }
  return [...moves].sort((a, b) => a.localeCompare(b));
}

function buildRecord(species, pokemon) {
  const id = species.id;
  const slug = species.name;
  const types = [...(pokemon.types ?? [])]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => capitalize(t.type.name));

  const eggGroups = [];
  for (const g of species.egg_groups ?? []) {
    const label = capitalize(g.name.replace(/\d+$/, ""));
    if (!eggGroups.includes(label)) eggGroups.push(label);
  }

  const genusEntry = (species.genera ?? []).find((g) => g.language?.name === "en");
  const dexEntries = buildDexEntries(species);

  // Base stats keyed by short label, in display order.
  const STAT_ORDER = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
  const statByName = Object.fromEntries(
    (pokemon.stats ?? []).map((s) => [s.stat?.name, s.base_stat])
  );
  const baseStats = STAT_ORDER.map((key) => ({
    key,
    value: typeof statByName[key] === "number" ? statByName[key] : 0,
  }));

  // Smogon Sprite Project community sprites (IP hygiene: no game-rip URLs).
  // {showdown} is the species slug lowercased with non-alphanumerics stripped.
  const showdown = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
  const spriteBase = "https://play.pokemonshowdown.com/sprites/gen5";
  const shinyBase = "https://play.pokemonshowdown.com/sprites/gen5-shiny";
  const artworkBase = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

  return {
    id,
    slug,
    name: displayName(slug),
    types,
    eggGroups,
    sprites: {
      regular: `${spriteBase}/${showdown}.png`,
      shiny: `${shinyBase}/${showdown}.png`,
    },
    artwork: `${artworkBase}/${id}.png`,
    heightM: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    genera: genusEntry ? genusEntry.genus : null,
    baseStats,
    dexEntries,
    eggMoves: buildEggMoves(pokemon),
  };
}

async function main() {
  console.log("Fetching species list…");
  const list = await fetchJson(
    "https://pokeapi.co/api/v2/pokemon-species?limit=1025",
    "species list"
  );
  const speciesList = list.results;
  console.log(`Found ${speciesList.length} species. Fetching details (concurrency ${CONCURRENCY})…`);

  const failures = [];
  const records = new Array(speciesList.length);
  let done = 0;

  async function worker(queue) {
    while (queue.length) {
      const index = queue.shift();
      const entry = speciesList[index];
      try {
        const species = await fetchJson(entry.url, `species ${entry.name}`);
        const defaultVariety = (species.varieties ?? []).find((v) => v.is_default);
        if (!defaultVariety) throw new Error(`no default variety for ${entry.name}`);
        const pokemon = await fetchJson(defaultVariety.pokemon.url, `pokemon ${entry.name}`);
        records[index] = buildRecord(species, pokemon);
      } catch (err) {
        failures.push({ name: entry.name, error: String(err?.message ?? err) });
        console.error(`  FAILED ${entry.name}: ${err?.message ?? err}`);
      }
      done++;
      if (done % 100 === 0 || done === speciesList.length) {
        console.log(`  progress: ${done}/${speciesList.length}`);
      }
    }
  }

  const queue = speciesList.map((_, i) => i);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

  if (failures.length) {
    console.error(`\n${failures.length} species failed after ${MAX_RETRIES} retries:`);
    for (const f of failures) console.error(`  - ${f.name}: ${f.error}`);
    process.exit(1);
  }

  const full = records;
  const index = full.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    types: r.types,
    eggGroups: r.eggGroups,
    sprites: r.sprites,
  }));

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "pokedex-index.json"), JSON.stringify(index) + "\n");
  writeFileSync(join(DATA_DIR, "pokedex-full.json"), JSON.stringify(full) + "\n");

  console.log(`\nDone. Wrote ${index.length} index records and ${full.length} full records to data/.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
