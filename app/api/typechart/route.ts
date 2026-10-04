/**
 * POST /api/typechart — type effectiveness as a JSON API.
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine).
 * Same type chart as the rest of the app (`effectiveness` in
 * `@/lib/typechart`), with the modeled defensive abilities from
 * `@/lib/data/ability-effects` and optional Terastallization.
 *
 * Request body (JSON):
 * {
 *   "attackType": "Ground",
 *   "defendingTypes": ["Steel", "Psychic"],   // 1–2 types
 *   "ability": "Levitate",                    // optional, one of the modeled abilities
 *   "teraType": "Fire"                        // optional: defender Terastallized into this type
 * }
 * Only `attackType` and `defendingTypes` are required. Type names are
 * case-insensitive. `teraType: "Stellar"` is accepted and leaves defensive
 * typing unchanged (as in-game), noted in the breakdown.
 *
 * Response: 200 with `{ "attackType", "defendingTypes", "ability",
 * "teraType", "multiplier", "breakdown" }`, or 400 with `{ "error": "…" }`
 * for bad input.
 */

import { TYPES, effectiveness } from "@/lib/typechart";
import {
  ABILITY_TYPE_EFFECTS,
  abilityDefenseMult,
  getAbilityTypeEffect,
} from "@/lib/data/ability-effects";

export const dynamic = "force-dynamic";

const EXAMPLE = {
  attackType: "Ground",
  defendingTypes: ["Steel", "Psychic"],
  ability: "Levitate",
};

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion type chart API",
      usage: "POST JSON to /api/typechart",
      example: EXAMPLE,
      valid_types: TYPES,
      modeled_abilities: ABILITY_TYPE_EFFECTS.map((a) => a.name),
      notes: [
        "attackType and defendingTypes are case-insensitive; defendingTypes takes 1–2 types.",
        "ability is optional and must be one of the modeled defensive abilities (Levitate, Flash Fire, Thick Fat, …). Abilities persist through Terastallizing.",
        "teraType is optional: the defender's typing is recomputed as that single type. \"Stellar\" leaves defensive typing unchanged, as in-game.",
        "Category-based abilities (Fluffy, Ice Scales, Fur Coat) and one-time effects (Sturdy, Disguise) are not modeled.",
      ],
    },
    { status: 200 },
  );
}

function normType(raw: unknown, label: string): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error(`${label} must be a type name.`);
  }
  const t = TYPES.find((x) => x.toLowerCase() === raw.trim().toLowerCase());
  if (!t) {
    throw new Error(
      `Unknown type "${raw}". Valid types: ${TYPES.join(", ")}.`,
    );
  }
  return t;
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

    const attackType = normType(b.attackType, "attackType");
    const rawDef = b.defendingTypes;
    if (!Array.isArray(rawDef) || rawDef.length < 1 || rawDef.length > 2) {
      throw new Error('"defendingTypes" must be an array of 1–2 type names.');
    }
    const defendingTypes = rawDef.map((t, i) =>
      normType(t, `defendingTypes[${i}]`),
    );

    let ability: string | null = null;
    if (
      b.ability !== undefined &&
      b.ability !== null &&
      String(b.ability).trim() !== ""
    ) {
      const fx = getAbilityTypeEffect(String(b.ability));
      if (!fx) {
        throw new Error(
          `Unknown ability "${b.ability}". Modeled abilities: ${ABILITY_TYPE_EFFECTS.map(
            (a) => a.name,
          ).join(", ")}.`,
        );
      }
      ability = fx.name;
    }

    let teraType: string | null = null;
    let finalDefTypes = defendingTypes;
    if (
      b.teraType !== undefined &&
      b.teraType !== null &&
      String(b.teraType).trim() !== ""
    ) {
      const raw = String(b.teraType).trim();
      if (/^stellar$/i.test(raw)) {
        teraType = "Stellar";
      } else {
        teraType = normType(raw, "teraType");
        finalDefTypes = [teraType];
      }
    }

    const perType = finalDefTypes.map((d) => ({
      type: d,
      mult: effectiveness(attackType, [d]),
    }));
    const combined = perType.reduce((acc, p) => acc * p.mult, 1);
    const multiplier = ability
      ? abilityDefenseMult(ability, attackType, combined)
      : combined;

    const parts: string[] = [
      `${attackType} vs ${perType
        .map((p) => `${p.type} (×${p.mult})`)
        .join(" and ")} → ×${combined} combined`,
    ];
    if (ability) {
      parts.push(
        multiplier === 0 && combined !== 0
          ? `${ability} grants immunity → ×0`
          : multiplier !== combined
            ? `${ability} adjusts it → ×${multiplier}`
            : `${ability} does not affect this matchup (still ×${multiplier})`,
      );
    }
    if (teraType) {
      parts.push(
        teraType === "Stellar"
          ? "Terastallized into Stellar: defensive typing unchanged"
          : `Terastallized into ${teraType}: defending as ${teraType}`,
      );
    }

    return Response.json(
      {
        attackType,
        defendingTypes,
        ability,
        teraType,
        multiplier,
        breakdown: parts.join(". ") + ".",
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
