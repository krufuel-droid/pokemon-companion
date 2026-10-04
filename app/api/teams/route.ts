/**
 * GET /api/teams — archived VGC tournament team lists as JSON.
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine):
 * "what did the top teams actually bring?" Read-only, no login required.
 *
 * Source: pokedata.ovh (unofficial, fan-run) roster + standings data,
 * normalized by scripts/fetch-tournament-teams.mjs into
 * public/tournament-teams/<id>.json. Masters division only, full
 * 6-Pokémon teams only, sorted by final placement ascending.
 *
 * - GET /api/teams → usage docs + list of archived tournaments
 *   { id, name, dates, teamCount }.
 * - GET /api/teams?tournament=<id>&limit=100 → that tournament's teams
 *   (limit default 100, max 500). Unknown id → 400 listing valid ids.
 *
 * STALENESS: a weekly job adds new tournaments (see the weekly meta-check
 * cron instructions). Re-fetch instead of caching; team lists never change
 * once archived, but the tournament list grows.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";

interface ArchivedMeta {
  id: string;
  name: string;
  dates: string | null;
  teamCount: number;
}

let indexCache: ArchivedMeta[] | null = null;

function loadIndex(): ArchivedMeta[] {
  if (indexCache) return indexCache;
  const dir = join(process.cwd(), "public", "tournament-teams");
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    files = [];
  }
  indexCache = files
    .map((f) => {
      try {
        const d = JSON.parse(
          readFileSync(join(dir, f), "utf-8"),
        ) as ArchivedMeta;
        return {
          id: d.id,
          name: d.name,
          dates: d.dates ?? null,
          teamCount: d.teamCount ?? 0,
        };
      } catch {
        return null;
      }
    })
    .filter((m): m is ArchivedMeta => m !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
  return indexCache;
}

function usage(tournaments: ArchivedMeta[]) {
  return {
    name: "Poké Companion tournament team archive",
    usage:
      "GET /api/teams → this document + tournament list. " +
      "GET /api/teams?tournament=<id>&limit=100 → team lists (limit default 100, max 500).",
    example: "/api/teams?tournament=1000035&limit=100",
    teamShape: {
      placement: 1,
      player: "Takuma Yamazaki",
      country: "JP",
      record: "13-2",
      pokemon: [
        {
          dex: 1000,
          species: "Gholdengo",
          nature: "Modest",
          ability: "Good as Gold",
          item: "Choice Specs",
          moves: ["Make It Rain"],
        },
      ],
    },
    source: "pokedata.ovh (unofficial, fan-run). Masters division only; " +
      "only players with a full 6-Pokémon team list are included; " +
      "sorted by final placement ascending.",
    tournaments,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tournamentId = url.searchParams.get("tournament");
  const index = loadIndex();

  if (!tournamentId) {
    return Response.json(usage(index), { status: 200 });
  }

  const meta = index.find((t) => t.id === tournamentId);
  if (!meta) {
    return Response.json(
      {
        error: `Unknown tournament id "${tournamentId}".`,
        validIds: index.map((t) => t.id),
      },
      { status: 400 },
    );
  }

  const rawLimit = url.searchParams.get("limit");
  let limit = 100;
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      return Response.json(
        { error: '"limit" must be a positive integer.' },
        { status: 400 },
      );
    }
    limit = Math.min(limit, 500);
  }

  const doc = JSON.parse(
    readFileSync(
      join(process.cwd(), "public", "tournament-teams", `${meta.id}.json`),
      "utf-8",
    ),
  ) as { teams: unknown[] } & Record<string, unknown>;

  return Response.json(
    { ...doc, teams: (doc.teams as unknown[]).slice(0, limit) },
    { status: 200 },
  );
}
