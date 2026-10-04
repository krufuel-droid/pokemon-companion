/**
 * GET /api/usage — species usage statistics computed from the archived
 * VGC tournament team lists (public/tournament-teams/*.json).
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine):
 * "how often does each Pokémon actually show up on real tournament teams,
 *  and what do those teams run on it?" Read-only, no login required.
 *
 * Source: pokedata.ovh (unofficial, fan-run) roster data, normalized by
 * scripts/fetch-tournament-teams.mjs. Masters division only, full
 * 6-Pokémon teams only.
 *
 * - GET /api/usage → this document + tournament list.
 * - GET /api/usage?limit=50 → global usage across all archived tournaments
 *   (limit default 50, max 231).
 * - GET /api/usage?tournament=<id>&limit=50 → usage scoped to one
 *   tournament. Unknown id → 400 listing valid ids.
 * - GET /api/usage?pokemon=<name> → Limitless-style usage spreads for one
 *   species across all archived tournaments: top items, moves, abilities,
 *   and natures. Case-insensitive; label forms work too ("Eternal Flower
 *   Floette", "Floette"). No match or ambiguous match → 400 with
 *   suggestions.
 *
 * LIMITATIONS: usage = % of archived teams, NOT official Limitless
 * percentages. The archive covers the tournaments listed here; it is not
 * every event ever played. `forms` breaks a species down by the bracket
 * labels in the source data (e.g. "Hisuian Form", "Male", "Eternal Flower");
 * "Standard" means no label was present.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

const SOURCE = "pokedata.ovh (unofficial, fan-run)";
const MAX_LIMIT = 231;

interface TeamPokemon {
  dex: number;
  species: string;
  nature?: string;
  ability?: string;
  item?: string;
  moves?: string[];
}

interface SpeciesUsage {
  species: string;
  dex: number;
  teams: number;
  pct: number;
  forms: Record<string, number>;
}

interface TournamentUsage {
  id: string;
  name: string;
  dates: string | null;
  teamCount: number;
  usage: SpeciesUsage[];
}

/** Per-species spread counts, aggregated across all archived tournaments. */
interface SpreadAgg {
  items: Map<string, number>;
  moves: Map<string, number>;
  abilities: Map<string, number>;
  natures: Map<string, number>;
}

interface SpreadEntry {
  name: string;
  teams: number;
  pct: number;
}

interface UsageCache {
  tournaments: TournamentUsage[];
  global: SpeciesUsage[];
  totalTeams: number;
  spreads: Map<string, SpreadAgg>;
}

const LABEL_RE = /\s*\[([^\]]+)\]\s*$/;

/** "Arcanine [Hisuian Form]" → { base: "Arcanine", label: "Hisuian Form" }. */
function splitLabel(species: string): { base: string; label: string } {
  const m = species.match(LABEL_RE);
  if (!m) return { base: species.trim(), label: "Standard" };
  return {
    base: species.slice(0, m.index).trim(),
    label: m[1].trim(),
  };
}

function bump(map: Map<string, number>, value: unknown): void {
  if (typeof value !== "string") return;
  const v = value.trim();
  if (!v) return;
  map.set(v, (map.get(v) ?? 0) + 1);
}

function buildUsage(
  teams: TeamPokemon[][],
  spreads?: Map<string, SpreadAgg>,
): SpeciesUsage[] {
  const total = teams.length;
  if (total === 0) return [];
  const agg = new Map<
    string,
    { dex: number; teamCount: number; forms: Map<string, number> }
  >();
  for (const team of teams) {
    const seenSpecies = new Set<string>();
    const seenForms = new Set<string>();
    for (const p of team) {
      const name = typeof p.species === "string" ? p.species : "";
      if (!name) continue;
      const { base, label } = splitLabel(name);
      let rec = agg.get(base);
      if (!rec) {
        rec = {
          dex: typeof p.dex === "number" ? p.dex : 0,
          teamCount: 0,
          forms: new Map<string, number>(),
        };
        agg.set(base, rec);
      }
      // A team counts once per species, even if it somehow runs two.
      if (!seenSpecies.has(base)) {
        seenSpecies.add(base);
        rec.teamCount += 1;
        // Spreads: first occurrence of this species on this team.
        if (spreads) {
          let s = spreads.get(base);
          if (!s) {
            s = {
              items: new Map<string, number>(),
              moves: new Map<string, number>(),
              abilities: new Map<string, number>(),
              natures: new Map<string, number>(),
            };
            spreads.set(base, s);
          }
          bump(s.items, p.item);
          bump(s.abilities, p.ability);
          bump(s.natures, p.nature);
          if (Array.isArray(p.moves)) {
            const seenMoves = new Set<string>();
            for (const mv of p.moves) {
              if (typeof mv !== "string") continue;
              const m = mv.trim();
              if (!m || seenMoves.has(m)) continue;
              seenMoves.add(m);
              s.moves.set(m, (s.moves.get(m) ?? 0) + 1);
            }
          }
        }
      }
      const formKey = `${base}|${label}`;
      if (!seenForms.has(formKey)) {
        seenForms.add(formKey);
        rec.forms.set(label, (rec.forms.get(label) ?? 0) + 1);
      }
    }
  }
  return [...agg.entries()]
    .map(([species, rec]) => ({
      species,
      dex: rec.dex,
      teams: rec.teamCount,
      pct: Math.round((rec.teamCount / total) * 1000) / 10,
      forms: Object.fromEntries(rec.forms),
    }))
    .sort(
      (a, b) =>
        b.pct - a.pct ||
        b.teams - a.teams ||
        a.species.localeCompare(b.species),
    );
}

let cache: UsageCache | null = null;

/** Read every archived tournament once and precompute usage + spreads. */
function loadCache(): UsageCache {
  if (cache) return cache;
  const dir = join(process.cwd(), "public", "tournament-teams");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    files = [];
  }
  const tournaments: TournamentUsage[] = [];
  const allTeams: TeamPokemon[][] = [];
  for (const f of files.sort()) {
    try {
      const d = JSON.parse(readFileSync(join(dir, f), "utf-8")) as {
        id?: string;
        name?: string;
        dates?: string | null;
        teams?: Array<{ pokemon?: TeamPokemon[] }>;
      };
      const teams = (d.teams ?? []).map((t) => t.pokemon ?? []);
      tournaments.push({
        id: String(d.id ?? f.replace(/\.json$/, "")),
        name: d.name ?? f,
        dates: d.dates ?? null,
        teamCount: teams.length,
        usage: buildUsage(teams),
      });
      for (const team of teams) allTeams.push(team);
    } catch {
      // Skip unreadable files; the archive stays usable.
    }
  }
  const spreads = new Map<string, SpreadAgg>();
  cache = {
    tournaments,
    global: buildUsage(allTeams, spreads),
    totalTeams: allTeams.length,
    spreads,
  };
  return cache;
}

const TOK_RE = /[^a-z0-9]+/i;
function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(TOK_RE)
    .filter((t) => t.length > 0);
}

/**
 * Find species matching a free-text query. Matches against the base name,
 * the full label forms ("Floette [Eternal Flower]"), the label text alone,
 * and token-subset matches so "Eternal Flower Floette" finds Floette.
 */
function findSpecies(
  c: UsageCache,
  query: string,
): { matches: SpeciesUsage[] } {
  const q = query.trim().toLowerCase();
  const matches: SpeciesUsage[] = [];
  if (!q) return { matches };
  const qTokens = tokens(q);
  for (const entry of c.global) {
    const base = entry.species.toLowerCase();
    const labels = Object.keys(entry.forms).filter((l) => l !== "Standard");
    const fullForms = labels.map((l) => `${entry.species} [${l}]`.toLowerCase());
    const tokenSet = new Set<string>();
    for (const s of [base, ...fullForms]) {
      for (const t of tokens(s)) tokenSet.add(t);
    }
    const exact =
      q === base ||
      fullForms.some(
        (f) => q === f || q === f.replace(/[\[\]]/g, "").trim(),
      );
    const fuzzy =
      base.includes(q) ||
      fullForms.some((f) => f.includes(q)) ||
      qTokens.every((t) => tokenSet.has(t));
    if (exact || fuzzy) matches.push(entry);
  }
  return { matches };
}

function topSpreads(
  map: Map<string, number> | undefined,
  speciesTeams: number,
  n: number,
): SpreadEntry[] {
  if (speciesTeams === 0) return [];
  return [...(map ?? new Map<string, number>()).entries()]
    .map(([name, teams]) => ({
      name,
      teams,
      pct: Math.round((teams / speciesTeams) * 1000) / 10,
    }))
    .sort(
      (a, b) =>
        b.teams - a.teams ||
        b.pct - a.pct ||
        a.name.localeCompare(b.name),
    )
    .slice(0, n);
}

function docs(c: UsageCache) {
  return {
    name: "Poké Companion species usage statistics",
    usage:
      "GET /api/usage → this document + tournament list. " +
      "GET /api/usage?limit=50 → global usage across all archived tournaments " +
      "(limit default 50, max 231). " +
      "GET /api/usage?tournament=<id>&limit=50 → usage for one tournament. " +
      "GET /api/usage?pokemon=<name> → usage spreads for one species " +
      "(items, moves, abilities, natures) across all archived tournaments.",
    example: "/api/usage?pokemon=Metagross",
    entryShape: {
      species: "Rillaboom",
      dex: 812,
      teams: 3120,
      pct: 44.1,
      forms: { Standard: 3120 },
    },
    spreadShape: {
      species: "Metagross",
      dex: 376,
      teams: 150,
      pct: 2.1,
      tournaments: 8,
      source: SOURCE,
      forms: { Standard: 150 },
      items: [{ name: "Metagrossite", teams: 120, pct: 80.0 }],
      moves: [{ name: "Psychic Fangs", teams: 145, pct: 96.7 }],
      abilities: [{ name: "Clear Body", teams: 150, pct: 100.0 }],
      natures: [{ name: "Adamant", teams: 90, pct: 60.0 }],
    },
    notes: [
      "pct = % of archived teams running the species (a team counts once per species).",
      "In ?pokemon= spreads, pct = % of that species' teams running the item/move/ability/nature.",
      'forms breaks a species down by source labels ("Hisuian Form", "Male", "Eternal Flower"); "Standard" = no label present.',
      `Source: ${SOURCE}. Masters division only; only full 6-Pokémon team lists included.`,
      "Usage is % of archived teams, not official Limitless percentages.",
    ],
    tournaments: c.tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      dates: t.dates,
      teamCount: t.teamCount,
    })),
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const c = loadCache();
  const tournamentId = url.searchParams.get("tournament");
  const rawLimit = url.searchParams.get("limit");
  const pokemonQuery = url.searchParams.get("pokemon");

  // Per-species usage spreads (global across all archived tournaments).
  if (pokemonQuery !== null) {
    const { matches } = findSpecies(c, pokemonQuery);
    if (matches.length === 1) {
      const entry = matches[0];
      const agg = c.spreads.get(entry.species);
      return Response.json(
        {
          species: entry.species,
          dex: entry.dex,
          teams: entry.teams,
          pct: entry.pct,
          tournaments: c.tournaments.length,
          source: SOURCE,
          forms: entry.forms,
          items: topSpreads(agg?.items, entry.teams, 10),
          moves: topSpreads(agg?.moves, entry.teams, 12),
          abilities: topSpreads(agg?.abilities, entry.teams, 10),
          natures: topSpreads(agg?.natures, entry.teams, 6),
        },
        { status: 200 },
      );
    }
    if (matches.length > 1) {
      return Response.json(
        {
          error: `Ambiguous Pokémon name "${pokemonQuery}".`,
          matches: matches.map((m) => m.species),
        },
        { status: 400 },
      );
    }
    const q = pokemonQuery.trim().toLowerCase();
    const suggestions = c.global
      .filter((e) => e.species.toLowerCase().includes(q))
      .slice(0, 8)
      .map((e) => e.species);
    return Response.json(
      {
        error: `No Pokémon matching "${pokemonQuery}".`,
        suggestions,
      },
      { status: 400 },
    );
  }

  if (!tournamentId && rawLimit === null) {
    return Response.json(docs(c), { status: 200 });
  }

  let limit = 50;
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      return Response.json(
        { error: '"limit" must be a positive integer.' },
        { status: 400 },
      );
    }
    limit = Math.min(limit, MAX_LIMIT);
  }

  if (!tournamentId) {
    return Response.json(
      {
        tournaments: c.tournaments.length,
        teams: c.totalTeams,
        source: SOURCE,
        usage: c.global.slice(0, limit),
      },
      { status: 200 },
    );
  }

  const t = c.tournaments.find((x) => x.id === tournamentId);
  if (!t) {
    return Response.json(
      {
        error: `Unknown tournament id "${tournamentId}".`,
        validIds: c.tournaments.map((x) => x.id),
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      id: t.id,
      name: t.name,
      dates: t.dates,
      teams: t.teamCount,
      source: SOURCE,
      usage: t.usage.slice(0, limit),
    },
    { status: 200 },
  );
}
