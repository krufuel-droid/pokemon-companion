"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { incrementRecord } from "@/lib/achievements";
import { evaluateStreakMilestones } from "@/lib/streaks";
import { checkSeasonalAchievements } from "@/lib/achievements-seasonal";
import { POKEMON_GAMES } from "@/lib/data/games";
import { speciesAppearsInGame, checkCatchLocation, encounterLocations } from "@/lib/game-validation";
import { GAME_LOCATIONS } from "@/lib/data/game-locations";

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
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [locations, setLocations] = useState<string[] | null>(null); // null = not loaded yet
  const [locationsLoading, setLocationsLoading] = useState(false);

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

  // Load locations whenever the game changes: species-specific encounter
  // data first, then the built-in per-game location list as backbone.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLocationsLoading(true);
    setLocations(null);
    setLocation("");
    encounterLocations(speciesId, game)
      .then((locs) => {
        if (cancelled) return;
        const list = locs.length > 0 ? locs : (GAME_LOCATIONS[game] ?? []);
        setLocations(list);
        if (list.length > 0) setLocation(list[0]);
      })
      .catch(() => {
        if (cancelled) return;
        const list = GAME_LOCATIONS[game] ?? [];
        setLocations(list);
        if (list.length > 0) setLocation(list[0]);
      })
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [game, open, speciesId]);

  async function submit(force = false) {
    if (!user || !location.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // Fact check: the Pokémon must actually appear in the chosen game.
      let appears: boolean;
      try {
        appears = await speciesAppearsInGame(speciesId, game);
      } catch {
        setError("Couldn't verify that game right now — check your connection and try again.");
        setBusy(false);
        return;
      }
      if (!appears) {
        setError(`${speciesName} doesn't appear in ${game} — pick the game you actually caught it in.`);
        setBusy(false);
        return;
      }
      // Location cross-check: warn (don't hard-block) if the spot doesn't
      // match any real encounter location in that game.
      if (!force) {
        const locCheck = await checkCatchLocation(speciesId, game, location.trim());
        if (locCheck === "mismatch") {
          setLocationWarning(
            `Hmm — "${location.trim()}" doesn't look like a ${speciesName} spot in ${game}. Double-check the location?`
          );
          setBusy(false);
          return;
        }
      }
      setLocationWarning(null);
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
      // Fire-and-forget: unlock streak milestones (7-day, 30-day) if crossed.
      void evaluateStreakMilestones(user.id).catch(() => {});
      void checkSeasonalAchievements(user.id, potdDate).catch(() => {});
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log your catch.");
    } finally {
      setBusy(false);
    }
  }

  async function unlog() {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await createClient()
        .from("daily_catches")
        .delete()
        .eq("user_id", user.id)
        .eq("potd_date", potdDate);
      if (error) throw error;
      setDone(false);
    } catch {
      // Keep the logged state so the user can retry.
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="mt-4 flex items-center justify-center gap-2 text-sm sm:justify-start">
        <span className="inline-block rounded-full bg-emerald-100 px-4 py-2 font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          ✅ Logged! Nice catch, trainer.
        </span>
        <button
          onClick={() => void unlog()}
          disabled={busy}
          className="font-semibold text-slate-400 underline-offset-2 hover:text-red-500 hover:underline disabled:opacity-50"
        >
          {busy ? "…" : "Undo"}
        </button>
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
          onChange={(e) => { setGame(e.target.value); setLocationWarning(null); }}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          {POKEMON_GAMES.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </label>
      <label className="mt-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
        Where did you catch it?
        {locationsLoading ? (
          <p className="mt-1 text-sm font-normal text-slate-400">Loading locations…</p>
        ) : locations && locations.length > 0 ? (
          <select
            value={location}
            onChange={(e) => { setLocation(e.target.value); setLocationWarning(null); }}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {locations.map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>
        ) : (
          <>
            <input
              value={location}
              onChange={(e) => { setLocation(e.target.value); setLocationWarning(null); }}
              placeholder="e.g. Cascarrafa, Area Zero, Route 3…"
              maxLength={80}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-1 font-normal text-slate-400">
              No location list for this game — type it in.
            </p>
          </>
        )}
      </label>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {locationWarning && (
        <div className="mt-2 rounded-xl bg-amber-100 p-3 text-xs text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
          <p>{locationWarning}</p>
          <button
            onClick={() => void submit(true)}
            disabled={busy}
            className="mt-2 rounded-full bg-amber-500 px-3 py-1.5 font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {busy ? "Logging…" : "It's correct — log anyway"}
          </button>
        </div>
      )}
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
