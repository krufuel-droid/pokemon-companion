/**
 * Shared types, limits, and helpers for the Phase 3 community features
 * (feed, reactions, friendships, direct messages).
 *
 * Database tables and Row Level Security already exist in
 * supabase/schema.sql — this module only shapes the client side.
 */

/** Client-side character limits (the schema enforces the same server-side). */
export const MAX_POST_LENGTH = 2000;
export const MAX_MESSAGE_LENGTH = 2000;

/** The emoji set available for post reactions. */
export const REACTION_EMOJI = ["❤️", "🔥", "😮", "👏"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJI)[number];

export interface PostAuthor {
  username: string;
  avatar_url: string | null;
}

export interface CommunityPost {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: PostAuthor | null;
}

export interface ReactionRow {
  post_id: string;
  emoji: string;
  user_id: string;
}

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

/** "just now" / "5m ago" / "2h ago" / "3d ago" / "Mar 4". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
