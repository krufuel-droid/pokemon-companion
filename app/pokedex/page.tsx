"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

// Wolf's QA find (Oct 5, 2026): tapping a Pokémon and going back used to
// dump you at the top of the list with filters cleared. We persist the
// list state per-tab in sessionStorage and restore it on mount.
// Follow-up (same day): restoring by raw scrollY still landed in a
// *different spot* — card heights vary (wrapped names, two-line type
// pills), and content-visibility's estimated sizes shift layout while the
// list re-renders, so a saved pixel value points at the wrong card. We now
// save the topmost visible card as an anchor and re-anchor to that exact
// card on return, which survives layout shifts. scrollY is kept as fallback.
const LIST_STATE_KEY = "pokedex:list-state-v2";

interface ListState {
  query?: string;
  region?: string;
  favoritesOnly?: boolean;
  anchorId?: string;
  anchorOffset?: number;
  scrollY?: number; // fallback when the anchor card can't be found
}

function loadListState(): ListState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(LIST_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ListState;
  } catch {
    return null;
  }
}

function saveListState(state: ListState) {
  try {
    sessionStorage.setItem(LIST_STATE_KEY, JSON.stringify(state));
  } catch {
    // storage may be unavailable — non-fatal
  }
}

// The topmost visible card: the first card with any part below the top
// edge of the viewport. We record its id and where its top sits relative
// to the viewport (negative = partially scrolled past), so the exact view
// can be rebuilt even if the layout shifts between save and restore.
function currentAnchor(): { anchorId?: string; anchorOffset?: number } {
  if (typeof window === "undefined") return {};
  const cards = document.querySelectorAll<HTMLElement>("[data-card-id]");
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (rect.bottom > 0) {
      return { anchorId: card.dataset.cardId, anchorOffset: rect.top };
    }
  }
  return {};
}

// Scroll so the anchor card sits exactly where it was. Returns true when
// the post-scroll offset matches (within a few px) — false means layout
// is still settling or the card isn't in the DOM yet, so the caller should
// retry.
function scrollToAnchor(anchorId: string, anchorOffset: number): boolean {
  const el = document.querySelector<HTMLElement>(
    `[data-card-id="${CSS.escape(anchorId)}"]`
  );
  if (!el) return false;
  const y = el.getBoundingClientRect().top + window.scrollY - anchorOffset;
  window.scrollTo(0, Math.max(0, y));
  const check = document.querySelector<HTMLElement>(
    `[data-card-id="${CSS.escape(anchorId)}"]`
  );
  if (!check) return false;
  return Math.abs(check.getBoundingClientRect().top - anchorOffset) <= 3;
}

const REGION_ADJECTIVE: Record<string, string> = {
  Alola: "Alolan",
  Galar: "Galarian",
  Hisui: "Hisuian",
  Paldea: "Paldean",
};

function SpeciesCard({
  species,
  onFavoriteToggle,
}: {
  species: SpeciesIndex;
  onFavoriteToggle?: (speciesId: number, favorited: boolean) => void;
}) {
  return (
    <Link
      href={`/pokedex/${species.id}`}
      data-card-id={`mon-${species.id}`}
      className="relative flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:ring-slate-700"
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 220px" }}
    >
      <FavoriteButton speciesId={species.id} onToggle={onFavoriteToggle} />
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
      data-card-id={`form-${form.speciesId}-${form.region}`}
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
  const restoredRef = useRef(false);
  const userInterruptedRestoreRef = useRef(false);

  // Restore list position + filters when returning (e.g. back from a detail page).
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadListState();
    if (!saved) return;
    if (saved.query) setQuery(saved.query);
    if (saved.region) setRegion(saved.region);
    if (saved.favoritesOnly) setFavoritesOnly(true);

    const run = () => {
      let attempts = 0;
      const tick = () => {
        // If the user started scrolling, stop fighting them.
        if (userInterruptedRestoreRef.current) return;
        attempts += 1;
        let settled = false;
        if (saved.anchorId && typeof saved.anchorOffset === "number") {
          settled = scrollToAnchor(saved.anchorId, saved.anchorOffset);
        }
        if (!settled && (saved.scrollY ?? 0) > 0) {
          // Fallback for states saved before anchors existed, or when the
          // anchor card isn't in this view (e.g. filters changed since).
          window.scrollTo(0, saved.scrollY as number);
          settled = Math.abs(window.scrollY - (saved.scrollY as number)) <= 2;
        }
        // Retry while layout is still settling (lazy cards, fonts, the
        // async favorites fetch). The anchor check makes retries cheap and
        // converges instead of drifting.
        if (!settled && attempts < 90) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    // Fonts change card heights, so wait for them before anchoring.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(run).catch(run);
    } else {
      run();
    }
  }, []);

  // Persist list state as the user scrolls / filters, so "back" lands where they were.
  useEffect(() => {
    let ticking = false;
    const save = () => {
      ticking = false;
      const { anchorId, anchorOffset } = currentAnchor();
      saveListState({
        query,
        region,
        favoritesOnly,
        anchorId,
        anchorOffset,
        scrollY: window.scrollY,
      });
    };
    const onScroll = () => {
      userInterruptedRestoreRef.current = true;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(save);
      }
    };
    const onHide = () => save();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onHide);
    };
  }, [query, region, favoritesOnly]);

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
              <SpeciesCard
                key={species.id}
                species={species}
                onFavoriteToggle={(id, fav) =>
                  setFavoriteIds((prev) => {
                    const next = new Set(prev);
                    if (fav) next.add(id);
                    else next.delete(id);
                    return next;
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
