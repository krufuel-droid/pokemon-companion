/**
 * Fetch all standard Pokémon moves from the public PokéAPI and bake them
 * into static JSON files consumed by lib/data/moves.ts:
 *   - data/moves.json         (id, name, type, category, power, accuracy,
 *                              pp, priority, generation number, short effect,
 *                              full effect, learnedBy species ids)
 *   - data/move-species.json  (compact id/name/sprite lookup for every
 *                              species referenced by any move's learnset)
 *
 * learned_by_pokemon names are resolved to National Pokédex species ids
 * using data/pokedex-full.json slugs; form names (e.g. "deoxys-attack",
 * "raichu-mega-x") fall back to their base species. Unresolvable names
 * are counted and reported, never guessed.
 *
 * Z-Moves and Max/G-Max moves are excluded (they aren't standard moves).
 *
 * Plain Node 24 — no dependencies. Run once with:
 *   node scripts/fetch-moves.mjs
 *
 * Takes a few minutes (~1000 API calls). If any move fails after retries,
 * the script exits nonzero and lists the failed names instead of silently
 * skipping.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");
const CONCURRENCY = 8;
const MAX_RETRIES = 3;

/** PokéAPI species slugs (data/pokedex-full.json) for learnset resolution. */
const pokedexFull = JSON.parse(
  readFileSync(join(DATA_DIR, "pokedex-full.json"), "utf8")
);
const slugToSpecies = new Map(
  pokedexFull.map((s) => [
    s.slug,
    { id: s.id, name: s.name, sprite: s.sprites.regular },
  ])
);

/**
 * Resolve a PokéAPI pokemon name (e.g. "pikachu", "deoxys-attack",
 * "raichu-mega-x", "meowstic-female-mega") to a National Pokédex species
 * id. Exact slug match first, then strip trailing form segments.
 * Returns null when nothing resolves — the caller reports it.
 */
function resolveSpeciesId(pokemonName) {
  let name = pokemonName;
  while (name.length > 0) {
    const hit = slugToSpecies.get(name);
    if (hit) return hit.id;
    const dash = name.lastIndexOf("-");
    if (dash === -1) return null;
    name = name.slice(0, dash);
  }
  return null;
}

const GEN_NUMBER = {
  "generation-i": 1,
  "generation-ii": 2,
  "generation-iii": 3,
  "generation-iv": 4,
  "generation-v": 5,
  "generation-vi": 6,
  "generation-vii": 7,
  "generation-viii": 8,
  "generation-ix": 9,
};

/** Z-Moves have no consistent name prefix, so list them explicitly. */
const Z_MOVE_NAMES = new Set([
  "breakneck-blitz",
  "all-out-pummeling",
  "supersonic-skystrike",
  "acid-downpour",
  "tectonic-rage",
  "continental-crush",
  "savage-spin-out",
  "never-ending-nightmare",
  "corkscrew-crash",
  "inferno-overdrive",
  "hydro-vortex",
  "bloom-doom",
  "gigavolt-havoc",
  "shattered-psyche",
  "subzero-slammer",
  "devastating-drake",
  "black-hole-eclipse",
  "twinkle-tackle",
  "catastropika",
  "sinister-arrow-raid",
  "malicious-moonsault",
  "oceanic-operetta",
  "guardian-of-alola",
  "soul-stealing-7-star-strike",
  "stoked-sparksurfer",
  "pulverizing-pancake",
  "extreme-evoboost",
  "genesis-supernova",
  "clangorous-soulblaze",
  // Signature Z-Moves missing from most lists:
  "10-000-000-volt-thunderbolt",
  "light-that-burns-the-sky",
  "searing-sunraze-smash",
  "menacing-moonraze-maelstrom",
  "lets-snuggle-forever",
  "splintered-stormshards",
]);

function isExcluded(name) {
  return (
    Z_MOVE_NAMES.has(name) ||
    name.startsWith("max-") ||
    name.startsWith("g-max-") ||
    // Physical/Special variants of the generic Z-Moves, e.g.
    // "breakneck-blitz--physical".
    name.includes("--")
  );
}

function prettyName(slug) {
  return slug
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function capitalize(s) {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "pokemon-companion-data-script" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return fetchJson(url, attempt + 1);
    }
    throw err;
  }
}

async function mapPool(items, size, fn) {
  const results = new Array(items.length);
  const failures = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i]);
      } catch (err) {
        failures.push({ item: items[i], err: String(err) });
        results[i] = null;
      }
      if ((i + 1) % 100 === 0 || i + 1 === items.length) {
        console.log(`  ...${i + 1}/${items.length}`);
      }
    }
  }
  await Promise.all(Array.from({ length: size }, worker));
  return { results, failures };
}

const list = await fetchJson("https://pokeapi.co/api/v2/move?limit=2000");
const entries = list.results.filter((m) => !isExcluded(m.name));

// PokéAPI's learned_by_pokemon is empty for a few signature moves whose
// learnsets are form-locked or otherwise missing upstream. Hand-verified
// overrides (National Pokédex species ids), keyed by move slug:
// - Torque moves: Ogerpon's signature moves, one per mask form (1017)
// - Behemoth Blade / Behemoth Bash: Zacian (888) / Zamazenta (889)
// - Pika Papow / Veevee Volley: Let's Go partner moves, Pikachu (25) / Eevee (133)
const LEARNSET_OVERRIDES = {
  "blazing-torque": [1017],
  "wicked-torque": [1017],
  "noxious-torque": [1017],
  "combat-torque": [1017],
  "magical-torque": [1017],
  "behemoth-blade": [888],
  "behemoth-bash": [889],
  "pika-papow": [25],
  "veevee-volley": [133],
};
console.log(
  `Found ${list.results.length} moves; keeping ${entries.length} after exclusions.`
);

const { results, failures } = await mapPool(
  entries,
  CONCURRENCY,
  async (entry) => {
    const m = await fetchJson(entry.url);
    const en = (m.effect_entries || []).find(
      (e) => e.language && e.language.name === "en"
    );
    const learnedBy = new Set();
    const unresolved = [];
    for (const p of m.learned_by_pokemon || []) {
      const id = resolveSpeciesId(p.name);
      if (id === null) unresolved.push(p.name);
      else learnedBy.add(id);
    }
    // Apply hand-verified overrides for signature moves PokéAPI leaves empty.
    for (const id of LEARNSET_OVERRIDES[entry.name] || []) learnedBy.add(id);
    return {
      id: m.id,
      name: prettyName(m.name),
      type: capitalize(m.type.name),
      category: capitalize(m.damage_class.name),
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
      priority: m.priority,
      gen: GEN_NUMBER[m.generation?.name] ?? null,
      shortEffect: en ? en.short_effect.replace(/\s+/g, " ").trim() : "",
      effect: en ? en.effect.replace(/\s+/g, " ").trim() : "",
      learnedBy: [...learnedBy].sort((a, b) => a - b),
      unresolved,
    };
  }
);

if (failures.length > 0) {
  console.error("FAILED MOVES:");
  for (const f of failures) console.error(` - ${f.item.name}: ${f.err}`);
  process.exit(1);
}

const moves = results.filter(Boolean).sort((a, b) => a.id - b.id);

// Report (but don't fail on) unresolvable learnset names.
const unresolvedNames = new Set();
for (const m of moves) for (const n of m.unresolved) unresolvedNames.add(n);
if (unresolvedNames.size > 0) {
  console.log(
    `Unresolved learnset names (${unresolvedNames.size}): ${[...unresolvedNames].slice(0, 20).join(", ")}${unresolvedNames.size > 20 ? "…" : ""}`
  );
}

const referencedIds = new Set();
for (const m of moves) {
  delete m.unresolved;
  for (const id of m.learnedBy) referencedIds.add(id);
}

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(join(DATA_DIR, "moves.json"), JSON.stringify(moves, null, 1));
console.log(`Wrote ${moves.length} moves to data/moves.json`);

// Compact species lookup for the learnset UI (id, name, sprite only).
const moveSpecies = [...referencedIds]
  .sort((a, b) => a - b)
  .map((id) => {
    const s = pokedexFull.find((sp) => sp.id === id);
    return { id, name: s.name, sprite: s.sprites.regular };
  });
writeFileSync(
  join(DATA_DIR, "move-species.json"),
  JSON.stringify(moveSpecies, null, 1)
);
console.log(
  `Wrote ${moveSpecies.length} referenced species to data/move-species.json`
);
