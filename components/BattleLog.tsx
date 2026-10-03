"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Battle {
  id: string;
  opponent: string;
  battle_type: string;
  result: string;
  deaths: number;
  notes: string | null;
  battled_at: string;
  user_id: string;
}

const BATTLE_TYPES = [
  { value: "gym", label: "🏟️ Gym" },
  { value: "rival", label: "⚔️ Rival" },
  { value: "elite", label: "👑 Elite Four" },
  { value: "champion", label: "🏆 Champion" },
  { value: "trainer", label: "🧑 Trainer" },
  { value: "wild", label: "🌿 Wild" },
  { value: "other", label: "❓ Other" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  BATTLE_TYPES.map((t) => [t.value, t.label])
);

export default function BattleLog({ runId, onChanged }: { runId: string; onChanged: () => void }) {
  const { user } = useAuth();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [battleType, setBattleType] = useState("gym");
  const [result, setResult] = useState("win");
  const [deaths, setDeaths] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("nuzlocke_battles")
          .select("*")
          .eq("run_id", runId)
          .order("battled_at", { ascending: false });
        if (!cancelled) setBattles((data as Battle[] | null) ?? []);
      } catch {
        // table may not exist yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !opponent.trim() || saving) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("nuzlocke_battles")
        .insert({
          run_id: runId,
          user_id: user.id,
          opponent: opponent.trim(),
          battle_type: battleType,
          result,
          deaths: Math.max(0, parseInt(deaths) || 0),
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      setBattles((prev) => [data as Battle, ...prev]);
      setOpponent("");
      setBattleType("gym");
      setResult("win");
      setDeaths("0");
      setNotes("");
      setShowForm(false);
      onChanged();
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this battle entry?")) return;
    try {
      const supabase = createClient();
      await supabase.from("nuzlocke_battles").delete().eq("id", id);
      setBattles((prev) => prev.filter((b) => b.id !== id));
      onChanged();
    } catch {
      // best-effort
    }
  }

  const wins = battles.filter((b) => b.result === "win").length;
  const losses = battles.filter((b) => b.result === "loss").length;
  const totalDeaths = battles.reduce((sum, b) => sum + b.deaths, 0);

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Battle Log
        </h2>
        {user && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {showForm ? "Cancel" : "+ Log Battle"}
          </button>
        )}
      </div>

      {(wins > 0 || losses > 0) && (
        <div className="mb-4 flex gap-4 text-sm">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {wins}W
          </span>
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {losses}L
          </span>
          {totalDeaths > 0 && (
            <span className="text-slate-500 dark:text-slate-400">
              💀 {totalDeaths} {totalDeaths === 1 ? "death" : "deaths"}
            </span>
          )}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mb-4 space-y-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="opp" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Opponent
              </label>
              <input
                id="opp"
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g. Katy, Nemona, Larry"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="btype" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Type
              </label>
              <select
                id="btype"
                value={battleType}
                onChange={(e) => setBattleType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {BATTLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Result</span>
              <div className="mt-1 flex gap-2">
                {(["win", "loss"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResult(r)}
                    aria-pressed={result === r}
                    className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      result === r
                        ? r === "win"
                          ? "bg-emerald-600 text-white"
                          : "bg-rose-600 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {r === "win" ? "✓ Win" : "✗ Loss"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="deaths" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Deaths
              </label>
              <input
                id="deaths"
                type="number"
                min="0"
                max="6"
                value={deaths}
                onChange={(e) => setDeaths(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="bnotes" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Notes (optional)
            </label>
            <textarea
              id="bnotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How'd it go? Close calls? MVPs?"
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !opponent.trim()}
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Battle"}
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        {battles.length === 0 ? (
          <p className="p-5 text-sm text-slate-600 dark:text-slate-400">
            No battles logged yet. Log your first gym battle!
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-slate-800">
            {battles.map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    <span
                      className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        b.result === "win"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                      }`}
                    >
                      {b.result === "win" ? "WIN" : "LOSS"}
                    </span>
                    {TYPE_LABEL[b.battle_type] ?? b.battle_type} — {b.opponent}
                  </p>
                  {b.deaths > 0 && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      💀 {b.deaths} {b.deaths === 1 ? "death" : "deaths"}
                    </p>
                  )}
                  {b.notes && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{b.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(b.battled_at).toLocaleDateString()}
                  </p>
                </div>
                {user && b.user_id === user.id && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(b.id)}
                    aria-label="Delete battle"
                    className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
