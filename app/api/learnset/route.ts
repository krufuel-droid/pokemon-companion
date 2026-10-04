/**
 * POST /api/learnset — learnable moves as a JSON API.
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine):
 * "what can Gholdengo learn?" so the AI can reason about what the
 * opponent might click. Read-only, no login required.
 *
 * Uses the same moves DB as the move-coverage tool (`MOVES` in
 * `@/lib/data/moves`): a move is learnable when the species' National
 * Pokédex id is in the move's `learnedBy` list. Species resolve via
 * `resolveSpecies` in `@/lib/damage-calc` (name or dex number,
 * case-insensitive) — the same resolver the damage API uses.
 *
 * Request body (JSON):
 * {
 *   "species": "Gholdengo",            // required: name or dex number
 *   "category": "physical",            // optional: physical | special | status
 *   "type": "Steel"                   // optional: attacking type
 * }
 *
 * Response: 200 with
 * { "species": "Gholdengo", "dexId": 1000, "count": N,
 *   "moves": [{ "name", "type", "category", "power", "accuracy", "pp" }, …] }
 * sorted by power descending (null power last, then name A–Z).
 * Unknown species → 400. Filters that match nothing → 200 with an empty
 * `moves` list (not an error).
 */

import { resolveSpecies } from "@/lib/damage-calc";
import { MOVES, type MoveEntry } from "@/lib/data/moves";
import { TYPES } from "@/lib/typechart";

export const dynamic = "force-dynamic";

const EXAMPLE = {
  species: "Gholdengo",
  category: "special",
  type: "Steel",
};

const CATEGORIES = ["physical", "special", "status"] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function asCategory(raw: unknown): CategoryFilter | undefined {
  if (raw === undefined || raw === null) return undefined;
  const q = String(raw).trim().toLowerCase();
  const hit = CATEGORIES.find((c) => c === q);
  if (!hit) {
    throw new Error(
      `"category" must be one of: ${CATEGORIES.join(", ")}.`,
    );
  }
  return hit;
}

function asType(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const q = String(raw).trim().toLowerCase();
  const hit = TYPES.find((t) => t.toLowerCase() === q);
  if (!hit) throw new Error(`Unknown type: ${raw}.`);
  return hit;
}

function toMoveJson(m: MoveEntry) {
  return {
    name: m.name,
    type: m.type,
    category: m.category.toLowerCase(),
    power: m.power,
    accuracy: m.accuracy,
    pp: m.pp,
  };
}

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion learnset API",
      usage: "POST JSON to /api/learnset",
      example: EXAMPLE,
      notes: [
        "species is required and accepts a Pokédex number or a name (case-insensitive).",
        'category is optional: "physical", "special", or "status".',
        "type is optional: filters to one attacking type (e.g. \"Steel\").",
        "Moves are sorted by power descending (null power last, then name A–Z).",
        "Filters that match nothing return 200 with an empty moves list.",
        "Learnsets come from the app's moves database (same source as the move-coverage tool).",
      ],
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }
  const b = body as Record<string, unknown>;
  try {
    if (b.species === undefined || b.species === null || String(b.species).trim() === "") {
      throw new Error("species is required (name or Pokédex number).");
    }
    const species = resolveSpecies(b.species as string | number);
    if (!species) throw new Error(`Unknown species: ${b.species}.`);
    const category = asCategory(b.category);
    const type = asType(b.type);

    const moves = MOVES.filter(
      (m) =>
        m.learnedBy.includes(species.id) &&
        (category === undefined || m.category.toLowerCase() === category) &&
        (type === undefined || m.type === type),
    )
      .sort((a, z) => {
        const ap = a.power ?? -1;
        const zp = z.power ?? -1;
        if (zp !== ap) return zp - ap;
        return a.name.localeCompare(z.name);
      })
      .map(toMoveJson);

    return Response.json(
      {
        species: species.name,
        dexId: species.id,
        count: moves.length,
        moves,
      },
      { status: 200 },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Lookup failed." },
      { status: 400 },
    );
  }
}
