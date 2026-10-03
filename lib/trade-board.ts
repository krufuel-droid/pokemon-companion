/**
 * Helpers for the community trade board (`trade_posts` table).
 *
 * The board itself lives in `app/community/trades/page.tsx`; this module
 * holds the shared row type, fetch logic, and the trade-evolution helper
 * used to suggest the "trade & trade back" flag.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** One row from trade_posts, with the poster's public profile joined. */
export interface TradePost {
  id: string;
  user_id: string;
  offering_species_id: number;
  offering_name: string;
  looking_species_id: number;
  looking_name: string;
  game: string;
  notes: string | null;
  evo_help: boolean;
  status: "open" | "fulfilled";
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
}

/**
 * Fetch all trade posts, newest first. Works with either the browser or the
 * server Supabase client. Throws when the table doesn't exist yet (the SQL
 * hasn't been run) so callers can show a setup hint instead of crashing.
 */
export async function fetchTradePosts(
  client: SupabaseClient,
): Promise<TradePost[]> {
  const { data, error } = await client
    .from("trade_posts")
    .select(
      "id, user_id, offering_species_id, offering_name, looking_species_id, looking_name, game, notes, evo_help, status, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Omit<TradePost, "author">[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const authors: Record<string, { username: string; avatar_url: string | null }> = {};
  if (ids.length > 0) {
    const { data: profData, error: profError } = await client
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);
    if (!profError) {
      for (const p of (profData as {
        id: string;
        username: string;
        avatar_url: string | null;
      }[] | null) ?? []) {
        authors[p.id] = { username: p.username, avatar_url: p.avatar_url };
      }
    }
  }
  return rows.map((r) => ({ ...r, author: authors[r.user_id] ?? null }));
}

/* ------------------------------------------------------------------ */
/* Trade-evolution helper                                              */
/* ------------------------------------------------------------------ */

/**
 * National Pokédex numbers of species that evolve BY trading (plain trade or
 * holding an item). Used by the board to pre-check the "trade & trade back"
 * flag when someone posts one of these as their offering or looking.
 *
 * Kept intentionally conservative: only the classic trade-evolution lines.
 */
const TRADE_EVOLUTION_IDS = new Set([
  64, // Kadabra → Alakazam
  67, // Machoke → Machamp
  75, // Graveler → Golem
  93, // Haunter → Gengar
  95, // Onix → Steelix (Metal Coat)
  112, // Rhydon → Rhyperior (Protector)
  117, // Seadra → Kingdra (Dragon Scale)
  123, // Scyther → Scizor (Metal Coat)
  125, // Electabuzz → Electivire (Electirizer)
  126, // Magmar → Magmortar (Magmarizer)
  137, // Porygon → Porygon2 (Up-Grade)
  61, // Poliwhirl → Politoed (King's Rock)
  356, // Dusclops → Dusknoir (Reaper Cloth)
  366, // Clamperl → Huntail/Gorebyss (Deep Sea Tooth/Scale)
  349, // Feebas → Milotic (Prism Scale)
  525, // Boldore → Gigalith
  533, // Gurdurr → Conkeldurr
  588, // Karrablast → Escavalier
  616, // Shelmet → Accelgor
  682, // Spritzee → Aromatisse (Sachet)
  684, // Swirlix → Slurpuff (Whipped Dream)
  708, // Phantump → Trevenant
  710, // Pumpkaboo → Gourgeist
]);

/** Does a species (by National Pokédex number) evolve via trade? */
export function evolvesByTrade(speciesId: number): boolean {
  return TRADE_EVOLUTION_IDS.has(speciesId);
}
