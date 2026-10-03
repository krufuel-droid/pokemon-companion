/**
 * Achievements library (Workstream 2).
 *
 * Owns the achievements catalog, per-user unlocked achievements, and the
 * "records" counters that feed threshold checks. Everything here degrades
 * gracefully: if the achievements tables haven't been migrated yet (or a
 * query fails for any other reason), callers get empty results and the app
 * keeps working.
 *
 * Mutation hooks elsewhere in the app must call incrementRecord
 * fire-and-forget: `void incrementRecord(...).catch(() => {})` — never await
 * it, never let it break the main action.
 */
import { createClient } from "./supabase/client";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

/**
 * Hardcoded fallback catalog of all 42 achievements. Used by getAchievements()
 * whenever the `achievements` table is missing or unreadable, so the UI works
 * before Amanda runs the migration.
 */
const FALLBACK_ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-favorite", name: "First Favorite", description: "Favorite your first Pokémon", icon: "⭐", category: "Collection" },
  { id: "favorite-10", name: "Growing Collection", description: "Favorite 10 Pokémon", icon: "⭐", category: "Collection" },
  { id: "favorite-50", name: "Serious Collector", description: "Favorite 50 Pokémon", icon: "🏅", category: "Collection" },
  { id: "favorite-100", name: "Living Dex Dream", description: "Favorite 100 Pokémon", icon: "💯", category: "Collection" },
  { id: "first-hunt", name: "Shiny Hunter", description: "Start your first shiny hunt", icon: "✨", category: "Shiny" },
  { id: "hunt-100", name: "Persistent", description: "Reach 100 encounters on one hunt", icon: "🔁", category: "Shiny" },
  { id: "first-shiny", name: "Golden!", description: "Complete a shiny hunt", icon: "🌟", category: "Shiny" },
  { id: "shiny-5", name: "Shiny Squad", description: "Complete 5 shiny hunts", icon: "🌈", category: "Shiny" },
  { id: "first-nuzlocke", name: "Brave Soul", description: "Start your first Nuzlocke run", icon: "💀", category: "Nuzlocke" },
  { id: "first-death", name: "First Blood", description: "Lose your first Pokémon (RIP)", icon: "🪦", category: "Nuzlocke" },
  { id: "nuzlocke-complete", name: "Survivor", description: "Complete a Nuzlocke run", icon: "🏆", category: "Nuzlocke" },
  { id: "memorial-10", name: "Fallen Heroes", description: "Memorialize 10 fallen Pokémon", icon: "🕯️", category: "Nuzlocke" },
  { id: "soul-link", name: "Together Strong", description: "Join a friend's Nuzlocke run", icon: "🤝", category: "Nuzlocke" },
  { id: "first-post", name: "Hello World", description: "Make your first community post", icon: "💬", category: "Social" },
  { id: "first-showcase", name: "Showcase Star", description: "Share your first shiny in the Shiny Showcase", icon: "✨", category: "Social" },
  { id: "posts-10", name: "Chatterbox", description: "Make 10 community posts", icon: "📣", category: "Social" },
  { id: "first-friend", name: "Friendly", description: "Add your first friend", icon: "👋", category: "Social" },
  { id: "friends-10", name: "Popular", description: "Have 10 friends", icon: "🎉", category: "Social" },
  { id: "reactions-25", name: "Cheerleader", description: "React to 25 posts", icon: "❤️", category: "Social" },
  { id: "quiz-rookie", name: "Who's That?", description: "Answer a quiz question correctly", icon: "❓", category: "Fun" },
  { id: "quiz-streak-10", name: "Poké Scholar", description: "Get a 10-answer streak in Who's That Pokémon?", icon: "🎓", category: "Fun" },
  { id: "daily-first", name: "Daily Catch", description: "Log a Pokémon of the Day catch", icon: "📅", category: "Daily" },
  { id: "daily-5", name: "Daily Devotee", description: "Log 5 Pokémon of the Day catches", icon: "🌟", category: "Daily" },
  { id: "streak-7", name: "Week Warrior", description: "Log a Pokémon-of-the-Day catch 7 days in a row", icon: "🔥", category: "Daily" },
  { id: "streak-30", name: "Unstoppable", description: "Log a Pokémon-of-the-Day catch 30 days in a row", icon: "🌋", category: "Daily" },
  { id: "hunt-1000", name: "Dedicated", description: "Reach 1,000 encounters on a single shiny hunt", icon: "💪", category: "Shiny" },
  { id: "shiny-phase-5", name: "Tough Luck Charm", description: "Reach 5 phases on a single shiny hunt", icon: "🍀", category: "Shiny" },
  { id: "shiny-10", name: "Sparkle Decade", description: "Complete 10 shiny hunts", icon: "💎", category: "Shiny" },
  { id: "first-trade-post", name: "Open for Business", description: "Create your first community trade post", icon: "🤝", category: "Trading" },
  { id: "trade-fulfilled", name: "Deal Closed", description: "Mark a trade post fulfilled", icon: "📦", category: "Trading" },
  { id: "first-rival", name: "Friendly Fire", description: "Declare your first rival", icon: "⚔️", category: "Rivals" },
  { id: "rival-victory", name: "Top of the Food Chain", description: "Win a weekly rivalry", icon: "🏆", category: "Rivals" },
  { id: "badge-1", name: "Gym Challenger", description: "Earn your first gym badge", icon: "🏵️", category: "Badges" },
  { id: "badge-5", name: "Badge Collector", description: "Earn 5 gym badges", icon: "🎖️", category: "Badges" },
  { id: "badge-10", name: "Gym Leader Material", description: "Earn all 10 gym badges", icon: "👑", category: "Badges" },
  { id: "first-gym-badge", name: "First Gym Badge", description: "Log your first gym badge win in the Gym Run Tracker", icon: "🏵️", category: "Badges" },
  { id: "dex-race-leader", name: "Dex Sprinter", description: "Top the friends Living Dex race leaderboard for a week", icon: "🏁", category: "Collection" },
  { id: "first-card", name: "First Card", description: "Add your first card to your TCG collection", icon: "🃏", category: "TCG" },
  { id: "first-mark", name: "Marked!", description: "Catch your first marked Pokémon", icon: "🎖️", category: "Collection" },
  { id: "first-sandwich", name: "Sandwich Chef", description: "Save your first sandwich recipe", icon: "🥪", category: "Fun" },
  { id: "spooky-week-catch-2026", name: "Ghostly Greetings", description: "Log a Pokémon of the Day catch during Spooky Week", icon: "👻", category: "Seasonal" },
  { id: "spooky-week-catch-5-2026", name: "Graveyard Shift", description: "Log 5 Pokémon of the Day catches during Spooky Week", icon: "🪦", category: "Seasonal" },
];

/**
 * The full achievement catalog, ordered by category then name. Falls back to
 * the hardcoded 38-def list if the `achievements` table is missing/erroring.
 */
export async function getAchievements(): Promise<AchievementDef[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("achievements")
      .select("id, name, description, icon, category")
      .order("category")
      .order("name");
    if (error || !data || data.length === 0) return FALLBACK_ACHIEVEMENTS;
    return data as AchievementDef[];
  } catch {
    return FALLBACK_ACHIEVEMENTS;
  }
}

/** Achievements a user has unlocked. Empty on any failure. */
export async function getUserAchievements(
  userId: string,
): Promise<{ achievement_id: string; unlocked_at: string }[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId);
    if (error) return [];
    return (data as { achievement_id: string; unlocked_at: string }[]) ?? [];
  } catch {
    return [];
  }
}

/** The user's raw record counters. Empty object on any failure. */
export async function getUserRecords(userId: string): Promise<Record<string, number>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_records")
      .select("stat_key, stat_value")
      .eq("user_id", userId);
    if (error) return {};
    const out: Record<string, number> = {};
    for (const row of (data as { stat_key: string; stat_value: number }[]) ?? []) {
      out[row.stat_key] = Number(row.stat_value) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Set a record to the max of its current value and `value`, then run
 * threshold checks. For best-streak style records. Fire-and-forget safe.
 */
export async function maxRecord(userId: string, key: string, value: number): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_records")
      .select("stat_value")
      .eq("user_id", userId)
      .eq("stat_key", key)
      .maybeSingle();
    if (error) throw error;
    const current = Number((data as { stat_value: number } | null)?.stat_value) || 0;
    if (value <= current) return [];
    const { error: upError } = await supabase.from("user_records").upsert(
      {
        user_id: userId,
        stat_key: key,
        stat_value: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,stat_key" },
    );
    if (upError) throw upError;
    return await checkAchievements(userId);
  } catch {
    return [];
  }
}

/**
 * Increment a record counter (default +1), then run threshold checks.
 * Returns newly unlocked achievement ids. Failures return [] — safe to call
 * fire-and-forget from UI mutation handlers.
 */
export async function incrementRecord(
  userId: string,
  key: string,
  delta = 1,
): Promise<string[]> {
  try {
    const supabase = createClient();
    // Read-then-write increment: Postgres upsert can't do relative updates
    // without an RPC, so fetch the current value and add delta.
    const { data, error } = await supabase
      .from("user_records")
      .select("stat_value")
      .eq("user_id", userId)
      .eq("stat_key", key)
      .maybeSingle();
    if (error) throw error;
    const current = Number((data as { stat_value: number } | null)?.stat_value) || 0;
    const { error: upError } = await supabase.from("user_records").upsert(
      {
        user_id: userId,
        stat_key: key,
        stat_value: current + delta,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,stat_key" },
    );
    if (upError) throw upError;
    return await checkAchievements(userId);
  } catch {
    return [];
  }
}

/**
 * Directly unlock one achievement for a user. Returns true only if the
 * insert was new (false when already unlocked or on failure).
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string,
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_achievements")
      .insert({ user_id: userId, achievement_id: achievementId })
      .select("achievement_id");
    // 23505 = unique violation: already unlocked, not an error.
    if (error) return false;
    return ((data as { achievement_id: string }[]) ?? []).length > 0;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Threshold evaluation                                               */
/* ------------------------------------------------------------------ */

type SupabaseBrowserClient = ReturnType<typeof createClient>;

/** Minimal structural view of a postgrest filter builder for counting. */
interface EqFilter {
  eq(column: string, value: unknown): EqFilter;
  or(filters: string): EqFilter;
}

/** Count rows matching a filter. Any failure → 0 (treat table as empty). */
async function countRows(
  supabase: SupabaseBrowserClient,
  table: string,
  apply: (q: EqFilter) => unknown,
): Promise<number> {
  try {
    const base = supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    const res = (await apply(base as unknown as EqFilter)) as {
      count: number | null;
      error: unknown;
    };
    if (res.error) return 0;
    return res.count ?? 0;
  } catch {
    return 0;
  }
}

/** Nuzlocke participation stats. Any failure → zeros. */
async function nuzlockeStats(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<{ owned: number; joined: number; completed: number; soulLinked: boolean }> {
  const empty = { owned: 0, joined: 0, completed: 0, soulLinked: false };
  try {
    const owned = await countRows(supabase, "nuzlockes", (q) =>
      q.eq("owner_id", userId),
    );
    const completed = await countRows(supabase, "nuzlockes", (q) =>
      q.eq("owner_id", userId).eq("status", "completed"),
    );
    // Participation rows → check whether any run belongs to someone else.
    let joined = 0;
    let soulLinked = false;
    const { data: parts } = await supabase
      .from("nuzlocke_participants")
      .select("run_id")
      .eq("user_id", userId);
    const runIds = [
      ...new Set(
        ((parts as { run_id: string }[] | null) ?? []).map((p) => p.run_id),
      ),
    ];
    joined = runIds.length;
    if (runIds.length > 0) {
      const { data: runs } = await supabase
        .from("nuzlockes")
        .select("id, owner_id")
        .in("id", runIds);
      soulLinked = (
        (runs as { id: string; owner_id: string }[] | null) ?? []
      ).some((r) => r.owner_id !== userId);
    }
    return { owned, joined, completed, soulLinked };
  } catch {
    return empty;
  }
}

/** Max encounters across any of the user's shiny hunts. Any failure → 0. */
async function maxEncounters(
  supabase: SupabaseBrowserClient,
  userId: string,
): Promise<number> {
  try {
    const { data } = await supabase
      .from("shiny_hunts")
      .select("encounters")
      .eq("owner_id", userId);
    let max = 0;
    for (const row of (data as { encounters: number }[] | null) ?? []) {
      const n = Number(row.encounters) || 0;
      if (n > max) max = n;
    }
    return max;
  } catch {
    return 0;
  }
}

/**
 * Compare the user's counts against every achievement threshold and insert
 * newly earned achievements (on conflict do nothing). Returns the ids that
 * were newly unlocked by this call.
 */
export async function checkAchievements(userId: string): Promise<string[]> {
  try {
    const supabase = createClient();
    const records = await getUserRecords(userId);
    const rec = (key: string): number => records[key] ?? 0;

    // Collection (favorites)
    const favorites = Math.max(
      await countRows(supabase, "favorites", (q) => q.eq("user_id", userId)),
      rec("favorites_added"),
    );

    // Marks (user_marks table, added Oct 2026)
    const marksCaught = Math.max(
      await countRows(supabase, "user_marks", (q) => q.eq("user_id", userId)),
      rec("marks_caught"),
    );

    // Shiny hunts
    const hunts = Math.max(
      await countRows(supabase, "shiny_hunts", (q) => q.eq("owner_id", userId)),
      rec("hunts_started"),
    );
    const huntsCompleted = Math.max(
      await countRows(supabase, "shiny_hunts", (q) =>
        q.eq("owner_id", userId).eq("completed", true),
      ),
      rec("hunts_completed"),
    );
    const bestEncounters = await maxEncounters(supabase, userId);

    // Nuzlockes + memorials
    const nuz = await nuzlockeStats(supabase, userId);
    const runsStarted = Math.max(nuz.owned, rec("nuzlockes_started"));
    const runsJoined = Math.max(nuz.joined, rec("nuzlockes_joined"));
    const memorials = Math.max(
      await countRows(supabase, "memorials", (q) => q.eq("owner_id", userId)),
      rec("memorials_made"),
    );

    // Social
    const posts = Math.max(
      await countRows(supabase, "posts", (q) => q.eq("author_id", userId)),
      rec("posts_made"),
    );
    const acceptedFriends = Math.max(
      await countRows(supabase, "friendships", (q) =>
        q
          .eq("status", "accepted")
          .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
      ),
      rec("friends_made"),
    );
    const reactions = Math.max(
      await countRows(supabase, "reactions", (q) => q.eq("user_id", userId)),
      rec("reactions_given"),
    );

    const earned: string[] = [];
    const when = (id: string, ok: boolean) => {
      if (ok) earned.push(id);
    };

    when("first-favorite", favorites >= 1);
    when("favorite-10", favorites >= 10);
    when("favorite-50", favorites >= 50);
    when("favorite-100", favorites >= 100);
    when("first-mark", marksCaught >= 1);

    when("first-hunt", hunts >= 1);
    when("hunt-100", bestEncounters >= 100);
    when("first-shiny", huntsCompleted >= 1);
    when("shiny-5", huntsCompleted >= 5);

    when("first-nuzlocke", runsStarted >= 1 || runsJoined >= 1);
    when("nuzlocke-complete", nuz.completed >= 1);
    when("soul-link", nuz.soulLinked || runsJoined >= 1);
    when("first-death", memorials >= 1);
    when("memorial-10", memorials >= 10);

    when("first-post", posts >= 1);
    when("posts-10", posts >= 10);
    when("first-friend", acceptedFriends >= 1);
    when("friends-10", acceptedFriends >= 10);
    when("reactions-25", reactions >= 25);

    // Quiz
    when("quiz-rookie", rec("quiz_correct") >= 1);
    when("quiz-streak-10", rec("quiz_best_streak") >= 10);

    // Daily catches
    when("daily-first", rec("daily_catches") >= 1);
    when("daily-5", rec("daily_catches") >= 5);

    if (earned.length === 0) return [];

    // Only insert achievements not already unlocked.
    const existing = new Set(
      (await getUserAchievements(userId)).map((a) => a.achievement_id),
    );
    const fresh = earned.filter((id) => !existing.has(id));
    if (fresh.length > 0) {
      await supabase.from("user_achievements").upsert(
        fresh.map((id) => ({ user_id: userId, achievement_id: id })),
        { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
      );
    }
    return fresh;
  } catch {
    return [];
  }
}
