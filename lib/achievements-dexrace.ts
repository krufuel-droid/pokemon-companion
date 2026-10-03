/**
 * Dex race achievement definitions (Living Dex race leaderboard).
 *
 * These live here (not in lib/achievements.ts) so the race workstream owns
 * them. The definition is also seeded into the `achievements` table by
 * supabase/migration-dex-race.sql, which unlockAchievement needs because
 * user_achievements.achievement_id references achievements(id).
 */
import type { AchievementDef } from "./achievements";

export const DEXRACE_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "dex-race-leader",
    name: "Dex Sprinter",
    description: "Top the friends Living Dex race leaderboard for a week",
    icon: "🏁",
    category: "Collection",
  },
];
