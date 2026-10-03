/**
 * Shiny odds table for the shiny hunt tracker.
 *
 * Sources (retrieved via web search, Oct 2026):
 * - Bulbapedia, "Shiny Pokémon" — full odds 1/4096 since Gen 6; Shiny Charm
 *   rerolls twice (3 total rolls) → ≈1/1365; Sparkling Power Lv. 3 adds 3
 *   rolls (4 total) → ≈1/1024 without charm, ≈1/683 with charm.
 * - Bulbapedia, "Masuda method" — Gen 8+: 1/683 without Shiny Charm,
 *   1/512 with Shiny Charm. (Gen 7 was 1/683 → 1/455 with charm; the Gen 8+
 *   numbers are used here since Scarlet/Violet is the current flagship.)
 * - Serebii Scarlet/Violet shiny-hunting guide — Mass Outbreaks grant bonus
 *   rolls scaling with KO count (up to ~25 bonus rolls); the table's 1/1024
 *   base is a representative high-KO value, and 1/512 matches the commonly
 *   cited outbreak + charm + Lv. 3 sandwich combo (1/512.3).
 * - Bulbapedia, "Pokémon Scarlet and Violet Versions" sandwich mechanics —
 *   Sparkling Power has 3 levels; only Lv. 3 gives the full 3 bonus rolls,
 *   so hunts with weaker sandwiches should use the "Other" row.
 *
 * These are representative denominators for display and probability math,
 * not promises — the game rolls what it rolls.
 */

export interface ShinyMethod {
  id: string;
  label: string;
  /** Odds denominator without the Shiny Charm. */
  baseOdds: number;
  /** Odds denominator with the Shiny Charm. */
  charmOdds: number;
  /** Short note shown in the UI explaining what the number covers. */
  note: string;
}

export const SHINY_METHODS: ShinyMethod[] = [
  {
    id: "random",
    label: "Random encounters",
    baseOdds: 4096,
    charmOdds: 1365,
    note: "Full odds. The Shiny Charm rerolls twice (Gen 6+).",
  },
  {
    id: "masuda",
    label: "Masuda Method (breeding)",
    baseOdds: 683,
    charmOdds: 512,
    note: "Gen 8+ values: 1/683 without charm, 1/512 with charm.",
  },
  {
    id: "chain",
    label: "Chain / combo",
    baseOdds: 512,
    charmOdds: 512,
    note: "Representative max-chain value — varies by game (SoS chains, catch combos, brilliant auras).",
  },
  {
    id: "outbreak",
    label: "Mass outbreak",
    baseOdds: 1024,
    charmOdds: 512,
    note: "Scarlet/Violet high-KO-count representative value; stacks with sandwich levels.",
  },
  {
    id: "sandwich",
    label: "Sparkling Power sandwich (Lv. 3)",
    baseOdds: 1024,
    charmOdds: 683,
    note: "Scarlet/Violet Lv. 3 Sparkling Power. Lower levels give worse odds — use Other then.",
  },
  {
    id: "other",
    label: "Other",
    baseOdds: 4096,
    charmOdds: 1365,
    note: "Fallback: full odds, charm rerolls twice.",
  },
];

/** Odds denominator for a method, honoring the Shiny Charm toggle. */
export function oddsFor(methodId: string, hasCharm: boolean): number {
  const m = SHINY_METHODS.find((x) => x.id === methodId);
  if (!m) return hasCharm ? 1365 : 4096;
  return hasCharm ? m.charmOdds : m.baseOdds;
}

/** Display label for a stored method id; falls back to the raw id. */
export function methodLabel(methodId: string): string {
  return SHINY_METHODS.find((m) => m.id === methodId)?.label ?? methodId;
}

/** The UI note for a stored method id. */
export function methodNote(methodId: string): string {
  return SHINY_METHODS.find((m) => m.id === methodId)?.note ?? "";
}
