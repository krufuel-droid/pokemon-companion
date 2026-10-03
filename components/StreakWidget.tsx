/**
 * StreakWidget (Workstream 3).
 *
 * Self-contained homepage card: my current catch streak, today's
 * Pokémon-of-the-Day catch status, and a mini friends-streak leaderboard
 * with an encouraging tone. Fetches its own data — mount it anywhere on the
 * homepage (coordinator mounts in app/page.tsx; no props needed).
 */
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";
import {
  getCatchStreak,
  getStreakLeaderboard,
  hasLoggedToday,
  type CatchStreak,
  type StreakLeaderRow,
} from "@/lib/streaks";

function rankMedal(rank: number): string {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
}

function Encouragement({
  me,
  leaders,
}: {
  me: string;
  leaders: StreakLeaderRow[];
}) {
  const mine = leaders.find((l) => l.userId === me);
  if (!mine || leaders.length <= 1) {
    return (
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        🌱 No one else on the board yet — invite a friend and race them!
      </p>
    );
  }
  const myRank = leaders.findIndex((l) => l.userId === me);
  const top = leaders[0];
  if (myRank === 0) {
    return (
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        🏆 You&apos;re leading the pack — keep that flame burning!
      </p>
    );
  }
  const behind = top.current - mine.current;
  return (
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
      {behind > 0
        ? `💪 ${top.username} is ${behind} day${behind === 1 ? "" : "s"} ahead — you can catch up!`
        : `🤝 Tied with ${top.username} — every day counts!`}
    </p>
  );
}

export default function StreakWidget() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<CatchStreak | null>(null);
  const [loggedToday, setLoggedToday] = useState<boolean | null>(null);
  const [leaders, setLeaders] = useState<StreakLeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [s, today, board] = await Promise.all([
          getCatchStreak(user.id),
          hasLoggedToday(user.id),
          getStreakLeaderboard(user.id),
        ]);
        if (cancelled) return;
        setStreak(s);
        setLoggedToday(today);
        setLeaders(board);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const card =
    "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700";

  if (!user) {
    return (
      <div className={card}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          🔥 <span className="font-bold text-slate-900 dark:text-slate-100">Catch streaks</span> —
          <a href="/login" className="ml-1 font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
            sign in
          </a>{" "}
          to track yours and race your friends!
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={card}>
        <p className="text-sm text-slate-500 dark:text-slate-400">Checking your streak…</p>
      </div>
    );
  }

  const current = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  const todayDone = loggedToday === true;

  return (
    <div className={card}>
      <div className="flex items-center gap-4">
        <span className="text-5xl" aria-hidden="true">🔥</span>
        <div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {current}{" "}
            <span className="text-base font-bold text-slate-500 dark:text-slate-400">
              day streak
            </span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {longest > current
              ? `Personal best: ${longest} days — you're ${longest - current} away from tying it!`
              : longest > 0
                ? "That's your personal best — amazing!"
                : "Log today's catch to start your streak."}
          </p>
        </div>
      </div>

      <p
        className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
          todayDone
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        }`}
      >
        {todayDone
          ? "✅ Today's catch logged — streak's safe!"
          : current > 0
            ? `⏳ Day ${current + 1} is waiting — catch today's Pokémon of the Day!`
            : "🌱 Catch today's Pokémon of the Day to light your first flame!"}
      </p>

      {leaders.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            🔥 Streak showdown
          </h3>
          <ul className="mt-2 space-y-1">
            {leaders.slice(0, 5).map((l, i) => {
              const isMe = user && l.userId === user.id;
              return (
                <li
                  key={l.userId}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 ${
                    isMe
                      ? "bg-mint/20 ring-1 ring-mint dark:bg-mint/10"
                      : "hover:bg-stone-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="w-6 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                    {rankMedal(i + 1) || `${i + 1}`}
                  </span>
                  <Avatar username={l.username} avatarUrl={l.avatarUrl} size={28} />
                  <span className="flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isMe ? "You" : l.username}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    🔥{l.current}
                  </span>
                </li>
              );
            })}
          </ul>
          {user && <Encouragement me={user.id} leaders={leaders} />}
        </div>
      )}
    </div>
  );
}
