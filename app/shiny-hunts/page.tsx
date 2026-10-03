"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies, getSpeciesById, type SpeciesIndex } from "@/lib/pokedex";
import { POKEMON_GAMES } from "@/lib/data/games";
import { SHINY_METHODS, oddsFor, methodLabel, methodNote } from "@/lib/shiny-odds";
import { unlockAchievement } from "@/lib/achievements";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

interface Hunt {
  id: string;
  owner_id: string;
  species_id: number;
  species_name: string;
  game: string | null;
  method: string;
  encounters: number;
  odds_denominator: number;
  has_charm: boolean;
  /** Phase counter (v2 migration). Defaults to 1 when the column is missing. */
  phases: number;
  status: "active" | "completed" | "abandoned";
  notes: string | null;
  started_at: string;
  completed_at: string | null;
}

/** Probability of having found at least one shiny after N encounters at 1/odds. */
function shinyProbability(encounters: number, odds: number): number {
  if (encounters <= 0 || odds <= 0) return 0;
  return 1 - Math.pow(1 - 1 / odds, encounters);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function StatusBadge({ status }: { status: Hunt["status"] }) {
  const styles =
    status === "completed"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      : status === "abandoned"
        ? "bg-stone-100 text-stone-600 dark:bg-slate-700 dark:text-slate-400"
        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
  const label = status === "completed" ? "✨ Found!" : status === "abandoned" ? "Abandoned" : "Hunting";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${styles}`}>
      {label}
    </span>
  );
}

function HuntCard({
  hunt,
  completedCount,
  onUpdate,
  onPhasesMissing,
}: {
  hunt: Hunt;
  completedCount: number;
  onUpdate: () => void;
  onPhasesMissing: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(hunt.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const species = getSpeciesById(hunt.species_id);
  // Effective odds honor the Shiny Charm toggle via the audited odds table.
  const effectiveOdds = oddsFor(hunt.method, hunt.has_charm);
  const prob = shinyProbability(hunt.encounters, effectiveOdds);

  function unlockForEncounters(total: number) {
    if (!user) return;
    if (total >= 100) void unlockAchievement(user.id, "hunt-100").catch(() => {});
    if (total >= 1000) void unlockAchievement(user.id, "hunt-1000").catch(() => {});
  }

  async function bump(amount: number) {
    if (!user || busy || hunt.status !== "active" || amount <= 0) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const next = hunt.encounters + amount;
      const { error } = await supabase
        .from("shiny_hunts")
        .update({ encounters: next, updated_at: new Date().toISOString() })
        .eq("id", hunt.id);
      if (error) throw error;
      unlockForEncounters(next);
      onUpdate();
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  }

  async function addPhase() {
    if (!user || busy || hunt.status !== "active") return;
    if (!confirm(`Start phase ${(hunt.phases ?? 1) + 1} of the ${hunt.species_name} hunt? Encounters keep counting.`)) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const next = (hunt.phases ?? 1) + 1;
      const { error } = await supabase
        .from("shiny_hunts")
        .update({ phases: next, updated_at: new Date().toISOString() })
        .eq("id", hunt.id);
      if (error) throw error;
      if (next >= 5) void unlockAchievement(user.id, "shiny-phase-5").catch(() => {});
      onUpdate();
    } catch {
      // Likely the v2 migration hasn't been run yet.
      onPhasesMissing();
    } finally {
      setBusy(false);
    }
  }

  async function toggleCharm() {
    if (!user || busy || hunt.status !== "active") return;
    setBusy(true);
    try {
      const supabase = createClient();
      const next = !hunt.has_charm;
      const { error } = await supabase
        .from("shiny_hunts")
        .update({
          has_charm: next,
          odds_denominator: oddsFor(hunt.method, next),
          updated_at: new Date().toISOString(),
        })
        .eq("id", hunt.id);
      if (error) throw error;
      onUpdate();
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: Hunt["status"]) {
    if (!user || busy) return;
    const confirmMsg =
      status === "completed"
        ? `Found the shiny ${hunt.species_name}?! ✨`
        : status === "abandoned"
          ? "Abandon this hunt?"
          : "Reopen this hunt?";
    if (!confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shiny_hunts")
        .update({
          status,
          completed_at: status === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", hunt.id);
      if (error) throw error;
      if (status === "completed") {
        void unlockAchievement(user.id, "first-shiny").catch(() => {});
        const total = completedCount + 1;
        if (total >= 5) void unlockAchievement(user.id, "shiny-5").catch(() => {});
        if (total >= 10) void unlockAchievement(user.id, "shiny-10").catch(() => {});
      }
      onUpdate();
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shiny_hunts")
        .update({ notes: notesDraft.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", hunt.id);
      if (error) throw error;
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
      onUpdate();
    } catch {
      // best-effort
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!user || busy) return;
    if (!confirm(`Delete the ${hunt.species_name} hunt?`)) return;
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.from("shiny_hunts").delete().eq("id", hunt.id);
      onUpdate();
    } finally {
      setBusy(false);
    }
  }

  const phases = hunt.phases ?? 1;

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-4">
        {species && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hunt.status === "completed" ? species.sprites.shiny : species.sprites.regular}
            alt={hunt.species_name}
            width={72}
            height={72}
            className="h-18 w-18 shrink-0 object-contain"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
              {hunt.species_name}
            </h2>
            <StatusBadge status={hunt.status} />
            {phases > 1 && (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800 dark:bg-violet-900 dark:text-violet-200">
                Phase {phases}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {methodLabel(hunt.method)}
            {hunt.game ? ` · ${hunt.game}` : ""}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {hunt.encounters.toLocaleString()}
            </span>{" "}
            encounters · 1/{effectiveOdds.toLocaleString()} odds
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-yellow-300 to-amber-400 transition-[width]"
              style={{ width: `${Math.min(100, prob * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {(prob * 100).toFixed(1)}% chance to have found one by now
          </p>
        </div>
      </div>

      {hunt.status === "active" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void bump(1)}
            disabled={busy}
            className="rounded-lg bg-mint px-6 py-2.5 text-lg font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => void bump(10)}
            disabled={busy}
            className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => void bump(50)}
            disabled={busy}
            className="rounded-lg bg-stone-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            +50
          </button>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Custom"
              aria-label="Custom encounter amount"
              className="w-24 rounded-lg border border-stone-300 bg-white px-2 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => {
                const n = parseInt(customAmount, 10);
                if (Number.isFinite(n) && n > 0) {
                  setCustomAmount("");
                  void bump(n);
                }
              }}
              disabled={busy}
              className="rounded-lg bg-stone-100 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-stone-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Add
            </button>
          </div>
          <button
            type="button"
            onClick={() => void addPhase()}
            disabled={busy}
            title="Start a new phase — encounters keep counting"
            className="rounded-lg bg-violet-100 px-3 py-2 text-sm font-bold text-violet-800 transition hover:bg-violet-200 disabled:opacity-60 dark:bg-violet-900 dark:text-violet-200"
          >
            🔁 New phase
          </button>
          <button
            type="button"
            onClick={() => void toggleCharm()}
            disabled={busy}
            aria-pressed={hunt.has_charm}
            title="Toggle the Shiny Charm — the odds above update"
            className={`rounded-lg px-3 py-2 text-sm font-bold transition disabled:opacity-60 ${
              hunt.has_charm
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200"
                : "bg-stone-100 text-slate-500 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            }`}
          >
            ✨ Charm {hunt.has_charm ? "on" : "off"}
          </button>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => void setStatus("completed")}
              disabled={busy}
              className="rounded-lg bg-yellow-100 px-3 py-1.5 text-sm font-bold text-yellow-800 transition hover:bg-yellow-200 disabled:opacity-60 dark:bg-yellow-900 dark:text-yellow-200"
            >
              ✨ Found it!
            </button>
            <button
              type="button"
              onClick={() => void setStatus("abandoned")}
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-60 dark:text-slate-400"
            >
              Abandon
            </button>
          </div>
        </div>
      )}
      {hunt.status !== "active" && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void setStatus("active")}
            disabled={busy}
            className="rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-stone-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300"
          >
            Reopen
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setNotesDraft(hunt.notes ?? "");
            setNotesOpen((o) => !o);
          }}
          className="text-sm font-semibold text-slate-500 underline decoration-dotted hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {notesOpen ? "Hide notes" : hunt.notes ? "📝 Notes" : "Add notes"}
        </button>
        {notesOpen && (
          <div className="mt-2">
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={3}
              placeholder="Route, sandwich recipe, what phase you're on…"
              className={inputClass}
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => void saveNotes()}
                disabled={busy}
                className="rounded-lg bg-mint px-4 py-1.5 text-sm font-bold text-slate-900 disabled:opacity-60 dark:text-slate-100"
              >
                Save notes
              </button>
              {notesSaved && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved ✓</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NewHuntForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<SpeciesIndex | null>(null);
  const [game, setGame] = useState("");
  const [method, setMethod] = useState("random");
  const [hasCharm, setHasCharm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || species) return [];
    return searchSpecies(q).slice(0, 8);
  }, [query, species]);

  // Live odds preview: the charm toggle changes the displayed odds.
  const previewOdds = oddsFor(method, hasCharm);
  const previewNote = methodNote(method);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !species || busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("shiny_hunts").insert({
        owner_id: user.id,
        species_id: species.id,
        species_name: species.name,
        game: game || null,
        method,
        odds_denominator: previewOdds,
        has_charm: hasCharm,
        status: "active",
      });
      if (error) throw error;
      void unlockAchievement(user.id, "first-hunt").catch(() => {});
      setQuery("");
      setSpecies(null);
      setGame("");
      setMethod("random");
      setHasCharm(false);
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create hunt.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-white/50 p-6 text-center font-semibold text-slate-500 transition hover:border-mint hover:text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ✨ Start a new shiny hunt
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void create(e)} className={cardClass}>
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New shiny hunt</h2>

      <div className="mt-4">
        <label className={labelClass}>Pokémon</label>
        {species ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={species.sprites.regular} alt={species.name} width={48} height={48} className="h-12 w-12 object-contain" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">{species.name}</span>
            <button type="button" onClick={() => { setSpecies(null); setQuery(""); }} className="text-sm text-slate-500 underline">
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Pokémon…"
              autoComplete="off"
              className={inputClass}
            />
            {matches.length > 0 && (
              <ul className="mt-1 grid max-h-48 grid-cols-4 gap-1 overflow-auto rounded-lg border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSpecies(m)}
                      title={m.name}
                      className="rounded-lg p-1 transition hover:bg-stone-100 dark:hover:bg-slate-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.sprites.regular} alt={m.name} width={48} height={48} className="h-12 w-12 object-contain" loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="hunt-game" className={labelClass}>Game (optional)</label>
          <select id="hunt-game" value={game} onChange={(e) => setGame(e.target.value)} className={inputClass}>
            <option value="">Any game</option>
            {POKEMON_GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hunt-method" className={labelClass}>Method</label>
          <select id="hunt-method" value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
            {SHINY_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} (1/{(hasCharm ? m.charmOdds : m.baseOdds).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={hasCharm}
          onChange={(e) => setHasCharm(e.target.checked)}
          className="h-4 w-4 accent-amber-500"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">I have the Shiny Charm</span>
      </label>

      <p className="mt-2 rounded-lg bg-stone-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        Odds: <span className="font-bold">1/{previewOdds.toLocaleString()}</span>
        {hasCharm && " ✨ (with Shiny Charm)"}
        {previewNote && <span className="block text-xs text-slate-500 dark:text-slate-400">{previewNote}</span>}
      </p>

      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy || !species}
          className="rounded-lg bg-mint px-6 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
        >
          {busy ? "Starting…" : "Start hunt ✨"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function StatsDashboard({ hunts }: { hunts: Hunt[] }) {
  const totalHunts = hunts.length;
  const totalEncounters = hunts.reduce((sum, h) => sum + (h.encounters ?? 0), 0);
  const shiniesFound = hunts.filter((h) => h.status === "completed").length;
  const activeCount = hunts.filter((h) => h.status === "active").length;
  const longest = hunts.reduce<Hunt | null>(
    (best, h) => (!best || h.encounters > best.encounters ? h : best),
    null,
  );

  const stats = [
    { label: "Hunts started", value: totalHunts.toLocaleString() },
    { label: "Total encounters", value: totalEncounters.toLocaleString() },
    { label: "✨ Shinies found", value: shiniesFound.toLocaleString() },
    { label: "Active hunts", value: activeCount.toLocaleString() },
  ];

  return (
    <details className={`${cardClass} p-5`} open={totalHunts > 0}>
      <summary className="cursor-pointer list-none">
        <span className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          📊 Hunt stats
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-stone-100 px-3 py-3 text-center dark:bg-slate-800"
          >
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
      {longest && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Longest hunt: <span className="font-semibold text-slate-700 dark:text-slate-200">
            {longest.species_name} ({longest.encounters.toLocaleString()} encounters
            {(longest.phases ?? 1) > 1 ? `, phase ${longest.phases}` : ""})
          </span>
        </p>
      )}
    </details>
  );
}

function PastHunts({ hunts }: { hunts: Hunt[] }) {
  const [open, setOpen] = useState(true);
  if (hunts.length === 0) return null;
  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          🏆 Past hunts <span className="text-sm font-semibold text-slate-500">({hunts.length})</span>
        </h2>
        <span className="text-slate-400">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {hunts.map((hunt) => {
            const species = getSpeciesById(hunt.species_id);
            return (
              <li
                key={hunt.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
              >
                {species && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={species.sprites.shiny}
                    alt={hunt.species_name}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 object-contain"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                    ✨ {hunt.species_name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hunt.encounters.toLocaleString()} encounters
                    {(hunt.phases ?? 1) > 1 ? ` · ${hunt.phases} phases` : ""}
                    {" · "}{methodLabel(hunt.method)}
                    {hunt.game ? ` · ${hunt.game}` : ""}
                    {" · found "}{fmtDate(hunt.completed_at)}
                  </p>
                </div>
                <Link
                  href={`/pokedex/${hunt.species_id}`}
                  className="shrink-0 text-sm font-semibold text-emerald-600 underline dark:text-emerald-400"
                >
                  View
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function ShinyHuntsPage() {
  const { configured, loading, user } = useAuth();
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [phasesMissing, setPhasesMissing] = useState(false);
  void configured;

  const fetchHunts = useCallback(async () => {
    if (!user) {
      setListLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shiny_hunts")
        .select("*")
        .eq("owner_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data as (Record<string, unknown> & { phases?: number })[] | null) ?? [];
      // Degrade gracefully: if the v2 migration hasn't been run, phases is
      // undefined and every hunt just shows as phase 1.
      const missing = rows.some((r) => r.phases === undefined);
      setPhasesMissing(missing);
      setHunts(
        rows.map((r) => ({
          id: String(r.id),
          owner_id: String(r.owner_id ?? ""),
          species_id: Number(r.species_id),
          species_name: String(r.species_name ?? "Unknown"),
          game: (r.game as string | null) ?? null,
          method: String(r.method ?? "random"),
          encounters: Number(r.encounters ?? 0),
          odds_denominator: Number(r.odds_denominator ?? 4096),
          has_charm: Boolean(r.has_charm),
          phases: typeof r.phases === "number" ? r.phases : 1,
          status: (r.status as Hunt["status"]) ?? "active",
          notes: (r.notes as string | null) ?? null,
          started_at: String(r.started_at ?? ""),
          completed_at: (r.completed_at as string | null) ?? null,
        })),
      );
      setTableMissing(false);
    } catch {
      setTableMissing(true);
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) void fetchHunts();
  }, [loading, fetchHunts]);

  const activeHunts = useMemo(() => hunts.filter((h) => h.status === "active"), [hunts]);
  const completedHunts = useMemo(() => hunts.filter((h) => h.status === "completed"), [hunts]);
  const abandonedHunts = useMemo(() => hunts.filter((h) => h.status === "abandoned"), [hunts]);
  const completedCount = completedHunts.length;
  const activeCount = activeHunts.length;

  if (!isSupabaseConfigured()) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">✨ Shiny hunts</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          <Link href="/login" className="font-semibold text-emerald-600 underline">Sign in</Link> to track your shiny hunts.
        </p>
      </div>
    );
  }

  const refresh = () => void fetchHunts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">✨ Shiny hunts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {activeCount > 0
              ? `${activeCount} active hunt${activeCount === 1 ? "" : "s"} — good luck!`
              : "Track every encounter on the road to that sparkle."}
          </p>
        </div>
      </div>

      {tableMissing ? (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Shiny hunts need the latest database update — run the newest SQL in the Supabase SQL Editor to enable them.
        </p>
      ) : (
        <>
          {phasesMissing && (
            <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Phase tracking needs the newest database update — run{" "}
              <code className="font-mono text-xs">supabase/migration-shiny-hunts-v2.sql</code>{" "}
              in the Supabase SQL Editor to enable &ldquo;New phase&rdquo;.
            </p>
          )}

          <div className="mt-6">
            <StatsDashboard hunts={hunts} />
          </div>

          <div className="mt-6">
            <NewHuntForm onCreated={refresh} />
          </div>

          {listLoading ? (
            <p className="mt-6 text-slate-500">Loading hunts…</p>
          ) : (
            <>
              {activeHunts.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    🎯 Active hunts <span className="text-sm font-semibold text-slate-500">({activeHunts.length})</span>
                  </h2>
                  <div className="mt-3 space-y-4">
                    {activeHunts.map((hunt) => (
                      <HuntCard
                        key={hunt.id}
                        hunt={hunt}
                        completedCount={completedCount}
                        onUpdate={refresh}
                        onPhasesMissing={() => setPhasesMissing(true)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {activeHunts.length === 0 && completedHunts.length === 0 && abandonedHunts.length === 0 && (
                <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  No hunts yet — start one above! ✨
                </p>
              )}

              <PastHunts hunts={completedHunts} />

              {abandonedHunts.length > 0 && (
                <details className="mt-8">
                  <summary className="cursor-pointer list-none">
                    <h2 className="inline text-lg font-bold text-slate-900 dark:text-slate-100">
                      🗃️ Abandoned hunts <span className="text-sm font-semibold text-slate-500">({abandonedHunts.length})</span>
                    </h2>
                  </summary>
                  <div className="mt-3 space-y-4">
                    {abandonedHunts.map((hunt) => (
                      <HuntCard
                        key={hunt.id}
                        hunt={hunt}
                        completedCount={completedCount}
                        onUpdate={refresh}
                        onPhasesMissing={() => setPhasesMissing(true)}
                      />
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
