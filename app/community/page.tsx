"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import CommunityTabs from "@/components/CommunityTabs";
import {
  MAX_POST_LENGTH,
  REACTION_EMOJI,
  timeAgo,
  type CommunityPost,
  type ReactionRow,
} from "@/lib/community";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40";

/** A signed-out visitor sees an invitation to join instead of the feed. */
function SignInPrompt() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className={`${cardClass} text-center`}>
        <h1 className="text-xl font-bold text-slate-900">
          Join the trainer community
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to share posts, react, and chat with fellow trainers.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function Composer({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !user) return;
    if (text.length > MAX_POST_LENGTH) {
      setError(`Posts are limited to ${MAX_POST_LENGTH} characters.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("posts")
        .insert({ author_id: user.id, body: text });
      if (error) {
        setError(error.message);
        return;
      }
      setBody("");
      onPosted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`${cardClass} mb-6`}>
      <label
        htmlFor="post-body"
        className="mb-2 block text-sm font-semibold text-slate-900"
      >
        Share with the community
      </label>
      <textarea
        id="post-body"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={inputClass}
        maxLength={MAX_POST_LENGTH}
        placeholder="Hatched a shiny? Survived a Nuzlocke? Tell the community…"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {body.length}/{MAX_POST_LENGTH}
        </span>
        <button
          type="submit"
          disabled={busy || body.trim() === ""}
          className="rounded-lg bg-mint px-6 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}

function ReactionBar({
  postId,
  reactions,
  userId,
  onToggled,
}: {
  postId: string;
  reactions: ReactionRow[];
  userId: string;
  onToggled: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(emoji: string) {
    if (busy) return;
    setBusy(emoji);
    try {
      const supabase = createClient();
      const mine = reactions.some(
        (r) => r.post_id === postId && r.emoji === emoji && r.user_id === userId,
      );
      if (mine) {
        await supabase
          .from("reactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)
          .eq("emoji", emoji);
      } else {
        const { error } = await supabase
          .from("reactions")
          .insert({ post_id: postId, user_id: userId, emoji });
        // 23505 = unique violation: someone (or a double tap) beat us to it.
        if (error && error.code !== "23505") {
          console.error("Reaction failed:", error.message);
        }
      }
      onToggled();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {REACTION_EMOJI.map((emoji) => {
        const count = reactions.filter(
          (r) => r.post_id === postId && r.emoji === emoji,
        ).length;
        const mine = reactions.some(
          (r) => r.post_id === postId && r.emoji === emoji && r.user_id === userId,
        );
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => void toggle(emoji)}
            disabled={busy !== null}
            aria-pressed={mine}
            aria-label={`React with ${emoji}`}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              mine
                ? "border-mint bg-mint/20 font-semibold text-slate-900"
                : "border-stone-200 bg-stone-50 text-slate-600 hover:border-stone-300 hover:bg-stone-100"
            }`}
          >
            {emoji}
            {count > 0 && <span className="ml-1 text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function PostCard({
  post,
  reactions,
  userId,
  onReactionsChanged,
  onDeleted,
}: {
  post: CommunityPost;
  reactions: ReactionRow[];
  userId: string;
  onReactionsChanged: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const mine = post.author_id === userId;

  async function remove() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (!error) onDeleted();
      else console.error("Delete failed:", error.message);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <article className={cardClass}>
      <div className="flex items-start gap-3">
        <Avatar
          username={post.author?.username ?? "?"}
          avatarUrl={post.author?.avatar_url}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            {post.author ? (
              <Link
                href={`/trainers/${encodeURIComponent(post.author.username)}`}
                className="truncate text-sm font-bold text-slate-900 hover:underline"
              >
                {post.author.username}
              </Link>
            ) : (
              <span className="text-sm font-bold text-slate-400">
                Unknown trainer
              </span>
            )}
            <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">
            {post.body}
          </p>
          <ReactionBar
            postId={post.id}
            reactions={reactions}
            userId={userId}
            onToggled={onReactionsChanged}
          />
        </div>
        {mine && (
          <div className="shrink-0">
            {confirming ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void remove()}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
                >
                  {deleting ? "…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function CommunityPage() {
  const { configured, loading, user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  /** Pure fetch: newest posts with their authors. Throws on failure. */
  const fetchPosts = useCallback(async (): Promise<CommunityPost[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, body, created_at, author_id, author:profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    // The embedded author is a to-one relation: normalize array-or-object
    // shapes into a single author (or null for orphaned posts).
    return ((data ?? []) as unknown as Array<{
      id: string;
      body: string;
      created_at: string;
      author_id: string;
      author:
        | { username: string; avatar_url: string | null }
        | Array<{ username: string; avatar_url: string | null }>
        | null;
    }>).map(
      (row): CommunityPost => ({
        id: row.id,
        body: row.body,
        created_at: row.created_at,
        author_id: row.author_id,
        author: Array.isArray(row.author) ? (row.author[0] ?? null) : row.author,
      }),
    );
  }, []);

  /** Pure fetch: reactions for the given post ids. */
  const fetchReactions = useCallback(
    async (postIds: string[]): Promise<ReactionRow[]> => {
      if (postIds.length === 0) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("reactions")
        .select("post_id, emoji, user_id")
        .in("post_id", postIds);
      if (error) throw new Error(error.message);
      return (data as ReactionRow[]) ?? [];
    },
    [],
  );

  /** Manual refresh used after posting or deleting (event handlers). */
  const reload = useCallback(() => {
    setLoadingFeed(true);
    void fetchPosts()
      .then((rows) => {
        setPosts(rows);
        setLoadingFeed(false);
      })
      .catch((e: unknown) =>
        console.error("Failed to load posts:", e instanceof Error ? e.message : e),
      );
  }, [fetchPosts]);

  const refreshReactions = useCallback(() => {
    const ids = posts.map((p) => p.id);
    void fetchReactions(ids)
      .then(setReactions)
      .catch((e: unknown) =>
        console.error("Failed to load reactions:", e instanceof Error ? e.message : e),
      );
  }, [posts, fetchReactions]);

  // Initial load once auth is ready. State updates happen in the promise
  // continuation (after the network round-trip), never synchronously.
  useEffect(() => {
    if (!configured || loading || !user) return;
    let cancelled = false;
    void fetchPosts()
      .then((rows) => {
        if (cancelled) return;
        setPosts(rows);
        setLoadingFeed(false);
      })
      .catch((e: unknown) =>
        console.error("Failed to load posts:", e instanceof Error ? e.message : e),
      );
    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, fetchPosts]);

  // Keep reactions in sync with the current post list.
  useEffect(() => {
    let cancelled = false;
    const ids = posts.map((p) => p.id);
    void fetchReactions(ids)
      .then((rows) => {
        if (cancelled) return;
        setReactions(rows);
      })
      .catch((e: unknown) =>
        console.error("Failed to load reactions:", e instanceof Error ? e.message : e),
      );
    return () => {
      cancelled = true;
    };
  }, [posts, fetchReactions]);

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return <SignInPrompt />;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Community</h1>
      <p className="mb-6 text-sm text-slate-600">
        The latest from trainers across the site. Be kind — everyone&apos;s
        journey started with a level 5 starter.
      </p>
      <CommunityTabs />
      <Composer onPosted={reload} />
      {loadingFeed ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading posts…</p>
      ) : posts.length === 0 ? (
        <div className={`${cardClass} text-center`}>
          <p className="text-sm text-slate-600">
            No posts yet — be the first to say hello! 👋
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              reactions={reactions}
              userId={user.id}
              onReactionsChanged={refreshReactions}
              onDeleted={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
