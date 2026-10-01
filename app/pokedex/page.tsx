"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAllSpecies, searchSpecies } from "@/lib/pokedex";
import type { SpeciesIndex } from "@/lib/pokedex";
import { TypePills } from "./type-pills";

const TOTAL_COUNT = 1025;
const INITIAL_COUNT = 60;

function SpeciesCard({ species }: { species: SpeciesIndex }) {
  return (
    <Link
      href={`/pokedex/${species.id}`}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <img
        src={species.sprites.regular}
        alt={species.name}
        className="h-24 w-24 object-contain"
        loading="lazy"
      />
      <span className="text-xs font-medium text-slate-400">#{species.id}</span>
      <span className="text-sm font-semibold capitalize text-slate-800">
        {species.name}
      </span>
      <TypePills types={species.types} />
    </Link>
  );
}

export default function PokedexPage() {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  const results = useMemo<SpeciesIndex[]>(
    () =>
      searching
        ? searchSpecies(trimmed)
        : getAllSpecies().slice(0, INITIAL_COUNT),
    [searching, trimmed]
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Pokédex</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every Pokémon, gens I–IX. Tap a card for the full entry.
        </p>

        <div className="mt-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search 1,025 Pokémon… (try "ge")'
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300"
          />
        </div>

        <p className="mt-4 text-sm text-slate-500" aria-live="polite">
          {searching ? (
            <>
              {results.length}{" "}
              {results.length === 1 ? "result" : "results"} for{" "}
              <span className="font-semibold text-slate-700">“{trimmed}”</span>
            </>
          ) : (
            <>
              Showing {INITIAL_COUNT} of {TOTAL_COUNT.toLocaleString()} — search
              to find more
            </>
          )}
        </p>

        {results.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-700">
              No Pokémon found for “{trimmed}” 🕵️
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try a different name — even two letters is enough to start
              searching.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((species) => (
              <SpeciesCard key={species.id} species={species} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
