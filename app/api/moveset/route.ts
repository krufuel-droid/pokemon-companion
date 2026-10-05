/**
 * GET /api/moveset?species=Lucario — competitive movesets as a JSON API.
 *
 * Built for programmatic use (e.g. Caleb's Aura Corner coach via Sunshine):
 * "what does the opponent most likely run?" so the coach picks defensive
 * answers from real movesets instead of inventing them.
 *
 * Simple GET, JSON back:
 *   /api/moveset?species=Gholdengo            (VGC Reg M-C, the default)
 *   /api/moveset?species=Lucario&format=ou     (Champions OU singles)
 *   /api/moveset?species=448                   (National Pokédex number)
 *   /api/moveset?species= mega lucario         (Mega forms accepted,
 *                                              case-insensitive)
 *
 * `format` accepts: "regmc" (default, VGC doubles) or "ou" (singles OU).
 * Full format codes (gen9championsvgc2026regmc / gen9championsou) also work.
 *
 * Data, in order of preference:
 *  1. Pikalytics usage snapshots (data/pikalytics/*.json, refreshed weekly
 *     by scripts/fetch-pikalytics.mjs): per-Pokémon most-common moves,
 *     items, abilities (with %), teammates, and a recommended set derived
 *     from featured tournament teams. Source: Pikalytics, CC BY-NC 4.0.
 *  2. Tournament-winning-team sets (lib/data/champions.ts) when the
 *     snapshot has no entry for the species.
 *
 * Honesty rules: natures and EV spreads are not published by the snapshot
 * source, so they come back null — never guessed. Aggregate abilities are
 * validated against PokéAPI at scrape time; impossible entries are dropped.
 *
 * Response: 200 with
 * { "species": "Lucario", "dexId": 448, "format": "gen9championsvgc2026regmc",
 *   "source": { "label": "Pikalytics", "url": "https://pikalytics.com",
 *               "license": "CC BY-NC 4.0" },
 *   "usage": 5.49, "winRate": 48.135, "record": "3020-3254",
 *   "recommendedSet": { "ability", "item", "moves": [...], "observations",
 *                       "sources": [...] },
 *   "moves": [{ "name", "pct" }, …], "items": […], "abilities": […],
 *   "teammates": [{ "name", "pct" }, …],
 *   "dataDate": "2026-05", "fetchedAt": "…",
 *   "notes": ["Natures and EV spreads are not published by this source."] }
 * Unknown species → 400. No data in any source → 404 with coveredSpecies.
 * No `species` param → 200 usage docs (same self-documenting pattern as
 * the other APIs).
 */

import { NextRequest } from "next/server";
import { resolveCombatant } from "@/lib/damage-calc";
import {
  getCoveredSpecies,
  getMovesetsForSpecies,
} from "@/lib/movesets";
import regmcSnapshot from "@/data/pikalytics/gen9championsvgc2026regmc.json";
import ouSnapshot from "@/data/pikalytics/gen9championsou.json";

export const dynamic = "force-dynamic";

interface SnapshotEntry {
  name: string;
  usage: number | null;
  winRate: number | null;
  record: string | null;
  moves: { name: string; pct: number }[];
  items: { name: string; pct: number }[];
  abilities: { name: string; pct: number }[];
  teammates: { name: string; pct: number }[];
  recommendedSet: {
    ability: string | null;
    item: string | null;
    moves: string[];
    observations: number;
    sources: string[];
    note?: string;
  } | null;
}

interface Snapshot {
  format: string;
  formatLabel: string;
  source: { label: string; url: string; license: string; note: string };
  dataDate: string | null;
  fetchedAt: string;
  roster: string[];
  pokemon: Record<string, SnapshotEntry>;
}

const SNAPSHOTS: Record<string, Snapshot> = {
  regmc: regmcSnapshot as unknown as Snapshot,
  gen9championsvgc2026regmc: regmcSnapshot as unknown as Snapshot,
  ou: ouSnapshot as unknown as Snapshot,
  gen9championsou: ouSnapshot as unknown as Snapshot,
};

/** Our "Mega Lucario" → Pikalytics "Lucario-Mega"; "Mega Charizard X" → "Charizard-Mega-X". */
function megaLabelToPikalytics(formLabel: string): string | null {
  const m = formLabel.match(/^Mega (.+?)(?: ([XYZ]))?$/i);
  if (!m) return null;
  return `${m[1]}-Mega${m[2] ? `-${m[2].toUpperCase()}` : ""}`;
}

/** Pikalytics "Salamence-Mega" → base "Salamence" for dex resolution. */
function pikalyticsBaseName(pikalyticsName: string): string {
  return pikalyticsName
    .replace(/-Eternal-Mega$/i, "")
    .replace(/-Mega(-[XYZ])?$/i, "")
    .replace(/-(Hisui|Alola|Galar|Paldea)$/i, "")
    .replace(/-F$/i, "");
}

function findSnapshotEntry(
  snapshot: Snapshot,
  speciesName: string,
  formLabel: string | null,
): SnapshotEntry | null {
  if (formLabel) {
    const pikaName = megaLabelToPikalytics(formLabel);
    if (pikaName && snapshot.pokemon[pikaName]) {
      return snapshot.pokemon[pikaName];
    }
  }
  if (snapshot.pokemon[speciesName]) return snapshot.pokemon[speciesName];
  const lower = speciesName.toLowerCase();
  const hit = Object.keys(snapshot.pokemon).find(
    (k) => k.toLowerCase() === lower,
  );
  return hit ? snapshot.pokemon[hit] : null;
}

/** Direct snapshot-key match for Pikalytics-style names ("Raichu-Mega-Y"). */
function findSnapshotEntryByKey(
  snapshot: Snapshot,
  raw: string,
): SnapshotEntry | null {
  if (snapshot.pokemon[raw]) return snapshot.pokemon[raw];
  const lower = raw.toLowerCase();
  const hit = Object.keys(snapshot.pokemon).find(
    (k) => k.toLowerCase() === lower,
  );
  return hit ? snapshot.pokemon[hit] : null;
}

function snapshotResponse(
  snapshot: Snapshot,
  entry: SnapshotEntry,
  opts: {
    species: string;
    pikalyticsName?: string;
    dexId?: number | null;
    form?: string | null;
  },
) {
  return Response.json(
    {
      species: opts.species,
      ...(opts.pikalyticsName ? { pikalyticsName: opts.pikalyticsName } : {}),
      ...(opts.form ? { form: opts.form } : {}),
      ...(opts.dexId != null ? { dexId: opts.dexId } : {}),
      format: snapshot.format,
      source: {
        label: snapshot.source.label,
        url: snapshot.source.url,
        license: snapshot.source.license,
      },
      usage: entry.usage,
      winRate: entry.winRate,
      record: entry.record,
      recommendedSet: entry.recommendedSet,
      moves: entry.moves,
      items: entry.items,
      abilities: entry.abilities,
      teammates: entry.teammates,
      natures: null,
      evs: null,
      dataDate: snapshot.dataDate,
      fetchedAt: snapshot.fetchedAt,
      notes: [
        "Natures and EV spreads are not published by this source.",
        "Recommended set is the most common featured-tournament-team set; aggregates are ladder-wide.",
      ],
    },
    { status: 200 },
  );
}

const USAGE = {
  name: "Poké Companion moveset API",
  usage: "GET /api/moveset?species=<name or dex number>&format=<regmc|ou>",
  example: "/api/moveset?species=Lucario&format=ou",
  notes: [
    "species accepts a Pokémon name, National Pokédex number, or Mega form name (case-insensitive).",
    "format is optional: \"regmc\" (Champions VGC doubles, default) or \"ou\" (Champions OU singles).",
    "Primary source is Pikalytics usage snapshots (CC BY-NC 4.0), refreshed weekly; falls back to tournament winning-team sets.",
    "Natures and EV spreads are not published by the snapshot source and come back null, never guessed.",
    "Aggregate abilities are validated against PokéAPI at scrape time; impossible entries are dropped.",
    "Pairs with /api/damage-calc: look up the likely set here, then run the damage math there.",
  ],
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const species = params.get("species");

  if (!species || species.trim() === "") {
    return Response.json(USAGE, { status: 200 });
  }

  const formatKey = (params.get("format") ?? "regmc").trim().toLowerCase();
  const snapshot = SNAPSHOTS[formatKey];
  if (!snapshot) {
    return Response.json(
      {
        error: `Unknown format: "${params.get("format")}". Use "regmc" or "ou".`,
      },
      { status: 400 },
    );
  }

  const trimmed = species.trim();
  const dexOrName = /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;

  // 0. Direct snapshot-key match first: Pikalytics-style names
  // ("Raichu-Mega-Y", "Arcanine-Hisui") resolve even when they aren't
  // modeled Mega forms in our own data.
  const directEntry = findSnapshotEntryByKey(snapshot, trimmed);
  if (directEntry) {
    let dexId: number | null = null;
    try {
      dexId = resolveCombatant(pikalyticsBaseName(trimmed))?.species.id ?? null;
    } catch {
      dexId = null;
    }
    return snapshotResponse(snapshot, directEntry, {
      species: pikalyticsBaseName(trimmed),
      pikalyticsName: trimmed,
      dexId,
    });
  }

  // resolveCombatant throws on no match (incl. Mega form names).
  let combatant: { species: { name: string; id: number }; formName: string | null } | null;
  try {
    combatant = resolveCombatant(dexOrName);
  } catch {
    combatant = null;
  }
  if (!combatant) {
    // Pikalytics-style Mega of a Champions-original form (e.g. "Raichu-Mega-Y")
    // isn't in our dex — fall back to the base species' snapshot entry.
    const base = pikalyticsBaseName(trimmed);
    if (base.toLowerCase() !== trimmed.toLowerCase()) {
      const baseEntry = findSnapshotEntryByKey(snapshot, base);
      if (baseEntry) {
        let dexId: number | null = null;
        try {
          dexId = resolveCombatant(base)?.species.id ?? null;
        } catch {
          dexId = null;
        }
        return snapshotResponse(snapshot, baseEntry, {
          species: base,
          pikalyticsName: trimmed,
          dexId,
        });
      }
    }
    return Response.json(
      { error: `Unknown species: "${trimmed}".` },
      { status: 400 },
    );
  }
  const { species: resolved, formName } = combatant;

  // 1. Pikalytics snapshot.
  const entry = findSnapshotEntry(snapshot, resolved.name, formName);
  if (entry) {
    return snapshotResponse(snapshot, entry, {
      species: resolved.name,
      form: formName,
      dexId: resolved.id,
    });
  }

  // 2. Fallback: tournament winning-team sets.
  const legacy = getMovesetsForSpecies(dexOrName);
  if (legacy) {
    return Response.json(
      {
        species: legacy.species,
        dexId: legacy.dexId,
        format: snapshot.format,
        source: {
          label: "Tournament winning teams (Champions page curation)",
          url: "https://pokemon-companion-pi.vercel.app/champions",
        },
        sets: legacy.sets,
        notes: [
          "No Pikalytics snapshot entry for this species; showing curated winning-team sets instead.",
        ],
      },
      { status: 200 },
    );
  }

  // 3. Nothing anywhere.
  const covered = new Set<string>([
    ...snapshot.roster,
    ...getCoveredSpecies().map((c) => c.name),
  ]);
  return Response.json(
    {
      error: `No competitive moveset data for ${resolved.name} yet.`,
      species: resolved.name,
      dexId: resolved.id,
      format: snapshot.format,
      coveredSpecies: [...covered].sort((a, b) => a.localeCompare(b)),
    },
    { status: 404 },
  );
}
