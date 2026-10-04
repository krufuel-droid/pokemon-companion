/**
 * POST /api/damage-calc — damage calculator as a JSON API.
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine).
 * Same Gen 7+ math as the Advanced damage calculator UI; both call
 * `calculateDamage` in `@/lib/damage-calc.ts` — the formula lives there.
 *
 * Request body (JSON):
 * {
 *   "attacker": { "species": "Charizard" | 6, "level": 50, "nature": "Modest",
 *                 "ability": "Blaze", "item": "Life Orb", "status": "Healthy",
 *                 "evs": { "spa": 252 }, "ivs": { "atk": 31 }, "pinchActive": false },
 *   "defender": { "species": "Venusaur", "level": 50, "nature": "Calm",
 *                 "ability": "Overgrow", "item": "Sitrus Berry", "status": "Healthy",
 *                 "evs": { "spd": 252 }, "notFullyEvolved": false, "currentHp": null },
 *   "move": { "power": 90, "type": "Fire", "category": "special" },
 *   "field": { "weather": "None", "terrain": "None", "reflect": false,
 *              "lightScreen": false, "crit": false, "stab": "auto",
 *              "effectiveness": "auto" }
 * }
 * Only `attacker.species`, `defender.species`, and `move` are required;
 * everything else falls back to sensible defaults (Lv 50, neutral natures,
 * 31 IVs, 0 EVs, no ability/item/weather).
 *
 * Doubles: POST with `"format": "doubles"` instead of `defender`:
 * {
 *   "format": "doubles",
 *   "attacker": { "species": "Incineroar", "level": 50, "nature": "Adamant",
 *                 "evs": { "atk": 252 } },
 *   "ally": { "species": "Rillaboom" },            // optional
 *   "defenders": [ { "species": "Gholdengo" },     // exactly two: [foe1, foe2]
 *                  { "species": "Calyrex-Shadow" } ],
 *   "move": { "power": 100, "type": "Dark", "category": "physical" },
 *   "target": "both-foes",                        // foe1 | foe2 | both-foes | ally
 *   "field": { "weather": "None" }
 * }
 * "both-foes" applies the Gen 7+ ×0.75 spread modifier to each target.
 * Response: `{ "format": "doubles", "attacker", "move", "target",
 * "spreadApplied", "targets": [{ "slot", "result", "spreadApplied" }], "notes" }`
 * with a full per-target result (rolls, KO summary, modifiers).
 * Limitations: no redirect moves (Follow Me / Rage Powder), no ally
 * abilities (Friend Guard).
 *
 * Response: 200 with the calc result (rolls, KO summary, modifiers, …),
 * or 400 with `{ "error": "…" }` for bad input.
 */

import {
  calculateDamage,
  calculateDoublesTurn,
  type CombatantInput,
  type DamageCalcInput,
  type DoublesTarget,
} from "@/lib/damage-calc";

export const dynamic = "force-dynamic";

const EXAMPLE: DamageCalcInput = {
  attacker: { species: "Charizard", level: 50, nature: "Modest" },
  defender: { species: "Venusaur", level: 50, nature: "Calm" },
  move: { power: 90, type: "Fire", category: "special" },
};

const DOUBLES_EXAMPLE = {
  format: "doubles",
  attacker: {
    species: "Incineroar",
    level: 50,
    nature: "Adamant",
    evs: { atk: 252 },
  },
  defenders: [
    { species: "Gholdengo", level: 50 },
    { species: "Calyrex-Shadow", level: 50 },
  ],
  move: { power: 100, type: "Dark", category: "physical" },
  target: "both-foes",
};

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion damage calculator API",
      usage: "POST JSON to /api/damage-calc",
      example: EXAMPLE,
      doubles_example: DOUBLES_EXAMPLE,
      notes: [
        "species accepts a Pokédex number or a name (case-insensitive).",
        "move.category is 'physical' or 'special'.",
        "field is optional; stab and effectiveness accept 'auto'.",
        "Only attacker.species, defender.species, and move are required.",
        'Doubles: send "format": "doubles" with "defenders": [foe1, foe2] (exactly two), optional "ally", and "target": "foe1" | "foe2" | "both-foes" | "ally" (default "both-foes").',
        '"both-foes" applies the Gen 7+ ×0.75 spread modifier to each target.',
        "Doubles response has per-target results under \"targets\" (each with rolls, KO summary, modifiers).",
        "Not modeled in doubles: redirect moves (Follow Me / Rage Powder), ally abilities (Friend Guard).",
      ],
    },
    { status: 200 },
  );
}

function asCombatant(
  raw: Record<string, unknown> | undefined,
  label: string,
): CombatantInput {
  if (!raw?.species) throw new Error(`${label}.species is required.`);
  return {
    species: raw.species as string | number,
    level: raw.level as number | undefined,
    nature: raw.nature as string | undefined,
    ability: raw.ability as string | undefined,
    item: raw.item as string | undefined,
    status: raw.status as string | undefined,
    evs: raw.evs as CombatantInput["evs"],
    ivs: raw.ivs as CombatantInput["ivs"],
    pinchActive: raw.pinchActive as boolean | undefined,
    notFullyEvolved: raw.notFullyEvolved as boolean | undefined,
    currentHp: raw.currentHp as number | null | undefined,
  };
}

function asField(raw: Record<string, unknown> | undefined) {
  const field = (raw ?? {}) as Record<string, unknown>;
  return {
    weather: field.weather as string | undefined,
    terrain: field.terrain as string | undefined,
    reflect: field.reflect as boolean | undefined,
    lightScreen: field.lightScreen as boolean | undefined,
    crit: field.crit as boolean | undefined,
    stab: field.stab as "auto" | "on" | "off" | undefined,
    effectiveness: field.effectiveness as "auto" | number | undefined,
  };
}

function asMove(raw: Record<string, unknown> | undefined): {
  power: number;
  type: string;
  category: "physical" | "special";
} {
  if (!raw) throw new Error("move is required.");
  if (typeof raw.power === "undefined")
    throw new Error("move.power is required.");
  if (!raw.type) throw new Error("move.type is required.");
  if (raw.category !== "physical" && raw.category !== "special") {
    throw new Error("move.category must be 'physical' or 'special'.");
  }
  return {
    power: Number(raw.power),
    type: String(raw.type),
    category: raw.category,
  };
}

function asCalcInput(body: unknown): DamageCalcInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;
  const attacker = b.attacker as Record<string, unknown> | undefined;
  const defender = b.defender as Record<string, unknown> | undefined;
  if (!attacker?.species) throw new Error("attacker.species is required.");
  if (!defender?.species) throw new Error("defender.species is required.");
  return {
    attacker: asCombatant(attacker, "attacker"),
    defender: asCombatant(defender, "defender"),
    move: asMove(b.move as Record<string, unknown> | undefined),
    field: asField(b.field as Record<string, unknown> | undefined),
  };
}

const DOUBLES_TARGETS: DoublesTarget[] = ["foe1", "foe2", "both-foes", "ally"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }
  const b = body as Record<string, unknown>;
  try {
    if (b.format === "doubles") {
      const defenders = b.defenders as
        | Array<Record<string, unknown>>
        | undefined;
      if (!Array.isArray(defenders) || defenders.length !== 2) {
        throw new Error('"defenders" must be an array of exactly two combatants: [foe1, foe2].');
      }
      const target = (b.target ?? "both-foes") as DoublesTarget;
      if (!DOUBLES_TARGETS.includes(target)) {
        throw new Error(
          '"target" must be "foe1", "foe2", "both-foes", or "ally".',
        );
      }
      const ally = b.ally as Record<string, unknown> | undefined;
      const result = calculateDoublesTurn({
        attacker: asCombatant(
          b.attacker as Record<string, unknown> | undefined,
          "attacker",
        ),
        ally: ally ? asCombatant(ally, "ally") : null,
        defenders: [
          asCombatant(defenders[0], "defenders[0]"),
          asCombatant(defenders[1], "defenders[1]"),
        ],
        move: asMove(b.move as Record<string, unknown> | undefined),
        target,
        field: asField(b.field as Record<string, unknown> | undefined),
      });
      return Response.json(result, { status: 200 });
    }
    const input = asCalcInput(b);
    const result = calculateDamage(input);
    return Response.json(result, { status: 200 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Calculation failed." },
      { status: 400 },
    );
  }
}
