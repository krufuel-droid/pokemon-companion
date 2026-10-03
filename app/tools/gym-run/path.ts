/**
 * Gym Run Tracker helpers: reuse the playthrough guide data ("The Path")
 * from lib/data/guides.ts instead of duplicating challenge lists.
 *
 * Each challenge below is a gym, trial, or titan milestone in the order
 * the game intends. Games whose guides have no gym/trial/titan milestones
 * (e.g. Pokémon Legends: Arceus, which is story-only) return null so the
 * UI falls back to free-text entries.
 */
import { GUIDES } from "@/lib/data/guides";

export type ChallengeKind = "gym" | "trial" | "titan" | "custom";

export interface RunChallenge {
  name: string;
  kind: ChallengeKind;
  detail: string;
}

const CHALLENGE_KINDS = new Set(["gym", "trial", "titan"]);

export const KIND_ICONS: Record<ChallengeKind, string> = {
  gym: "🏟️",
  trial: "✨",
  titan: "🗿",
  custom: "⭐",
};

export const KIND_LABELS: Record<ChallengeKind, string> = {
  gym: "Gym",
  trial: "Trial",
  titan: "Titan",
  custom: "Challenge",
};

/**
 * The ordered gym/trial/titan challenges for a game, pulled straight from
 * that game's guide path. Matches POKEMON_GAMES entries by exact title.
 * Returns null when the game has no path challenge data (free-text mode).
 */
export function getChallengesForGame(game: string): RunChallenge[] | null {
  const guide = GUIDES.find((g) => g.title === game) ?? null;
  if (!guide) return null;
  const challenges = guide.path
    .filter((m) => CHALLENGE_KINDS.has(m.kind))
    .map((m) => ({
      name: m.name,
      kind: m.kind as ChallengeKind,
      detail: m.detail,
    }));
  return challenges.length > 0 ? challenges : null;
}

/** Progress unit label, e.g. "5/8 badges", "3/10 trials", "2/5 titans", "4/13 wins". */
export function progressUnit(challenges: { kind: ChallengeKind }[]): string {
  const kinds = new Set(challenges.map((c) => c.kind));
  if (kinds.size === 1) {
    const only = challenges[0]?.kind;
    if (only === "gym") return "badges";
    if (only === "trial") return "trials";
    if (only === "titan") return "titans";
  }
  return "wins";
}
