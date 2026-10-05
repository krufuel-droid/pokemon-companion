/**
 * GET /api/player — find a player's archived tournament runs.
 *
 * Read-only, no login required. Searches every archived tournament team
 * list (public/tournament-teams/*.json — the same archive /api/teams
 * serves) for a case-insensitive partial player-name match. Filtering
 * happens server-side so the client only receives the matching runs —
 * and so players placed below /api/teams' 500-team cap are still found.
 *
 * - GET /api/player → usage docs + list of archived tournaments
 *   (newest first).
 * - GET /api/player?player=<name> → every archived run for players whose
 *   name contains <name> (case-insensitive), grouped by tournament
 *   newest-first. Each run carries placement, player, country, W-L record,
 *   and the full 6-Pokémon team (dex, species, nature, ability, item,
 *   moves, sprite).
 *
 * Source: pokedata.ovh (unofficial, fan-run). Masters division only; only
 * players with a full 6-Pokémon team list are included.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getSpeciesById } from "@/lib/pokedex";

export const dynamic = "force-dynamic";

interface ArchivedPokemon {
  dex: number;
  species: string;
  nature: string;
  ability: string;
  item: string;
  moves: string[];
}

interface ArchivedTeam {
  placement: number;
  player: string;
  country: string;
  record: string;
  pokemon: ArchivedPokemon[];
}

interface TournamentArchive {
  id: string;
  name: string;
  dates: string | null;
  teamCount: number;
  teams: ArchivedTeam[];
}

interface PlayerPokemon extends ArchivedPokemon {
  sprite: string | null;
}

interface PlayerRun {
  placement: number;
  player: string;
  country: string;
  record: string;
  pokemon: PlayerPokemon[];
}

/** Lazily loaded per-file cache; archived team lists never change. */
const archiveCache = new Map<string, TournamentArchive>();

function tournamentDir(): string {
  return join(process.cwd(), "public", "tournament-teams");
}

function loadArchive(id: string): TournamentArchive | null {
  const cached = archiveCache.get(id);
  if (cached) return cached;
  try {
    const data = JSON.parse(
      readFileSync(join(tournamentDir(), `${id}.json`), "utf-8"),
    ) as TournamentArchive;
    archiveCache.set(id, data);
    return data;
  } catch {
    return null;
  }
}

function listArchives(): TournamentArchive[] {
  let files: string[] = [];
  try {
    files = readdirSync(tournamentDir()).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files
    .map((f) => loadArchive(f.replace(/\.json$/, "")))
    .filter((a): a is TournamentArchive => a !== null);
}

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Sortable timestamp from an archive "Month D-D, YYYY" date string. */
function eventStart(dates: string | null): number {
  if (!dates) return 0;
  const m = dates.match(/^([A-Za-z]+)\s+(\d+)(?:\s*-\s*\d+)?,\s*(\d{4})/);
  if (!m) return 0;
  const month = MONTHS[m[1].toLowerCase()] ?? 0;
  return Date.UTC(Number(m[3]), month, Number(m[2]));
}

function newestFirst(archives: TournamentArchive[]): TournamentArchive[] {
  return archives
    .slice()
    .sort((a, b) => eventStart(b.dates) - eventStart(a.dates));
}

function spriteFor(dex: number): string | null {
  try {
    return getSpeciesById(dex)?.sprites.regular ?? null;
  } catch {
    return null;
  }
}

function usage(archives: TournamentArchive[]) {
  return {
    name: "Poké Companion player tracker API",
    usage:
      "GET /api/player → this document + tournament list. " +
      "GET /api/player?player=<name> → every archived tournament run for " +
      "players whose name contains <name> (case-insensitive), grouped by " +
      "tournament newest-first.",
    example: "/api/player?player=Yamazaki",
    runShape: {
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
          sprite: "https://…/1000.png",
        },
      ],
    },
    notes: [
      "Source: pokedata.ovh (unofficial, fan-run). Masters division only; only players with a full 6-Pokémon team list are included.",
      "A partial name can match several players; every match is returned and the distinct full names are listed in `players`.",
    ],
    tournaments: newestFirst(archives).map((a) => ({
      id: a.id,
      name: a.name,
      dates: a.dates,
      teamCount: a.teamCount ?? a.teams.length,
    })),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("player");
  const archives = listArchives();

  if (!raw || !raw.trim()) {
    return Response.json(usage(archives), { status: 200 });
  }

  const query = raw.trim();
  if (query.length < 2) {
    return Response.json(
      { error: "Search for at least 2 characters.", query },
      { status: 400 },
    );
  }
  const needle = query.toLowerCase();

  const matchedNames = new Set<string>();
  const tournaments: Array<{
    id: string;
    name: string;
    dates: string | null;
    runs: PlayerRun[];
  }> = [];

  for (const archive of newestFirst(archives)) {
    const runs: PlayerRun[] = archive.teams
      .filter((t) => t.player.toLowerCase().includes(needle))
      .map((t) => {
        matchedNames.add(t.player);
        return {
          placement: t.placement,
          player: t.player,
          country: t.country,
          record: t.record,
          pokemon: t.pokemon.map((p) => ({
            ...p,
            sprite: spriteFor(p.dex),
          })),
        };
      });
    if (runs.length > 0) {
      tournaments.push({
        id: archive.id,
        name: archive.name,
        dates: archive.dates,
        runs,
      });
    }
  }

  return Response.json(
    {
      query,
      players: [...matchedNames].sort((a, b) => a.localeCompare(b)),
      totalRuns: tournaments.reduce((n, t) => n + t.runs.length, 0),
      tournaments,
      source:
        "pokedata.ovh (unofficial, fan-run). Masters division only; " +
        "only players with a full 6-Pokémon team list are included.",
    },
    { status: 200 },
  );
}
