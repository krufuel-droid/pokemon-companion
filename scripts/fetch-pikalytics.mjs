/**
 * Fetch competitive usage snapshots from Pikalytics' AI-friendly endpoints
 * and bake them into static JSON files consumed by /api/moveset:
 *   - data/pikalytics/gen9championsvgc2026regmc.json  (Champions VGC, doubles)
 *   - data/pikalytics/gen9championsou.json            (Champions OU, singles)
 *
 * Why Pikalytics: per-Pokémon pages publish most-common moves, items,
 * abilities (with %), plus featured tournament teams with full sets.
 * The /ai/ endpoints are explicitly made for programs (see
 * https://pikalytics.com/robots.txt — "AI-Optimized Endpoints").
 * Data is CC BY-NC 4.0; we credit Pikalytics in the snapshot metadata
 * and in every API response that serves it.
 *
 * Ability noise: Pikalytics' aggregate ability percentages are noisy on
 * young formats (e.g. "Basculegion with Trace"). Every aggregate ability
 * is validated against PokéAPI's legal ability list for the species and
 * dropped when impossible. The recommended set is derived from featured
 * teams (real observed sets), which don't have this problem.
 *
 * No EV/nature data is published on these pages — spreads stay null and
 * are a separate data source (PokeBase / Smogon ladder files).
 *
 * Politeness: ~1.2s between requests, identifying User-Agent, raw pages
 * cached under ~/.cache/pokemon-companion-pikalytics (outside the repo so
 * the cache is never pushed). A weekly cron re-runs this; cached pages
 * are re-fetched only with --refresh.
 *
 * Plain Node 24 — no dependencies. Run:
 *   node scripts/fetch-pikalytics.mjs [--format <code>] [--refresh] [--limit N]
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "data", "pikalytics");
const CACHE_DIR =
  process.env.PIKALYTICS_CACHE_DIR ||
  join(homedir(), ".cache", "pokemon-companion-pikalytics");

const UA =
  "PokemonCompanionBot/1.0 (+https://pokemon-companion-pi.vercel.app; weekly competitive usage snapshot; contact via site feedback)";
const DELAY_MS = 1200;
const FORMATS = {
  gen9championsvgc2026regmc: "Pokemon Champions VGC 2026 Reg M-C",
  gen9championsou: "Pokemon Champions OU",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url, { retries = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 404) return { status: 404, text: null };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: 200, text: await res.text() };
    } catch (e) {
      lastErr = e;
      await sleep(2000 * (i + 1));
    }
  }
  throw lastErr;
}

async function cachedFetch(cacheKey, url) {
  const path = join(CACHE_DIR, cacheKey);
  if (existsSync(path) && !REFRESH) return readFileSync(path, "utf8");
  const { status, text } = await fetchText(url);
  await sleep(DELAY_MS);
  if (status === 404 || text === null) return null;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  return text;
}

/** Parse the "Best 50 Pokemon by Usage" table on the AI format index. */
function parseRoster(indexMd) {
  const roster = [];
  const rowRe =
    /^\|\s*\d+\s*\|\s*\*\*(.+?)\*\*\s*\|\s*([\d.]+)%\s*\|\s*([\d.N/A%]+)\s*\|\s*([\d\-N/A]+)\s*\|.*\[AI\]\(([^)]+)\)/gm;
  let m;
  while ((m = rowRe.exec(indexMd)) !== null) {
    roster.push({
      name: m[1].trim(),
      usage: parseFloat(m[2]),
      winRate: m[3] === "N/A" ? null : parseFloat(m[3]),
      record: m[4] === "N/A" ? null : m[4],
      aiPath: m[5].trim(),
    });
  }
  return roster;
}

function parsePctList(md, section) {
  const out = [];
  const secRe = new RegExp(
    `## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`,
  );
  const sec = md.match(secRe);
  if (!sec) return out;
  const lineRe = /^-\s*\*\*(.+?)\*\*:\s*([\d.]+)%/gm;
  let m;
  while ((m = lineRe.exec(sec[1])) !== null) {
    out.push({ name: m[1].trim(), pct: parseFloat(m[2]) });
  }
  return out;
}

function parseQuickInfo(md) {
  const get = (label) => {
    const m = md.match(new RegExp(`\\|\\s*\\*\\*${label}\\*\\*\\s*\\|\\s*([^|]+?)\\s*\\|`));
    return m ? m[1].trim() : null;
  };
  const pct = (s) => (s ? parseFloat(s.replace("%", "")) : null);
  return {
    usage: pct(get("Usage")),
    winRate: pct(get("Win Rate")),
    record: get("Record"),
    dataDate: get("Data Date"),
  };
}

/** Parse "## Featured Teams with X" into full observed sets. */
function parseFeaturedTeams(md, pageName) {
  const teams = [];
  const secRe = /## Featured Teams with [\s\S]*?(?=\n## FAQ|\n## Additional|\n## User-Friendly|$)/;
  const sec = md.match(secRe);
  if (!sec) return teams;
  const blocks = sec[0].split(/^### Team \d+ by /m).slice(1);
  for (const b of blocks) {
    const author = b.split("\n")[0].trim();
    const ability = b.match(/-\s*\*\*Ability\*\*:\s*(.+)/)?.[1]?.trim() ?? null;
    const item = b.match(/-\s*\*\*Item\*\*:\s*(.+)/)?.[1]?.trim() ?? null;
    const movesRaw = b.match(/-\s*\*\*Moves\*\*:\s*(.+)/)?.[1]?.trim() ?? "";
    const moves = movesRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const record = b.match(/\*Record:\s*([^*]+)\*/)?.[1]?.trim() ?? null;
    const event = b.match(/\*Event:\s*([^*]+)\*/)?.[1]?.trim() ?? null;
    const pokemonLine = b.match(/\*\*Pokemon\*\*:\s*(.+)/)?.[1]?.trim() ?? null;
    if (moves.length === 0) continue;
    teams.push({ author, record, event, pokemon: pokemonLine, ability, item, moves });
  }
  return teams;
}

/** Most common featured-team set (ability+item+moves); null when no teams. */
function recommendedSet(teams) {
  if (teams.length === 0) return null;
  const groups = new Map();
  for (const t of teams) {
    const key = JSON.stringify([
      t.ability, t.item, [...t.moves].sort(),
    ]);
    if (!groups.has(key)) {
      groups.set(key, {
        ability: t.ability, item: t.item, moves: t.moves,
        observations: 0, sources: [],
      });
    }
    const g = groups.get(key);
    g.observations += 1;
    g.sources.push(
      [t.author, t.record, t.event].filter(Boolean).join(" — "),
    );
  }
  return [...groups.values()].sort((a, b) => b.observations - a.observations)[0];
}

// --- Ability validation against PokéAPI -----------------------------------

const abilityCache = new Map();
function pokeApiSlug(pikalyticsName) {
  return pikalyticsName
    .toLowerCase()
    .replace(/-mega-([xyz])$/, "-mega-$1")
    .replace(/-mega$/, "-mega")
    .replace(/-hisui$/, "-hisui")
    .replace(/-alola$/, "-alola")
    .replace(/-galar$/, "-galar")
    .replace(/-paldea$/, "-paldea")
    .replace(/-f$/, "-female")
    .replace(/-eternal-mega$/, "-eternal")
    .replace(/\s+/g, "-");
}

async function legalAbilities(pikalyticsName) {
  if (abilityCache.has(pikalyticsName)) return abilityCache.get(pikalyticsName);
  const slug = pokeApiSlug(pikalyticsName);
  const cachePath = join(CACHE_DIR, "pokeapi-abilities", `${slug}.json`);
  let names = null;
  let validated = false;
  if (existsSync(cachePath) && !REFRESH) {
    try {
      const cached = JSON.parse(readFileSync(cachePath, "utf8"));
      names = cached.abilities; validated = cached.validated;
    } catch { /* fall through to fetch */ }
  }
  if (names === null) {
    try {
      const { status, text } = await fetchText(`https://pokeapi.co/api/v2/pokemon/${slug}`);
      await sleep(600);
      if (status === 200 && text) {
        const data = JSON.parse(text);
        names = data.abilities.map((a) =>
          a.ability.name.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
        );
        validated = true;
      } else {
        validated = false; // no PokéAPI entry (e.g. Champions-original forms)
      }
    } catch {
      validated = false;
    }
    mkdirSync(dirname(cachePath), { recursive: true });
    writeFileSync(cachePath, JSON.stringify({ abilities: names, validated }));
  }
  const result = { abilities: names, validated };
  abilityCache.set(pikalyticsName, result);
  return result;
}

const titleCase = (s) =>
  s.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");

/** Pikalytics slug → our canonical "Mega X" form label when applicable. */
function toOurFormLabel(pikalyticsName) {
  let m = pikalyticsName.match(/^(.+)-Mega-([XYZ])$/i);
  if (m) return `Mega ${m[1]} ${m[2].toUpperCase()}`;
  m = pikalyticsName.match(/^(.+)-Mega$/i);
  if (m) return `Mega ${m[1]}`;
  return null;
}

// --- Main -------------------------------------------------------------------

const args = process.argv.slice(2);
const REFRESH = args.includes("--refresh");
const formatArg = (() => {
  const i = args.indexOf("--format");
  return i >= 0 ? args[i + 1] : null;
})();
const limitArg = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? parseInt(args[i + 1], 10) : null;
})();

const failures = [];
const droppedAbilities = [];

async function scrapeFormat(format) {
  const label = FORMATS[format];
  console.log(`\n=== ${label} (${format}) ===`);
  const indexMd = await cachedFetch(`${format}/_index.md`, `https://www.pikalytics.com/ai/pokedex/${format}`);
  if (!indexMd) throw new Error(`Could not fetch format index for ${format}`);
  let roster = parseRoster(indexMd);
  if (limitArg) roster = roster.slice(0, limitArg);
  console.log(`roster: ${roster.length} pokemon`);

  const pokemon = {};
  let ok = 0;
  let dataDate = null;
  for (const entry of roster) {
    const aiUrl = entry.aiPath.startsWith("http")
      ? entry.aiPath
      : `https://www.pikalytics.com${entry.aiPath}`;
    const slug = aiUrl.split("/").pop();
    let md = null;
    try {
      md = await cachedFetch(`${format}/${slug}.md`, aiUrl);
    } catch (e) {
      failures.push(`${format}/${entry.name}: ${e.message}`);
      continue;
    }
    if (!md) {
      failures.push(`${format}/${entry.name}: 404 at ${aiUrl}`);
      continue;
    }
    const info = parseQuickInfo(md);
    if (!dataDate && info.dataDate) dataDate = info.dataDate;
    const moves = parsePctList(md, "Common Moves");
    const items = parsePctList(md, "Common Items");
    const abilitiesRaw = parsePctList(md, "Common Abilities");
    const teammates = parsePctList(md, "Common Teammates");
    const featuredTeams = parseFeaturedTeams(md, entry.name);

    // Validate aggregate abilities against PokéAPI legal abilities.
    const { abilities: legal, validated } = await legalAbilities(entry.name);
    const legalSet = legal ? new Set(legal.map((a) => a.toLowerCase())) : null;
    const abilities = [];
    for (const a of abilitiesRaw) {
      if (legalSet && !legalSet.has(a.name.toLowerCase())) {
        droppedAbilities.push(`${format}/${entry.name}: dropped impossible ability "${a.name}" (${a.pct}%)`);
        continue;
      }
      abilities.push(a);
    }

    const rec = recommendedSet(featuredTeams);
    const fallbackSet = !rec && moves.length > 0
      ? {
          ability: abilities[0]?.name ?? null,
          item: items[0]?.name ?? null,
          moves: moves.slice(0, 4).map((m) => m.name),
          observations: 0,
          sources: [],
          note: "Derived from aggregate usage (no featured teams published).",
        }
      : null;

    pokemon[entry.name] = {
      name: entry.name,
      ourFormLabel: toOurFormLabel(entry.name),
      usage: info.usage ?? entry.usage ?? null,
      winRate: info.winRate ?? entry.winRate ?? null,
      record: info.record ?? entry.record ?? null,
      moves: moves.slice(0, 12),
      items: items.slice(0, 8),
      abilities,
      abilitiesValidated: validated,
      teammates: teammates.slice(0, 8),
      recommendedSet: rec ?? fallbackSet,
      featuredTeams: featuredTeams.slice(0, 10),
    };
    ok++;
    if (ok % 10 === 0) console.log(`  ...${ok}/${roster.length}`);
  }

  const snapshot = {
    format,
    formatLabel: label,
    source: {
      label: "Pikalytics",
      url: "https://pikalytics.com",
      license: "CC BY-NC 4.0",
      note: "Usage data aggregated by Pikalytics from ranked battles. Ability aggregates validated against PokéAPI; impossible entries dropped (see droppedAbilities in scraper log).",
    },
    dataDate,
    fetchedAt: new Date().toISOString(),
    roster: roster.map((r) => r.name),
    pokemon,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${format}.json`);
  writeFileSync(outPath, JSON.stringify(snapshot, null, 1));
  console.log(`wrote ${outPath} (${ok} ok, ${roster.length - ok} failed)`);
  return { format, ok, total: roster.length };
}

async function main() {
  const formats = formatArg ? [formatArg] : Object.keys(FORMATS);
  for (const f of formats) {
    if (!FORMATS[f]) throw new Error(`Unknown format: ${f}. Known: ${Object.keys(FORMATS).join(", ")}`);
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  for (const f of formats) await scrapeFormat(f);

  console.log(`\n--- done ---`);
  console.log(`dropped ${droppedAbilities.length} impossible ability entries`);
  for (const d of droppedAbilities.slice(0, 15)) console.log(`  ${d}`);
  if (droppedAbilities.length > 15) console.log(`  ...and ${droppedAbilities.length - 15} more`);
  if (failures.length > 0) {
    console.log(`failures (${failures.length}):`);
    for (const f of failures.slice(0, 15)) console.log(`  ${f}`);
    if (failures.length > 15) console.log(`  ...and ${failures.length - 15} more`);
  }
}

main().catch((e) => {
  console.error("SCRAPER FAILED:", e.message);
  process.exit(1);
});
