/**
 * Badge achievements (Badge workstream).
 *
 * Complements lib/achievements.ts (Workstream 2) — never edit that file.
 * The defs below must exist in the `achievements` table for unlocking to
 * work (user_achievements.achievement_id is a foreign key), so run
 * supabase/migration-badges.sql to seed them; it's idempotent.
 */
import { type AchievementDef, unlockAchievement } from "./achievements";

export const BADGE_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "badge-1",
    name: "Gym Challenger",
    description: "Earn your first gym badge",
    icon: "🏵️",
    category: "Badges",
  },
  {
    id: "badge-5",
    name: "Badge Collector",
    description: "Earn 5 gym badges",
    icon: "🎖️",
    category: "Badges",
  },
  {
    id: "badge-10",
    name: "Gym Leader Material",
    description: "Earn all 10 gym badges",
    icon: "👑",
    category: "Badges",
  },
];

/**
 * Unlock badge achievements for a badge count. Fire-and-forget safe:
 * failures return [] and never throw.
 */
export async function checkBadgeAchievements(
  userId: string,
  earnedCount: number,
): Promise<string[]> {
  const fresh: string[] = [];
  try {
    const when = async (id: string, ok: boolean) => {
      if (!ok) return;
      let newly = false;
      try {
        newly = await unlockAchievement(userId, id);
      } catch {
        newly = false;
      }
      if (newly) fresh.push(id);
    };
    await when("badge-1", earnedCount >= 1);
    await when("badge-5", earnedCount >= 5);
    await when("badge-10", earnedCount >= 10);
  } catch {
    // graceful degradation: no badge achievements, no crash
  }
  return fresh;
}
