/**
 * Shiny-hunt achievement definitions (Workstream: shiny hunt upgrades).
 *
 * These live here — NOT in lib/achievements.ts (that file is owned by
 * another workstream) — and are unlocked via the shared
 * `unlockAchievement(userId, id)` from "@/lib/achievements". The v2 SQL
 * migration seeds matching rows into the `achievements` table so they
 * show up in the gallery.
 */
import type { AchievementDef } from "@/lib/achievements";

export const SHINY_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "hunt-1000",
    name: "Dedicated",
    description: "Reach 1,000 encounters on a single shiny hunt",
    icon: "💪",
    category: "Shiny",
  },
  {
    id: "shiny-phase-5",
    name: "Tough Luck Charm",
    description: "Reach 5 phases on a single shiny hunt",
    icon: "🍀",
    category: "Shiny",
  },
  {
    id: "shiny-10",
    name: "Sparkle Decade",
    description: "Complete 10 shiny hunts",
    icon: "💎",
    category: "Shiny",
  },
];
