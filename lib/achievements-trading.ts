/**
 * Trading-specific achievements for the community trade board.
 *
 * Lives here (NOT in lib/achievements.ts) so the trade-board workstream owns
 * its own catalog. Unlock via `unlockAchievement(userId, id)` from
 * "@/lib/achievements", always fire-and-forget.
 */
import type { AchievementDef } from "@/lib/achievements";

export const TRADING_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-trade-post",
    name: "Open for Business",
    description: "Create your first community trade post",
    icon: "🤝",
    category: "Trading",
  },
  {
    id: "trade-fulfilled",
    name: "Deal Closed",
    description: "Mark a trade post fulfilled",
    icon: "📦",
    category: "Trading",
  },
];
