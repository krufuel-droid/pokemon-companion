"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { incrementRecord } from "@/lib/achievements";
import { POKEMON_GAMES } from "@/lib/data/games";

export default function DailyCatchLogger({
  speciesId,
  speciesName,
  potdDate,
}: {
  speciesId: number;
  speciesName: string;
  potdDate: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [game, setGame] = useState<string>(POKEMON_GAMES[0]);
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    createClient()
      .from("daily_catches")
      .select("id")
      .eq("user_id", user.id)
      .eq("potd_date", potdDate)
      .maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => {
        if (data) setDone(true);
      })
      .catch(() => {});
  }, [user, potdDate]);

  async function submit() {
    if (!user || !location.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("daily_catches").insert({
        user_id: user.id,
        species_id: speciesId,
        species_name: speciesName,
        potd_date: potdDate,
        game,
        location: location.trim(),
      });
      if (error) {
        if (error.code === "23505") {
          setDone(true);
          return;
        }
        throw error;
      }
      void incrementRecord(user.id, "daily_catches", 1).catch(() => {});
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log your catch.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="mt-4 inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
        ✅ Logged! Nice catch, trainer.
      </p>
    );
  }

  if (!user) {
    return (
      <p className="mt-4 text-sm text-slate-400">
        <a href="/login" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">Sign in</a>{" "}
        to log your catches.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full bg-amber-400 px-5 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-amber-300"
      >
        🎉 I caught it!
      </button>
    );
  }

  return (
    <div className="mt-4 w-full rounded-2xl bg-amber-50 p-4 text-left ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-800">
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
        Log your {speciesName} catch
      </p>
      <label className="mt-3 block text-xs font-semibold text-slate-500 dark:text-slate-400">
        Which game?
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          {POKEMON_GAMES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
        Where did you catch it?
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Cascarrafa, Area Zero, Route 3…"
          maxLength={80}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => void submit()}
          disabled={busy || !location.trim()}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "Logging…" : "Log catch"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
