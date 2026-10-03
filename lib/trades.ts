import type { SupabaseClient } from "@supabase/supabase-js";

/** One row from trade_wishlist / trade_list. */
export interface TradeEntry {
  id: string;
  user_id: string;
  species_id: number;
  species_name: string;
  note: string | null;
  game: string | null;
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
      .select("id, user_id, species_id, species_name, note, game")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("trade_list")
      .select("id, user_id, species_id, species_name, note, game")
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
 * Matching is by species_id; when both sides specify a game, the games must
 * also match (a null game means "any game").
 */
export function computeTradeMatches<
  M extends { species_id: number; game?: string | null },
  T extends { species_id: number; game?: string | null },
>(
  mine: TradeListPair<M>,
  theirs: TradeListPair<T>,
): { youHaveForThem: T[]; theyHaveForYou: T[] } {
  const gameOk = (a: string | null | undefined, b: string | null | undefined) =>
    !a || !b || a === b;
  const myTrade = mine.forTrade;
  const myWish = mine.wishlist;
  return {
    youHaveForThem: theirs.wishlist.filter((e) =>
      myTrade.some((m) => m.species_id === e.species_id && gameOk(m.game, e.game)),
    ),
    theyHaveForYou: theirs.forTrade.filter((e) =>
      myWish.some((m) => m.species_id === e.species_id && gameOk(m.game, e.game)),
    ),
  };
}
