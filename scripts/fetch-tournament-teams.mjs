#!/usr/bin/env node
/**
 * Fetch VGC tournament team data from pokedata.ovh (unofficial, fan-run)
 * and normalize it into lean JSON for the bot API.
 *
 * Usage: node scripts/fetch-tournament-teams.mjs 1000035 1000036 [...]
 *
 * For each tournament id:
 *   - GET https://www.pokedata.ovh/standings2/RosterData/<id>.json
 *   - GET https://www.pokedata.ovh/standings2/standings/<id>_Masters.json
 *   - keep Masters-division players with a full 6-Pokémon team,
 *     joined to standings for placement + W/L/T record
 *   - write public/tournament-teams/<id>.json
 *
 * Be gentle: 1s delay between requests, one fetch per URL per run,
 * normal browser User-Agent.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "tournament-teams");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Normalize a name for fallback matching ("CHIA,HAN LIN" vs "CHIA HAN LIN"). */
function normName(n) {
  return String(n ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normMon(raw) {
  // [dex, form, nature, <unused>, ability, species, item, [moves]]
  const [dex, , nature, , ability, species, item, moves] = raw;
  return {
    dex: parseInt(String(dex), 10),
    species: species ?? null,
    nature: nature ?? null,
    ability: ability ?? null,
    item: item ?? null,
    moves: Array.isArray(moves) ? moves.filter(Boolean) : [],
  };
}

async function fetchTournament(id) {
  const rosterUrl = `https://www.pokedata.ovh/standings2/RosterData/${id}.json`;
  const standingsUrl = `https://www.pokedata.ovh/standings2/standings/${id}_Masters.json`;

  const roster = await getJson(rosterUrl);
  await sleep(1000);
  const standingsDoc = await getJson(standingsUrl);
  await sleep(1000);

  const players = standingsDoc?.standings?.players ?? [];
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error(`no Masters standings players for ${id}`);
  }
  // Standings arrive sorted by points desc → placement = index + 1.
  const exact = new Map();
  const fuzzy = new Map();
  players.forEach((p, i) => {
    exact.set(`${p.n}||${p.c}`, { p, placement: i + 1 });
    fuzzy.set(`${normName(p.n)}||${p.c}`, { p, placement: i + 1 });
  });

  const title =
    standingsDoc?.tournament?.title ?? `Tournament ${id}`;
  const dates =
    standingsDoc?.tournament?.date ??
    (Array.isArray(standingsDoc?.tournament?.["Event dates"])
      ? standingsDoc.tournament["Event dates"][0]
      : null) ??
    null;

  const teams = [];
  let unmatched = 0;
  for (const entry of roster) {
    if (entry?.d !== "M") continue;
    const tl = entry?.tl;
    if (!Array.isArray(tl) || tl.length !== 6) continue;
    const hit =
      exact.get(`${entry.n}||${entry.c}`) ??
      fuzzy.get(`${normName(entry.n)}||${entry.c}`);
    if (!hit) {
      unmatched++;
      continue;
    }
    const [w = 0, l = 0, t = 0] = hit.p.s ?? [];
    teams.push({
      placement: hit.placement,
      player: hit.p.n,
      country: hit.p.c ?? null,
      record: t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`,
      pokemon: tl.map(normMon),
    });
  }
  teams.sort((a, b) => a.placement - b.placement);

  let note = null;
  let finalTeams = teams;
  const probe = JSON.stringify({ teams });
  if (probe.length > 2 * 1024 * 1024) {
    finalTeams = teams.slice(0, 200);
    note = `Truncated to top 200 of ${teams.length} by placement (2MB cap).`;
  }

  const out = {
    id: String(id),
    name: title,
    dates,
    division: "Masters",
    source: "pokedata.ovh (unofficial, fan-run)",
    teamCount: finalTeams.length,
    ...(note ? { note } : {}),
    teams: finalTeams,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${id}.json`);
  writeFileSync(path, JSON.stringify(out));
  const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024);
  console.log(
    `OK ${id}: ${finalTeams.length} teams (${kb}KB)${unmatched ? `, ${unmatched} unmatched roster entries skipped` : ""}${note ? " [truncated]" : ""} -> ${path}`,
  );
  return { id: String(id), teams: finalTeams.length, kb };
}

const ids = process.argv.slice(2);
if (ids.length === 0) {
  console.error(
    "Usage: node scripts/fetch-tournament-teams.mjs <tournamentId> [...]",
  );
  process.exit(1);
}

let ok = 0;
for (const id of ids) {
  try {
    await fetchTournament(id);
    ok++;
  } catch (err) {
    console.error(`FAIL ${id}: ${err.message}`);
  }
  await sleep(1000);
}
console.log(`Done: ${ok}/${ids.length} tournaments archived.`);
