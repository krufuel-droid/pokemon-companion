"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllSpecies, searchSpecies } from "@/lib/pokedex";
import type { SpeciesIndex } from "@/lib/pokedex";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  getRegionalForms,
  REGIONAL_REGIONS,
  type RegionalForm,
} from "@/lib/data/forms";
import { TypePills } from "./type-pills";
import FavoriteButton from "@/components/FavoriteButton";

const TOTAL_COUNT = 1025;

const REGION_ADJECTIVE: Record<string, string> = {
  Alola: "Alolan",
  Galar: "Galarian",
  Hisui: "Hisuian",
  Paldea: "Paldean",
};

function SpeciesCard({ species }: { species: SpeciesIndex }) {
  return (
    <Link
      href={`/pokedex/${species.id}`}
      className="relative flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:ring-slate-700"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 220px" }}
    >
      <FavoriteButton speciesId={species.id} />
      <img
        src={species.sprites.regular}
        alt={species.name}
        className="h-24 w-24 object-contain"
        loading="lazy"
      />
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">#{species.id}</span>
      <span className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
        {species.name}
      </span>
      <TypePills types={species.types} />
    </Link>
  );
}

function RegionalFormCard({ form }: { form: RegionalForm }) {
  return (
    <Link
      href={`/pokedex/${form.speciesId}`}
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:ring-slate-700"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 220px" }}
    >
      <img
        src={form.sprite}
        alt={form.formName}
        className="h-24 w-24 object-contain"
        loading="lazy"
      />
      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
        {REGION_ADJECTIVE[form.region] ?? form.region}
      </span>
      <span className="text-center text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
        {form.formName}
      </span>
      <TypePills types={form.types} />
    </Link>
  );
}

export default function PokedexPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      setFavoritesOnly(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("favorites")
          .select("species_id")
          .eq("user_id", user.id);
        if (!cancelled) {
          setFavoriteIds(new Set(((data as { species_id: number }[] | null) ?? []).map((r) => r.species_id)));
        }
      } catch {
        // table may not exist yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;
  const browsingRegion = region !== "all";

  const regionalForms = useMemo(() => getRegionalForms(), []);

  const results = useMemo<SpeciesIndex[]>(
    () => {
      const base = browsingRegion
        ? []
        : searching
          ? searchSpecies(trimmed)
          : getAllSpecies();
      return favoritesOnly ? base.filter((s) => favoriteIds.has(s.id)) : base;
    },
    [searching, trimmed, browsingRegion, favoritesOnly, favoriteIds]
  );

  const regionResults = useMemo<RegionalForm[]>(
    () =>
      browsingRegion
        ? regionalForms.filter(
            (f) =>
              f.region === region &&
              (!searching ||
                f.formName.toLowerCase().includes(trimmed.toLowerCase()))
          )
        : [],
    [browsingRegion, regionalForms, region, searching, trimmed]
  );

  const shownCount = browsingRegion ? regionResults.length : results.length;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Pokédex</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every Pokémon, gens I–IX. Tap a card for the full entry.
        </p>

        <div className="mt-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search 1,025 Pokémon… (try "ge")'
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-700"
          />
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by region"
        >
          <button
            type="button"
            onClick={() => { setRegion("all"); setFavoritesOnly(false); }}
            aria-pressed={region === "all" && !favoritesOnly}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              region === "all" && !favoritesOnly
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
            }`}
          >
            All Pokémon
          </button>
          {user && (
            <button
              type="button"
              onClick={() => { setFavoritesOnly(!favoritesOnly); setRegion("all"); }}
              aria-pressed={favoritesOnly}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                favoritesOnly
                  ? "bg-yellow-500 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              ⭐ Favorites ({favoriteIds.size})
            </button>
          )}
          {REGIONAL_REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              aria-pressed={region === r}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                region === r
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {REGION_ADJECTIVE[r] ?? r}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
          {browsingRegion ? (
            <>
              {regionResults.length}{" "}
              {REGION_ADJECTIVE[region] ?? region}{" "}
              {regionResults.length === 1 ? "form" : "forms"}
              {searching && (
                <>
                  {" "}
                  for{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    “{trimmed}”
                  </span>
                </>
              )}
            </>
          ) : searching ? (
            <>
              {results.length}{" "}
              {results.length === 1 ? "result" : "results"} for{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">“{trimmed}”</span>
            </>
          ) : (
            <>All {TOTAL_COUNT.toLocaleString()} Pokémon</>
          )}
        </p>

        {shownCount === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              {browsingRegion
                ? `No ${REGION_ADJECTIVE[region] ?? region} forms found 🕵️`
                : `No Pokémon found for “${trimmed}” 🕵️`}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try a different name — even two letters is enough to start
              searching.
            </p>
          </div>
        ) : browsingRegion ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {regionResults.map((form) => (
              <RegionalFormCard key={form.formName} form={form} />
            ))}
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
