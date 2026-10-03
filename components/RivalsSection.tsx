"use client";

/**
 * Rivalries section for the friends page. Self-contained: it loads its own
 * friends list, rivalries, live weekly scores, and settled-week history, and
 * lazily settles last week's results on view (no cron).
 *
 * The coordinator mounts this on app/friends/page.tsx as <RivalsSection />.
 * Scoring formula lives in lib/rivals.ts (10 pts per Daily Catch log,
 * 5 pts per new Living Dex entry, Monday–Sunday America/Chicago).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { FriendProfile, Friendship } from "@/lib/community";
import { unlockAchievement } from "@/lib/achievements";
import {
  CATCH_POINTS,
  DEX_POINTS,
  chicagoWeekStart,
  declareRival,
  getMyRivalries,
  getRivalryHistory,
  removeRival,
  settlePastWeeks,
  weeklyScore,
  weekLabel,
  type RivalRow,
  type RivalWeekRow,
  type WeeklyScore,
} from "@/lib/rivals";

type Rivalry = RivalRow & { other: FriendProfile | null };
type LiveScore = { me: WeeklyScore; them: WeeklyScore };

const shell =
  "rounded-2xl border border-stone-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";
const subtext = "text-sm text-stone-500 dark:text-slate-400";
const btn =
  "rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50";
const ghostBtn =
  "rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
const dangerBtn =
  "rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40";

function ScoreBar({ me, them }: { me: number; them: number }) {
  const total = me + them;
  const mePct = total === 0 ? 50 : Math.round((me / total) * 100);
  return (
    <div
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-slate-800"
      aria-hidden="true"
    >
      <div
        className="h-full rounded-l-full bg-amber-400 transition-all"
        style={{ width: `${mePct}%` }}
      />
      <div
        className="h-full rounded-r-full bg-sky-400 transition-all"
        style={{ width: `${100 - mePct}%` }}
      />
    </div>
  );
}

/** Which of my rivalries involves this user id (either direction). */
function rivalUserIds(rivalries: RivalRow[]): Set<string> {
  return new Set(rivalries.flatMap((r) => [r.user_id, r.rival_id]));
}

export default function RivalsSection() {
  const { configured, loading: authLoading, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [liveScores, setLiveScores] = useState<Record<string, LiveScore>>({});
  const [history, setHistory] = useState<RivalWeekRow[]>([]);
  const [pickerId, setPickerId] = useState("");
  const [declaring, setDeclaring] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }, []);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const rows = await getMyRivalries(user.id);
      // Rival profiles: rivals are always friends, whose profiles we can read.
      const otherIds = [
        ...new Set(rows.map((r) => (r.user_id === user.id ? r.rival_id : r.user_id))),
      ];
      const profMap: Record<string, FriendProfile> = {};
      if (otherIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", otherIds);
        for (const p of (data as FriendProfile[] | null) ?? []) profMap[p.id] = p;
      }
      const full: Rivalry[] = rows.map((r) => ({
        ...r,
        other: profMap[r.user_id === user.id ? r.rival_id : r.user_id] ?? null,
      }));
      setRivalries(full);

      // Friends list (accepted only) for the declare-rival picker.
      const { data: fr } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status, created_at")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      const friendRows = (fr as Friendship[] | null) ?? [];
      const friendIds = [
        ...new Set(
          friendRows.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id)),
        ),
      ];
      if (friendIds.length > 0) {
        const { data: fp } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", friendIds);
        setFriends((fp as FriendProfile[] | null) ?? []);
      } else {
        setFriends([]);
      }

      // Lazy settle: finalize last week, then show history + live scores.
      const settled = await settlePastWeeks(supabase, rows);
      const hist = await getRivalryHistory(supabase, rows);
      // Merge any rows settlePastWeeks just wrote that the history read missed.
      const seen = new Set(hist.map((h) => h.id));
      const merged = [
        ...hist,
        ...settled.filter((s) => !seen.has(s.id) && s.settled_at),
      ].sort((a, b) => (a.week_start < b.week_start ? 1 : -1));
      setHistory(merged);

      // Unlock rival-victory for weeks I won (fire-and-forget, idempotent).
      const myWins = merged.filter((w) => w.winner_id === user.id);
      for (const w of myWins) {
        void unlockAchievement(user.id, "rival-victory").catch(() => {});
      }

      // Live scores for the current week.
      const thisWeek = chicagoWeekStart();
      const scores: Record<string, LiveScore> = {};
      await Promise.all(
        rows.map(async (r) => {
          const otherId = r.user_id === user.id ? r.rival_id : r.user_id;
          const [mine, theirs] = await Promise.all([
            weeklyScore(supabase, user.id, thisWeek),
            weeklyScore(supabase, otherId, thisWeek),
          ]);
          scores[r.id] =
            r.user_id === user.id ? { me: mine, them: theirs } : { me: theirs, them: mine };
        }),
      );
      setLiveScores(scores);
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const msg = e instanceof Error ? e.message : String(e);
      if (code === "42P01" || /does not exist|relation/i.test(msg)) {
        // Rival tables not set up yet — hint, don't crash.
        setMissing(true);
      } else {
        console.error("Failed to load rivalries:", msg);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    void reload();
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [authLoading, user, reload]);

  if (!configured || !user) return null;

  const taken = rivalUserIds(rivalries);
  const candidates = friends
    .filter((f) => f.id !== user.id && !taken.has(f.id))
    .sort((a, b) => a.username.localeCompare(b.username));

  const handleDeclare = () => {
    if (!pickerId || declaring) return;
    setDeclaring(true);
    declareRival(user.id, pickerId).then((res) => {
      setDeclaring(false);
      if (res === "ok") {
        const name = candidates.find((c) => c.id === pickerId)?.username ?? "them";
        flash(`Gauntlet thrown! ${name} is now your rival. ⚔️`);
        setPickerId("");
        void unlockAchievement(user.id, "first-rival").catch(() => {});
        void reload();
      } else if (res === "already") {
        flash("You're already rivals with that trainer.");
      } else if (res === "self") {
        flash("Declaring yourself your own rival is a bold move… but no. 😄");
      } else {
        flash("Couldn't declare a rival — try again in a bit.");
      }
    });
  };

  const handleRemove = (rivalry: Rivalry) => {
    const otherId = rivalry.user_id === user.id ? rivalry.rival_id : rivalry.user_id;
    removeRival(user.id, otherId).then((ok) => {
      setConfirmingRemove(null);
      if (ok) {
        flash("Rivalry ended. The scoreboard remembers… probably.");
        void reload();
      } else {
        flash("Couldn't end the rivalry — try again in a bit.");
      }
    });
  };

  const nameFor = (r: Rivalry) => r.other?.username ?? "A mystery trainer";

  return (
    <section className={shell} aria-label="Rivalries">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-slate-100">
            ⚔️ Rivalries
          </h2>
          <p className={subtext}>
            Weekly bragging rights — loser earns a silly title.
          </p>
        </div>
        <span
          className="shrink-0 text-xl text-stone-400 transition-transform dark:text-slate-500"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
          aria-hidden="true"
        >
          ▸
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {notice && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              {notice}
            </p>
          )}

          {missing ? (
            <p className={subtext}>
              The rival system isn't set up yet — ask Alison to run{" "}
              <code className="rounded bg-stone-100 px-1 dark:bg-slate-800">
                supabase/migration-rivals.sql
              </code>{" "}
              in the Supabase SQL Editor.
            </p>
          ) : loading ? (
            <div className="h-16 animate-pulse rounded-xl bg-stone-100 dark:bg-slate-800" />
          ) : (
            <>
              <p className={subtext}>
                Each week (Mon–Sun), your {CATCH_POINTS}-pt Daily Catch logs and{" "}
                {DEX_POINTS}-pt new Living Dex entries battle your rival's. Ties go
                to nobody — the trophy shelf stays dusty. 🏆
              </p>

              {/* Declare a rival */}
              <div className="rounded-xl border border-stone-100 p-3 dark:border-slate-800">
                <h3 className="mb-2 text-sm font-semibold text-stone-900 dark:text-slate-100">
                  Throw down the gauntlet
                </h3>
                {candidates.length === 0 ? (
                  <p className={subtext}>
                    {friends.length === 0
                      ? "Add some friends first — rivals need to be friends."
                      : "Everyone you know is already a rival. Fierce. 🔥"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      value={pickerId}
                      onChange={(e) => setPickerId(e.target.value)}
                      className="min-w-0 flex-1 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      aria-label="Choose a friend to declare as your rival"
                    >
                      <option value="">Pick a friend…</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.username}
                        </option>
                      ))}
                    </select>
                    <button type="button" className={btn} onClick={handleDeclare} disabled={!pickerId || declaring}>
                      {declaring ? "Declaring…" : "Declare rival ⚔️"}
                    </button>
                  </div>
                )}
              </div>

              {/* Current week head-to-head */}
              {rivalries.length === 0 ? (
                <p className={subtext}>
                  No rivals yet. Pick a friend above and start a friendly war. 🧤
                </p>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-slate-100">
                    This week{" "}
                    <span className="font-normal text-stone-400 dark:text-slate-500">
                      ({weekLabel(chicagoWeekStart())})
                    </span>
                  </h3>
                  {rivalries.map((r) => {
                    const live = liveScores[r.id];
                    const name = nameFor(r);
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-stone-100 p-3 dark:border-slate-800"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-stone-900 dark:text-slate-100">
                            You vs {name}
                          </span>
                          {confirmingRemove === r.id ? (
                            <button
                              type="button"
                              className={dangerBtn}
                              onClick={() => handleRemove(r)}
                            >
                              Confirm — end it
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={ghostBtn}
                              onClick={() => setConfirmingRemove(r.id)}
                            >
                              End rivalry
                            </button>
                          )}
                        </div>
                        {live ? (
                          <>
                            <div className="mb-1 flex items-end justify-between text-sm">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {live.me.total}
                              </span>
                              <span className={subtext}>
                                {live.me.catches} catch{live.me.catches === 1 ? "" : "es"} ·{" "}
                                {live.me.dexEntries} new dex
                              </span>
                              <span className={subtext}>
                                {live.them.catches} catch{live.them.catches === 1 ? "" : "es"} ·{" "}
                                {live.them.dexEntries} new dex
                              </span>
                              <span className="font-bold text-sky-600 dark:text-sky-400">
                                {live.them.total}
                              </span>
                            </div>
                            <ScoreBar me={live.me.total} them={live.them.total} />
                            <p className={`mt-1 text-center text-xs ${subtext}`}>
                              {live.me.total === live.them.total
                                ? "Dead even — how dramatic. 🎭"
                                : live.me.total > live.them.total
                                  ? "You're ahead. Don't get cocky. 😌"
                                  : `${name} is ahead. Time to catch up! 🏃`}
                            </p>
                          </>
                        ) : (
                          <div className="h-8 animate-pulse rounded-lg bg-stone-100 dark:bg-slate-800" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-slate-100">
                    Past weeks
                  </h3>
                  {history.slice(0, 8).map((w) => {
                    const iWon = w.winner_id === user.id;
                    const otherId = w.user_id === user.id ? w.rival_id : w.user_id;
                    const otherName =
                      rivalries.find((r) =>
                        [r.user_id, r.rival_id].includes(otherId),
                      )?.other?.username ?? "A mystery trainer";
                    const myScore = w.user_id === user.id ? w.user_score : w.rival_score;
                    const theirScore = w.user_id === user.id ? w.rival_score : w.user_score;
                    return (
                      <div
                        key={w.id}
                        className="rounded-xl bg-stone-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <span className="font-medium text-stone-800 dark:text-slate-200">
                            {weekLabel(w.week_start)} vs {otherName}
                          </span>
                          <span className="text-stone-600 dark:text-slate-300">
                            {myScore} – {theirScore}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
                          {w.winner_id === null ? (
                            <>Tied! Nobody gets a title this week. 🤝</>
                          ) : (
                            <>
                              {iWon ? "You won! 🏆" : `${otherName} won!`}{" "}
                              <span className="italic">
                                {(iWon ? otherName : "You")} earned the “{w.loser_title}”
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
