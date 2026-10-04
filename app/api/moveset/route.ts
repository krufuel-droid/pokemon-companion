/**
 * GET /api/moveset?species=Metagross — competitive movesets as a JSON API.
 *
 * Built for programmatic use (e.g. Caleb's Aura Corner coach via Sunshine):
 * "what does the opponent most likely run?" so the coach picks defensive
 * answers from real movesets instead of inventing them.
 *
 * Simple GET, JSON back:
 *   /api/moveset?species=Gholdengo   (name or National Pokédex number,
 *                                      case-insensitive)
 *
 * Data: winning-team sets aggregated from `lib/data/champions.ts`
 * (FEATURED_TEAMS + TOURNAMENT_RESULTS — the same sources as the Champions
 * page), via `getMovesetsForSpecies` in `@/lib/movesets`. Only sets the
 * linked tournament coverage actually published; fields the coverage didn't
 * report (often EVs) come back as null, never filled in from memory.
 * Sets are ordered most-observed first.
 *
 * Coverage: only species that appear on winning teams have data
 * (~24 species across 5 winning teams as of Oct 2026). Coverage grows
 * automatically as new winning teams are added to champions.ts.
 *
 * Response: 200 with
 * { "species": "Gholdengo", "dexId": 1000,
 *   "sets": [{ "form", "ability", "item", "nature", "evs", "moves": [...],
 *               "observations": 2,
 *               "sources": [{ "event", "date", "player", "placement",
 *                             "sourceLabel", "sourceUrl" }] }],
 *   "dataNote": "…" }
 * Unknown species → 400. Known species with no observed sets → 404 with
 * `coveredSpecies` (name + dexId, A–Z) so callers can see what's available.
 * No `species` param → 200 usage docs (same self-documenting pattern as
 * the other APIs).
 */

import { NextRequest } from "next/server";
import { resolveSpecies } from "@/lib/damage-calc";
import {
  getCoveredSpecies,
  getMovesetsForSpecies,
} from "@/lib/movesets";

export const dynamic = "force-dynamic";

const USAGE = {
  name: "Poké Companion moveset API",
  usage: "GET /api/moveset?species=<name or dex number>",
  example: "/api/moveset?species=Gholdengo",
  notes: [
    "species accepts a Pokémon name or National Pokédex number (case-insensitive).",
    "Returns the most common competitive movesets observed on tournament-winning teams, most-observed first.",
    "Moves, nature, item, ability, and EVs come only from published tournament coverage; missing fields are null, never guessed.",
    "Each set lists the winning teams it was observed on, with sources.",
    "Coverage is limited to species on winning teams; it grows as new results are added to the Champions page.",
    "For species with no observed sets, the response is 404 with a coveredSpecies list.",
    "Pairs with /api/damage-calc: look up the likely set here, then run the damage math there.",
  ],
};

export async function GET(request: NextRequest) {
  const species = request.nextUrl.searchParams.get("species");

  if (!species || species.trim() === "") {
    return Response.json(USAGE, { status: 200 });
  }

  const trimmed = species.trim();
  const dexOrName = /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;

  // resolveSpecies throws on no match; the lib treats that as "no data".
  let resolved: { name: string; id: number } | null;
  try {
    resolved = resolveSpecies(dexOrName);
  } catch {
    resolved = null;
  }
  if (!resolved) {
    return Response.json(
      { error: `Unknown species: "${trimmed}".` },
      { status: 400 },
    );
  }

  const result = getMovesetsForSpecies(dexOrName);
  if (!result) {
    return Response.json(
      {
        error: `No competitive moveset data for ${resolved.name} yet — it hasn't appeared on a featured winning team.`,
        species: resolved.name,
        dexId: resolved.id,
        coveredSpecies: getCoveredSpecies(),
      },
      { status: 404 },
    );
  }

  return Response.json(
    {
      species: result.species,
      dexId: result.dexId,
      sets: result.sets,
      dataNote:
        "Observed sets from featured tournament-winning teams (see sources per set). Fields not reported by coverage are null.",
    },
    { status: 200 },
  );
}
