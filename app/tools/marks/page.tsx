"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MARKS, MARK_GROUPS, TOTAL_MARKS, type MarkDef, type MarkGroup } from "@/lib/data/marks";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { incrementRecord } from "@/lib/achievements";

type Filter = "all" | "caught" | "missing";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "caught", label: "Caught" },
  { key: "missing", label: "Missing" },
];

const GROUP_ORDER: MarkGroup[] = ["personality", "time", "weather", "rarity", "special"];

function MarkRow({
  mark,
  caught,
  onToggle,
}: {
  mark: MarkDef;
  caught: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(mark.id)}
      aria-pressed={caught}
      aria-label={`${mark.name}, ${mark.title} — ${caught ? "caught" : "not caught"}`}
      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
        caught ? "" : "opacity-75"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
          caught
            ? "bg-emerald-500 text-white"
            : "bg-slate-200 text-transparent ring-1 ring-slate-300 dark:bg-slate-700 dark:ring-slate-600"
        }`}
      >
        ✓
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{mark.name}</span>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{mark.title}</span>
        </span>
        <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{mark.howToGet}</span>
        {mark.note && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            {mark.note}
          </span>
        )}
      </span>
    </button>
  );
}

export default function MarksPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [caughtIds, setCaughtIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setCaughtIds(new Set());
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_marks")
          .select("mark_id")
          .eq("user_id", user.id);
        if (!cancelled) {
          setCaughtIds(
            new Set(((data as { mark_id: string }[] | null) ?? []).map((r) => r.mark_id)),
          );
        }
      } catch {
        // table may not exist yet — tracker still renders, nothing is caught
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function toggleMark(markId: string) {
    if (!user) return;
    const already = caughtIds.has(markId);
    const supabase = createClient();

    if (already) {
      await supabase
        .from("user_marks")
        .delete()
        .eq("user_id", user.id)
        .eq("mark_id", markId);
      setCaughtIds((prev) => {
        const next = new Set(prev);
        next.delete(markId);
        return next;
      });
    } else {
      const { error } = await supabase.from("user_marks").insert({
        user_id: user.id,
        mark_id: markId,
      });
      if (error && error.code !== "23505") return;
      setCaughtIds((prev) => {
        const next = new Set(prev);
        next.add(markId);
        return next;
      });
      void incrementRecord(user.id, "marks_caught", 1).catch(() => {});
    }
  }

  const caughtCount = caughtIds.size;
  const pct = (caughtCount / TOTAL_MARKS) * 100;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MARKS.filter((m) => {
      const isCaught = caughtIds.has(m.id);
      if (filter === "caught" && !isCaught) return false;
      if (filter === "missing" && isCaught) return false;
      if (q.length >= 2) {
        const hay = `${m.name} ${m.title} ${m.description} ${m.howToGet}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, filter, caughtIds]);

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      marks: filtered.filter((m) => m.group === group),
    })).filter((g) => g.marks.length > 0);
  }, [filtered]);

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Mark Tracker</h1>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          <Link href="/login" className="font-semibold text-emerald-600 underline underline-offset-2 dark:text-emerald-400">
            Sign in
          </Link>{" "}
          to track your marks.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Tools · Scarlet &amp; Violet
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Mark Tracker
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Tap a mark to check it off. Track your progress toward all {TOTAL_MARKS} obtainable marks in Scarlet &amp; Violet.
      </p>

      {/* Progress */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {caughtCount} <span className="text-base font-medium text-slate-400">/ {TOTAL_MARKS} marks</span>
          </p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {pct.toFixed(1)}%
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search marks…"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter marks">
        {FILTERS.map((f) => {
          const count =
            f.key === "all" ? TOTAL_MARKS : f.key === "caught" ? caughtCount : TOTAL_MARKS - caughtCount;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Groups */}
      {!loaded ? (
        <p className="mt-8 text-center text-slate-400">Loading…</p>
      ) : grouped.length === 0 ? (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">No marks found.</p>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map(({ group, marks }) => (
            <section key={group}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {MARK_GROUPS[group].label}
                </h2>
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  {marks.filter((m) => caughtIds.has(m.id)).length}/{marks.length}
                </span>
              </div>
              <p className="mb-2 px-1 text-sm text-slate-500 dark:text-slate-400">
                {MARK_GROUPS[group].blurb}
              </p>
              <div className="divide-y divide-slate-100 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-700">
                {marks.map((mark) => (
                  <MarkRow
                    key={mark.id}
                    mark={mark}
                    caught={caughtIds.has(mark.id)}
                    onToggle={toggleMark}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
