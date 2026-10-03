/**
 * Profile emblems for streak milestones (Workstream 3).
 *
 * Coordinator wiring (app/profile/page.tsx, ProfileHighlights emblems state —
 * DO NOT edit from here):
 *
 *   import { getStreakEmblems } from "@/lib/streak-emblems";
 *   // alongside the Daily Star emblem computation:
 *   const streakEmblems = await getStreakEmblems(userId);
 *   setEmblems((prev) => [...prev, ...streakEmblems]);
 *
 * Same { icon, name, detail } shape as the Daily Star emblem. Emblems are
 * earned on the LONGEST streak (once you've hit a milestone, you keep the
 * badge), with the detail line showing the live current streak.
 */
import { getCatchStreak } from "./streaks";

export interface StreakEmblem {
  icon: string;
  name: string;
  detail: string;
}

const STREAK_EMBLEMS = [
  { threshold: 7, icon: "🔥", name: "Week Warrior" },
  { threshold: 30, icon: "🌋", name: "Unstoppable" },
] as const;

/** Streak emblems the user has earned. Empty on any failure. */
export async function getStreakEmblems(userId: string): Promise<StreakEmblem[]> {
  try {
    const { current, longest } = await getCatchStreak(userId);
    return STREAK_EMBLEMS.filter((e) => longest >= e.threshold).map((e) => ({
      icon: e.icon,
      name: e.name,
      detail:
        current >= e.threshold
          ? `${e.threshold}-day catch streak — currently ${current} days 🔥`
          : `${e.threshold}-day catch streak — best: ${longest} days`,
    }));
  } catch {
    return [];
  }
}
