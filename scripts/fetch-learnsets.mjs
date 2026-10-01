/**
 * Build per-game level-up learnsets for every species (1-1025) from the
 * public PokeAPI and write one small static JSON file per species:
 *   public/learnsets/<id>.json
 *
 * Each file is self-contained (move type/power/etc. joined from
 * data/moves.json at build time) so the detail page can fetch just the
 * one it needs when the "Level-up moves" accordion opens.
 *
 * Plain Node 24 - no dependencies. Run with:
 *   node scripts/fetch-learnsets.mjs
 * Smoke test on a few species first with:
 *   LIMIT=5 node scripts/fetch-learnsets.mjs
 *
 * Takes a few minutes (~1050 API calls at concurrency 8).
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "learnsets");
const CONCURRENCY = 3;
const MAX_RETRIES = 3;
const LIMIT = Number(process.env.LIMIT ?? 1025);

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
  "the-isle-of-armor": "The Isle of Armor",
  "the-crown-tundra": "The Crown Tundra",
  "brilliant-diamond": "Brilliant Diamond",
  "shining-pearl": "Shining Pearl",
  "legends-arceus": "Legends: Arceus",
  scarlet: "Scarlet",
  violet: "Violet",
  "the-teal-mask": "The Teal Mask",
  "the-indigo-disk": "The Indigo Disk",
  "the-teal-mask-scarlet": "The Teal Mask",
  "the-teal-mask-violet": "The Teal Mask",
  "the-indigo-disk-scarlet": "The Indigo Disk",
  "the-indigo-disk-violet": "The Indigo Disk",
  "legends-za": "Legends: Z-A",
  colosseum: "Colosseum",
  xd: "XD: Gale of Darkness",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function displayName(slug) {
  return slug
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

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
      if (attempt < MAX_RETRIES) await sleep(1500 * attempt);
    }
  }
  throw lastErr;
}

/** Chronological version-group info: order + friendly game label. */
async function loadVersionGroups() {
  const list = await fetchJson(
    "https://pokeapi.co/api/v2/version-group/?limit=100",
    "version-group list"
  );
  const groups = [];
  const queue = list.results.map((g) => g.url);
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const g = await fetchJson(url, `version-group ${url}`);
      await sleep(400);
      const versions = (g.versions ?? []).map((v) => v.name);
      // Dedupe: DLC version groups list per-game variants of the same game
      // (e.g. the-teal-mask-scarlet / the-teal-mask-violet).
      const label = [
        ...new Set(versions.map((v) => VERSION_LABELS[v] ?? displayName(v))),
      ].join(" & ");
      groups.push({ vg: g.name, order: g.order, label });
    }
  }
  await Promise.all(Array.from({ length: 2 }, () => worker()));
  groups.sort((a, b) => a.order - b.order);
  return groups;
}

function buildLearnsets(pokemon, moveInfo) {
  // vg -> Map(key `${level}|${slug}` -> row)
  const byGroup = new Map();
  for (const m of pokemon.moves ?? []) {
    const slug = m.move?.name;
    if (!slug) continue;
    for (const vgd of m.version_group_details ?? []) {
      if (vgd.move_learn_method?.name !== "level-up") continue;
      const vg = vgd.version_group?.name;
      if (!vg) continue;
      const level = vgd.level_learned_at ?? 0;
      if (!byGroup.has(vg)) byGroup.set(vg, new Map());
      const key = `${level}|${slug}`;
      if (!byGroup.get(vg).has(key)) {
        const info = moveInfo.get(displayName(slug)) ?? {};
        byGroup.get(vg).set(key, {
          level,
          move: displayName(slug),
          type: info.type ?? null,
          category: info.category ?? null,
          power: typeof info.power === "number" ? info.power : null,
          accuracy: typeof info.accuracy === "number" ? info.accuracy : null,
        });
      }
    }
  }
  return byGroup;
}

async function main() {
  // Move details joined at build time so each file is self-contained.
  const moves = JSON.parse(readFileSync(join(ROOT, "data", "moves.json"), "utf8"));
  const moveInfo = new Map(moves.map((m) => [m.name, m]));
  console.log(`Loaded ${moveInfo.size} moves for detail join.`);

  console.log("Loading version groups...");
  const vgInfo = await loadVersionGroups();
  const vgByName = new Map(vgInfo.map((g) => [g.vg, g]));
  console.log(`Found ${vgInfo.length} version groups.`);

  const allIds = Array.from({ length: Math.min(LIMIT, 1025) }, (_, i) => i + 1);
  // Resumable: skip species whose output file already exists and is non-empty.
  mkdirSync(OUT_DIR, { recursive: true });
  const ids = allIds.filter((id) => {
    const f = join(OUT_DIR, `${id}.json`);
    try {
      return statSync(f).size === 0;
    } catch {
      return !existsSync(f);
    }
  });
  console.log(`Skipping ${allIds.length - ids.length} already-fetched species; ${ids.length} remaining.`);
  const failures = [];
  let done = 0;

  async function worker(queue) {
    while (queue.length) {
      const id = queue.shift();
      try {
        const pokemon = await fetchJson(
          `https://pokeapi.co/api/v2/pokemon/${id}`,
          `pokemon ${id}`
        );
        await sleep(400);
        const byGroup = buildLearnsets(pokemon, moveInfo);
        const games = [];
        for (const [vg, rows] of byGroup) {
          const info = vgByName.get(vg);
          const movesArr = [...rows.values()].sort(
            (a, b) => a.level - b.level || a.move.localeCompare(b.move)
          );
          if (movesArr.length === 0) continue;
          games.push({
            vg,
            label: info?.label ?? displayName(vg),
            order: info?.order ?? 999,
            moves: movesArr,
          });
        }
        // Newest game first.
        games.sort((a, b) => b.order - a.order);
        const record = {
          id,
          name: displayName(pokemon.name),
          games,
        };
        writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(record) + "\n");
      } catch (err) {
        failures.push({ id, error: String(err?.message ?? err) });
        console.error(`  FAILED ${id}: ${err?.message ?? err}`);
      }
      done++;
      if (done % 100 === 0 || done === ids.length) {
        console.log(`  progress: ${done}/${ids.length}`);
      }
    }
  }

  const queue = [...ids];
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

  if (failures.length) {
    console.error(`\n${failures.length} species failed after ${MAX_RETRIES} retries:`);
    for (const f of failures) console.error(`  - ${f.id}: ${f.error}`);
    process.exit(1);
  }
  console.log(`\nDone. Wrote ${ids.length} learnset files to public/learnsets/.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
