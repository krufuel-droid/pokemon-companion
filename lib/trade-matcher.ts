/**
 * Trade auto-matcher for the community trade board.
 *
 * Compares a signed-in trainer's OPEN trade posts against every other
 * trainer's OPEN posts and finds where offers and wants overlap:
 *
 * - MUTUAL: you offer X and they want X, AND they offer Y and you want Y.
 * - ONE-SIDED: only one of those directions overlaps.
 *
 * Pure logic — no Supabase calls — so it can run on the client over the
 * already-fetched post list. Reuses the TradePost row type read-only.
 */
import type { TradePost } from "./trade-board";

export interface TradeMatch {
  /** The signed-in user's post. */
  myPost: TradePost;
  /** The other trainer's post. */
  theirPost: TradePost;
  /** true when both directions overlap; otherwise one-sided. */
  mutual: boolean;
  /** Pokémon names this side offers that the other side wants (≤1). */
  iOfferTheyWant: string[];
  /** Pokémon names the other side offers that this side wants (≤1). */
  theyOfferIWant: string[];
}

/** Tolerant name compare: lowercase + trimmed. */
export function normalizePokemonName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

/** Do these two names refer to the same Pokémon (tolerant compare)? */
export function namesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizePokemonName(a);
  const nb = normalizePokemonName(b);
  return na.length > 0 && nb.length > 0 && na === nb;
}

/**
 * Find matches for the signed-in user.
 *
 * - Only OPEN posts on both sides (fulfilled/closed posts are skipped).
 * - The user's own posts are never matched against each other.
 * - Mutual matches rank first; within each tier, newest other-post first.
 * - At most one match per (my post, their post) pair — the pair yields one
 *   card showing everything that overlaps.
 */
export function findTradeMatches(
  posts: TradePost[],
  userId: string,
): TradeMatch[] {
  const myOpen = posts.filter(
    (p) => p.user_id === userId && p.status === "open",
  );
  const theirOpen = posts.filter(
    (p) => p.user_id !== userId && p.status === "open",
  );
  if (myOpen.length === 0 || theirOpen.length === 0) return [];

  const matches: TradeMatch[] = [];
  for (const mine of myOpen) {
    for (const theirs of theirOpen) {
      const iOfferTheyWant = namesMatch(mine.offering_name, theirs.looking_name)
        ? [mine.offering_name]
        : [];
      const theyOfferIWant = namesMatch(theirs.offering_name, mine.looking_name)
        ? [theirs.offering_name]
        : [];
      if (iOfferTheyWant.length === 0 && theyOfferIWant.length === 0) {
        continue;
      }
      matches.push({
        myPost: mine,
        theirPost: theirs,
        mutual: iOfferTheyWant.length > 0 && theyOfferIWant.length > 0,
        iOfferTheyWant,
        theyOfferIWant,
      });
    }
  }

  return matches.sort((a, b) => {
    if (a.mutual !== b.mutual) return a.mutual ? -1 : 1;
    return (
      new Date(b.theirPost.created_at).getTime() -
      new Date(a.theirPost.created_at).getTime()
    );
  });
}
