/**
 * POST /api/stats — full stat-block calculator as a JSON API.
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine).
 * Same Gen 7+ stat math as the rest of the app (`combatantStats` in
 * `@/lib/damage-calc.ts`) — the formula lives there, never here.
 *
 * Request body (JSON):
 * {
 *   "species": "Gholdengo",        // name or Pokédex number, case-insensitive
 *   "level": 50,                   // optional, 1–100, default 50
 *   "nature": "Modest",            // optional, default "Hardy" (neutral)
 *   "evs": { "spa": 252 },         // optional, 0–252 per stat, 510 total
 *   "ivs": { "atk": 31 },          // optional, 0–31 per stat, default 31
 *   "speedModifiers": {            // optional, all default false
 *     "choiceScarf": true, "tailwind": false,
 *     "paralysis": false, "swiftSwim": false
 *   }
 * }
 * Only `species` is required.
 *
 * Response: 200 with `{ "species", "dexId", "level", "nature",
 * "stats": { "hp", "atk", "def", "spa", "spd", "spe" },
 * "effectiveSpeed", "speedNotes" }`, or 400 with `{ "error": "…" }`.
 */

import {
  combatantStats,
  resolveSpecies,
  STAT_KEYS,
  type StatKey,
} from "@/lib/damage-calc";
import { NATURES } from "@/lib/data/natures";

export const dynamic = "force-dynamic";

const EXAMPLE = {
  species: "Gholdengo",
  level: 50,
  nature: "Modest",
  evs: { spa: 252, spe: 252 },
  speedModifiers: { choiceScarf: true },
};

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion stat calculator API",
      usage: "POST JSON to /api/stats",
      example: EXAMPLE,
      valid_stats: STAT_KEYS,
      valid_natures: NATURES.map((n) => n.name),
      notes: [
        "species accepts a Pokédex number or a name (case-insensitive).",
        "evs: integers 0–252 per stat, 510 total. ivs: integers 0–31, default 31.",
        "Speed modifiers apply in order Swift Swim → Choice Scarf → Tailwind → Paralysis, floored per step (Gen 7+).",
        "effectiveSpeed is the final Speed after modifiers; stats.spe is the unmodified stat.",
      ],
    },
    { status: 200 },
  );
}

function asLevel(raw: unknown): number {
  const level = raw === undefined || raw === null ? 50 : raw;
  if (
    typeof level !== "number" ||
    !Number.isInteger(level) ||
    level < 1 ||
    level > 100
  ) {
    throw new Error('"level" must be an integer 1–100.');
  }
  return level;
}

function asNature(raw: unknown): string {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return "Hardy";
  }
  const n = NATURES.find(
    (x) => x.name.toLowerCase() === String(raw).trim().toLowerCase(),
  );
  if (!n) {
    throw new Error(
      `Unknown nature "${raw}". Valid natures: ${NATURES.map((x) => x.name).join(
        ", ",
      )}.`,
    );
  }
  return n.name;
}

function asSpread(
  raw: unknown,
  label: string,
  min: number,
  max: number,
  cap: number | null,
): Partial<Record<StatKey, number>> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(
      `"${label}" must be an object like { "atk": 252 }. Valid stats: ${STAT_KEYS.join(
        ", ",
      )}.`,
    );
  }
  const out: Partial<Record<StatKey, number>> = {};
  let total = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = k.toLowerCase() as StatKey;
    if (!STAT_KEYS.includes(key)) {
      throw new Error(
        `Unknown stat "${k}" in "${label}". Valid stats: ${STAT_KEYS.join(
          ", ",
        )}.`,
      );
    }
    if (
      typeof v !== "number" ||
      !Number.isInteger(v) ||
      v < min ||
      v > max
    ) {
      throw new Error(`"${label}.${k}" must be an integer ${min}–${max}.`);
    }
    out[key] = v;
    total += v;
  }
  if (cap !== null && total > cap) {
    throw new Error(`"${label}" total is ${total}; the cap is ${cap}.`);
  }
  return out;
}

function asBool(raw: unknown, label: string): boolean {
  if (raw === undefined || raw === null) return false;
  if (typeof raw !== "boolean") {
    throw new Error(`"${label}" must be true or false.`);
  }
  return raw;
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
  try {
    if (!body || typeof body !== "object") {
      throw new Error("Request body must be a JSON object.");
    }
    const b = body as Record<string, unknown>;
    if (b.species === undefined || b.species === null || String(b.species).trim() === "") {
      throw new Error('"species" is required (name or Pokédex number).');
    }
    const species = resolveSpecies(b.species as string | number);

    const level = asLevel(b.level);
    const nature = asNature(b.nature);
    const evs = asSpread(b.evs, "evs", 0, 252, 510);
    const ivs = asSpread(b.ivs, "ivs", 0, 31, null);

    const mods = (b.speedModifiers ?? {}) as Record<string, unknown>;
    if (typeof mods !== "object" || Array.isArray(mods)) {
      throw new Error('"speedModifiers" must be an object.');
    }
    const swiftSwim = asBool(mods.swiftSwim, "speedModifiers.swiftSwim");
    const choiceScarf = asBool(mods.choiceScarf, "speedModifiers.choiceScarf");
    const tailwind = asBool(mods.tailwind, "speedModifiers.tailwind");
    const paralysis = asBool(mods.paralysis, "speedModifiers.paralysis");

    const stats = combatantStats(species, level, nature, evs, ivs);

    let s = stats.spe;
    const speedNotes: string[] = [
      `Base Speed ${s} at Lv ${level} (${nature})`,
    ];
    if (swiftSwim) {
      s = Math.floor(s * 2);
      speedNotes.push(`Swift Swim ×2 → ${s}`);
    }
    if (choiceScarf) {
      s = Math.floor(s * 1.5);
      speedNotes.push(`Choice Scarf ×1.5 → ${s}`);
    }
    if (tailwind) {
      s = Math.floor(s * 2);
      speedNotes.push(`Tailwind ×2 → ${s}`);
    }
    if (paralysis) {
      s = Math.floor(s * 0.5);
      speedNotes.push(`Paralysis ×0.5 → ${s}`);
    }
    if (speedNotes.length === 1) {
      speedNotes.push("No speed modifiers applied.");
    }

    return Response.json(
      {
        species: species?.name ?? "Unknown",
        dexId: species?.id ?? null,
        level,
        nature,
        stats,
        effectiveSpeed: s,
        speedNotes,
      },
      { status: 200 },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Calculation failed." },
      { status: 400 },
    );
  }
}
