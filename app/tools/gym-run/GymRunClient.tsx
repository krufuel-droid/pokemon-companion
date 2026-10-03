"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { unlockAchievement } from "@/lib/achievements";
import { checkBadgeAchievements } from "@/lib/achievements-badges";
import GymTeamPanel from "@/components/GymTeamPanel";
import EliteFourPanel from "@/components/EliteFourPanel";
import { POKEMON_GAMES } from "@/lib/data/games";
import {
  getChallengesForGame,
  progressUnit,
  KIND_ICONS,
  KIND_LABELS,
  type ChallengeKind,
} from "./path";

export type GymResult = "pending" | "win" | "loss";

export interface GymRunEntry {
  challenge: string;
  kind: ChallengeKind;
  detail: string;
  result: GymResult;
  team: string;
  date: string;
  notes: string;
}

interface GymRun {
  id: string;
  game: string;
  entries: GymRunEntry[];
  created_at: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeEntry(raw: unknown, index: number): GymRunEntry {
  const r = (raw ?? {}) as Partial<GymRunEntry>;
  const kind: ChallengeKind =
    r.kind === "gym" ||
    r.kind === "trial" ||
    r.kind === "titan" ||
    r.kind === "elite" ||
    r.kind === "champion" ||
    r.kind === "custom"
      ? r.kind
      : "custom";
  const result: GymResult =
    r.result === "win" || r.result === "loss" ? r.result : "pending";
  return {
    challenge: String(r.challenge ?? `Challenge ${index + 1}`),
    kind,
    detail: String(r.detail ?? ""),
    result,
    team: String(r.team ?? ""),
    date: String(r.date ?? ""),
    notes: String(r.notes ?? ""),
  };
}

const RESULT_STYLES: Record<GymResult, string> = {
  pending:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  win: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
  loss: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function SignInPrompt() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign in to track gym runs
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Log your gyms, trials, and titans playthrough by playthrough.
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

function ProgressHeader({ run }: { run: GymRun }) {
  const wins = run.entries.filter((e) => e.result === "win").length;
  const total = run.entries.length;
  const unit = progressUnit(run.entries);
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {wins}/{total} {unit}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{pct}%</span>
      </div>
      <div
        className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        role="progressbar"
        aria-valuenow={wins}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ChallengeEditor({
  entry,
  onSave,
  onClose,
  saving,
}: {
  entry: GymRunEntry;
  onSave: (entry: GymRunEntry) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [result, setResult] = useState<GymResult>(entry.result);
  const [team, setTeam] = useState(entry.team);
  const [date, setDate] = useState(entry.date || todayISO());
  const [notes, setNotes] = useState(entry.notes);

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

  return (
    <form
      className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSave({ ...entry, result, team: team.trim(), date, notes: notes.trim() });
      }}
    >
      <div>
        <span className={labelClass}>Result</span>
        <div className="flex gap-2">
          {(["win", "loss"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setResult(r)}
              aria-pressed={result === r}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ring-1 transition ${
                result === r
                  ? r === "win"
                    ? "bg-emerald-500 text-white ring-emerald-500 dark:bg-emerald-600 dark:ring-emerald-600"
                    : "bg-red-500 text-white ring-red-500 dark:bg-red-600 dark:ring-red-600"
                  : "bg-white text-slate-600 ring-slate-300 hover:ring-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
              }`}
            >
              {r === "win" ? "🏆 Win" : "💀 Loss"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor={`team-${entry.challenge}`}>
          Team used
        </label>
        <input
          id={`team-${entry.challenge}`}
          className={inputClass}
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="e.g. Pikachu, Charizard, Blastoise"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`date-${entry.challenge}`}>
          Date
        </label>
        <input
          id={`date-${entry.challenge}`}
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor={`notes-${entry.challenge}`}>
          Notes
        </label>
        <textarea
          id={`notes-${entry.challenge}`}
          className={inputClass}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it go? Close call? New strategy?"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {entry.result !== "pending" && (
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onSave({ ...entry, result: "pending", team: "", date: "", notes: "" })
            }
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:ring-slate-400 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
          >
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:ring-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
        >
          Close
        </button>
      </div>
    </form>
  );
}

export default function GymRunClient() {
  const { loading, user } = useAuth();
  const [runs, setRuns] = useState<GymRun[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [newGame, setNewGame] = useState<string>(POKEMON_GAMES[0]);
  const [showStartForm, setShowStartForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  const fetchRuns = useCallback(async () => {
    if (!user) {
      setRuns([]);
      setDataLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("gym_runs")
        .select("id, game, entries, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data as { id: string; game: string; entries: unknown; created_at: string }[] | null) ?? [];
      setRuns(
        rows.map((row) => ({
          id: row.id,
          game: row.game,
          entries: Array.isArray(row.entries)
            ? row.entries.map((e, i) => sanitizeEntry(e, i))
            : [],
          created_at: row.created_at,
        })),
      );
    } catch {
      // Table may not be migrated yet — show an empty list.
      setRuns([]);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void fetchRuns();
  }, [loading, fetchRuns]);

  const activeRun = useMemo(
    () => runs.find((r) => r.id === activeRunId) ?? null,
    [runs, activeRunId],
  );

  async function startRun(e: FormEvent) {
    e.preventDefault();
    if (!user || creating) return;
    setCreating(true);
    try {
      const challenges = getChallengesForGame(newGame);
      const entries: GymRunEntry[] = (challenges ?? []).map((c) => ({
        challenge: c.name,
        kind: c.kind,
        detail: c.detail,
        result: "pending" as GymResult,
        team: "",
        date: "",
        notes: "",
      }));
      const supabase = createClient();
      const { data, error } = await supabase
        .from("gym_runs")
        .insert({ user_id: user.id, game: newGame, entries })
        .select("id, game, entries, created_at")
        .single();
      if (error) throw error;
      const row = data as { id: string; game: string; entries: unknown; created_at: string };
      const run: GymRun = {
        id: row.id,
        game: row.game,
        entries: Array.isArray(row.entries)
          ? row.entries.map((e, i) => sanitizeEntry(e, i))
          : entries,
        created_at: row.created_at,
      };
      setRuns((prev) => [run, ...prev]);
      setActiveRunId(run.id);
      setShowStartForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not start the run.");
    } finally {
      setCreating(false);
    }
  }

  async function saveEntries(run: GymRun, entries: GymRunEntry[], index: number) {
    if (!user) return;
    setSavingIndex(index);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("gym_runs")
        .update({ entries, updated_at: new Date().toISOString() })
        .eq("id", run.id);
      if (error) throw error;
      const updatedRuns = runs.map((r) => (r.id === run.id ? { ...r, entries } : r));
      setRuns(updatedRuns);
      setEditingIndex(null);
      // Achievements (fire-and-forget, never break the save).
      const runWins = entries.filter((e) => e.result === "win").length;
      const totalWins = updatedRuns.reduce(
        (sum, r) => sum + r.entries.filter((e) => e.result === "win").length,
        0,
      );
      if (runWins > 0) {
        void unlockAchievement(user.id, "first-gym-badge").catch(() => {});
        void checkBadgeAchievements(user.id, totalWins).catch(() => {});
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save the entry.");
    } finally {
      setSavingIndex(null);
    }
  }

  async function addCustomChallenge() {
    if (!activeRun || !customName.trim() || addingCustom) return;
    setAddingCustom(true);
    const entries: GymRunEntry[] = [
      ...activeRun.entries,
      {
        challenge: customName.trim(),
        kind: "custom" as ChallengeKind,
        detail: "",
        result: "pending" as GymResult,
        team: "",
        date: "",
        notes: "",
      },
    ];
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("gym_runs")
        .update({ entries, updated_at: new Date().toISOString() })
        .eq("id", activeRun.id);
      if (error) throw error;
      setRuns((prev) => prev.map((r) => (r.id === activeRun.id ? { ...r, entries } : r)));
      setCustomName("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add the challenge.");
    } finally {
      setAddingCustom(false);
    }
  }

  async function deleteRun(runId: string) {
    if (!confirm("Delete this run? This can't be undone.")) return;
    setDeletingId(runId);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("gym_runs").delete().eq("id", runId);
      if (error) throw error;
      setRuns((prev) => prev.filter((r) => r.id !== runId));
      setActiveRunId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete the run.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!isSupabaseConfigured()) return <SupabaseNeeded />;
  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <SignInPrompt />;

  /* ------------------------------- run detail ------------------------------- */
  if (activeRun) {
    const freeText = getChallengesForGame(activeRun.game) === null;
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setActiveRunId(null);
            setEditingIndex(null);
          }}
          className="mb-4 text-sm font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          ← All runs
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {activeRun.game}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Started {new Date(activeRun.created_at).toLocaleDateString()}
              {freeText && " · custom challenges"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => deleteRun(activeRun.id)}
            disabled={deletingId === activeRun.id}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-slate-300 transition hover:ring-red-400 disabled:opacity-60 dark:bg-slate-900 dark:text-red-400 dark:ring-slate-600"
          >
            {deletingId === activeRun.id ? "Deleting…" : "Delete run"}
          </button>
        </div>

        <div className="mt-4">
          <ProgressHeader run={activeRun} />
        </div>

        <div className="mt-4 space-y-3">
          {activeRun.entries.map((entry, i) => {
            const open = editingIndex === i;
            return (
              <div
                key={`${entry.challenge}-${i}`}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <button
                  type="button"
                  onClick={() => setEditingIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-800 dark:text-slate-100">
                      <span className="mr-1.5">{KIND_ICONS[entry.kind]}</span>
                      {entry.challenge}
                    </span>
                    {entry.detail && (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {entry.detail}
                      </span>
                    )}
                    {entry.team && (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        Team: {entry.team}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${RESULT_STYLES[entry.result]}`}
                    >
                      {entry.result === "pending"
                        ? KIND_LABELS[entry.kind]
                        : entry.result}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {open ? "▾" : "▸"}
                    </span>
                  </span>
                </button>
                {open && (
                  <>
                    <GymTeamPanel
                      game={activeRun.game}
                      challengeName={entry.challenge}
                    />
                    <EliteFourPanel
                      game={activeRun.game}
                      kind={entry.kind}
                      challengeName={entry.challenge}
                    />
                    <ChallengeEditor
                      entry={entry}
                      saving={savingIndex === i}
                      onClose={() => setEditingIndex(null)}
                      onSave={(updated) => {
                        const entries = activeRun.entries.map((e, j) =>
                          j === i ? updated : e,
                        );
                        void saveEntries(activeRun, entries, i);
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {freeText && (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void addCustomChallenge();
            }}
          >
            <input
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Add a challenge (e.g. Kleavor frenzy)"
            />
            <button
              type="submit"
              disabled={addingCustom || !customName.trim()}
              className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {addingCustom ? "Adding…" : "Add"}
            </button>
          </form>
        )}
      </div>
    );
  }

  /* -------------------------------- run list -------------------------------- */
  return (
    <div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        {showStartForm ? (
          <form onSubmit={startRun}>
            <label
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="gymrun-game"
            >
              Pick a game
            </label>
            <select
              id="gymrun-game"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={newGame}
              onChange={(e) => setNewGame(e.target.value)}
            >
              {POKEMON_GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {getChallengesForGame(newGame)
                ? `${getChallengesForGame(newGame)!.length} challenges pre-loaded in order from the ${newGame} guide.`
                : "This game's guide has no set gym path — you'll add challenges as free text."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {creating ? "Starting…" : "Start run"}
              </button>
              <button
                type="button"
                onClick={() => setShowStartForm(false)}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 transition hover:ring-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowStartForm(true)}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            + Start a new run
          </button>
        )}
      </div>

      {runs.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-3xl">🏟️</p>
          <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">
            No runs yet
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Start a run above, then log each gym, trial, or titan as you beat
            it — your team, the result, and any notes.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {runs.map((run) => {
            const wins = run.entries.filter((e) => e.result === "win").length;
            const total = run.entries.length;
            const unit = progressUnit(run.entries);
            const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
            return (
              <button
                key={run.id}
                type="button"
                onClick={() => setActiveRunId(run.id)}
                className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {run.game}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {wins}/{total} {unit}
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Started {new Date(run.created_at).toLocaleDateString()} · tap to log
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
