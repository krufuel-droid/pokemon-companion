"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { unlockAchievement } from "@/lib/achievements";
import { POKEMON_GAMES } from "@/lib/data/games";
import RunTypeBadge, { NUZLOCKE_TYPES } from "@/components/RunTypeBadge";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

const STANDARD_RULES =
  "1. Catch only the first Pokémon encountered in each area.\n" +
  "2. If a Pokémon faints, it is dead — box or release it permanently.\n" +
  "3. Nickname every Pokémon you catch.\n" +
  "4. No items in battle (optional).";

interface Run {
  id: string;
  owner_id: string;
  title: string;
  rules: string | null;
  status: string;
  run_type: string | null;
  created_at: string;
}

/** The schema has no game column, so an optional game is stored as a
 *  "Game: <name>" prefix line inside the rules text. */
function packRules(game: string, rules: string): string {
  const g = game.trim();
  return g ? `Game: ${g}\n${rules}` : rules;
}
export function unpackGame(rules: string | null): { game: string | null; rules: string } {
  if (!rules) return { game: null, rules: "" };
  const m = rules.match(/^Game: ([^\n]+)\n?/);
  if (!m) return { game: null, rules };
  return { game: m[1].trim(), rules: rules.slice(m[0].length) };
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : status === "wiped"
        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-mint/25 text-slate-800 dark:text-slate-100";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}>
      {status}
    </span>
  );
}

function SignInPrompt() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className={`${cardClass} text-center`}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign in to run a Nuzlocke
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Track your runs and share them with friends.
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

export default function NuzlockePage() {
  const { configured, loading, user } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [aliveCounts, setAliveCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteRun(runId: string) {
    if (!confirm("Delete this run? This can't be undone. (Memorials are kept.)")) return;
    setDeletingId(runId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("nuzlockes").delete().eq("id", runId);
      if (error) throw error;
      setRuns((prev) => prev.filter((r) => r.id !== runId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete the run.");
    } finally {
      setDeletingId(null);
    }
  }

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [runType, setRunType] = useState("standard");
  const [rules, setRules] = useState(STANDARD_RULES);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchPageData = useCallback(async () => {
    let all: Run[] = [];
    let participantCounts: Record<string, number> = {};
    let aliveCounts: Record<string, number> = {};
    if (!user) return { all, participantCounts, aliveCounts };
    const supabase = createClient();
    try {
      const [{ data: owned }, { data: parts }] = await Promise.all([
        supabase.from("nuzlockes").select("id, owner_id, title, rules, status, run_type, created_at").eq("owner_id", user.id),
        supabase.from("nuzlocke_participants").select("run_id").eq("user_id", user.id),
      ]);
      const ownedRuns = (owned as Run[]) ?? [];
      const joinedIds = [...new Set(((parts as { run_id: string }[] | null) ?? []).map((p) => p.run_id))];
      const missing = joinedIds.filter((id) => !ownedRuns.some((r) => r.id === id));
      let joinedRuns: Run[] = [];
      if (missing.length > 0) {
        const { data } = await supabase
          .from("nuzlockes")
          .select("id, owner_id, title, rules, status, run_type, created_at")
          .in("id", missing);
        joinedRuns = (data as Run[]) ?? [];
      }
      all = [...ownedRuns, ...joinedRuns].sort((a, b) => b.created_at.localeCompare(a.created_at));
    } catch {
      all = [];
    }

    const ids = all.map((r) => r.id);
    if (ids.length > 0) {
      try {
        const { data } = await supabase.from("nuzlocke_participants").select("run_id").in("run_id", ids);
        for (const p of (data as { run_id: string }[] | null) ?? []) {
          participantCounts[p.run_id] = (participantCounts[p.run_id] ?? 0) + 1;
        }
      } catch {
        participantCounts = {};
      }
      try {
        const { data } = await supabase
          .from("nuzlocke_team")
          .select("run_id")
          .in("run_id", ids)
          .eq("user_id", user.id)
          .eq("status", "alive");
        for (const t of (data as { run_id: string }[] | null) ?? []) {
          aliveCounts[t.run_id] = (aliveCounts[t.run_id] ?? 0) + 1;
        }
      } catch {
        aliveCounts = {};
      }
    }
    return { all, participantCounts, aliveCounts };
  }, [user]);

  const refresh = useCallback(async () => {
    const { all, participantCounts: pc, aliveCounts: ac } = await fetchPageData();
    setRuns(all);
    setParticipantCounts(pc);
    setAliveCounts(ac);
    setDataLoading(false);
  }, [fetchPageData]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    void fetchPageData().then(({ all, participantCounts: pc, aliveCounts: ac }) => {
      if (cancelled) return;
      setRuns(all);
      setParticipantCounts(pc);
      setAliveCounts(ac);
      setDataLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, fetchPageData]);

  const ownedFirst = useMemo(() => {
    if (!user) return runs;
    return [...runs].sort((a, b) => Number(b.owner_id === user.id) - Number(a.owner_id === user.id));
  }, [runs, user]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("nuzlockes")
        .insert({ owner_id: user.id, title: title.trim(), rules: packRules(game, rules), status: "active", run_type: runType })
        .select("id")
        .single();
      if (error) throw error;
      const runId = (data as { id: string }).id;
      try {
        await supabase.from("nuzlocke_participants").insert({ run_id: runId, user_id: user.id });
      } catch {
        // Joining is best-effort; the run itself is created.
      }
      void unlockAchievement(user.id, "first-nuzlocke").catch(() => {});
      setTitle("");
      setGame("");
      setRunType("standard");
      setRules(STANDARD_RULES);
      setShowForm(false);
      await refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create the run.");
    } finally {
      setCreating(false);
    }
  }

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading your runs…
      </div>
    );
  }
  if (!user) return <SignInPrompt />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nuzlocke runs</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your teams, deaths, and glory — live with friends.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-mint px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
        >
          {showForm ? "Cancel" : "Start a run"}
        </button>
      </div>

      {showForm && (
        <div className={`${cardClass} mt-6`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Start a run</h2>
          <form onSubmit={onCreate} className="mt-4 space-y-4">
            <div>
              <label htmlFor="run-title" className={labelClass}>
                Run title
              </label>
              <input
                id="run-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Scarlet Soul-Link with Sam"
                maxLength={60}
              />
            </div>
            <div>
              <label htmlFor="run-game" className={labelClass}>
                Game <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <select
                id="run-game"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className={inputClass}
              >
                <option value="">— Select a game —</option>
                {POKEMON_GAMES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="run-type" className={labelClass}>
                Run type
              </label>
              <select
                id="run-type"
                value={runType}
                onChange={(e) => setRunType(e.target.value)}
                className={inputClass}
              >
                {NUZLOCKE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="run-rules" className={labelClass}>
                House rules
              </label>
              <textarea
                id="run-rules"
                rows={6}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className={inputClass}
                maxLength={2000}
                placeholder="1. Catch only the first Pokémon per area…"
              />
            </div>
            {createError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {createError}
              </p>
            )}
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
            >
              {creating ? "Creating…" : "Create run"}
            </button>
          </form>
        </div>
      )}

      <div className="mt-8">
        {dataLoading ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">Loading your runs…</p>
        ) : runs.length === 0 ? (
          <div className={`${cardClass} text-center`}>
            <p className="text-3xl" aria-hidden="true">💀</p>
            <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">No runs yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600 dark:text-slate-400">
              Every legend starts somewhere. Start your first Nuzlocke run, invite
              friends, and try to keep everyone alive.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
            >
              Start your first run
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ownedFirst.map((run) => (
              <div key={run.id} className={`${cardClass} relative transition hover:shadow-md`}>
                <Link href={`/nuzlocke/${run.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="break-words font-bold text-slate-900 dark:text-slate-100">{run.title}</h2>
                    <div className="flex shrink-0 items-center gap-2">
                      <RunTypeBadge type={run.run_type} />
                      <StatusBadge status={run.status} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <span>{participantCounts[run.id] ?? 0} trainer{(participantCounts[run.id] ?? 0) === 1 ? "" : "s"}</span>
                    <span>{aliveCounts[run.id] ?? 0} of yours alive</span>
                  </div>
                </Link>
                {run.owner_id === user?.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void deleteRun(run.id);
                    }}
                    disabled={deletingId === run.id}
                    className="absolute right-4 top-4 rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
                    aria-label={`Delete ${run.title}`}
                  >
                    {deletingId === run.id ? "…" : "✕"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
