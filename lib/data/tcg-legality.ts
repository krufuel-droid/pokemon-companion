/**
 * TCG format legality helpers (deck builder).
 *
 * Legality comes straight from the pokemontcg.io card payload
 * (`legalities.standard` / `legalities.expanded`): a card is legal in a
 * format only when the API explicitly says "Legal". Unlimited allows
 * everything. Data freshness follows the API (refreshed on each fetch,
 * cached 1h by lib/tcg.ts) — last reviewed 2026-10-03.
 */

import type { TcgCard } from "@/lib/tcg";

export type TcgFormat = "Standard" | "Expanded" | "Unlimited";

export const TCG_FORMATS: TcgFormat[] = ["Standard", "Expanded", "Unlimited"];

/** True when the card may be played in the given format. */
export function isLegalInFormat(card: TcgCard, format: TcgFormat): boolean {
  if (format === "Unlimited") return true;
  const key = format.toLowerCase();
  return card.legalities[key] === "Legal";
}

/** True for basic Energy (the one card type exempt from the 4-copy rule). */
export function isBasicEnergy(card: TcgCard): boolean {
  return (
    card.supertype === "Energy" &&
    card.subtypes.some((s) => s.toLowerCase() === "basic")
  );
}

/** Max copies of one card in a deck (4, or unlimited for basic Energy). */
export function maxCopies(card: TcgCard): number {
  return isBasicEnergy(card) ? 99 : 4;
}

/** Human-readable legality summary for a card across all formats. */
export function legalitySummary(card: TcgCard): string {
  const ok = TCG_FORMATS.filter((f) => isLegalInFormat(card, f));
  return ok.length === 3 ? "Legal everywhere" : `Legal: ${ok.join(", ")}`;
}
