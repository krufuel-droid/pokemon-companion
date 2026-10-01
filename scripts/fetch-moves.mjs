/**
 * Fetch all standard Pokémon moves from the public PokéAPI and bake them
 * into a static JSON file consumed by lib/data/moves.ts:
 *   - data/moves.json  (name, type, category, power, accuracy, pp, priority,
 *                       short effect, full effect)
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

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");
const CONCURRENCY = 8;
const MAX_RETRIES = 3;

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
]);

function isExcluded(name) {
  return (
    Z_MOVE_NAMES.has(name) ||
    name.startsWith("max-") ||
    name.startsWith("g-max-")
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
    return {
      id: m.id,
      name: prettyName(m.name),
      type: capitalize(m.type.name),
      category: capitalize(m.damage_class.name),
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
      priority: m.priority,
      shortEffect: en ? en.short_effect.replace(/\s+/g, " ").trim() : "",
      effect: en ? en.effect.replace(/\s+/g, " ").trim() : "",
    };
  }
);

if (failures.length > 0) {
  console.error("FAILED MOVES:");
  for (const f of failures) console.error(` - ${f.item.name}: ${f.err}`);
  process.exit(1);
}

const moves = results.filter(Boolean).sort((a, b) => a.id - b.id);
mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(join(DATA_DIR, "moves.json"), JSON.stringify(moves, null, 1));
console.log(`Wrote ${moves.length} moves to data/moves.json`);
