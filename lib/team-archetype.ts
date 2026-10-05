/**
 * Team Archetype Analyzer — reads 6 Pokémon and reports the team's game plan.
 *
 * Data sources (all local, no fabrication):
 * - Abilities: observed on real tournament teams, generated from
 *   `public/tournament-teams/*.json` into `data/species-abilities.json`
 *   (dex id → ability names actually seen). Species with no observations
 *   are skipped for ability checks and flagged in the notes.
 * - Moves: `data/moves.json` learnsets (`learnedBy` dex-id lists),
 *   inverted once at module load into species → move names.
 * - Base stats: `@/lib/pokedex` `getSpeciesById` (for speed + stat lean).
 *
 * Heuristics are deliberately transparent — every hit carries the
 * evidence lines that produced it, and the page documents the rules.
 */

import speciesAbilities from "../data/species-abilities.json";
import movesData from "../data/moves.json";
import { getSpeciesById } from "./pokedex";

export interface TeamMon {
  id: number;
  label: string;
}

export type Commitment = "strong" | "moderate" | "hint";

export interface ArchetypeHit {
  key: string;
  name: string;
  emoji: string;
  level: Commitment;
  /** One-line summary, e.g. "Torkoal sets sun · Venusaur, Charizard abuse it". */
  detail: string;
  /** Transparent evidence bullets. */
  evidence: string[];
}

export interface TeamReadout {
  hits: ArchetypeHit[];
  /** Data caveats, e.g. species with no observed abilities. */
  notes: string[];
  /** Headline archetype name, or null when nothing dominates. */
  headline: string | null;
}

// ---------------------------------------------------------------------------
// Data lookups
// ---------------------------------------------------------------------------

const abilityMap = speciesAbilities as Record<string, string[]>;

interface MoveRow {
  name: string;
  learnedBy?: number[];
}

/** Species dex id → set of move names it can learn. Built once. */
const movesBySpecies = (() => {
  const m = new Map<number, Set<string>>();
  for (const row of movesData as MoveRow[]) {
    if (!row.learnedBy) continue;
    for (const dex of row.learnedBy) {
      let s = m.get(dex);
      if (!s) {
        s = new Set<string>();
        m.set(dex, s);
      }
      s.add(row.name);
    }
  }
  return m;
})();

function abilitiesOf(id: number): string[] {
  return abilityMap[String(id)] ?? [];
}

function movesOf(id: number): Set<string> {
  return movesBySpecies.get(id) ?? new Set<string>();
}

function learns(id: number, move: string): boolean {
  const target = move.toLowerCase();
  for (const m of movesOf(id)) {
    if (m.toLowerCase() === target) return true;
  }
  return false;
}

function learnsAny(id: number, moves: string[]): boolean {
  const set = movesOf(id);
  return moves.some((mv) =>
    [...set].some((m) => m.toLowerCase() === mv.toLowerCase()),
  );
}

function baseSpe(id: number): number | null {
  const s = getSpeciesById(id);
  const st = s?.baseStats.find((b) => b.key === "speed");
  return st ? st.value : null;
}

function statLean(id: number): "attacker" | "wall" | "mixed" | null {
  const s = getSpeciesById(id);
  if (!s) return null;
  const v = (k: string) => s.baseStats.find((b) => b.key === k)?.value ?? 0;
  const off = Math.max(v("attack"), v("special-attack"));
  const def = Math.max(v("defense"), v("special-defense"));
  if (off - def >= 30) return "attacker";
  if (def - off >= 30) return "wall";
  return "mixed";
}

// ---------------------------------------------------------------------------
// Archetype definitions
// ---------------------------------------------------------------------------

interface WeatherDef {
  key: string;
  name: string;
  emoji: string;
  setters: string[];
  abusers: string[];
}

const WEATHERS: WeatherDef[] = [
  {
    key: "sun",
    name: "Sun",
    emoji: "☀️",
    setters: ["Drought"],
    abusers: ["Chlorophyll", "Solar Power", "Flower Gift"],
  },
  {
    key: "rain",
    name: "Rain",
    emoji: "🌧️",
    setters: ["Drizzle"],
    abusers: ["Swift Swim", "Rain Dish", "Hydration"],
  },
  {
    key: "sand",
    name: "Sand",
    emoji: "🏜️",
    setters: ["Sand Stream"],
    abusers: ["Sand Rush", "Sand Force", "Sand Veil"],
  },
  {
    key: "snow",
    name: "Snow",
    emoji: "❄️",
    setters: ["Snow Warning"],
    abusers: ["Slush Rush", "Ice Body"],
  },
];

const TERRAIN_SETTERS = [
  "Electric Surge",
  "Grassy Surge",
  "Psychic Surge",
  "Misty Surge",
];
const TERRAIN_ABUSERS = ["Surge Surfer"];

const HAZARDS = ["Stealth Rock", "Spikes", "Toxic Spikes"];
const RECOVERY = [
  "Recover",
  "Roost",
  "Slack Off",
  "Moonlight",
  "Morning Sun",
  "Synthesis",
  "Shore Up",
  "Soft-Boiled",
  "Milk Drink",
];

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function abilityHit(
  mon: TeamMon,
  abilities: string[],
): { mon: TeamMon; ability: string } | null {
  const known = abilitiesOf(mon.id);
  const found = abilities.find((a) => known.includes(a));
  return found ? { mon, ability: found } : null;
}

export function analyzeTeam(team: TeamMon[]): TeamReadout {
  const filled = team.filter((m) => m.id > 0);
  const hits: ArchetypeHit[] = [];
  const notes: string[] = [];

  const noAbilityData = filled.filter(
    (m) => abilitiesOf(m.id).length === 0,
  );
  if (noAbilityData.length > 0) {
    notes.push(
      `No observed ability data for ${noAbilityData.map((m) => m.label).join(", ")} — ability checks skipped for them.`,
    );
  }

  // --- Weather archetypes ---
  for (const w of WEATHERS) {
    const setters = filled
      .map((m) => abilityHit(m, w.setters))
      .filter((x): x is { mon: TeamMon; ability: string } => x !== null);
    const abusers = filled
      .map((m) => abilityHit(m, w.abusers))
      .filter((x): x is { mon: TeamMon; ability: string } => x !== null)
      .filter((a) => !setters.some((s) => s.mon.id === a.mon.id));

    if (setters.length === 0 && abusers.length === 0) continue;

    let level: Commitment;
    if (setters.length >= 1 && abusers.length >= 2) level = "strong";
    else if (
      (setters.length >= 1 && abusers.length === 1) ||
      abusers.length >= 3
    )
      level = "moderate";
    else level = "hint";

    const setterBit =
      setters.length > 0
        ? `${setters.map((s) => `${s.mon.label} (${s.ability})`).join(", ")} set${setters.length > 1 ? "" : "s"} it`
        : "no setter";
    const abuserBit =
      abusers.length > 0
        ? `${abusers.map((a) => `${a.mon.label} (${a.ability})`).join(", ")} abuse it`
        : "no abusers";
    hits.push({
      key: w.key,
      name: `${w.name} team`,
      emoji: w.emoji,
      level,
      detail: `${setterBit} · ${abuserBit}`,
      evidence: [
        `Weather setters found: ${setters.length} (${setters.map((s) => `${s.mon.label} via ${s.ability}`).join(", ") || "none"})`,
        `Weather abusers found: ${abusers.length} (${abusers.map((a) => `${a.mon.label} via ${a.ability}`).join(", ") || "none"})`,
        `Strong = setter + 2+ abusers · Moderate = setter + 1 abuser (or 3+ abusers) · Hint = setter or abusers alone`,
      ],
    });
  }

  // --- Terrain ---
  {
    const setters = filled
      .map((m) => abilityHit(m, TERRAIN_SETTERS))
      .filter((x): x is { mon: TeamMon; ability: string } => x !== null);
    const abusers = filled
      .map((m) => abilityHit(m, TERRAIN_ABUSERS))
      .filter((x): x is { mon: TeamMon; ability: string } => x !== null);
    if (setters.length > 0 || abusers.length > 0) {
      let level: Commitment;
      if (setters.length >= 1 && abusers.length >= 1) level = "strong";
      else if (setters.length >= 2 || abusers.length >= 1) level = "moderate";
      else level = "hint";
      const names = setters.map((s) => s.mon.label);
      hits.push({
        key: "terrain",
        name: "Terrain team",
        emoji: "🌱",
        level,
        detail:
          setters.length > 0
            ? `${names.join(", ")} set${names.length > 1 ? "" : "s"} terrain`
            : "Terrain abusers without a setter",
        evidence: [
          `Terrain setters: ${setters.map((s) => `${s.mon.label} (${s.ability})`).join(", ") || "none"}`,
          `Terrain abusers (Surge Surfer): ${abusers.map((a) => a.mon.label).join(", ") || "none"}`,
        ],
      });
    }
  }

  // --- Trick Room ---
  {
    const trUsers = filled.filter((m) => learns(m.id, "Trick Room"));
    const slow = filled.filter((m) => {
      const spe = baseSpe(m.id);
      return spe !== null && spe <= 60;
    });
    if (trUsers.length > 0) {
      let level: Commitment;
      if (trUsers.length >= 2 && slow.length >= 3) level = "strong";
      else if (slow.length >= 2) level = "moderate";
      else level = "hint";
      hits.push({
        key: "trickroom",
        name: "Trick Room",
        emoji: "🌀",
        level,
        detail: `${trUsers.map((m) => m.label).join(", ")} set${trUsers.length > 1 ? "" : "s"} it · ${slow.length} slow mon${slow.length === 1 ? "" : "s"} (≤60 base Speed)`,
        evidence: [
          `Trick Room learners: ${trUsers.map((m) => m.label).join(", ")}`,
          `Slow composition (≤60 base Speed): ${slow.map((m) => m.label).join(", ") || "none"}`,
          `Strong = 2+ setters + 3+ slow · Moderate = setter(s) + 2+ slow · Hint = a setter alone`,
        ],
      });
    }
  }

  // --- Speed control ---
  {
    const tailwind = filled.filter((m) => learns(m.id, "Tailwind"));
    const webs = filled.filter((m) => learns(m.id, "Sticky Web"));
    const twave = filled.filter((m) => learns(m.id, "Thunder Wave"));
    const tools = tailwind.length + webs.length + twave.length;
    if (tools > 0) {
      // Tailwind is the format's signature speed tool; Thunder Wave alone
      // is too common to ever read as a committed game plan.
      const level: Commitment =
        tailwind.length >= 2 || (tailwind.length >= 1 && tools >= 3)
          ? "strong"
          : tools >= 2
            ? "moderate"
            : "hint";
      const bits: string[] = [];
      if (tailwind.length > 0)
        bits.push(`Tailwind (${tailwind.map((m) => m.label).join(", ")})`);
      if (webs.length > 0)
        bits.push(`Sticky Web (${webs.map((m) => m.label).join(", ")})`);
      if (twave.length > 0)
        bits.push(`Thunder Wave (${twave.map((m) => m.label).join(", ")})`);
      hits.push({
        key: "speedcontrol",
        name: "Speed control",
        emoji: "💨",
        level,
        detail: bits.join(" · "),
        evidence: [
          `Speed-control tools found on ${tools} mon${tools === 1 ? "" : "s"}: ${bits.join("; ") || "none"}`,
          `Strong = 2+ Tailwind users (or Tailwind + 3 tools) · Moderate = 2+ tools · Hint = 1 tool`,
        ],
      });
    }
  }

  // --- Playstyle: stall / hyper offense / balance (emit strongest one) ---
  {
    const hazardMons = filled.filter((m) => learnsAny(m.id, HAZARDS));
    const recoveryMons = filled.filter((m) => learnsAny(m.id, RECOVERY));
    const leans = filled.map((m) => statLean(m.id));
    const attackers = leans.filter((l) => l === "attacker").length;
    const walls = leans.filter((l) => l === "wall").length;

    const candidates: ArchetypeHit[] = [];
    if (recoveryMons.length >= 3 && walls >= 2) {
      candidates.push({
        key: "stall",
        name: "Stall",
        emoji: "🧱",
        level: "strong",
        detail: `${recoveryMons.length} recovery users, ${walls} walls — built to outlast`,
        evidence: [
          `Recovery-move learners: ${recoveryMons.map((m) => m.label).join(", ")}`,
          `Defensive-leaning mons: ${walls} · Hazard setters: ${hazardMons.map((m) => m.label).join(", ") || "none"}`,
        ],
      });
    } else if (recoveryMons.length >= 2 && walls >= 1) {
      candidates.push({
        key: "stall",
        name: "Stall-leaning",
        emoji: "🧱",
        level: "moderate",
        detail: `${recoveryMons.length} recovery users — durable, not full stall`,
        evidence: [
          `Recovery-move learners: ${recoveryMons.map((m) => m.label).join(", ")}`,
          `Defensive-leaning mons: ${walls}`,
        ],
      });
    }
    if (attackers >= 4 && hazardMons.length >= 1 && recoveryMons.length <= 1) {
      candidates.push({
        key: "hyperoffense",
        name: "Hyper offense",
        emoji: "⚡",
        level: "strong",
        detail: `${attackers} attackers, hazards up, almost no recovery — all gas`,
        evidence: [
          `Offensive-leaning mons: ${attackers} of ${filled.length}`,
          `Hazard setters: ${hazardMons.map((m) => m.label).join(", ")} · Recovery users: ${recoveryMons.length}`,
        ],
      });
    } else if (attackers >= 4) {
      candidates.push({
        key: "hyperoffense",
        name: "Offense-leaning",
        emoji: "⚡",
        level: "moderate",
        detail: `${attackers} attackers — hits hard, light on staying power`,
        evidence: [`Offensive-leaning mons: ${attackers} of ${filled.length}`],
      });
    }
    if (
      candidates.length === 0 &&
      attackers >= 2 &&
      attackers <= 3 &&
      walls >= 1 &&
      walls <= 2
    ) {
      candidates.push({
        key: "balance",
        name: "Balance",
        emoji: "⚖️",
        level: "moderate",
        detail: `${attackers} attackers + ${walls} walls — a bit of everything`,
        evidence: [
          `Offensive-leaning: ${attackers} · Defensive-leaning: ${walls} · Mixed: ${leans.filter((l) => l === "mixed").length}`,
        ],
      });
    }
    // Keep only the strongest playstyle read (strong > moderate).
    candidates.sort((a, b) =>
      a.level === b.level ? 0 : a.level === "strong" ? -1 : 1,
    );
    if (candidates.length > 0) hits.push(candidates[0]);
  }

  const rank: Record<Commitment, number> = { strong: 0, moderate: 1, hint: 2 };
  // Within a commitment level, the headline prefers the most defining
  // game plan: weather > terrain > Trick Room > playstyle > speed control.
  const catRank = (key: string): number => {
    if (["sun", "rain", "sand", "snow"].includes(key)) return 0;
    if (key === "terrain") return 1;
    if (key === "trickroom") return 2;
    if (["stall", "hyperoffense", "balance"].includes(key)) return 3;
    return 4;
  };
  hits.sort(
    (a, b) => rank[a.level] - rank[b.level] || catRank(a.key) - catRank(b.key),
  );

  const headline =
    hits.length > 0 && hits[0].level !== "hint" ? hits[0].name : null;

  return { hits, notes, headline };
}
