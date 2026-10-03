import type { SupabaseClient } from "@supabase/supabase-js";

/** One row from trade_wishlist / trade_list. */
export interface TradeEntry {
  id: string;
  user_id: string;
  species_id: number;
  species_name: string;
  note: string | null;
}

export type TradeTable = "trade_wishlist" | "trade_list";

export interface TradeListPair<E = TradeEntry> {
  wishlist: E[];
  forTrade: E[];
}

/**
 * Fetch both trade lists for one user. Works with either the browser or the
 * server Supabase client. Throws when the tables don't exist yet (the SQL
 * hasn't been run) so callers can show a setup hint instead of crashing.
 */
export async function fetchTradeLists(
  client: SupabaseClient,
  userId: string,
): Promise<TradeListPair> {
  const [w, t] = await Promise.all([
    client
      .from("trade_wishlist")
      .select("id, user_id, species_id, species_name, note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("trade_list")
      .select("id, user_id, species_id, species_name, note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  if (w.error) throw new Error(w.error.message);
  if (t.error) throw new Error(t.error.message);
  return {
    wishlist: ((w.data as TradeEntry[] | null) ?? []) as TradeEntry[],
    forTrade: ((t.data as TradeEntry[] | null) ?? []) as TradeEntry[],
  };
}

/**
 * Two-way trade matches between me and one other trainer:
 * - youHaveForThem: species on THEIR wishlist that are on MY trade list
 * - theyHaveForYou: species on THEIR trade list that are on MY wishlist
 * Matching is by species_id, so nicknames/notes don't affect it.
 */
export function computeTradeMatches<
  M extends { species_id: number },
  T extends { species_id: number },
>(
  mine: TradeListPair<M>,
  theirs: TradeListPair<T>,
): { youHaveForThem: T[]; theyHaveForYou: T[] } {
  const myTradeIds = new Set(mine.forTrade.map((e) => e.species_id));
  const myWishIds = new Set(mine.wishlist.map((e) => e.species_id));
  return {
    youHaveForThem: theirs.wishlist.filter((e) => myTradeIds.has(e.species_id)),
    theyHaveForYou: theirs.forTrade.filter((e) => myWishIds.has(e.species_id)),
  };
}
