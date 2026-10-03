"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import {
  ensureWeeklyChallenge,
  isAutoCounted,
  logChallengeProgress,
  myChallengeCount,
  weekLabel,
  type WeeklyChallenge,
} from "@/lib/challenges";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900";

interface LeaderRow {
  userId: string;
  count: number;
  username: string;
  avatarUrl: string | null;
}

interface PastChallenge {
  challenge: WeeklyChallenge;
  winnerName: string | null;
  winnerCount: number;
}

function rankMedal(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
}

/** Section 4: ONE active weekly challenge + leaderboard. Sleek, not overwhelming. */
export default function ChallengesView({
  me,
  myUsername,
  nicknames,
}: {
  me: string;
  myUsername: string;
  nicknames: Record<string, string>;
}) {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [myCount, setMyCount] = useState<number>(0);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [past, setPast] = useState<PastChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState<boolean | null>(null);
  const [loggingBusy, setLoggingBusy] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const displayName = (userId: string, username: string) =>
    userId === me ? myUsername : nicknames[userId] || username;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const ch = await ensureWeeklyChallenge(supabase);
        if (cancelled) return;
        if (!ch) {
          // Tables not migrated yet — hide the UI with a hint.
          setTableReady(false);
          setLoading(false);
          return;
        }
        setTableReady(true);
        setChallenge(ch);

        const mine = await myChallengeCount(supabase, ch, me);
        if (cancelled) return;
        setMyCount(mine);

        // Sync my count into the shared progress table so the leaderboard
        // can rank everyone from one place (even auto-counted goal types).
        if (mine > 0) {
          await supabase.from("challenge_progress").upsert(
            {
              challenge_id: ch.id,
              user_id: me,
              count: mine,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "challenge_id,user_id" },
          );
        }

        const { data: rows } = await supabase
          .from("challenge_progress")
          .select("user_id, count")
          .eq("challenge_id", ch.id)
          .order("count", { ascending: false })
          .limit(50);
        const progress = (rows as { user_id: string; count: number }[] | null) ?? [];

        const ids = [...new Set(progress.map((p) => p.user_id))];
        const nameMap: Record<string, { username: string; avatar_url: string | null }> = {};
        if (ids.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", ids);
          for (const p of (profs as { id: string; username: string; avatar_url: string | null }[] | null) ?? []) {
            nameMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
          }
        }
        if (cancelled) return;
        setLeaders(
          progress.map((p) => ({
            userId: p.user_id,
            count: p.count,
            username: nameMap[p.user_id]?.username ?? "Unknown",
            avatarUrl: nameMap[p.user_id]?.avatar_url ?? null,
          })),
        );

        // The most recent past challenge, collapsed — that's all we show.
        const { data: pastRow } = await supabase
          .from("challenges")
          .select("*")
          .lt("week_start", ch.week_start)
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (pastRow && !cancelled) {
          const pastCh = pastRow as WeeklyChallenge;
          const { data: topRow } = await supabase
            .from("challenge_progress")
            .select("user_id, count")
            .eq("challenge_id", pastCh.id)
            .order("count", { ascending: false })
            .limit(1)
            .maybeSingle();
          const top = topRow as { user_id: string; count: number } | null;
          let winnerName: string | null = null;
          if (top) {
            const { data: wp } = await supabase
              .from("profiles")
              .select("id, username")
              .eq("id", top.user_id)
              .maybeSingle();
            const w = wp as { id: string; username: string } | null;
            winnerName = w ? displayName(w.id, w.username) : null;
          }
          if (!cancelled) {
            setPast({ challenge: pastCh, winnerName, winnerCount: top?.count ?? 0 });
          }
        }
      } catch (e) {
        console.error("Failed to load challenges:", e instanceof Error ? e.message : e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const handleLog = async () => {
    if (!challenge || loggingBusy) return;
    setLoggingBusy(true);
    setLogError(null);
    try {
      const next = await logChallengeProgress(createClient(), challenge.id, me, challenge.target_count);
      setMyCount(next);
      setLeaders((prev) => {
        const idx = prev.findIndex((l) => l.userId === me);
        if (idx === -1) {
          return [
            ...prev,
            { userId: me, count: next, username: myUsername, avatarUrl: null },
          ].sort((a, b) => b.count - a.count);
        }
        const copy = [...prev];
        copy[idx] = { ...copy[idx], count: next };
        return copy.sort((a, b) => b.count - a.count);
      });
    } catch (e) {
      setLogError(e instanceof Error ? e.message : "Couldn't log your progress.");
    } finally {
      setLoggingBusy(false);
    }
  };

  if (loading || tableReady === null) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading this week's challenge…</p>
      </div>
    );
  }

  if (tableReady === false) {
    return (
      <div className={cardClass}>
        <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Challenges</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Challenges need the latest database update — run the newest SQL in the Supabase SQL Editor
          first.
        </p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className={cardClass}>
        <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">Challenges</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No challenge this week yet. Check back soon!
        </p>
      </div>
    );
  }

  const auto = isAutoCounted(challenge.goal_type);
  const pct = Math.min(100, Math.round((myCount / Math.max(1, challenge.target_count)) * 100));
  const done = myCount >= challenge.target_count;

  return (
    <div className="space-y-6">
      {/* The ONE active challenge */}
      <section className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {weekLabel(challenge.week_start)}
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          {challenge.title}
        </h2>
        {challenge.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {challenge.description}
          </p>
        )}

        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-mint to-emerald-400 transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your progress:{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {myCount}/{challenge.target_count}
              </span>
              {done && <span className="ml-2">🎉 Done!</span>}
            </p>
            {!auto && !done && (
              <button
                type="button"
                onClick={() => void handleLog()}
                disabled={loggingBusy}
                className="rounded-lg bg-mint px-4 py-1.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
              >
                {loggingBusy ? "…" : "+1 Log"}
              </button>
            )}
          </div>
          {auto && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Counted automatically from your daily “Say hi” waves.
            </p>
          )}
          {logError && <p className="mt-1 text-xs text-red-600">{logError}</p>}
        </div>
      </section>

      {/* Leaderboard */}
      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">Leaderboard</h2>
        {leaders.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No one has logged anything yet — be the first! 🏁
          </p>
        ) : (
          <ul className="space-y-1">
            {leaders.map((l, i) => {
              const isMe = l.userId === me;
              return (
                <li
                  key={l.userId}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                    isMe
                      ? "bg-mint/20 ring-1 ring-mint dark:bg-mint/10"
                      : "hover:bg-stone-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="w-8 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                    {rankMedal(i + 1) || `${i + 1}`}
                  </span>
                  <Avatar username={l.username} avatarUrl={l.avatarUrl} size={32} />
                  <span className="flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {displayName(l.userId, l.username)}
                    {isMe && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {l.count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* One collapsed previous challenge — that's it. */}
      {past && (
        <details className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
          <summary className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-400">
            Previous challenge: {past.challenge.title}
          </summary>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {weekLabel(past.challenge.week_start)} —{" "}
            {past.winnerName ? (
              <>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {past.winnerName}
                </span>{" "}
                won with {past.winnerCount} 🏆
              </>
            ) : (
              "no one logged anything."
            )}
          </p>
        </details>
      )}
    </div>
  );
}
