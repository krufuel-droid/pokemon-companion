/**
 * Themed Pokémon of the Day helper (Workstream: seasonal events).
 *
 * Drop-in: the POTD picker passes its full candidate list through
 * `applySeasonalFilter()` before hashing to a pick. During an active event the
 * pool is restricted to the event's `potdTypeFilter` types; otherwise the list
 * is returned untouched. Never returns an empty pool — if the filter would
 * remove every candidate, the original list is kept (graceful degradation).
 */
import { getActiveSeasonalEvent } from "./data/seasonal-events";
import type { SpeciesIndex } from "./pokedex";

/**
 * Restrict `candidates` to the active seasonal event's types, if any.
 * Pass the same Date the POTD picker hashes on for consistency.
 */
export function applySeasonalFilter(
  candidates: SpeciesIndex[],
  date: Date = new Date(),
): SpeciesIndex[] {
  const event = getActiveSeasonalEvent(date);
  if (!event || event.potdTypeFilter.length === 0) return candidates;
  const wanted = new Set(event.potdTypeFilter.map((t) => t.toLowerCase()));
  const filtered = candidates.filter((s) =>
    s.types.some((t) => wanted.has(t.toLowerCase())),
  );
  return filtered.length > 0 ? filtered : candidates;
}

/**
 * True while a seasonal event is overriding the POTD pool. Lets the POTD
 * card show a "themed" badge without importing the event data directly.
 */
export function isSeasonalPotdActive(date: Date = new Date()): boolean {
  return getActiveSeasonalEvent(date) !== null;
}
