/**
 * Fetch evolution chains from PokéAPI and bake them into data/evolutions.json.
 *
 * Output shape:
 *   {
 *     "chains": [ <root EvoNode>, ... ],
 *     "speciesToChain": { "<speciesId>": <chainIndex>, ... }
 *   }
 * EvoNode: { id, name, sprite, method, evolvesTo: [EvoNode] }
 *   - `method` is a short human label for how THIS species evolves from its
 *     parent (null on the chain root), e.g. "Lv. 16", "Thunder Stone", "Trade".
 *
 * Usage: node scripts/fetch-evolutions.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_RETRIES = 4;
const CONCURRENCY = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "pokemon-companion-data/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      console.warn(`  retry ${attempt}/${MAX_RETRIES} ${label}: ${err.message}`);
      if (attempt < MAX_RETRIES) await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

function cleanName(slug) {
  return String(slug)
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Pick the most useful evolution_details: prefer an item-based method
 *  (e.g. Leaf Stone) over a legacy location-based level-up, since stones
 *  are the definitive method in modern games. */
function pickDetail(details) {
  if (!details || details.length === 0) return null;
  return details.find((d) => d.trigger?.name === "use-item") ?? details[0];
}

/** Short human label for evolution_details, e.g. "Lv. 16", "Thunder Stone". */
function methodLabel(det) {
  if (!det || !det.trigger?.name) return null;
  const t = det.trigger.name;
  let base;
  if (t === "level-up") {
    base = det.min_level ? `Lv. ${det.min_level}` : "Level up";
  } else if (t === "trade") {
    base = det.held_item ? `Trade (${cleanName(det.held_item.name)})` : "Trade";
  } else if (t === "use-item") {
    base = det.item ? cleanName(det.item.name) : "Use item";
  } else {
    base = cleanName(t);
  }
  const qualifiers = [];
  if (det.min_happiness) qualifiers.push("high friendship");
  if (det.min_affection) qualifiers.push("high affection");
  if (det.min_beauty) qualifiers.push("high beauty");
  if (det.known_move?.name) qualifiers.push(`knowing ${cleanName(det.known_move.name)}`);
  if (det.known_move_type?.name) qualifiers.push(`${cleanName(det.known_move_type.name)} move`);
  if (det.party_species?.name) qualifiers.push(`with ${cleanName(det.party_species.name)} in party`);
  if (det.min_steps) qualifiers.push(`after ${det.min_steps} steps on foot`);
  if (det.needs_multiplayer) qualifiers.push("in a Union Circle group");
  if (det.time_of_day) qualifiers.push(det.time_of_day);
  return qualifiers.length > 0 ? `${base} · ${qualifiers.join(" · ")}` : base;
}

function speciesIdFromUrl(url) {
  const m = /\/pokemon-species\/(\d+)\/?$/.exec(url ?? "");
  return m ? Number(m[1]) : null;
}

function buildNode(apiNode, pokedexById) {
  const id = speciesIdFromUrl(apiNode.species?.url);
  const info = id != null ? pokedexById.get(id) : undefined;
  const det = pickDetail(apiNode.evolution_details);
  return {
    id,
    name: info?.name ?? cleanName(apiNode.species?.name ?? `species-${id}`),
    sprite: info?.sprites?.regular ?? null,
    method: methodLabel(det),
    evolvesTo: (apiNode.evolves_to ?? [])
      // Skip phantom "evolutions" with no method at all (e.g. PokéAPI
      // lists Phione -> Manaphy with zero evolution details, but Phione
      // does not evolve in the games).
      .filter((child) => (child.evolution_details ?? []).length > 0)
      .map((child) => buildNode(child, pokedexById)),
  };
}

function collectIds(node, out) {
  if (node.id != null) out.push(node.id);
  for (const child of node.evolvesTo) collectIds(child, out);
}

async function main() {
  const pokedex = JSON.parse(
    readFileSync(join(ROOT, "data", "pokedex-full.json"), "utf8")
  );
  const pokedexById = new Map(pokedex.map((s) => [s.id, s]));
  console.log(`Loaded ${pokedexById.size} species.`);

  const list = await fetchJson(
    "https://pokeapi.co/api/v2/evolution-chain/?limit=1000",
    "evolution-chain list"
  );
  console.log(`Found ${list.count} evolution chains.`);

  const chains = [];
  const speciesToChain = {};
  const queue = list.results.map((c) => c.url);
  let done = 0;

  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const chain = await fetchJson(url, `evolution-chain ${url}`);
      await sleep(300);
      const root = buildNode(chain.chain, pokedexById);
      const ids = [];
      collectIds(root, ids);
      const index = chains.length;
      chains.push(root);
      for (const id of ids) speciesToChain[String(id)] = index;
      done += 1;
      if (done % 50 === 0) console.log(`  ${done}/${list.count} chains`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Safety net: any species not covered by a chain (e.g. Manaphy, which
  // PokéAPI only lists as a detail-less child of Phione) gets its own
  // single-stage chain so every species has an Evolutions section lookup.
  for (const s of pokedex) {
    if (speciesToChain[String(s.id)] === undefined) {
      const index = chains.length;
      chains.push({
        id: s.id,
        name: s.name,
        sprite: s.sprites?.regular ?? null,
        method: null,
        evolvesTo: [],
      });
      speciesToChain[String(s.id)] = index;
    }
  }

  const outPath = join(ROOT, "data", "evolutions.json");
  writeFileSync(outPath, JSON.stringify({ chains, speciesToChain }));
  console.log(
    `Wrote ${outPath}: ${chains.length} chains covering ${Object.keys(speciesToChain).length} species.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
