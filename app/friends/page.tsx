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
import { fetchTradeLists, computeTradeMatches, type TradeEntry, type TradeListPair } from "@/lib/trades";
import {
  friendshipTier,
  friendshipProgressPct,
  todayLocal,
  type FriendshipProgress,
} from "@/lib/friendship";
import { getSpeciesById } from "@/lib/pokedex";
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
type TabId = "friends" | "activity" | "compare" | "trading";

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
                    href={`/trainer/${encodeURIComponent(item.username)}`}
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
                    href={`/trainer/${encodeURIComponent(item.username)}`}
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
/* Trading matchmaker                                                   */
/* ------------------------------------------------------------------ */

function TradeMatchSpecies({ entry }: { entry: TradeEntry }) {
  const species = getSpeciesById(entry.species_id);
  return (
    <li className="flex items-center gap-2 rounded-lg bg-stone-50 px-2 py-1.5 dark:bg-slate-950">
      {species && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={species.sprites.regular}
          alt={entry.species_name}
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain"
          loading="lazy"
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
          {entry.species_name}
        </p>
        {entry.note && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{entry.note}</p>
        )}
      </div>
    </li>
  );
}

function TradingView({ me, friends }: { me: string; friends: FriendRow[] }) {
  const [mine, setMine] = useState<TradeListPair | null>(null);
  const [theirLists, setTheirLists] = useState<Record<string, TradeListPair>>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNoMatches, setShowNoMatches] = useState(false);

  const validFriends = useMemo(
    () => friends.filter((f): f is FriendRow & { other: FriendProfileSeen } => !!f.other),
    [friends],
  );
  const idsKey = useMemo(
    () => validFriends.map((f) => f.other.id).sort().join(","),
    [validFriends],
  );

  useEffect(() => {
    if (validFriends.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const ids = validFriends.map((f) => f.other.id);
        const [mineRes, wRes, tRes] = await Promise.all([
          fetchTradeLists(supabase, me),
          supabase
            .from("trade_wishlist")
            .select("id, user_id, species_id, species_name, note")
            .in("user_id", ids),
          supabase
            .from("trade_list")
            .select("id, user_id, species_id, species_name, note")
            .in("user_id", ids),
        ]);
        if (wRes.error) throw new Error(wRes.error.message);
        if (tRes.error) throw new Error(tRes.error.message);
        const map: Record<string, TradeListPair> = {};
        for (const id of ids) map[id] = { wishlist: [], forTrade: [] };
        for (const e of ((wRes.data as TradeEntry[] | null) ?? [])) {
          if (map[e.user_id]) map[e.user_id].wishlist.push(e);
        }
        for (const e of ((tRes.data as TradeEntry[] | null) ?? [])) {
          if (map[e.user_id]) map[e.user_id].forTrade.push(e);
        }
        if (!cancelled) {
          setMine(mineRes);
          setTheirLists(map);
          setLoading(false);
        }
      } catch {
        // Trade tables don't exist yet (SQL not run) — hint, don't crash.
        if (!cancelled) {
          setMissing(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, idsKey]);

  const matches = useMemo(
    () =>
      validFriends
        .map((f) => {
          const theirs = theirLists[f.other.id] ?? { wishlist: [], forTrade: [] };
          const { youHaveForThem, theyHaveForYou } = mine
            ? computeTradeMatches(mine, theirs)
            : { youHaveForThem: [] as TradeEntry[], theyHaveForYou: [] as TradeEntry[] };
          return {
            friend: f,
            youHaveForThem,
            theyHaveForYou,
            total: youHaveForThem.length + theyHaveForYou.length,
          };
        })
        .sort((a, b) => b.total - a.total),
    [validFriends, mine, theirLists],
  );

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Finding trade matches…
      </p>
    );
  }
  if (missing) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        Trading needs the latest database update — run the newest SQL in the Supabase SQL Editor
        to enable it.
      </p>
    );
  }
  if (validFriends.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Add some friends to see trade matches here.
      </p>
    );
  }

  const matched = matches.filter((m) => m.total > 0);
  const unmatched = matches.filter((m) => m.total === 0);

  return (
    <div>
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Matches your <Link href="/profile" className="font-semibold underline">Looking For</Link>{" "}
        and <Link href="/profile" className="font-semibold underline">For Trade</Link> lists against
        each friend&apos;s. Tap a trainer to see the details.
      </p>

      {matched.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No trade matches yet — add Pokémon to your lists on your profile and check back!
        </p>
      )}

      <ul className="space-y-3">
        {matched.map((m) => {
          const name = m.friend.other.username;
          const isOpen = expanded === m.friend.other.id;
          const summary: string[] = [];
          if (m.youHaveForThem.length > 0) {
            summary.push(
              `You have ${m.youHaveForThem.length} on ${name}'s wishlist`,
            );
          }
          if (m.theyHaveForYou.length > 0) {
            summary.push(`${name} has ${m.theyHaveForYou.length} you want`);
          }
          return (
            <li key={m.friend.other.id} className={`${cardClass} !p-4`}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : m.friend.other.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 text-left"
              >
                <Avatar
                  username={name}
                  avatarUrl={m.friend.other.avatar_url}
                  online={isOnline(m.friend.other.last_seen)}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/trainer/${encodeURIComponent(name)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span role="img" aria-hidden="true" className="mr-1">🔄</span>
                    {summary.join(" · ")}
                  </p>
                </div>
                <span aria-hidden="true" className="shrink-0 text-slate-400">
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>

              {isOpen && (
                <div
                  className={`mt-3 grid gap-3 border-t border-stone-100 pt-3 dark:border-slate-800 ${
                    m.youHaveForThem.length > 0 && m.theyHaveForYou.length > 0
                      ? "sm:grid-cols-2"
                      : ""
                  }`}
                >
                  {m.youHaveForThem.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        You have {m.youHaveForThem.length} they want
                      </p>
                      <ul className="space-y-1.5">
                        {m.youHaveForThem.map((e) => (
                          <TradeMatchSpecies key={e.id} entry={e} />
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.theyHaveForYou.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        They have {m.theyHaveForYou.length} you want
                      </p>
                      <ul className="space-y-1.5">
                        {m.theyHaveForYou.map((e) => (
                          <TradeMatchSpecies key={e.id} entry={e} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {unmatched.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowNoMatches((v) => !v)}
            aria-expanded={showNoMatches}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-stone-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            {showNoMatches ? "▾" : "▸"} No trade matches ({unmatched.length})
          </button>
          {showNoMatches && (
            <ul className="mt-2 space-y-2 opacity-70">
              {unmatched.map((m) => (
                <li key={m.friend.other.id} className={`${cardClass} !p-3`}>
                  <div className="flex items-center gap-3">
                    <Avatar
                      username={m.friend.other.username}
                      avatarUrl={m.friend.other.avatar_url}
                      size={32}
                    />
                    <Link
                      href={`/trainer/${encodeURIComponent(m.friend.other.username)}`}
                      className="truncate text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300"
                    >
                      {m.friend.other.username}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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
  const [tab, setTab] = useState<TabId>(() => {
    // The trainer profile links here with ?tab=trading.
    if (typeof window === "undefined") return "friends";
    return new URLSearchParams(window.location.search).get("tab") === "trading"
      ? "trading"
      : "friends";
  });
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FriendProfileSeen>>({});
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Add-by-trainer-code (also prefilled from ?add=<code>, e.g. a scanned QR).
  const [codeInput, setCodeInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("add") ?? "";
  });

  // Friend nicknames: my private display names, keyed by friend id.
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [nicknameBusy, setNicknameBusy] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  // Friends-list search + filter chips.
  const [friendFilter, setFriendFilter] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [tradeMatchOnly, setTradeMatchOnly] = useState(false);
  const [tradeMatchCounts, setTradeMatchCounts] = useState<Record<string, number> | null>(null);
  const [loadingTradeMatches, setLoadingTradeMatches] = useState(false);

  // Section 3: Friendship levels. Keyed by friend id; one row per direction.
  const [friendship, setFriendship] = useState<Record<string, FriendshipProgress>>({});
  // null = unknown (still loading), false = table not migrated yet (hide the UI).
  const [friendshipReady, setFriendshipReady] = useState<boolean | null>(null);
  // Toast after a "Say hi".
  const [hiToast, setHiToast] = useState<string | null>(null);

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

  /** My private nicknames for friends (owner-only table; empty when the SQL isn't run yet). */
  const fetchNicknames = useCallback(async () => {
    if (!user) {
      setNicknames({});
      return;
    }
    try {
      const { data, error } = await createClient()
        .from("friend_nicknames")
        .select("friend_id, nickname");
      if (error) throw new Error(error.message);
      const map: Record<string, string> = {};
      for (const row of (data as { friend_id: string; nickname: string }[] | null) ?? []) {
        if (row.nickname) map[row.friend_id] = row.nickname;
      }
      setNicknames(map);
    } catch (e) {
      console.error("Failed to load nicknames:", e instanceof Error ? e.message : e);
    }
  }, [user]);

  /** Section 3: my friendship progress with each friend (my direction's rows). */
  const fetchFriendship = useCallback(async () => {
    if (!user) {
      setFriendship({});
      setFriendshipReady(false);
      return;
    }
    try {
      const { data, error } = await createClient()
        .from("friendship_progress")
        .select("friend_id, points, last_interaction_date")
        .eq("user_id", user.id);
      if (error) throw error;
      const map: Record<string, FriendshipProgress> = {};
      for (
        const row of (data as
          | { friend_id: string; points: number; last_interaction_date: string | null }[]
          | null) ?? []
      ) {
        map[row.friend_id] = {
          points: row.points ?? 0,
          last_interaction_date: row.last_interaction_date,
        };
      }
      setFriendship(map);
      setFriendshipReady(true);
    } catch (e) {
      // The table doesn't exist until the Section 3 SQL is run — hide the UI.
      setFriendshipReady(false);
      const code = (e as { code?: string } | null)?.code;
      if (code !== "42P01") {
        console.error(
          "Failed to load friendship progress:",
          e instanceof Error ? e.message : e,
        );
      }
    }
  }, [user]);

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
        // Nicknames load alongside the friend list (independent fetch).
        void fetchNicknames();
        // Friendship levels load alongside too (independent fetch).
        void fetchFriendship();
      })
      .catch((e: unknown) =>
        console.error("Failed to load friendships:", e instanceof Error ? e.message : e),
      );
    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, fetchFriendData, fetchNicknames, fetchFriendship]);

  const rows: FriendRow[] = useMemo(() => {
    if (!user) return [];
    return friendships.map((f) => ({
      ...f,
      other:
        profiles[f.requester_id === user.id ? f.addressee_id : f.requester_id] ??
        null,
    }));
  }, [friendships, profiles, user]);

  const incoming = useMemo(
    () => rows.filter((r) => r.status === "pending" && user && r.addressee_id === user.id),
    [rows, user],
  );
  const outgoing = useMemo(
    () => rows.filter((r) => r.status === "pending" && user && r.requester_id === user.id),
    [rows, user],
  );
  const friends = useMemo(() => rows.filter((r) => r.status === "accepted"), [rows]);
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

  /** Add a friend by 12-digit trainer code (Section 5: QR invites). */
  async function sendRequestByCode(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const code = codeInput.trim();
    setSearchError(null);
    setSearchInfo(null);
    if (!/^\d{12}$/.test(code)) {
      setSearchError("Trainer codes are 12 digits — check the code and try again.");
      return;
    }
    setSearching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("trainer_code", code)
        .maybeSingle();
      if (error) {
        if (error.code === "42703") {
          setSearchError(
            "Trainer codes need the latest database update — run it in the Supabase SQL Editor first.",
          );
          return;
        }
        throw new Error(error.message);
      }
      const found = data as FriendProfile | null;
      if (!found) {
        setSearchError(`No trainer found with code ${code}. Check the code and try again.`);
        return;
      }
      const { error: reqError, info } = await requestFriend(found);
      if (reqError) setSearchError(reqError);
      else {
        setSearchInfo(info ?? null);
        setCodeInput("");
        reload();
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Lookup failed — try again.");
    } finally {
      setSearching(false);
    }
  }

  /** Nickname shown in place of the username in the friends list. */
  const displayName = useCallback(
    (friendId: string, username: string) => nicknames[friendId] || username,
    [nicknames],
  );

  async function saveNickname(friendId: string) {
    if (!user) return;
    const value = nicknameDraft.trim().slice(0, 30);
    setNicknameError(null);
    setNicknameBusy(friendId);
    try {
      const supabase = createClient();
      if (value === "") {
        // Clearing the nickname deletes the row (falls back to the username).
        const { error } = await supabase
          .from("friend_nicknames")
          .delete()
          .eq("user_id", user.id)
          .eq("friend_id", friendId);
        if (error) throw new Error(error.message);
        setNicknames((prev) => {
          const next = { ...prev };
          delete next[friendId];
          return next;
        });
      } else {
        const { error } = await supabase.from("friend_nicknames").upsert(
          { user_id: user.id, friend_id: friendId, nickname: value },
          { onConflict: "user_id,friend_id" },
        );
        if (error) throw new Error(error.message);
        setNicknames((prev) => ({ ...prev, [friendId]: value }));
      }
      setEditingNickname(null);
    } catch (e) {
      setNicknameError(e instanceof Error ? e.message : "Couldn't save the nickname — try again.");
    } finally {
      setNicknameBusy(null);
    }
  }

  /**
   * Lazy trade-match counts per friend for the "Trade matches" filter chip.
   * Fetched once, the first time the chip is turned on.
   */
  const loadTradeMatchCounts = useCallback(async () => {
    if (!user || tradeMatchCounts || loadingTradeMatches) return;
    setLoadingTradeMatches(true);
    try {
      const supabase = createClient();
      const ids = friends
        .map((f) => f.other?.id)
        .filter((id): id is string => !!id);
      const counts: Record<string, number> = {};
      const mine = await fetchTradeLists(supabase, user.id);
      if (ids.length > 0) {
        const [wRes, tRes] = await Promise.all([
          supabase.from("trade_wishlist").select("user_id, species_id").in("user_id", ids),
          supabase.from("trade_list").select("user_id, species_id").in("user_id", ids),
        ]);
        if (wRes.error || tRes.error) throw new Error("trade lists unavailable");
        const map: Record<string, TradeListPair> = {};
        for (const id of ids) map[id] = { wishlist: [], forTrade: [] };
        for (const e of ((wRes.data as (TradeEntry & { user_id: string })[] | null) ?? [])) {
          if (map[e.user_id]) map[e.user_id].wishlist.push(e);
        }
        for (const e of ((tRes.data as (TradeEntry & { user_id: string })[] | null) ?? [])) {
          if (map[e.user_id]) map[e.user_id].forTrade.push(e);
        }
        for (const id of ids) {
          const { youHaveForThem, theyHaveForYou } = computeTradeMatches(mine, map[id]);
          counts[id] = youHaveForThem.length + theyHaveForYou.length;
        }
      }
      setTradeMatchCounts(counts);
    } catch {
      // Trade tables not migrated yet — treat everyone as having no matches.
      setTradeMatchCounts({});
    } finally {
      setLoadingTradeMatches(false);
    }
  }, [user, friends, tradeMatchCounts, loadingTradeMatches]);

  function toggleTradeChip() {
    if (!tradeMatchOnly) void loadTradeMatchCounts();
    setTradeMatchOnly(!tradeMatchOnly);
  }

  const filteredFriends = useMemo(() => {
    const q = friendFilter.trim().toLowerCase();
    return friends.filter(
      (r): r is FriendRow & { other: FriendProfileSeen } => {
        if (!r.other) return false;
        if (q) {
          const nick = (nicknames[r.other.id] ?? "").toLowerCase();
          const uname = r.other.username.toLowerCase();
          if (!nick.includes(q) && !uname.includes(q)) return false;
        }
        if (onlineOnly && !isOnline(r.other.last_seen)) return false;
        if (tradeMatchOnly && (tradeMatchCounts?.[r.other.id] ?? 0) === 0) return false;
        return true;
      },
    );
  }, [friends, friendFilter, nicknames, onlineOnly, tradeMatchOnly, tradeMatchCounts]);

  const friendsListFiltered =
    friendFilter.trim() !== "" || onlineOnly || tradeMatchOnly;

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

  /**
   * Section 3: "Say hi" — one friendship point per friend per day.
   * Upserts my direction's row: points+1, last_interaction_date=today.
   * The button is disabled once done for the day (app-level enforcement).
   */
  async function sayHi(friendId: string, label: string) {
    if (!user) return;
    const today = todayLocal();
    const current = friendship[friendId];
    if (current?.last_interaction_date === today) return;
    setActionBusy(`hi-${friendId}`);
    try {
      const { error } = await createClient()
        .from("friendship_progress")
        .upsert(
          {
            user_id: user.id,
            friend_id: friendId,
            points: (current?.points ?? 0) + 1,
            last_interaction_date: today,
          },
          { onConflict: "user_id,friend_id" },
        );
      if (error) throw error;
      setFriendship((prev) => ({
        ...prev,
        [friendId]: {
          points: (prev[friendId]?.points ?? 0) + 1,
          last_interaction_date: today,
        },
      }));
      setHiToast(`+1 friendship with ${label}!`);
    } catch (e) {
      console.error("Failed to say hi:", e instanceof Error ? e.message : e);
    } finally {
      setActionBusy(null);
    }
  }

  // Auto-dismiss the "Say hi" toast.
  useEffect(() => {
    if (!hiToast) return;
    const t = setTimeout(() => setHiToast(null), 2500);
    return () => clearTimeout(t);
  }, [hiToast]);

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
    { id: "trading", label: "Trading" },
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

      {tab === "trading" && <TradingView me={user.id} friends={friends} />}

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

          {/* Add friend by trainer code */}
          <form onSubmit={(e) => void sendRequestByCode(e)} className={`${cardClass} mb-6`}>
            <label htmlFor="friend-code" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Add a friend by trainer code
            </label>
            <div className="flex gap-2">
              <input
                id="friend-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                className={`${inputClass} font-mono tracking-widest`}
                placeholder="12-digit code"
                maxLength={12}
                inputMode="numeric"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={searching || codeInput.trim() === ""}
                className="shrink-0 rounded-lg bg-mint px-5 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
              >
                {searching ? "…" : "Send request"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              Tip: trainers can share their code from their profile page — or scan the QR.
            </p>
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
                              href={`/trainer/${encodeURIComponent(s.profile.username)}`}
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
                              href={r.other ? `/trainer/${encodeURIComponent(r.other.username)}` : "#"}
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
                <SectionTitle>
                  {friendsListFiltered
                    ? `Friends (${filteredFriends.length} of ${friends.length})`
                    : `Friends (${friends.length})`}
                </SectionTitle>
                {nicknameError && (
                  <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    {nicknameError}
                  </p>
                )}
                {friends.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No friends yet — send a request above to get started!
                  </p>
                ) : (
                  <>
                    {/* Search + filter chips */}
                    <div className="mb-4 space-y-2">
                      <input
                        type="search"
                        value={friendFilter}
                        onChange={(e) => setFriendFilter(e.target.value)}
                        placeholder="Search friends…"
                        aria-label="Search friends by name or nickname"
                        className={inputClass}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setOnlineOnly((v) => !v)}
                          aria-pressed={onlineOnly}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            onlineOnly
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                              : "border-stone-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          <span role="img" aria-hidden="true" className="mr-1">🟢</span>
                          Online now
                        </button>
                        <button
                          type="button"
                          onClick={toggleTradeChip}
                          aria-pressed={tradeMatchOnly}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            tradeMatchOnly
                              ? "border-mint bg-mint/20 text-slate-900 dark:text-slate-100"
                              : "border-stone-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          <span role="img" aria-hidden="true" className="mr-1">🔄</span>
                          {loadingTradeMatches ? "Checking trades…" : "Trade matches"}
                        </button>
                        {friendsListFiltered && (
                          <button
                            type="button"
                            onClick={() => {
                              setFriendFilter("");
                              setOnlineOnly(false);
                              setTradeMatchOnly(false);
                            }}
                            className="rounded-full px-3 py-1 text-xs font-semibold text-slate-400 underline-offset-2 hover:underline dark:text-slate-500"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    {filteredFriends.length === 0 ? (
                      <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
                        No friends match — try a different search or clear the filters.
                      </p>
                    ) : (
                  <ul className="space-y-3">
                    {filteredFriends.map((r) => {
                      const name = displayName(r.other.id, r.other.username);
                      const hasNickname = !!nicknames[r.other.id];
                      // Section 3: friendship level (0 points until they say hi).
                      const fp = friendship[r.other.id] ?? {
                        points: 0,
                        last_interaction_date: null,
                      };
                      const tier = friendshipTier(fp.points);
                      const doneToday = fp.last_interaction_date === todayLocal();
                      return (
                        <li key={r.id} className={`${cardClass} !p-4`}>
                          <div className="flex items-center gap-3">
                            <Avatar
                              username={r.other.username}
                              avatarUrl={r.other.avatar_url}
                              online={isOnline(r.other.last_seen)}
                            />
                            <div className="min-w-0 flex-1">
                              {editingNickname === r.other.id ? (
                                <form
                                  onSubmit={(ev) => {
                                    ev.preventDefault();
                                    void saveNickname(r.other.id);
                                  }}
                                  className="flex items-center gap-1.5"
                                >
                                  <input
                                    autoFocus
                                    value={nicknameDraft}
                                    onChange={(ev) => setNicknameDraft(ev.target.value)}
                                    maxLength={30}
                                    placeholder={r.other.username}
                                    aria-label={`Nickname for ${r.other.username} (clear to remove)`}
                                    className="w-36 rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                                  />
                                  <button
                                    type="submit"
                                    disabled={nicknameBusy === r.other.id}
                                    className="rounded-md bg-mint px-2.5 py-1 text-xs font-bold text-slate-900 disabled:opacity-60 dark:text-slate-100"
                                  >
                                    {nicknameBusy === r.other.id ? "…" : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNickname(null);
                                      setNicknameDraft("");
                                      setNicknameError(null);
                                    }}
                                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <Link
                                    href={`/trainer/${encodeURIComponent(r.other.username)}`}
                                    className="truncate text-sm font-bold text-slate-900 hover:underline dark:text-slate-100"
                                  >
                                    {name}
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNickname(r.other.id);
                                      setNicknameDraft(nicknames[r.other.id] ?? "");
                                      setNicknameError(null);
                                    }}
                                    title={
                                      hasNickname
                                        ? `Edit nickname for ${r.other.username}`
                                        : `Set a nickname for ${r.other.username}`
                                    }
                                    aria-label={
                                      hasNickname
                                        ? `Edit nickname for ${r.other.username}`
                                        : `Set a nickname for ${r.other.username}`
                                    }
                                    className="shrink-0 rounded px-1 text-xs text-slate-400 transition hover:bg-stone-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                  >
                                    <span role="img" aria-hidden="true">✎</span>
                                  </button>
                                  {friendshipReady && (
                                    <span
                                      title={`Friendship: ${fp.points} point${fp.points === 1 ? "" : "s"}`}
                                      className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                      <span role="img" aria-hidden="true" className="mr-0.5">
                                        {tier.emoji}
                                      </span>
                                      {tier.name}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="mt-1 flex items-center gap-3">
                                <Link
                                  href="/messages"
                                  className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline dark:text-slate-400"
                                >
                                  Message
                                </Link>
                                {hasNickname && (
                                  <span className="truncate text-xs text-slate-400 dark:text-slate-500">
                                    @{r.other.username}
                                  </span>
                                )}
                                {isOnline(r.other.last_seen) && (
                                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    Online
                                  </span>
                                )}
                                {friendshipReady && (
                                  <button
                                    type="button"
                                    onClick={() => void sayHi(r.other.id, name)}
                                    disabled={doneToday || actionBusy === `hi-${r.other.id}`}
                                    title={
                                      doneToday
                                        ? "You already said hi today — come back tomorrow!"
                                        : `Say hi to ${name} (+1 friendship, once a day)`
                                    }
                                    className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-slate-900 transition hover:brightness-95 disabled:cursor-default disabled:bg-stone-100 disabled:text-slate-400 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                                  >
                                    {actionBusy === `hi-${r.other.id}`
                                      ? "…"
                                      : doneToday
                                        ? "Done today ✓"
                                        : "Say hi 👋"}
                                  </button>
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
                                aria-label={`Unfriend ${name}`}
                              >
                                Unfriend
                              </button>
                            )}
                          </div>
                          {/* Section 3: one slim progress bar toward the next tier. */}
                          {friendshipReady && (
                            <div className="mt-2.5">
                              <div className="h-1 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700">
                                <div
                                  className="h-1 rounded-full bg-gradient-to-r from-amber-300 to-rose-400 transition-[width]"
                                  style={{ width: `${friendshipProgressPct(fp.points)}%` }}
                                />
                              </div>
                              <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-slate-500">
                                {tier.nextTierAt === null ? (
                                  <span className="font-semibold">MAX</span>
                                ) : (
                                  <>
                                    {fp.points}/{tier.nextTierAt} to {tier.nextTierName}
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </>
      )}
      {/* Section 3: "Say hi" confirmation toast. */}
      {hiToast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-slate-900"
        >
          {hiToast}
        </div>
      )}
    </div>
  );
}
