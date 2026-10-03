"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { getAchievements, getUserAchievements, type AchievementDef } from "@/lib/achievements";
import { timeAgo } from "@/lib/community";

const CATEGORY_ORDER = ["Collection", "Shiny", "Nuzlocke", "Social"];

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";
interface FriendUnlock {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function SignInPrompt({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className={`${cardClass} text-center`}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Achievements are for members of the community.
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

export default function AchievementsPage() {
  const { configured, loading, user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementDef[]>([]);
  const [unlockedAt, setUnlockedAt] = useState<Record<string, string>>({});
  const [friendUnlocks, setFriendUnlocks] = useState<FriendUnlock[]>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [dataLoading, setDataLoading] = useState(true);

  const catalogById = useMemo(() => {
    const map: Record<string, AchievementDef> = {};
    for (const a of achievements) map[a.id] = a;
    return map;
  }, [achievements]);

  const fetchPageData = useCallback(async () => {
    const defs = await getAchievements().catch(() => [] as AchievementDef[]);
    const mine = user ? await getUserAchievements(user.id).catch(() => []) : [];
    const mineMap: Record<string, string> = {};
    for (const u of mine) mineMap[u.achievement_id] = u.unlocked_at;

    let unlocks: FriendUnlock[] = [];
    let nameMap: Record<string, string> = {};
    if (user) {
      // Accepted friendships in either direction give the friend ids.
      const supabase = createClient();
      let friendIds: string[] = [];
      try {
        const { data, error } = await supabase
          .from("friendships")
          .select("requester_id, addressee_id")
          .eq("status", "accepted")
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
        if (error) throw error;
        friendIds = [
          ...new Set(
            ((data as { requester_id: string; addressee_id: string }[]) ?? []).map((r) =>
              r.requester_id === user.id ? r.addressee_id : r.requester_id,
            ),
          ),
        ];
      } catch {
        friendIds = [];
      }

      if (friendIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from("user_achievements")
            .select("user_id, achievement_id, unlocked_at")
            .in("user_id", friendIds)
            .order("unlocked_at", { ascending: false })
            .limit(10);
          if (error) throw error;
          unlocks = (data as FriendUnlock[]) ?? [];
        } catch {
          unlocks = [];
        }
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", friendIds);
          if (error) throw error;
          for (const p of (data as { id: string; username: string }[]) ?? []) {
            nameMap[p.id] = p.username;
          }
        } catch {
          nameMap = {};
        }
      }
    }
    return { defs, mineMap, unlocks, nameMap };
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    void fetchPageData().then(({ defs, mineMap, unlocks, nameMap }) => {
      if (cancelled) return;
      setAchievements(defs);
      setUnlockedAt(mineMap);
      setFriendUnlocks(unlocks);
      setUsernames(nameMap);
      setDataLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, fetchPageData]);

  const grouped = useMemo(() => {
    const groups = new Map<string, AchievementDef[]>();
    for (const a of achievements) {
      const list = groups.get(a.category) ?? [];
      list.push(a);
      groups.set(a.category, list);
    }
    const ordered = CATEGORY_ORDER.filter((c) => groups.has(c));
    for (const c of groups.keys()) {
      if (!ordered.includes(c)) ordered.push(c);
    }
    return ordered.map((c) => ({ category: c, items: groups.get(c) ?? [] }));
  }, [achievements]);

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading achievements…
      </div>
    );
  }
  if (!user) return <SignInPrompt title="Sign in to see your achievements" />;

  const unlockedCount = Object.keys(unlockedAt).length;
  const total = achievements.length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Achievements</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {unlockedCount} / {total} unlocked
          </p>
        </div>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Achievements unlocked"
      >
        <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${pct}%` }} />
      </div>

      {dataLoading ? (
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Loading achievements…
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map(({ category, items }) => (
            <section key={category}>
              <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">{category}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a) => {
                  const when = unlockedAt[a.id];
                  const isUnlocked = when !== undefined;
                  return (
                    <div
                      key={a.id}
                      className={`${cardClass} p-5 ${
                        isUnlocked ? "ring-2 ring-mint" : ""
                      }`}
                    >
                      <div
                        className={`text-4xl ${isUnlocked ? "" : "opacity-40 grayscale"}`}
                        aria-hidden="true"
                      >
                        {a.icon}
                      </div>
                      <h3 className="mt-3 font-bold text-slate-900 dark:text-slate-100">{a.name}</h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.description}</p>
                      {isUnlocked ? (
                        <p className="mt-3 inline-block rounded-full bg-mint/20 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                          Unlocked {formatDate(when)}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
                          Locked
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">
          Friends&apos; recent unlocks
        </h2>
        <div className={cardClass}>
          {friendUnlocks.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No unlocks yet — be the first!
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-slate-800">
              {friendUnlocks.map((u) => {
                const def = catalogById[u.achievement_id];
                return (
                  <li key={`${u.user_id}-${u.achievement_id}`} className="flex items-center gap-3 py-3">
                    <span className="text-2xl" aria-hidden="true">
                      {def?.icon ?? "🏅"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {def?.name ?? "Achievement"}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {usernames[u.user_id] ?? "A trainer"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {timeAgo(u.unlocked_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
