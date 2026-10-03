/**
 * Section 3: Friendship levels.
 *
 * Points are earned with one daily "Say hi" interaction per friend
 * (each direction keeps its own row in the friendship_progress table).
 * Once-per-day enforcement lives in app code; this module shapes the
 * client-side tiers and progress.
 */

export interface FriendshipTier {
  name: string;
  emoji: string;
  /** Points needed to reach this tier. */
  minPoints: number;
  /** Points needed for the next tier, or null at the max tier. */
  nextTierAt: number | null;
  /** Name of the next tier, or null at the max tier. */
  nextTierName: string | null;
}

interface TierDef {
  name: string;
  emoji: string;
  minPoints: number;
}

const TIER_DEFS: TierDef[] = [
  { name: "Good Friends", emoji: "💛", minPoints: 0 },
  { name: "Great Friends", emoji: "🧡", minPoints: 7 },
  { name: "Best Friends", emoji: "❤️", minPoints: 30 },
];

/** The tier a point total belongs to, plus where the next tier starts. */
export function friendshipTier(points: number): FriendshipTier {
  let idx = 0;
  for (let i = 0; i < TIER_DEFS.length; i++) {
    if (points >= TIER_DEFS[i].minPoints) idx = i;
  }
  const next = TIER_DEFS[idx + 1] ?? null;
  return {
    name: TIER_DEFS[idx].name,
    emoji: TIER_DEFS[idx].emoji,
    minPoints: TIER_DEFS[idx].minPoints,
    nextTierAt: next ? next.minPoints : null,
    nextTierName: next ? next.name : null,
  };
}

/**
 * Progress within the current tier as a 0–100 percentage, for the slim
 * progress bar. At the max tier the bar is always full.
 */
export function friendshipProgressPct(points: number): number {
  const tier = friendshipTier(points);
  if (tier.nextTierAt === null) return 100;
  const span = tier.nextTierAt - tier.minPoints;
  if (span <= 0) return 100;
  return Math.min(100, Math.max(0, ((points - tier.minPoints) / span) * 100));
}

/** Today's date as YYYY-MM-DD in local time (matches the date column). */
export function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface FriendshipProgress {
  points: number;
  last_interaction_date: string | null;
}
