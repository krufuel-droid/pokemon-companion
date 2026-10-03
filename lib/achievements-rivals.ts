/**
 * Rival-system achievements.
 *
 * Defined here (NOT in lib/achievements.ts) so the rival workstream stays
 * self-contained. Unlock them fire-and-forget with the existing
 * `unlockAchievement(userId, id)` from lib/achievements.ts:
 *
 *   void unlockAchievement(me, "first-rival").catch(() => {});
 */
import type { AchievementDef } from "./achievements";

export const RIVAL_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-rival",
    name: "Friendly Fire",
    description: "Declare your first rival",
    icon: "⚔️",
    category: "Rivals",
  },
  {
    id: "rival-victory",
    name: "Top of the Food Chain",
    description: "Win a weekly rivalry",
    icon: "🏆",
    category: "Rivals",
  },
];
