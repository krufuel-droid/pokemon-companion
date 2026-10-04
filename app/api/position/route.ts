/**
 * POST /api/position — doubles board-state evaluator ("the AI's brain").
 *
 * Built for programmatic use (Caleb's VGC AI project via Sunshine): given a
 * doubles board state, it returns the speed order, per-pairup damage
 * analysis for the AI's declared moves, matchup verdicts, and a
 * STAB-based threat list for the opposing side.
 *
 * Request body (JSON):
 * {
 *   "allies": [combatant, combatant],
 *   "foes":   [combatant, combatant],
 *   "field":  { "weather": "None", "terrain": "None", "trickRoom": false,
 *               "tailwindAllies": 0, "tailwindFoes": 0,
 *               "reflectFoes": false, "lightScreenFoes": false }
 * }
 * Each combatant:
 * { "species": "Incineroar" | 727, "level": 50, "nature": "Adamant",
 *   "ability": "Intimidate", "item": "Sitrus Berry", "status": "Healthy",
 *   "evs": { "hp": 252 }, "ivs": { "spe": 31 },
 *   "teraType": "Fire", "currentHpPct": 100,
 *   "boosts": { "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0 },
 *   "moves": [{ "name": "Flare Blitz", "power": 120, "type": "Fire",
 *               "category": "physical" }] }
 * Only `species` is required per combatant; everything else has defaults
 * (Lv 50, neutral nature, 31 IVs, 0 EVs, full HP, no boosts, no moves).
 *
 * Response: 200 with
 * { "speedOrder": [{ "side", "slot", "species", "effectiveSpeed" }],
 *   "pairups": [{ "attacker", "defender", "moves": [{ "name", "range",
 *                "rangePct", "koChance", "koSummary" }], "verdict" }],
 *   "threats": ["Rillaboom threatens Incineroar: Grass STAB ×2 …"],
 *   "notes": [...] }
 * or 400 with `{ "error": "…" }` for bad input.
 *
 * Math notes (also in GET):
 * - Damage uses the shared Gen 7+ `calculateDamage` — the formula is never
 *   reimplemented here. Stat stages (boosts) apply to damage stats and
 *   effective speed.
 * - `teraType` recomputes the defender's typing as the single Tera type
 *   (abilities persist; Stellar keeps the original defense), and grants
 *   the attacker ×2 STAB on a matching move (Stellar excluded — not modeled).
 * - Type-level abilities (Levitate, Flash Fire, …) are baked into the
 *   effectiveness passed to the calc, so they are never double-counted.
 * - No Protect / Fake Out / priority / redirection modeling — damage is
 *   per-move raw, and there is no prediction of which move a foe clicks.
 */

import {
  calculateDamage,
  combatantStats,
  resolveSpecies,
  stageMult,
  type StatKey,
} from "@/lib/damage-calc";
import type { SpeciesIndex } from "@/lib/pokedex";
import { effectiveness, TYPES } from "@/lib/typechart";
import {
  abilityDefenseMult,
  abilityNote,
  getAbilityTypeEffect,
} from "@/lib/data/ability-effects";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Input shapes
// ---------------------------------------------------------------------------

interface PositionMoveInput {
  name?: string;
  power: number;
  type: string;
  category: "physical" | "special";
}

type BoostKey = "atk" | "def" | "spa" | "spd" | "spe";
const BOOST_KEYS: BoostKey[] = ["atk", "def", "spa", "spd", "spe"];

interface ResolvedMove {
  name: string;
  power: number;
  type: string;
  category: "physical" | "special";
}

interface PositionCombatantInput {
  species: string | number;
  level?: number;
  nature?: string;
  ability?: string;
  item?: string;
  status?: string;
  evs?: Partial<Record<StatKey, number>>;
  ivs?: Partial<Record<StatKey, number>>;
  teraType?: string;
  currentHpPct?: number;
  boosts?: Partial<Record<BoostKey, number>>;
  moves?: ResolvedMove[];
}

interface PositionFieldInput {
  weather?: string;
  terrain?: string;
  trickRoom?: boolean;
  tailwindAllies?: number;
  tailwindFoes?: number;
  reflectFoes?: boolean;
  lightScreenFoes?: boolean;
}

const EXAMPLE = {
  allies: [
    {
      species: "Incineroar",
      level: 50,
      nature: "Adamant",
      ability: "Intimidate",
      evs: { hp: 252, atk: 252 },
      moves: [
        { name: "Flare Blitz", power: 120, type: "Fire", category: "physical" },
        { name: "Knock Off", power: 65, type: "Dark", category: "physical" },
      ],
    },
    {
      species: "Rillaboom",
      level: 50,
      nature: "Jolly",
      ability: "Grassy Surge",
      moves: [
        { name: "Grassy Glide", power: 70, type: "Grass", category: "physical" },
      ],
    },
  ],
  foes: [
    {
      species: "Gholdengo",
      level: 50,
      currentHpPct: 100,
      moves: [
        { name: "Make It Rain", power: 120, type: "Steel", category: "special" },
      ],
    },
    {
      species: "Calyrex-Shadow",
      level: 50,
      moves: [
        { name: "Astral Barrage", power: 120, type: "Ghost", category: "special" },
      ],
    },
  ],
  field: {
    weather: "None",
    terrain: "Grassy",
    trickRoom: false,
    tailwindAllies: 0,
    tailwindFoes: 0,
  },
};

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion position evaluator API",
      usage: "POST JSON to /api/position",
      example: EXAMPLE,
      valid_values: {
        species: "Pokédex number or name (case-insensitive).",
        nature: "Any of the 25 natures; defaults to Hardy (neutral).",
        type: TYPES,
        category: ["physical", "special"],
        weather: ["None", "Harsh Sunlight", "Rain", "Sandstorm", "Snow"],
        terrain: ["None", "Electric", "Grassy", "Psychic", "Misty"],
        boosts: "Stat stages, integers from -6 to +6 (default 0).",
        currentHpPct: "0–100 (default 100).",
        teraType:
          "Any type, or Stellar (keeps the original defense). Recomputes the defender's typing as the single Tera type; abilities persist. On the attacker, a move matching teraType gets ×2 STAB (Stellar excluded).",
      },
      verdict_rule: [
        "favorable: any declared move has koChance >= 0.5, or the attacker's best STAB is ×2+ while it resists the defender's best STAB.",
        "unfavorable: the defender's best STAB is ×2+ against the attacker while the attacker's best return STAB is below ×2.",
        "even: everything else.",
      ],
      notes: [
        "Damage uses the shared Gen 7+ calculator — same math as the site and /api/damage-calc.",
        "Stat stages (boosts) apply to damage stats (atk/def/spa/spd) and effective speed, floored per step as in-game.",
        "Attacker-side teraType grants ×2 STAB on a matching move (Stellar excluded — not modeled).",
        "Speed order: Tailwind ×2 while active, paralysis ×0.5, Choice Scarf ×1.5, Spe stages applied then floored. Trick Room reverses the order. Ties are listed in input order (in-game they are coin flips).",
        "koChance is the fraction of the 16 damage rolls that KO from the defender's current HP.",
        "threats is STAB-based (best STAB type vs the target's typing, ability- and Tera-adjusted) — it does not use the foe's declared moves and does not predict which move a foe clicks.",
        "Not modeled: Protect, Fake Out, priority brackets, redirection (Follow Me / Rage Powder), or switching.",
      ],
    },
    { status: 200 },
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function asIntIn(v: unknown, lo: number, hi: number, label: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < lo || n > hi) {
    throw new Error(`${label} must be an integer from ${lo} to ${hi}.`);
  }
  return n;
}

function asType(v: unknown, label: string): string {
  const s = String(v ?? "").trim();
  const hit = TYPES.find((t) => t.toLowerCase() === s.toLowerCase());
  if (!hit) {
    throw new Error(
      `${label} must be one of: ${TYPES.join(", ")}.`,
    );
  }
  return hit;
}

function asMove(raw: unknown, label: string): {
  name: string;
  power: number;
  type: string;
  category: "physical" | "special";
} {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${label} must be an object with power, type, category.`);
  }
  const m = raw as Record<string, unknown>;
  if (typeof m.power === "undefined" || Number.isNaN(Number(m.power))) {
    throw new Error(`${label}.power is required.`);
  }
  const power = Number(m.power);
  if (power < 0 || power > 250) {
    throw new Error(`${label}.power must be between 0 and 250.`);
  }
  if (m.category !== "physical" && m.category !== "special") {
    throw new Error(`${label}.category must be "physical" or "special".`);
  }
  return {
    name: typeof m.name === "string" && m.name.trim() ? m.name.trim() : "Move",
    power,
    type: asType(m.type, `${label}.type`),
    category: m.category,
  };
}

function asCombatant(raw: unknown, label: string): PositionCombatantInput {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${label} must be an object with a species.`);
  }
  const c = raw as Record<string, unknown>;
  if (c.species === undefined || c.species === null || String(c.species).trim() === "") {
    throw new Error(`${label}.species is required.`);
  }
  // resolveSpecies throws on unknown species/names.
  resolveSpecies(c.species as string | number);

  const boosts: Partial<Record<BoostKey, number>> = {};
  if (c.boosts !== undefined) {
    if (!c.boosts || typeof c.boosts !== "object") {
      throw new Error(`${label}.boosts must be an object like { "atk": 2 }.`);
    }
    for (const k of BOOST_KEYS) {
      const v = (c.boosts as Record<string, unknown>)[k];
      if (v !== undefined) boosts[k] = asIntIn(v, -6, 6, `${label}.boosts.${k}`);
    }
  }

  let moves: ResolvedMove[] | undefined;
  if (c.moves !== undefined) {
    if (!Array.isArray(c.moves)) {
      throw new Error(`${label}.moves must be an array.`);
    }
    moves = c.moves.map((m, i) => asMove(m, `${label}.moves[${i}]`));
  }

  if (c.currentHpPct !== undefined) {
    asIntIn(c.currentHpPct, 0, 100, `${label}.currentHpPct`);
  }
  if (c.level !== undefined) {
    asIntIn(c.level, 1, 100, `${label}.level`);
  }

  let teraType: string | undefined;
  if (
    c.teraType !== undefined &&
    c.teraType !== null &&
    String(c.teraType).trim() !== ""
  ) {
    const t = String(c.teraType).trim();
    if (t.toLowerCase() !== "stellar") {
      teraType = asType(t, `${label}.teraType`);
    } else {
      teraType = "Stellar";
    }
  }

  return {
    species: c.species as string | number,
    level: c.level === undefined ? 50 : Number(c.level),
    nature: typeof c.nature === "string" ? c.nature : "Hardy",
    ability: typeof c.ability === "string" ? c.ability : "None",
    item: typeof c.item === "string" ? c.item : "None",
    status: typeof c.status === "string" ? c.status : "Healthy",
    evs: (c.evs ?? {}) as Partial<Record<StatKey, number>>,
    ivs: (c.ivs ?? {}) as Partial<Record<StatKey, number>>,
    teraType,
    currentHpPct: c.currentHpPct === undefined ? 100 : Number(c.currentHpPct),
    boosts,
    moves,
  };
}

function asField(raw: unknown): PositionFieldInput {
  const f = (raw ?? {}) as Record<string, unknown>;
  return {
    weather: typeof f.weather === "string" ? f.weather : "None",
    terrain: typeof f.terrain === "string" ? f.terrain : "None",
    trickRoom: f.trickRoom === true,
    tailwindAllies: f.tailwindAllies === undefined ? 0 : asIntIn(f.tailwindAllies, 0, 4, "field.tailwindAllies"),
    tailwindFoes: f.tailwindFoes === undefined ? 0 : asIntIn(f.tailwindFoes, 0, 4, "field.tailwindFoes"),
    reflectFoes: f.reflectFoes === true,
    lightScreenFoes: f.lightScreenFoes === true,
  };
}

// ---------------------------------------------------------------------------
// Resolved board
// ---------------------------------------------------------------------------

interface ResolvedMon {
  side: "ally" | "foe";
  slot: 0 | 1;
  species: SpeciesIndex;
  name: string;
  level: number;
  nature: string;
  ability: string;
  item: string;
  status: string;
  evs: Partial<Record<StatKey, number>>;
  ivs: Partial<Record<StatKey, number>>;
  /** Defense typing after Tera (Stellar keeps the original). */
  defTypes: string[];
  teraType: string | undefined;
  maxHp: number;
  currentHp: number;
  moves: { name: string; power: number; type: string; category: "physical" | "special" }[];  effectiveSpeed: number;
  /** Stat stages, passed through to damage rolls. */
  boosts: Partial<Record<BoostKey, number>>;
  /** True when the ability is a type-level one baked into effectiveness. */
  abilityBaked: boolean;
}

function resolveMon(
  c: PositionCombatantInput,
  side: "ally" | "foe",
  slot: 0 | 1,
  field: PositionFieldInput,
): ResolvedMon {
  const species = resolveSpecies(c.species)!;
  const level = c.level ?? 50;
  const stats = combatantStats(
    species,
    level,
    c.nature ?? "Hardy",
    c.evs ?? {},
    c.ivs ?? {},
  );
  const maxHp = Math.max(1, stats.hp);
  const currentHp = Math.max(
    1,
    Math.floor((maxHp * (c.currentHpPct ?? 100)) / 100),
  );

  // Effective speed: Spe stages → paralysis → Tailwind → Choice Scarf.
  let spe = stats.spe;
  spe = Math.floor(spe * stageMult(c.boosts?.spe ?? 0));
  if ((c.status ?? "Healthy").toLowerCase() === "paralyzed") {
    spe = Math.floor(spe * 0.5);
  }
  const tailwind = side === "ally" ? field.tailwindAllies : field.tailwindFoes;
  if ((tailwind ?? 0) > 0) spe = Math.floor(spe * 2);
  if ((c.item ?? "None").toLowerCase() === "choice scarf") {
    spe = Math.floor(spe * 1.5);
  }
  spe = Math.max(1, spe);

  const tera = c.teraType;
  const defTypes =
    tera && tera !== "Stellar" ? [tera] : [...species.types];

  return {
    side,
    slot,
    species,
    name: species.name,
    level,
    nature: c.nature ?? "Hardy",
    ability: c.ability ?? "None",
    item: c.item ?? "None",
    status: c.status ?? "Healthy",
    evs: c.evs ?? {},
    ivs: c.ivs ?? {},
    defTypes,
    teraType: tera,
    maxHp,
    currentHp,
    moves: (c.moves ?? []).map((m, i) => ({
      name: m.name === "Move" ? `Move ${i + 1}` : m.name,
      power: m.power,
      type: m.type,
      category: m.category,
    })),
    effectiveSpeed: spe,
    boosts: { ...(c.boosts ?? {}) },
    abilityBaked: getAbilityTypeEffect(c.ability) !== undefined,
  };
}

/** Best STAB attacking type vs a defender (ability- and Tera-adjusted). */
function bestStabVs(
  atkTypes: string[],
  def: ResolvedMon,
): { type: string; mult: number } {
  let best = { type: atkTypes[0] ?? "Normal", mult: 0 };
  for (const t of atkTypes) {
    const base = effectiveness(t, def.defTypes);
    const adj = abilityDefenseMult(def.ability, t, base);
    if (adj > best.mult) best = { type: t, mult: adj };
  }
  return best;
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

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
    if (!Array.isArray(b.allies) || b.allies.length !== 2) {
      throw new Error('"allies" must be an array of exactly two combatants.');
    }
    if (!Array.isArray(b.foes) || b.foes.length !== 2) {
      throw new Error('"foes" must be an array of exactly two combatants.');
    }
    const field = asField(b.field);
    const allies = (b.allies as unknown[]).map((c, i) =>
      resolveMon(asCombatant(c, `allies[${i}]`), "ally", i as 0 | 1, field),
    );
    const foes = (b.foes as unknown[]).map((c, i) =>
      resolveMon(asCombatant(c, `foes[${i}]`), "foe", i as 0 | 1, field),
    );

    // --- Speed order ---
    const order = [...allies, ...foes].sort((x, y) =>
      field.trickRoom
        ? x.effectiveSpeed - y.effectiveSpeed
        : y.effectiveSpeed - x.effectiveSpeed,
    );
    const speedOrder = order.map((m) => ({
      side: m.side,
      slot: m.slot,
      species: m.name,
      effectiveSpeed: m.effectiveSpeed,
    }));

    // --- Pairups: each ally's declared moves vs each foe ---
    const pairups: Array<{
      attacker: { side: string; slot: number; species: string };
      defender: { side: string; slot: number; species: string };
      moves: Array<{
        name: string;
        range: string;
        rangePct: string;
        koChance: number;
        koSummary: string;
      }>;
      verdict: "favorable" | "even" | "unfavorable";
    }> = [];

    for (const atk of allies) {
      for (const def of foes) {
        const moveResults = atk.moves.map((mv) => {
          // Effectiveness baked here so type-level abilities (Levitate…)
          // and Tera are honored; those abilities are stripped from the
          // defender passed to the calc to avoid double-counting.
          const baseEff = effectiveness(mv.type, def.defTypes);
          const adjEff = abilityDefenseMult(def.ability, mv.type, baseEff);
          const result = calculateDamage({
            attacker: {
              species: atk.species.id,
              level: atk.level,
              nature: atk.nature,
              ability: atk.ability,
              item: atk.item,
              status: atk.status,
              evs: atk.evs,
              ivs: atk.ivs,
              boosts: atk.boosts,
              teraType: atk.teraType,
            },
            defender: {
              species: def.species.id,
              level: def.level,
              nature: def.nature,
              ability: def.abilityBaked ? "None" : def.ability,
              item: def.item,
              status: def.status,
              evs: def.evs,
              ivs: def.ivs,
              boosts: def.boosts,
              currentHp: def.currentHp,
            },
            move: { power: mv.power, type: mv.type, category: mv.category },
            field: {
              weather: field.weather,
              terrain: field.terrain,
              reflect: field.reflectFoes,
              lightScreen: field.lightScreenFoes,
              effectiveness: adjEff,
            },
          });
          const kos = result.rolls.filter((r) => r >= def.currentHp).length;
          return {
            name: mv.name,
            range: `${result.minRoll}-${result.maxRoll}`,
            rangePct: `${result.minPct}-${result.maxPct}`,
            koChance: Math.round((kos / result.rolls.length) * 100) / 100,
            koSummary: result.koSummary,
          };
        });

        const atkBest = bestStabVs(atk.species.types, def);
        const foeBest = bestStabVs(def.species.types, atk);
        const allyResists = foeBest.mult < 1;
        let verdict: "favorable" | "even" | "unfavorable" = "even";
        if (
          moveResults.some((m) => m.koChance >= 0.5) ||
          (atkBest.mult >= 2 && allyResists)
        ) {
          verdict = "favorable";
        } else if (foeBest.mult >= 2 && atkBest.mult < 2) {
          verdict = "unfavorable";
        }

        pairups.push({
          attacker: { side: atk.side, slot: atk.slot, species: atk.name },
          defender: { side: def.side, slot: def.slot, species: def.name },
          moves: moveResults,
          verdict,
        });
      }
    }

    // --- Threats: each foe's best STAB vs each ally ---
    const threats: string[] = [];
    for (const foe of foes) {
      for (const ally of allies) {
        const { type, mult } = bestStabVs(foe.species.types, ally);
        if (mult >= 2) {
          const note = abilityNote(
            ally.ability,
            type,
            effectiveness(type, ally.defTypes),
          );
          const hasAbility =
            ally.ability.trim() !== "" &&
            ally.ability.toLowerCase() !== "none";
          // Attacker-side Tera: a STAB matching the foe's Tera type hits
          // with ×2 STAB instead of ×1.5 (Stellar excluded — not modeled).
          const teraOff =
            foe.teraType &&
            foe.teraType.toLowerCase() !== "stellar" &&
            foe.teraType.toLowerCase() === type.toLowerCase();
          threats.push(
            `${foe.name} threatens ${ally.name}: ${type} STAB ×${mult}` +
              (mult >= 4 ? " (4×!)" : "") +
              (teraOff ? " — Terastallized: ×2 STAB" : "") +
              (note ? ` — ${note}` : hasAbility ? " (ability-adjusted)" : ""),
          );
        }
      }
    }

    const notes: string[] = [];
    if (field.trickRoom) notes.push("Trick Room is up: speed order reversed.");
    if ((field.tailwindAllies ?? 0) > 0)
      notes.push(`Tailwind (allies): ${field.tailwindAllies} turn(s) left.`);
    if ((field.tailwindFoes ?? 0) > 0)
      notes.push(`Tailwind (foes): ${field.tailwindFoes} turn(s) left.`);
    notes.push(
      "Stat stages (boosts) apply to damage stats and effective speed.",
    );

    return Response.json(
      { speedOrder, pairups, threats, notes },
      { status: 200 },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Evaluation failed." },
      { status: 400 },
    );
  }
}
