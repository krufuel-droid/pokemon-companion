/**
 * Helpers for the TCG card trading board (`tcg_trade_posts` table).
 *
 * Lives as a "Cards" sub-tab inside `app/community/trades/page.tsx`,
 * mirroring the Pokémon `trade_posts` board patterns (public read,
 * owner write/delete, fulfilled toggle, author join).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { TCGDEX_LANGUAGES } from "./tcgdex";

export const CARD_CONDITIONS = [
  "Mint",
  "Near Mint",
  "Excellent",
  "Good",
  "Played",
] as const;

export type CardCondition = (typeof CARD_CONDITIONS)[number];

/** One row from tcg_trade_posts, with the poster's public profile joined. */
export interface CardTradePost {
  id: string;
  user_id: string;
  offering_card_name: string;
  offering_set: string | null;
  offering_language: string;
  offering_condition: string;
  looking_card_name: string;
  looking_set: string | null;
  looking_language: string;
  looking_condition: string | null;
  notes: string | null;
  status: "open" | "fulfilled";
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
}

export function languageLabel(code: string): string {
  return TCGDEX_LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();
}

/**
 * Fetch all card trade posts, newest first. Throws when the table doesn't
 * exist yet so callers can show a setup hint instead of crashing.
 */
export async function fetchCardTradePosts(
  client: SupabaseClient
): Promise<CardTradePost[]> {
  const { data, error } = await client
    .from("tcg_trade_posts")
    .select(
      "id, user_id, offering_card_name, offering_set, offering_language, offering_condition, looking_card_name, looking_set, looking_language, looking_condition, notes, status, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Omit<CardTradePost, "author">[];
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
