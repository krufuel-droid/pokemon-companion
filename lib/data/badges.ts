/**
 * Gym-style badge case (Badge workstream).
 *
 * ~10 virtual "gym badges" for milestone moments, earned live from existing
 * tables. No persistence table: every check degrades gracefully — any DB
 * error (missing table, missing migration, RLS block) just reads as
 * "not earned yet".
 *
 * Tables used (all guarded, none owned by this workstream):
 * - collection        (Living Dex entries, incl. is_shiny)
 * - shiny_hunts       (owner_id, completed, completed_at)
 * - daily_catches     (potd_date, one log per trainer per day)
 * - nuzlocke_battles  (battle_type, result — rival victories)
 * - posts             (author_id — community posts)
 * - trade_list        (offering a Pokémon for trade)
 */
import { createClient } from "../supabase/client";

export interface BadgeCheckResult {
  /** Whether the badge is earned right now. */
  earned: boolean;
  /** Current progress toward `target` (e.g. 42 of 100). */
  progress: number;
  /** ISO timestamp of the moment the badge was effectively earned, when derivable. */
  earnedAt?: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  /** Gym-style flavor line shown under the name. */
  flavor: string;
  /** Hint shown while locked. */
  hint: string;
  /** Progress goal; 1 for one-shot badges. */
  target: number;
  /** Live check against existing tables. Never throws — returns unearned on any failure. */
  check: (userId: string) => Promise<BadgeCheckResult>;
}

type SupabaseBrowserClient = ReturnType<typeof createClient>;

/** Postgrest filter builder piece we chain filters onto. */
type FilterBuilder = {
  eq(column: string, value: unknown): FilterBuilder;
};

/** Count rows on a table; any failure reads as 0 (missing table, RLS block, etc.). */
async function countRows(
  supabase: SupabaseBrowserClient,
  table: string,
  userCol: string,
  userId: string,
  extra?: (q: FilterBuilder) => FilterBuilder,
): Promise<number> {
  try {
    let q: FilterBuilder = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(userCol, userId) as unknown as FilterBuilder;
    if (extra) q = extra(q);
    const res = (await q) as unknown as { count: number | null; error: unknown };
    if (res.error) return 0;
    return res.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Timestamp of the Nth chronologically-earliest row (1-based). Crossing the
 * threshold happens exactly when that row lands, so its timestamp is the
 * badge's earned date. Returns undefined when the threshold isn't met.
 */
async function nthMilestoneAt(
  supabase: SupabaseBrowserClient,
  table: string,
  userCol: string,
  userId: string,
  dateCol: string,
  n: number,
  extra?: (q: FilterBuilder) => FilterBuilder,
): Promise<string | undefined> {
  try {
    let q: FilterBuilder = supabase
      .from(table)
      .select(dateCol)
      .eq(userCol, userId)
      .order(dateCol, { ascending: true })
      .limit(n) as unknown as FilterBuilder;
    if (extra) q = extra(q);
    const res = (await q) as unknown as {
      data: Record<string, string | null>[] | null;
      error: unknown;
    };
    if (res.error || !res.data || res.data.length < n) return undefined;
    return res.data[n - 1]?.[dateCol] ?? undefined;
  } catch {
    return undefined;
  }
}

/** Consecutive-day catch streak from daily_catches (potd_date), ending today or yesterday. */
async function catchStreak(supabase: SupabaseBrowserClient, userId: string): Promise<{
  streak: number;
  endedOn?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("daily_catches")
      .select("potd_date")
      .eq("user_id", userId)
      .order("potd_date", { ascending: false })
      .limit(400);
    if (error || !data) return { streak: 0 };
    const dates = (data as { potd_date: string }[]).map((d) => d.potd_date).sort().reverse();
    if (dates.length === 0) return { streak: 0 };

    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const set = new Set(dates);
    const start = new Date();
    // If today isn't logged yet, the streak can still be alive through yesterday.
    if (!set.has(key(start))) start.setDate(start.getDate() - 1);
    let streak = 0;
    const cursor = new Date(start);
    while (set.has(key(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak > 0 ? { streak, endedOn: key(start) } : { streak: 0 };
  } catch {
    return { streak: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* Badge checks                                                        */
/* ------------------------------------------------------------------ */

function dexCheck(target: number): (userId: string) => Promise<BadgeCheckResult> {
  return async (userId) => {
    try {
      const supabase = createClient();
      const count = await countRows(supabase, "collection", "user_id", userId);
      if (count < target) return { earned: false, progress: count };
      const earnedAt = await nthMilestoneAt(supabase, "collection", "user_id", userId, "caught_at", target);
      return { earned: true, progress: count, earnedAt };
    } catch {
      return { earned: false, progress: 0 };
    }
  };
}

async function checkFirstShinyHunt(userId: string): Promise<BadgeCheckResult> {
  try {
    const supabase = createClient();
    const count = await countRows(supabase, "shiny_hunts", "owner_id", userId, (q) =>
      q.eq("completed", true),
    );
    if (count < 1) return { earned: false, progress: 0 };
    const earnedAt = await nthMilestoneAt(
      supabase, "shiny_hunts", "owner_id", userId, "completed_at", 1,
      (q) => q.eq("completed", true),
    );
    return { earned: true, progress: count, earnedAt };
  } catch {
    return { earned: false, progress: 0 };
  }
}

async function checkShinyDex10(userId: string): Promise<BadgeCheckResult> {
  try {
    const supabase = createClient();
    const count = await countRows(supabase, "collection", "user_id", userId, (q) =>
      q.eq("is_shiny", true),
    );
    if (count < 10) return { earned: false, progress: count };
    const earnedAt = await nthMilestoneAt(
      supabase, "collection", "user_id", userId, "caught_at", 10,
      (q) => q.eq("is_shiny", true),
    );
    return { earned: true, progress: count, earnedAt };
  } catch {
    return { earned: false, progress: 0 };
  }
}

function streakCheck(target: number): (userId: string) => Promise<BadgeCheckResult> {
  return async (userId) => {
    try {
      const supabase = createClient();
      const { streak, endedOn } = await catchStreak(supabase, userId);
      if (streak < target) return { earned: false, progress: streak };
      return { earned: true, progress: streak, earnedAt: endedOn ? `${endedOn}T00:00:00` : undefined };
    } catch {
      return { earned: false, progress: 0 };
    }
  };
}

async function checkRivalWin(userId: string): Promise<BadgeCheckResult> {
  try {
    const supabase = createClient();
    const count = await countRows(supabase, "nuzlocke_battles", "user_id", userId, (q) =>
      q.eq("battle_type", "rival"),
    );
    if (count < 1) return { earned: false, progress: 0 };
    const earnedAt = await nthMilestoneAt(
      supabase, "nuzlocke_battles", "user_id", userId, "battled_at", 1,
      (q) => q.eq("battle_type", "rival"),
    );
    return { earned: true, progress: count, earnedAt };
  } catch {
    return { earned: false, progress: 0 };
  }
}

async function checkPosts10(userId: string): Promise<BadgeCheckResult> {
  try {
    const supabase = createClient();
    const count = await countRows(supabase, "posts", "author_id", userId);
    if (count < 10) return { earned: false, progress: count };
    const earnedAt = await nthMilestoneAt(supabase, "posts", "author_id", userId, "created_at", 10);
    return { earned: true, progress: count, earnedAt };
  } catch {
    return { earned: false, progress: 0 };
  }
}

async function checkTradeFirst(userId: string): Promise<BadgeCheckResult> {
  try {
    const supabase = createClient();
    const count = await countRows(supabase, "trade_list", "user_id", userId);
    if (count < 1) return { earned: false, progress: 0 };
    const earnedAt = await nthMilestoneAt(supabase, "trade_list", "user_id", userId, "created_at", 1);
    return { earned: true, progress: count, earnedAt };
  } catch {
    return { earned: false, progress: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* The badge catalog                                                   */
/* ------------------------------------------------------------------ */

export const BADGES: BadgeDef[] = [
  {
    id: "dex-25",
    name: "Dex Rookie",
    icon: "🥉",
    flavor: "The journey begins.",
    hint: "Log 25 Pokémon in your Living Dex.",
    target: 25,
    check: dexCheck(25),
  },
  {
    id: "dex-100",
    name: "Dex Veteran",
    icon: "🏅",
    flavor: "A third of the way there.",
    hint: "Log 100 Pokémon in your Living Dex.",
    target: 100,
    check: dexCheck(100),
  },
  {
    id: "dex-500",
    name: "Pokémon Professor",
    icon: "🎓",
    flavor: "The lab would be proud.",
    hint: "Log 500 Pokémon in your Living Dex.",
    target: 500,
    check: dexCheck(500),
  },
  {
    id: "shiny-first",
    name: "Golden Star",
    icon: "⭐",
    flavor: "The sparkle finally appeared.",
    hint: "Complete your first shiny hunt.",
    target: 1,
    check: checkFirstShinyHunt,
  },
  {
    id: "shiny-dex-10",
    name: "Sparkle Collector",
    icon: "✨",
    flavor: "A whole box of glitter.",
    hint: "Mark 10 shiny Pokémon as caught in your Living Dex.",
    target: 10,
    check: checkShinyDex10,
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    icon: "🔥",
    flavor: "Seven sunrises, seven catches.",
    hint: "Catch the Pokémon of the Day 7 days in a row.",
    target: 7,
    check: streakCheck(7),
  },
  {
    id: "streak-30",
    name: "Month of Stars",
    icon: "🌟",
    flavor: "An entire moon cycle of dedication.",
    hint: "Catch the Pokémon of the Day 30 days in a row.",
    target: 30,
    check: streakCheck(30),
  },
  {
    id: "rival-win",
    name: "Rival Crusher",
    icon: "⚔️",
    flavor: "Smell ya later, rival.",
    hint: "Win your first rival battle in a Nuzlocke run.",
    target: 1,
    check: checkRivalWin,
  },
  {
    id: "posts-10",
    name: "Community Voice",
    icon: "📣",
    flavor: "The feed knows your name.",
    hint: "Make 10 community posts.",
    target: 10,
    check: checkPosts10,
  },
  {
    id: "trade-first",
    name: "Trade Tycoon",
    icon: "🔄",
    flavor: "Every master starts with one swap.",
    hint: "Offer your first Pokémon for trade.",
    target: 1,
    check: checkTradeFirst,
  },
];

export interface EvaluatedBadge {
  def: BadgeDef;
  earned: boolean;
  progress: number;
  earnedAt?: string;
}

/** Run every badge check for a user. Individual failures never block the rest. */
export async function evaluateBadges(userId: string): Promise<EvaluatedBadge[]> {
  const results = await Promise.all(
    BADGES.map(async (def) => {
      let r: BadgeCheckResult;
      try {
        r = await def.check(userId);
      } catch {
        r = { earned: false, progress: 0 };
      }
      return { def, earned: r.earned, progress: r.progress, earnedAt: r.earnedAt };
    }),
  );
  return results;
}

/** Number of earned badges — feeds the badge achievements in lib/achievements-badges.ts. */
export function countEarned(badges: EvaluatedBadge[]): number {
  return badges.filter((b) => b.earned).length;
}
