"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies, getSpeciesById, type SpeciesIndex } from "@/lib/pokedex";
import { POKEMON_GAMES } from "@/lib/data/games";

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
  status: "active" | "completed" | "abandoned";
  notes: string | null;
  started_at: string;
  completed_at: string | null;
}

const METHODS: { id: string; label: string; odds: number }[] = [
  { id: "random", label: "Random encounters", odds: 4096 },
  { id: "masuda", label: "Masuda Method (breeding)", odds: 683 },
  { id: "chain", label: "Chain / combo", odds: 512 },
  { id: "outbreak", label: "Mass outbreak", odds: 512 },
  { id: "sandwich", label: "Sparkling Power sandwich", odds: 1024 },
  { id: "other", label: "Other", odds: 4096 },
];

function methodOdds(methodId: string): number {
  return METHODS.find((m) => m.id === methodId)?.odds ?? 4096;
}

/** Probability of having found at least one shiny after N encounters at 1/odds. */
function shinyProbability(encounters: number, odds: number): number {
  if (encounters <= 0 || odds <= 0) return 0;
  return 1 - Math.pow(1 - 1 / odds, encounters);
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

function HuntCard({ hunt, onUpdate }: { hunt: Hunt; onUpdate: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const species = getSpeciesById(hunt.species_id);
  const effectiveOdds = hunt.has_charm ? Math.max(1, Math.round(hunt.odds_denominator / 3)) : hunt.odds_denominator;
  const prob = shinyProbability(hunt.encounters, effectiveOdds);

  async function bump(amount: number) {
    if (!user || busy || hunt.status !== "active") return;
    setBusy(true);
    try {
      const supabase = createClient();
      const next = hunt.encounters + amount;
      const { error } = await supabase
        .from("shiny_hunts")
        .update({ encounters: next, updated_at: new Date().toISOString() })
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
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
              {hunt.species_name}
            </h2>
            <StatusBadge status={hunt.status} />
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {METHODS.find((m) => m.id === hunt.method)?.label ?? hunt.method}
            {hunt.game ? ` · ${hunt.game}` : ""}
            {hunt.has_charm ? " · ✨ Shiny Charm" : ""}
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
        odds_denominator: methodOdds(method),
        has_charm: hasCharm,
        status: "active",
      });
      if (error) throw error;
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
            {METHODS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} (1/{m.odds.toLocaleString()})</option>
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
        <span className="text-sm text-slate-700 dark:text-slate-300">I have the Shiny Charm (≈3× odds)</span>
      </label>

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

export default function ShinyHuntsPage() {
  const { configured, loading, user } = useAuth();
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [filter, setFilter] = useState<"active" | "completed" | "abandoned" | "all">("active");

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
      setHunts((data as Hunt[] | null) ?? []);
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

  const filtered = useMemo(
    () => (filter === "all" ? hunts : hunts.filter((h) => h.status === filter)),
    [hunts, filter],
  );
  const activeCount = hunts.filter((h) => h.status === "active").length;

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
          <div className="mt-6">
            <NewHuntForm onCreated={() => void fetchHunts()} />
          </div>

          <div className="mt-6 flex gap-2">
            {(["active", "completed", "abandoned", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-sm font-semibold capitalize transition ${
                  filter === f
                    ? "bg-mint text-slate-900 dark:text-slate-100"
                    : "bg-stone-100 text-slate-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {listLoading ? (
            <p className="mt-6 text-slate-500">Loading hunts…</p>
          ) : filtered.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
              {filter === "active" ? "No active hunts — start one above! ✨" : `No ${filter} hunts.`}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {filtered.map((hunt) => (
                <HuntCard key={hunt.id} hunt={hunt} onUpdate={() => void fetchHunts()} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
