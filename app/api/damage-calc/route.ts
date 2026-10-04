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
 * Response: 200 with the calc result (rolls, KO summary, modifiers, …),
 * or 400 with `{ "error": "…" }` for bad input.
 */

import { calculateDamage, type DamageCalcInput } from "@/lib/damage-calc";

export const dynamic = "force-dynamic";

const EXAMPLE: DamageCalcInput = {
  attacker: { species: "Charizard", level: 50, nature: "Modest" },
  defender: { species: "Venusaur", level: 50, nature: "Calm" },
  move: { power: 90, type: "Fire", category: "special" },
};

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion damage calculator API",
      usage: "POST JSON to /api/damage-calc",
      example: EXAMPLE,
      notes: [
        "species accepts a Pokédex number or a name (case-insensitive).",
        "move.category is 'physical' or 'special'.",
        "field is optional; stab and effectiveness accept 'auto'.",
        "Only attacker.species, defender.species, and move are required.",
      ],
    },
    { status: 200 },
  );
}

function asCalcInput(body: unknown): DamageCalcInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object.");
  }
  const b = body as Record<string, unknown>;
  const attacker = b.attacker as Record<string, unknown> | undefined;
  const defender = b.defender as Record<string, unknown> | undefined;
  const move = b.move as Record<string, unknown> | undefined;
  if (!attacker?.species) throw new Error("attacker.species is required.");
  if (!defender?.species) throw new Error("defender.species is required.");
  if (!move) throw new Error("move is required.");
  if (typeof move.power === "undefined")
    throw new Error("move.power is required.");
  if (!move.type) throw new Error("move.type is required.");
  if (move.category !== "physical" && move.category !== "special") {
    throw new Error("move.category must be 'physical' or 'special'.");
  }
  const field = (b.field ?? {}) as Record<string, unknown>;
  return {
    attacker: {
      species: attacker.species as string | number,
      level: attacker.level as number | undefined,
      nature: attacker.nature as string | undefined,
      ability: attacker.ability as string | undefined,
      item: attacker.item as string | undefined,
      status: attacker.status as string | undefined,
      evs: attacker.evs as DamageCalcInput["attacker"]["evs"],
      ivs: attacker.ivs as DamageCalcInput["attacker"]["ivs"],
      pinchActive: attacker.pinchActive as boolean | undefined,
    },
    defender: {
      species: defender.species as string | number,
      level: defender.level as number | undefined,
      nature: defender.nature as string | undefined,
      ability: defender.ability as string | undefined,
      item: defender.item as string | undefined,
      status: defender.status as string | undefined,
      evs: defender.evs as DamageCalcInput["defender"]["evs"],
      ivs: defender.ivs as DamageCalcInput["defender"]["ivs"],
      notFullyEvolved: defender.notFullyEvolved as boolean | undefined,
      currentHp: defender.currentHp as number | null | undefined,
    },
    move: {
      power: Number(move.power),
      type: String(move.type),
      category: move.category,
    },
    field: {
      weather: field.weather as string | undefined,
      terrain: field.terrain as string | undefined,
      reflect: field.reflect as boolean | undefined,
      lightScreen: field.lightScreen as boolean | undefined,
      crit: field.crit as boolean | undefined,
      stab: field.stab as "auto" | "on" | "off" | undefined,
      effectiveness: field.effectiveness as "auto" | number | undefined,
    },
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  let input: DamageCalcInput;
  try {
    input = asCalcInput(body);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid input." },
      { status: 400 },
    );
  }
  try {
    const result = calculateDamage(input);
    return Response.json(result, { status: 200 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Calculation failed." },
      { status: 400 },
    );
  }
}
