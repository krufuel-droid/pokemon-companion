/**
 * GET /api/meta — the current competitive snapshot as JSON.
 *
 * Built for programmatic use (e.g. Caleb's VGC AI project via Sunshine):
 * "what does the field look like right now?" Read-only, no login required.
 *
 * Everything here comes verbatim from `lib/data/champions.ts` — the same
 * source as the Champions page's Current meta section. The meta picks are
 * ordered by Limitless VGC's Regulation M-C usage ranking; the usage
 * percentages live inside each pick's `note` text (there is no separate
 * usage field in the source, so none is invented here).
 *
 * STALENESS: a weekly job refreshes champions.ts (meta, tournaments,
 * results). Re-fetch this endpoint instead of caching it — a snapshot
 * older than ~2 weeks is probably out of date.
 *
 * Response: 200 with
 * {
 *   "regulation": "Regulation M-C",
 *   "regulationDates": "September 9 – December 2, 2026",
 *   "snapshotDate": "October 1, 2026",
 *   "source": { "label": "Limitless VGC — Regulation M-C rankings",
 *               "url": "https://limitlessvgc.com" },
 *   "picks": [{ "name": "Rillaboom", "note": "The #1 most-used … 53.6% usage — …" }, …],
 *   "stale": "…"
 * }
 */

import {
  META_PICKS,
  META_SOURCE,
  REGULATION,
  SNAPSHOT_DATE,
} from "@/lib/data/champions";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      name: "Poké Companion competitive meta snapshot",
      regulation: REGULATION.name,
      regulationDates: REGULATION.dates,
      snapshotDate: SNAPSHOT_DATE,
      source: META_SOURCE,
      picks: META_PICKS.map((p) => ({
        name: p.name,
        // Present on form picks (e.g. "Hisuian Arcanine" → speciesName "Arcanine").
        ...(p.speciesName ? { speciesName: p.speciesName } : {}),
        note: p.note,
      })),
      stale:
        "This snapshot is refreshed by a weekly job (lib/data/champions.ts). " +
        "Re-fetch this endpoint instead of caching it — data older than ~2 weeks " +
        "is probably out of date. Usage percentages are embedded in each pick's note.",
    },
    { status: 200 },
  );
}
