"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllSpecies, searchSpecies } from "@/lib/pokedex";
import type { SpeciesIndex } from "@/lib/pokedex";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { incrementRecord } from "@/lib/achievements";
import DexRace from "@/components/DexRace";
import { TypePills } from "../pokedex/type-pills";

interface CollectionEntry {
  species_id: number;
  is_shiny: boolean;
}

function CollectionCard({
  species,
  caught,
  shiny,
  onToggle,
  onToggleShiny,
}: {
  species: SpeciesIndex;
  caught: boolean;
  shiny: boolean;
  onToggle: (speciesId: number) => void;
  onToggleShiny: (speciesId: number) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onToggle(species.id)}
        className={`relative flex w-full flex-col items-center gap-1.5 rounded-2xl p-4 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
          caught
            ? "bg-white ring-emerald-300 dark:bg-slate-900 dark:ring-emerald-700"
            : "bg-white opacity-60 ring-slate-200 grayscale dark:bg-slate-900 dark:ring-slate-700"
        }`}
        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 220px" }}
        aria-pressed={caught}
        aria-label={`${species.name} ${caught ? "caught" : "not caught"}`}
      >
        {caught && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
            ✓
          </span>
        )}
        <img
          src={shiny && caught ? species.sprites.shiny : species.sprites.regular}
          alt={species.name}
          className="h-24 w-24 object-contain"
          loading="lazy"
        />
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">#{species.id}</span>
        <span className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
          {species.name}
        </span>
        <TypePills types={species.types} />
      </button>
      {caught && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleShiny(species.id);
          }}
          aria-label={shiny ? "Remove shiny mark" : "Mark as shiny"}
          aria-pressed={shiny}
          title={shiny ? "Remove shiny mark" : "Mark as shiny"}
          className={`absolute right-2 top-2 rounded-full p-1.5 text-lg transition ${
            shiny
              ? "opacity-100"
              : "opacity-40 hover:opacity-100"
          }`}
        >
          {shiny ? "✨" : "☆"}
        </button>
      )}
    </div>
  );
}

type Filter = "all" | "caught" | "missing" | "shiny";

export default function CollectionPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [entries, setEntries] = useState<Map<number, CollectionEntry>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setEntries(new Map());
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("collection")
          .select("species_id, is_shiny")
          .eq("user_id", user.id);
        if (!cancelled) {
          const map = new Map<number, CollectionEntry>();
          for (const row of (data as CollectionEntry[] | null) ?? []) {
            const existing = map.get(row.species_id);
            map.set(row.species_id, {
              species_id: row.species_id,
              is_shiny: existing?.is_shiny || row.is_shiny,
            });
          }
          setEntries(map);
        }
      } catch {
        // table may not exist yet
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function toggleCaught(speciesId: number) {
    if (!user) return;
    const existing = entries.get(speciesId);
    const supabase = createClient();

    if (existing) {
      // Remove from collection
      await supabase
        .from("collection")
        .delete()
        .eq("user_id", user.id)
        .eq("species_id", speciesId);
      setEntries((prev) => {
        const next = new Map(prev);
        next.delete(speciesId);
        return next;
      });
    } else {
      // Add to collection
      const { error } = await supabase.from("collection").insert({
        user_id: user.id,
        species_id: speciesId,
        is_shiny: false,
      });
      if (error && error.code !== "23505") return;
      setEntries((prev) => {
        const next = new Map(prev);
        next.set(speciesId, { species_id: speciesId, is_shiny: false });
        return next;
      });
      void incrementRecord(user.id, "collection_added", 1);
    }
  }

  async function toggleShiny(speciesId: number) {
    if (!user) return;
    const existing = entries.get(speciesId);
    if (!existing) return;
    const newShiny = !existing.is_shiny;
    const supabase = createClient();

    // Update the shiny flag - delete old row(s) and insert with new value
    await supabase
      .from("collection")
      .delete()
      .eq("user_id", user.id)
      .eq("species_id", speciesId);
    const { error } = await supabase.from("collection").insert({
      user_id: user.id,
      species_id: speciesId,
      is_shiny: newShiny,
    });
    if (error) return;
    setEntries((prev) => {
      const next = new Map(prev);
      next.set(speciesId, { species_id: speciesId, is_shiny: newShiny });
      return next;
    });
  }

  const allSpecies = useMemo(() => getAllSpecies(), []);
  const caughtCount = entries.size;
  const shinyCount = [...entries.values()].filter((e) => e.is_shiny).length;
  const total = allSpecies.length;
  const pct = total > 0 ? (caughtCount / total) * 100 : 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base: SpeciesIndex[];
    if (q.length >= 2) {
      base = searchSpecies(q);
    } else {
      base = allSpecies;
    }
    switch (filter) {
      case "caught":
        return base.filter((s) => entries.has(s.id));
      case "missing":
        return base.filter((s) => !entries.has(s.id));
      case "shiny":
        return base.filter((s) => entries.get(s.id)?.is_shiny);
      default:
        return base;
    }
  }, [query, filter, allSpecies, entries]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${total})` },
    { key: "caught", label: `Caught (${caughtCount})` },
    { key: "missing", label: `Missing (${total - caughtCount})` },
    { key: "shiny", label: `✨ Shiny (${shinyCount})` },
  ];

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Living Dex</h1>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          <Link href="/login" className="font-semibold text-emerald-600 underline underline-offset-2 dark:text-emerald-400">
            Sign in
          </Link>{" "}
          to track your collection.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Collection
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Living Dex
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Tap a Pokémon to mark it caught. Track your progress toward catching &apos;em all.
      </p>

      {/* Progress */}
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {caughtCount.toLocaleString()} <span className="text-base font-medium text-slate-400">/ {total.toLocaleString()}</span>
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
        {shinyCount > 0 && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            ✨ {shinyCount} shiny {shinyCount === 1 ? "entry" : "entries"}
          </p>
        )}
      </div>

      {/* Living Dex race — friendly leaderboard among friends */}
      <div className="mt-6">
        <DexRace />
      </div>

      {/* Search */}
      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Pokémon…"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter collection">
        {FILTERS.map((f) => (
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
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {!loaded ? (
        <p className="mt-8 text-center text-slate-400">Loading…</p>
      ) : results.length === 0 ? (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
          No Pokémon found.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map((species) => {
            const entry = entries.get(species.id);
            return (
              <CollectionCard
                key={species.id}
                species={species}
                caught={!!entry}
                shiny={entry?.is_shiny ?? false}
                onToggle={toggleCaught}
                onToggleShiny={toggleShiny}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
