"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import CommunityTabs from "@/components/CommunityTabs";
import { incrementRecord, getAchievements, type AchievementDef } from "@/lib/achievements";
import { timeAgo, type FriendProfile, type Friendship } from "@/lib/community";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

/** "Online" = seen within the last 5 minutes. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  const t = new Date(lastSeen).getTime();
  return !Number.isNaN(t) && Date.now() - t < ONLINE_WINDOW_MS;
}

type FriendProfileSeen = FriendProfile & { last_seen: string | null };
type FriendRow = Friendship & { other: FriendProfileSeen | null };
type TabId = "friends" | "activity" | "compare";

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{children}</h2>
  );
}

/* ------------------------------------------------------------------ */
/* Activity feed                                                       */
/* ------------------------------------------------------------------ */

interface ActivityItem {
  id: string;
  type: "achievement" | "catch";
  at: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  achievementName?: string;
  achievementIcon?: string;
  speciesName?: string;
  nickname?: string | null;
  runTitle?: string | null;
}

function ActivityFeed({
  friendIds,
  profiles,
}: {
  friendIds: string[];
  profiles: Record<string, FriendProfileSeen>;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const idsKey = useMemo(() => [...friendIds].sort().join(","), [friendIds]);

  useEffect(() => {
    if (friendIds.length === 0) {
      setItems([]);
      setLoadingFeed(false);
      return;
    }
    let cancelled = false;
    setLoadingFeed(true);
    (async () => {
      try {
        const supabase = createClient();
        const defs = await getAchievements();
        const defMap = new Map<string, AchievementDef>(defs.map((d) => [d.id, d]));

        const [uaRes, teamRes] = await Promise.all([
          supabase
            .from("user_achievements")
            .select("user_id, achievement_id, unlocked_at")
            .in("user_id", friendIds)
            .order("unlocked_at", { ascending: false })
            .limit(25),
          supabase
            .from("nuzlocke_team")
            .select("user_id, species_name, nickname, added_at, run_id")
            .in("user_id", friendIds)
            .order("added_at", { ascending: false })
            .limit(25),
        ]);

        const unlocks = (uaRes.data as { user_id: string; achievement_id: string; unlocked_at: string }[] | null) ?? [];
        const catches = (teamRes.data as { user_id: string; species_name: string; nickname: string | null; added_at: string; run_id: string }[] | null) ?? [];

        let runTitles = new Map<string, string>();
        const runIds = [...new Set(catches.map((c) => c.run_id))];
        if (runIds.length > 0) {
          const { data } = await supabase.from("nuzlockes").select("id, title").in("id", runIds);
          runTitles = new Map(((data as { id: string; title: string }[] | null) ?? []).map((r) => [r.id, r.title]));
        }

        const merged: ActivityItem[] = [
          ...unlocks.map((u) => {
            const def = defMap.get(u.achievement_id);
            const p = profiles[u.user_id];
            return {
              id: `ua-${u.user_id}-${u.achievement_id}`,
              type: "achievement" as const,
              at: u.unlocked_at,
              userId: u.user_id,
              username: p?.username ?? "A trainer",
              avatarUrl: p?.avatar_url ?? null,
              achievementName: def?.name ?? "an achievement",
              achievementIcon: def?.icon ?? "🏆",
            };
          }),
          ...catches.map((c, i) => {
            const p = profiles[c.user_id];
            return {
              id: `catch-${c.user_id}-${c.added_at}-${i}`,
              type: "catch" as const,
              at: c.added_at,
              userId: c.user_id,
              username: p?.username ?? "A trainer",
              avatarUrl: p?.avatar_url ?? null,
              speciesName: c.species_name,
              nickname: c.nickname,
              runTitle: runTitles.get(c.run_id) ?? null,
            };
          }),
        ];
        merged.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
        if (!cancelled) setItems(merged.slice(0, 15));
      } catch (e) {
        if (!cancelled) console.error("Failed to load activity:", e instanceof Error ? e.message : e);
      } finally {
        if (!cancelled) setLoadingFeed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (loadingFeed) {
    return <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading activity…</p>;
  }
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Nothing yet — your friends&apos; achievements and catches will show up here.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className={`${cardClass} !p-4`}>
          <div className="flex items-center gap-3">
            <Avatar username={item.username} avatarUrl={item.avatarUrl} size={36} />
            <div className="min-w-0 flex-1">
              {item.type === "achievement" ? (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span role="img" aria-hidden="true" className="mr-1">{item.achievementIcon}</span>
                  <Link
                    href={`/trainers/${encodeURIComponent(item.username)}`}
                    className="font-bold text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {item.username}
                  </Link>{" "}
                  unlocked <span className="font-semibold">{item.achievementName}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span role="img" aria-hidden="true" className="mr-1">⚾</span>
                  <Link
                    href={`/trainers/${encodeURIComponent(item.username)}`}
                    className="font-bold text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {item.username}
                  </Link>{" "}
                  caught{" "}
                  <span className="font-semibold">
                    {item.nickname ? `${item.nickname} (${item.speciesName})` : item.speciesName}
                  </span>
                  {item.runTitle && <span className="text-slate-500 dark:text-slate-400"> in {item.runTitle}</span>}
                </p>
              )}
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{timeAgo(item.at)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Compare                                                             */
/* ------------------------------------------------------------------ */

interface StatSet {
  achievements: number;
  runs: number;
  catches: number;
}

async function fetchStats(userId: string): Promise<StatSet> {
  const supabase = createClient();
  try {
    const [a, r, c] = await Promise.all([
      supabase.from("user_achievements").select("achievement_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("nuzlockes").select("id", { count: "exact", head: true }).eq("owner_id", userId),
      supabase.from("nuzlocke_team").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    return {
      achievements: a.count ?? 0,
      runs: r.count ?? 0,
      catches: c.count ?? 0,
    };
  } catch {
    return { achievements: 0, runs: 0, catches: 0 };
  }
}

function StatRow({ label, mine, theirs }: { label: string; mine: number; theirs: number }) {
  const cell = (v: number, winner: boolean) => (
    <span className={`text-lg font-bold ${winner ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
      {v}
    </span>
  );
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-t border-stone-100 py-3 first:border-t-0 dark:border-slate-800">
      <div className="text-right">{cell(mine, mine >= theirs)}</div>
      <div className="text-center text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="text-left">{cell(theirs, theirs >= mine)}</div>
    </div>
  );
}

function CompareView({
  me,
  myUsername,
  friends,
}: {
  me: string;
  myUsername: string;
  friends: FriendRow[];
}) {
  const [selectedId, setSelectedId] = useState("");
  const [loadingStats, setLoadingStats] = useState(false);
  const [result, setResult] = useState<{ stats: { mine: StatSet; theirs: StatSet }; username: string; avatarUrl: string | null } | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setResult(null);
      return;
    }
    const friend = friends.find((f) => f.other?.id === selectedId);
    if (!friend?.other) return;
    let cancelled = false;
    setLoadingStats(true);
    (async () => {
      const [mine, theirs] = await Promise.all([fetchStats(me), fetchStats(selectedId)]);
      if (!cancelled) {
        setResult({
          stats: { mine, theirs },
          username: friend.other!.username,
          avatarUrl: friend.other!.avatar_url,
        });
        setLoadingStats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, me, friends]);

  return (
    <div>
      <div className={`${cardClass} mb-6`}>
        <label htmlFor="compare-friend" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
          Compare yourself with a friend
        </label>
        <select
          id="compare-friend"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className={inputClass}
        >
          <option value="">Pick a friend…</option>
          {friends.map((f) =>
            f.other ? (
              <option key={f.other.id} value={f.other.id}>
                {f.other.username}
              </option>
            ) : null,
          )}
        </select>
      </div>

      {loadingStats && (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">Crunching numbers…</p>
      )}

      {!loadingStats && result && (
        <div className={cardClass}>
          <div className="mb-4 grid grid-cols-3 items-center gap-2">
            <p className="truncate text-right text-sm font-bold text-slate-900 dark:text-slate-100">{myUsername}</p>
            <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">vs</p>
            <div className="flex items-center gap-2">
              <Avatar username={result.username} avatarUrl={result.avatarUrl} size={28} />
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{result.username}</p>
            </div>
          </div>
          <StatRow label="Achievements" mine={result.stats.mine.achievements} theirs={result.stats.theirs.achievements} />
          <StatRow label="Nuzlocke runs" mine={result.stats.mine.runs} theirs={result.stats.theirs.runs} />
          <StatRow label="Nuzlocke catches" mine={result.stats.mine.catches} theirs={result.stats.theirs.catches} />
        </div>
      )}

      {!loadingStats && !result && (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Pick a friend above to see how you stack up.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Suggestions                                                         */
/* ------------------------------------------------------------------ */

interface Suggestion {
  profile: FriendProfile;
  mutualCount: number;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function FriendsPage() {
  const { configured, loading, user, profile } = useAuth();
  const [tab, setTab] = useState<TabId>("friends");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FriendProfileSeen>>({});
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [confirmUnfriend, setConfirmUnfriend] = useState<string | null>(null);

  /** Pure fetch: my friendships plus the other party's profiles (with last_seen). */
  const fetchFriendData = useCallback(async (): Promise<{
    rows: Friendship[];
    map: Record<string, FriendProfileSeen>;
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
    const map: Record<string, FriendProfileSeen> = {};
    if (otherIds.length > 0) {
      const { data: profData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, last_seen")
        .in("id", otherIds);
      for (const p of (profData as FriendProfileSeen[]) ?? []) map[p.id] = p;
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
  const friendIds = useMemo(
    () => friends.map((f) => f.other?.id).filter((id): id is string => !!id),
    [friends],
  );

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

  /**
   * Core friend-request logic shared by the name search and the
   * suggestions list. Returns a user-facing message.
   */
  const requestFriend = useCallback(
    async (found: FriendProfile): Promise<{ error?: string; info?: string }> => {
      if (!user) return { error: "Sign in first." };
      if (found.id === user.id) return { error: "That's you! You can't send yourself a friend request." };
      // The schema has no DELETE policy on friendships, so declined /
      // cancelled / unfriended rows live on with status 'blocked'. A new
      // request reuses the existing row instead of inserting a duplicate.
      const existing = existingRow(found.id);
      if (existing) {
        if (existing.status === "accepted") return { error: `You're already friends with ${found.username}!` };
        if (existing.status === "pending") {
          return {
            error:
              existing.requester_id === user.id
                ? `You already sent ${found.username} a request — it's still pending.`
                : `${found.username} already sent you a request — check your inbox!`,
          };
        }
        // blocked: revive the row as a fresh outgoing request.
        const { error } = await createClient()
          .from("friendships")
          .update({ requester_id: user.id, addressee_id: found.id, status: "pending" })
          .eq("id", existing.id);
        if (error) return { error: error.message };
        return { info: `Friend request sent to ${found.username}! 🎉` };
      }
      const { error } = await createClient().from("friendships").insert({
        requester_id: user.id,
        addressee_id: found.id,
        status: "pending",
      });
      if (error) {
        return {
          error:
            error.code === "23505"
              ? `A request with ${found.username} already exists.`
              : error.message,
        };
      }
      return { info: `Friend request sent to ${found.username}! 🎉` };
    },
    [user, existingRow],
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
      const { error, info } = await requestFriend(found);
      if (error) setSearchError(error);
      else {
        setSearchInfo(info ?? null);
        setSearchInput("");
        reload();
      }
    } finally {
      setSearching(false);
    }
  }

  /** Friend-of-friend suggestions: accepted friendships are publicly readable. */
  const fetchSuggestions = useCallback(async () => {
    if (!user || friendIds.length === 0) {
      setSuggestions([]);
      return;
    }
    try {
      const supabase = createClient();
      const known = new Set<string>([user.id, ...friendIds]);
      const list = friendIds.join(",");
      const { data } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.in.(${list}),addressee_id.in.(${list})`);
      const counts = new Map<string, number>();
      for (const row of (data as { requester_id: string; addressee_id: string }[] | null) ?? []) {
        // The "other" side of each edge; skip edges between two of my friends.
        const other = known.has(row.requester_id) && !known.has(row.addressee_id)
          ? row.addressee_id
          : !known.has(row.requester_id) && known.has(row.addressee_id)
            ? row.requester_id
            : null;
        if (!other || known.has(other)) continue;
        // Skip anyone I already have any kind of row with (pending/blocked).
        if (existingRow(other)) continue;
        counts.set(other, (counts.get(other) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (top.length === 0) {
        setSuggestions([]);
        return;
      }
      const { data: profData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", top.map(([id]) => id));
      const byId = new Map<string, FriendProfile>(
        ((profData as FriendProfile[] | null) ?? []).map((p) => [p.id, p]),
      );
      setSuggestions(
        top
          .map(([id, mutualCount]) => ({ profile: byId.get(id), mutualCount }))
          .filter((s): s is Suggestion => !!s.profile),
      );
    } catch (e) {
      console.error("Failed to load suggestions:", e instanceof Error ? e.message : e);
    }
  }, [user, friendIds, existingRow]);

  useEffect(() => {
    if (!loadingFriends) void fetchSuggestions();
  }, [loadingFriends, fetchSuggestions]);

  async function suggestAdd(s: Suggestion) {
    setActionBusy(`suggest-${s.profile.id}`);
    setSearchError(null);
    try {
      const { error, info } = await requestFriend(s.profile);
      if (error) {
        setSearchError(error);
      } else {
        setSearchInfo(info ?? null);
        setSuggestions((prev) => prev.filter((p) => p.profile.id !== s.profile.id));
        reload();
      }
    } finally {
      setActionBusy(null);
    }
  }

  async function accept(id: string) {
    setActionBusy(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", id);
      if (!error && user) {
        // Fire-and-forget: count the new friendship for BOTH users.
        const row = friendships.find((f) => f.id === id);
        const otherId = row
          ? row.requester_id === user.id
            ? row.addressee_id
            : row.requester_id
          : null;
        void incrementRecord(user.id, "friends_made").catch(() => {});
        if (otherId) void incrementRecord(otherId, "friends_made").catch(() => {});
      }
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

  const tabs: { id: TabId; label: string }[] = [
    { id: "friends", label: `Friends (${friends.length})` },
    { id: "activity", label: "Activity" },
    { id: "compare", label: "Compare" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Friends</h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Add trainers by name. Only mutual friends can message each other.
      </p>
      <CommunityTabs />

      {/* Sub-tabs */}
      <nav aria-label="Friends sections" className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "activity" && <ActivityFeed friendIds={friendIds} profiles={profiles} />}

      {tab === "compare" && (
        <CompareView me={user.id} myUsername={profile?.username ?? "You"} friends={friends} />
      )}

      {tab === "friends" && (
        <>
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
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <section>
                  <SectionTitle>People you might know</SectionTitle>
                  <ul className="space-y-3">
                    {suggestions.map((s) => (
                      <li key={s.profile.id} className={`${cardClass} !p-4`}>
                        <div className="flex items-center gap-3">
                          <Avatar username={s.profile.username} avatarUrl={s.profile.avatar_url} />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/trainers/${encodeURIComponent(s.profile.username)}`}
                              className="block truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
                            >
                              {s.profile.username}
                            </Link>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              {s.mutualCount} mutual friend{s.mutualCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void suggestAdd(s)}
                            disabled={actionBusy === `suggest-${s.profile.id}`}
                            className="shrink-0 rounded-lg bg-mint px-4 py-1.5 text-sm font-bold text-slate-900 disabled:opacity-60 dark:text-slate-100"
                          >
                            {actionBusy === `suggest-${s.profile.id}` ? "…" : "Add"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

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
                            <Avatar
                              username={r.other?.username ?? "?"}
                              avatarUrl={r.other?.avatar_url}
                              online={isOnline(r.other?.last_seen)}
                            />
                            <div className="min-w-0 flex-1">
                              <Link
                                href={r.other ? `/trainers/${encodeURIComponent(r.other.username)}` : "#"}
                                className="block truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
                              >
                                {r.other?.username ?? "Unknown trainer"}
                              </Link>
                              <div className="mt-1 flex items-center gap-3">
                                <Link
                                  href="/messages"
                                  className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
                                >
                                  Message
                                </Link>
                                {isOnline(r.other?.last_seen) && (
                                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Online
                                  </span>
                                )}
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
        </>
      )}
    </div>
  );
}
