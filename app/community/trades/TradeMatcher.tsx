"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { unlockAchievement } from "@/lib/achievements";
import { timeAgo } from "@/lib/community";
import {
  findTradeMatches,
  type TradeMatch,
} from "@/lib/trade-matcher";
import type { TradePost } from "@/lib/trade-board";

function Highlight({ children }: { children: string }) {
  return (
    <mark className="rounded bg-mint/60 px-1 py-0.5 font-bold text-slate-900 dark:bg-mint/40 dark:text-slate-50">
      {children}
    </mark>
  );
}

function spriteUrl(speciesId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
}

function MatchCard({ match }: { match: TradeMatch }) {
  const theirs = match.theirPost;
  const postAnchor = `#trade-post-${theirs.id}`;

  return (
    <article className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        {match.mutual ? (
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            💘 Mutual match
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            💛 One-sided
          </span>
        )}
        {theirs.evo_help && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            🔄 Trade-evo help
          </span>
        )}
      </div>

      {/* Both sides of the trade, at a glance */}
      <div className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {match.iOfferTheyWant.length > 0 && (
          <p>
            You offer <Highlight>{match.iOfferTheyWant[0]}</Highlight>{" "}
            <span aria-hidden>⇄</span> {theirs.author?.username ?? "They"} want{" "}
            <Highlight>{theirs.looking_name}</Highlight>
          </p>
        )}
        {match.theyOfferIWant.length > 0 && (
          <p>
            {theirs.author?.username ?? "They"} offer{" "}
            <Highlight>{theirs.offering_name}</Highlight>{" "}
            <span aria-hidden>⇄</span> you want{" "}
            <Highlight>{match.myPost.looking_name}</Highlight>
          </p>
        )}
      </div>

      {/* The other trainer's post summary */}
      <div className="mt-3 flex items-start gap-3 rounded-lg bg-stone-50 p-3 dark:bg-slate-900/60">
        <Avatar
          username={theirs.author?.username ?? "?"}
          avatarUrl={theirs.author?.avatar_url ?? undefined}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {theirs.author?.username ?? "Unknown trainer"}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {timeAgo(theirs.created_at)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spriteUrl(theirs.offering_species_id)}
              alt={theirs.offering_name}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
            <span aria-hidden className="text-lg font-black text-mint">
              →
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spriteUrl(theirs.looking_species_id)}
              alt={theirs.looking_name}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {theirs.offering_name} → {theirs.looking_name} · {theirs.game}
            </p>
          </div>
        </div>
      </div>

      <a
        href={postAnchor}
        className="mt-3 inline-block rounded-lg bg-mint px-4 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
      >
        View their post
      </a>
    </article>
  );
}

/**
 * "💘 Matches for you" — auto-matcher section shown at the top of the trade
 * board for signed-in trainers. Collapsible to keep the page tidy.
 * The board's own post list is left untouched.
 */
export default function TradeMatcher({
  posts,
  userId,
}: {
  posts: TradePost[];
  userId: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const unlockedRef = useRef(false);

  const matches = useMemo(() => findTradeMatches(posts, userId), [posts, userId]);

  // "Matchmaker" achievement: fire once when the matcher first finds ≥1
  // match for a signed-in user. Never let it break the board.
  useEffect(() => {
    if (matches.length === 0 || unlockedRef.current) return;
    unlockedRef.current = true;
    try {
      void unlockAchievement(userId, "matchmaker").catch(() => {});
    } catch {
      /* ignore */
    }
  }, [matches.length, userId]);

  if (matches.length === 0) return null;

  const mutualCount = matches.filter((m) => m.mutual).length;

  return (
    <section
      aria-label="Trade matches for you"
      className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-base font-bold text-slate-900 dark:text-slate-100">
          💘 Matches for you
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {matches.length} match{matches.length === 1 ? "" : "es"}
          {mutualCount > 0 && ` · ${mutualCount} mutual`}
          <span aria-hidden>{expanded ? "▾" : "▸"}</span>
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {matches.map((m) => (
            <MatchCard
              key={`${m.myPost.id}-${m.theirPost.id}`}
              match={m}
            />
          ))}
        </div>
      )}
    </section>
  );
}
