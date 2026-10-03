/**
 * Challenge-track achievement definitions (Workstream 3).
 *
 * lib/achievements.ts owns the achievement catalog + unlock plumbing
 * (read-only for this workstream), so the streak milestones live here as a
 * plain AchievementDef[] export.
 *
 * IMPORTANT: these must ALSO be seeded into the `achievements` table —
 * user_achievements.achievement_id has an FK to achievements(id), so
 * unlockAchievement('streak-7') fails silently until the row exists.
 * supabase/migration-challenges.sql seeds both rows (safe to re-run).
 */
import type { AchievementDef } from "./achievements";

export const CHALLENGE_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Log a Pokémon-of-the-Day catch 7 days in a row",
    icon: "🔥",
    category: "Daily",
  },
  {
    id: "streak-30",
    name: "Unstoppable",
    description: "Log a Pokémon-of-the-Day catch 30 days in a row",
    icon: "🌋",
    category: "Daily",
  },
];
