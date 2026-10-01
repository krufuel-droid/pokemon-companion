"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import CommunityTabs from "@/components/CommunityTabs";
import { timeAgo, type FriendProfile, type Friendship } from "@/lib/community";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

type FriendRow = Friendship & { other: FriendProfile | null };

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{children}</h2>
  );
}

export default function FriendsPage() {
  const { configured, loading, user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FriendProfile>>({});
  const [loadingFriends, setLoadingFriends] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [confirmUnfriend, setConfirmUnfriend] = useState<string | null>(null);

  /** Pure fetch: my friendships plus the other party's profiles. */
  const fetchFriendData = useCallback(async (): Promise<{
    rows: Friendship[];
    map: Record<string, FriendProfile>;
  }> => {
    if (!user) return { rows: [], map: {} };
    const supabase = createClient();
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data as Friendship[]) ?? [];

    const otherIds = [
      ...new Set(
        rows.map((r) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)),
      ),
    ];
    const map: Record<string, FriendProfile> = {};
    if (otherIds.length > 0) {
      const { data: profData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherIds);
      for (const p of (profData as FriendProfile[]) ?? []) map[p.id] = p;
    }
    return { rows, map };
  }, [user]);

  /** Manual refresh used after friend actions (event handlers). */
  const reload = useCallback(() => {
    void fetchFriendData()
      .then(({ rows, map }) => {
        setFriendships(rows);
        setProfiles(map);
      })
      .catch((e: unknown) =>
        console.error("Failed to load friendships:", e instanceof Error ? e.message : e),
      );
  }, [fetchFriendData]);

  // Initial load once auth is ready. State updates happen in the promise
  // continuation (after the network round-trip), never synchronously.
  useEffect(() => {
    if (!configured || loading || !user) return;
    let cancelled = false;
    void fetchFriendData()
      .then(({ rows, map }) => {
        if (cancelled) return;
        setFriendships(rows);
        setProfiles(map);
        setLoadingFriends(false);
      })
      .catch((e: unknown) =>
        console.error("Failed to load friendships:", e instanceof Error ? e.message : e),
      );
    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, fetchFriendData]);

  const rows: FriendRow[] = useMemo(() => {
    if (!user) return [];
    return friendships.map((f) => ({
      ...f,
      other:
        profiles[f.requester_id === user.id ? f.addressee_id : f.requester_id] ??
        null,
    }));
  }, [friendships, profiles, user]);

  const incoming = rows.filter(
    (r) => r.status === "pending" && user && r.addressee_id === user.id,
  );
  const outgoing = rows.filter(
    (r) => r.status === "pending" && user && r.requester_id === user.id,
  );
  const friends = rows.filter((r) => r.status === "accepted");

  /** Any existing friendship row between me and another user, either direction. */
  const existingRow = useCallback(
    (otherId: string) =>
      rows.find(
        (r) =>
          (r.requester_id === user?.id && r.addressee_id === otherId) ||
          (r.requester_id === otherId && r.addressee_id === user?.id),
      ),
    [rows, user],
  );

  async function sendRequest(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const name = searchInput.trim();
    setSearchError(null);
    setSearchInfo(null);
    if (!USERNAME_RE.test(name)) {
      setSearchError("Enter a valid trainer name (3–24 chars: letters, numbers, underscores).");
      return;
    }
    setSearching(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", name)
        .maybeSingle();
      const found = data as FriendProfile | null;
      if (!found) {
        setSearchError(`No trainer named "${name}" found. Check the spelling.`);
        return;
      }
      if (found.id === user.id) {
        setSearchError("That's you! You can't send yourself a friend request.");
        return;
      }
      // The schema has no DELETE policy on friendships, so declined /
      // cancelled / unfriended rows live on with status 'blocked'. A new
      // request reuses the existing row instead of inserting a duplicate.
      const existing = existingRow(found.id);
      if (existing) {
        if (existing.status === "accepted") {
          setSearchError(`You're already friends with ${found.username}!`);
          return;
        }
        if (existing.status === "pending") {
          setSearchError(
            existing.requester_id === user.id
              ? `You already sent ${found.username} a request — it's still pending.`
              : `${found.username} already sent you a request — check your inbox!`,
          );
          return;
        }
        // blocked: revive the row as a fresh outgoing request.
        const { error } = await supabase
          .from("friendships")
          .update({ requester_id: user.id, addressee_id: found.id, status: "pending" })
          .eq("id", existing.id);
        if (error) {
          setSearchError(error.message);
          return;
        }
        setSearchInfo(`Friend request sent to ${found.username}! 🎉`);
        setSearchInput("");
        reload();
        return;
      }
      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: found.id,
        status: "pending",
      });
      if (error) {
        setSearchError(
          error.code === "23505"
            ? `A request with ${found.username} already exists.`
            : error.message,
        );
        return;
      }
      setSearchInfo(`Friend request sent to ${found.username}! 🎉`);
      setSearchInput("");
      reload();
    } finally {
      setSearching(false);
    }
  }

  async function accept(id: string) {
    setActionBusy(id);
    try {
      const supabase = createClient();
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
      reload();
    } finally {
      setActionBusy(null);
    }
  }

  /**
   * Decline / cancel / unfriend. The schema has no DELETE policy on
   * friendships, so these move the row to 'blocked' (the schema's terminal
   * non-friend state) instead of deleting it.
   */
  async function blockRow(id: string) {
    setActionBusy(id);
    try {
      const supabase = createClient();
      await supabase.from("friendships").update({ status: "blocked" }).eq("id", id);
      reload();
    } finally {
      setActionBusy(null);
      setConfirmUnfriend(null);
    }
  }

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className={`${cardClass} text-center`}>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Friends need a sign-in</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in to find trainers and build your friends list.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Friends</h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Add trainers by name. Only mutual friends can message each other.
      </p>
      <CommunityTabs />

      {/* Add friend */}
      <form onSubmit={(e) => void sendRequest(e)} className={`${cardClass} mb-6`}>
        <label htmlFor="friend-search" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          Add a friend by trainer name
        </label>
        <div className="flex gap-2">
          <input
            id="friend-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={inputClass}
            placeholder="e.g. minty_fresh"
            maxLength={24}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={searching || searchInput.trim() === ""}
            className="shrink-0 rounded-lg bg-mint px-5 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
          >
            {searching ? "…" : "Send request"}
          </button>
        </div>
        {searchError && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {searchError}
          </p>
        )}
        {searchInfo && (
          <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {searchInfo}
          </p>
        )}
      </form>

      {loadingFriends ? (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading friends…</p>
      ) : (
        <div className="space-y-8">
          {/* Incoming requests */}
          <section>
            <SectionTitle>
              {`Friend requests (${incoming.length})`}
            </SectionTitle>
            {incoming.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No pending requests.</p>
            ) : (
              <ul className="space-y-3">
                {incoming.map((r) => (
                  <li key={r.id} className={`${cardClass} !p-4`}>
                    <div className="flex items-center gap-3">
                      <Avatar username={r.other?.username ?? "?"} avatarUrl={r.other?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={r.other ? `/trainers/${encodeURIComponent(r.other.username)}` : "#"}
                          className="truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
                        >
                          {r.other?.username ?? "Unknown trainer"}
                        </Link>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          sent {timeAgo(r.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void accept(r.id)}
                        disabled={actionBusy === r.id}
                        className="rounded-lg bg-mint px-4 py-1.5 text-sm font-bold text-slate-900 disabled:opacity-60 dark:text-slate-100"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void blockRow(r.id)}
                        disabled={actionBusy === r.id}
                        className="rounded-lg border border-stone-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-950"
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Outgoing requests */}
          {outgoing.length > 0 && (
            <section>
              <SectionTitle>{`Sent requests (${outgoing.length})`}</SectionTitle>
              <ul className="space-y-3">
                {outgoing.map((r) => (
                  <li key={r.id} className={`${cardClass} !p-4`}>
                    <div className="flex items-center gap-3">
                      <Avatar username={r.other?.username ?? "?"} avatarUrl={r.other?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                          {r.other?.username ?? "Unknown trainer"}
                        </span>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          waiting since {timeAgo(r.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void blockRow(r.id)}
                        disabled={actionBusy === r.id}
                        className="rounded-lg border border-stone-300 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-950"
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Friends list */}
          <section>
            <SectionTitle>{`Friends (${friends.length})`}</SectionTitle>
            {friends.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No friends yet — send a request above to get started!
              </p>
            ) : (
              <ul className="space-y-3">
                {friends.map((r) => {
                  return (
                    <li key={r.id} className={`${cardClass} !p-4`}>
                      <div className="flex items-center gap-3">
                        <Avatar username={r.other?.username ?? "?"} avatarUrl={r.other?.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={r.other ? `/trainers/${encodeURIComponent(r.other.username)}` : "#"}
                            className="block truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
                          >
                            {r.other?.username ?? "Unknown trainer"}
                          </Link>
                          <div className="mt-1 flex gap-3">
                            <Link
                              href="/messages"
                              className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
                            >
                              Message
                            </Link>
                          </div>
                        </div>
                        {confirmUnfriend === r.id ? (
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => void blockRow(r.id)}
                              disabled={actionBusy === r.id}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmUnfriend(null)}
                              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-400"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmUnfriend(r.id)}
                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950 dark:hover:text-red-400"
                            aria-label={`Unfriend ${r.other?.username ?? "trainer"}`}
                          >
                            Unfriend
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
