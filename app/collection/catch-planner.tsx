"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getAllSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { POKEMON_GAMES } from "@/lib/data/games";
import { useAuth } from "@/components/AuthProvider";
import { unlockAchievement } from "@/lib/achievements";

/* ------------------------------------------------------------------ */
/* Game → PokéAPI version mapping                                      */
/* ------------------------------------------------------------------ */

/**
 * PokéAPI version keys for each of the 18 mainline game groups
 * (newest first, same order as POKEMON_GAMES in lib/data/games.ts).
 * Encounter lookups union the locations across the group's versions,
 * e.g. Scarlet ∪ Violet.
 */
const GAME_VERSIONS: Record<string, string[]> = {
  "Pokémon Scarlet & Violet": ["scarlet", "violet"],
  "Pokémon Legends: Arceus": ["legends-arceus"],
  "Pokémon Sword & Shield": ["sword", "shield"],
  "Pokémon Brilliant Diamond & Shining Pearl": [
    "brilliant-diamond",
    "shining-pearl",
  ],
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!": [
    "lets-go-pikachu",
    "lets-go-eevee",
  ],
  "Pokémon Sun & Moon": ["sun", "moon"],
  "Pokémon Ultra Sun & Ultra Moon": ["ultra-sun", "ultra-moon"],
  "Pokémon X & Y": ["x", "y"],
  "Pokémon Omega Ruby & Alpha Sapphire": ["omega-ruby", "alpha-sapphire"],
  "Pokémon Black & White": ["black", "white"],
  "Pokémon Black 2 & White 2": ["black-2", "white-2"],
  "Pokémon Diamond & Pearl": ["diamond", "pearl"],
  "Pokémon Platinum": ["platinum"],
  "Pokémon HeartGold & SoulSilver": ["heartgold", "soulsilver"],
  "Pokémon Ruby, Sapphire & Emerald": ["ruby", "sapphire", "emerald"],
  "Pokémon FireRed & LeafGreen": ["firered", "leafgreen"],
  "Pokémon Gold, Silver & Crystal": ["gold", "silver", "crystal"],
  "Pokémon Red, Blue & Yellow": ["red", "blue", "yellow"],
};

/**
 * PokéAPI publishes no wild-encounter data for these versions (verified:
 * even Scarlet/Violet starters return []), so planning is impossible for a
 * game composed only of them. Also documented in lib/data/game-locations.ts.
 */
const VERSIONS_WITHOUT_ENCOUNTER_DATA = new Set(["scarlet", "violet"]);

/* ------------------------------------------------------------------ */
/* Encounter data — same flow as app/pokedex/[id]/encounters-section.tsx */
/* ------------------------------------------------------------------ */

interface ApiEncounterArea {
  location_area: { name: string };
  version_details: { version: { name: string } }[];
}

/** "kanto-route-3-area" → "Kanto Route 3". Mirrors encounters-section.tsx. */
function cleanLocationArea(name: string): string {
  return name
    .replace(/-area$/, "")
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const ENCOUNTER_CACHE_KEY = "pcdx-encounter-cache-v1";
/** speciesId → version → location names. Hydrated from localStorage once. */
const encounterCache = new Map<number, Record<string, string[]>>();
let cacheHydrated = false;

function hydrateCache(): void {
  if (cacheHydrated) return;
  cacheHydrated = true;
  try {
    const raw = localStorage.getItem(ENCOUNTER_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Record<string, string[]>>;
    for (const [id, perVersion] of Object.entries(parsed)) {
      encounterCache.set(Number(id), perVersion);
    }
  } catch {
    /* corrupted cache: start fresh */
  }
}

function persistCache(): void {
  try {
    const obj: Record<string, Record<string, string[]>> = {};
    for (const [id, perVersion] of encounterCache) obj[String(id)] = perVersion;
    localStorage.setItem(ENCOUNTER_CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* quota exceeded: keep the in-memory cache for this session */
  }
}

/**
 * Per-version wild-encounter locations for one species, via PokéAPI —
 * the same endpoint encounters-section.tsx uses. Throws on network/HTTP
 * errors (callers treat that as "couldn't check", not "unobtainable").
 */
async function loadEncountersByVersion(
  speciesId: number,
  signal: AbortSignal
): Promise<Record<string, string[]>> {
  hydrateCache();
  const hit = encounterCache.get(speciesId);
  if (hit) return hit;

  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${speciesId}/encounters`,
    { signal }
  );
  if (!res.ok) throw new Error(`PokéAPI responded ${res.status}`);
  const areas = (await res.json()) as ApiEncounterArea[];

  const byVersion: Record<string, Set<string>> = {};
  for (const area of areas) {
    const location = cleanLocationArea(area.location_area.name);
    for (const vd of area.version_details ?? []) {
      const versionName = vd.version?.name;
      if (!versionName) continue;
      (byVersion[versionName] ??= new Set()).add(location);
    }
  }
  const frozen: Record<string, string[]> = {};
  for (const [version, locations] of Object.entries(byVersion)) {
    frozen[version] = [...locations];
  }
  encounterCache.set(speciesId, frozen);
  return frozen;
}

/* ------------------------------------------------------------------ */
/* Planning                                                            */
/* ------------------------------------------------------------------ */

interface LocationGroup {
  location: string;
  species: SpeciesIndex[];
}

interface PlanResult {
  gameLabel: string;
  missingTotal: number;
  /** Unique missing species with at least one wild location in this game. */
  placed: number;
  /** Checked species with no wild location in this game (gift/trade/transfer). */
  unobtainable: number;
  /** Species that couldn't be checked due to network errors. */
  errored: number;
  groups: LocationGroup[];
}

type PlanState =
  | { status: "idle" }
  | { status: "planning"; done: number; total: number }
  | { status: "error" }
  | { status: "no-data"; gameLabel: string }
  | { status: "ready"; result: PlanResult };

const CONCURRENCY = 8;

async function runPlan(
  versions: string[],
  missing: SpeciesIndex[],
  signal: AbortSignal,
  onProgress: (done: number) => void
): Promise<Omit<PlanResult, "gameLabel" | "missingTotal">> {
  const byLocation = new Map<string, SpeciesIndex[]>();
  const placedIds = new Set<number>();
  let unobtainable = 0;
  let errored = 0;
  const queue = [...missing];
  let done = 0;

  async function worker(): Promise<void> {
    while (queue.length > 0 && !signal.aborted) {
      const species = queue.shift();
      if (!species) break;
      try {
        const perVersion = await loadEncountersByVersion(species.id, signal);
        const locations = new Set<string>();
        for (const v of versions) {
          for (const loc of perVersion[v] ?? []) locations.add(loc);
        }
        if (signal.aborted) return;
        if (locations.size === 0) {
          unobtainable += 1;
        } else {
          placedIds.add(species.id);
          for (const loc of locations) {
            const list = byLocation.get(loc);
            if (list) list.push(species);
            else byLocation.set(loc, [species]);
          }
        }
      } catch {
        if (signal.aborted) return;
        errored += 1;
      }
      done += 1;
      onProgress(done);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker())
  );
  if (signal.aborted) throw new DOMException("aborted", "AbortError");

  const groups: LocationGroup[] = [...byLocation.entries()].map(
    ([location, species]) => ({
      location,
      species: species.sort((a, b) => a.id - b.id),
    })
  );
  // Richest hunting grounds first, then A–Z.
  groups.sort(
    (a, b) =>
      b.species.length - a.species.length ||
      a.location.localeCompare(b.location)
  );
  return { placed: placedIds.size, unobtainable, errored, groups };
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

function LocationRow({
  location,
  species,
  open,
  onToggle,
}: {
  location: string;
  species: SpeciesIndex[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
      >
        <span
          aria-hidden="true"
          className="shrink-0 text-sm font-bold text-slate-400 dark:text-slate-500"
        >
          {open ? "▾" : "▸"}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-slate-800 dark:text-slate-100">
          📍 {location}
        </span>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          {species.length} {species.length === 1 ? "Pokémon" : "Pokémon"}
        </span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          {species.map((s) => (
            <Link
              key={s.id}
              href={`/pokedex/${s.id}`}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 ring-1 ring-transparent transition hover:bg-emerald-100 hover:ring-emerald-300 dark:bg-slate-800 dark:hover:bg-emerald-900 dark:hover:ring-emerald-700"
            >
              <img
                src={s.sprites.regular}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
                loading="lazy"
              />
              <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-200">
                {s.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CatchPlanner({
  caught,
}: {
  caught: ReadonlyMap<number, unknown>;
}) {
  const { user } = useAuth();
  const [game, setGame] = useState<string>(POKEMON_GAMES[0]);
  const [plan, setPlan] = useState<PlanState>({ status: "idle" });
  const [openLocations, setOpenLocations] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);

  const missing = useMemo(
    () => getAllSpecies().filter((s) => !caught.has(s.id)),
    [caught]
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  const startPlan = useCallback(() => {
    abortRef.current?.abort();

    if (missing.length === 0) {
      // Nothing missing at all — celebrate without any network calls.
      setPlan({
        status: "ready",
        result: {
          gameLabel: game,
          missingTotal: 0,
          placed: 0,
          unobtainable: 0,
          errored: 0,
          groups: [],
        },
      });
      return;
    }

    const versions = GAME_VERSIONS[game] ?? [];
    if (
      versions.length > 0 &&
      versions.every((v) => VERSIONS_WITHOUT_ENCOUNTER_DATA.has(v))
    ) {
      setPlan({ status: "no-data", gameLabel: game });
      return;
    }

    // Achievement: planner opened for a game. Signed-in users only;
    // best-effort — a failure here must never break planning.
    if (user) {
      try {
        void unlockAchievement(user.id, "planner-first");
      } catch {
        /* guarded */
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setPlan({ status: "planning", done: 0, total: missing.length });
    setOpenLocations(new Set());

    void runPlan(versions, missing, controller.signal, (done) => {
      setPlan({ status: "planning", done, total: missing.length });
    }).then(
      (partial) => {
        persistCache();
        setPlan({
          status: "ready",
          result: {
            gameLabel: game,
            missingTotal: missing.length,
            ...partial,
          },
        });
      },
      (err: unknown) => {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          setPlan({ status: "idle" });
        } else {
          setPlan({ status: "error" });
        }
      }
    );
  }, [game, missing, user]);

  const cancelPlan = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const result = plan.status === "ready" ? plan.result : null;

  const toggleLocation = useCallback((location: string) => {
    setOpenLocations((prev) => {
      const next = new Set(prev);
      if (next.has(location)) next.delete(location);
      else next.add(location);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!result) return;
    setOpenLocations(new Set(result.groups.map((g) => g.location)));
  }, [result]);

  const collapseAll = useCallback(() => setOpenLocations(new Set()), []);

  return (
    <section aria-label="Catch planner" className="mt-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          🗺️ Catch Planner
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pick a game and we&apos;ll cross-reference your Living Dex, then group
          every Pokémon you&apos;re still missing by where to catch it in the
          wild.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="planner-game"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Game
            </label>
            <select
              id="planner-game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {POKEMON_GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          {plan.status === "planning" ? (
            <button
              type="button"
              onClick={cancelPlan}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={startPlan}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              Plan my catches
            </button>
          )}
        </div>

        {plan.status === "planning" && (
          <div className="mt-4" aria-live="polite">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                Checking wild encounters…
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {plan.done} / {plan.total}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
                style={{
                  width: `${
                    plan.total > 0 ? (plan.done / plan.total) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {plan.status === "error" && (
        <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-4xl" aria-hidden="true">
            📡
          </p>
          <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
            Couldn&apos;t reach the encounter data
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The lookup service didn&apos;t respond. Your collection is
            untouched — try planning again.
          </p>
        </div>
      )}

      {/* No encounter data for this game (e.g. Scarlet/Violet) */}
      {plan.status === "no-data" && (
        <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-4xl" aria-hidden="true">
            🗺️
          </p>
          <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
            No wild-encounter data for {plan.gameLabel} yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Our encounter source doesn&apos;t publish wild locations for this
            game, so there&apos;s nothing to plan with. Sword &amp; Shield,
            Legends: Arceus, and older games have full data — pick one of those
            instead.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4">
          {result.missingTotal === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <p className="text-5xl" aria-hidden="true">
                🎉
              </p>
              <p className="mt-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                Living Dex complete!
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                You&apos;ve caught all 1,025 Pokémon. Legendary work, trainer —
                no planning needed.
              </p>
            </div>
          ) : result.groups.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <p className="text-4xl" aria-hidden="true">
                🌿
              </p>
              <p className="mt-3 text-lg font-bold text-slate-800 dark:text-slate-100">
                Nothing left to catch in the wild in {result.gameLabel}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {result.unobtainable > 0 && (
                  <>
                    {result.unobtainable} of your missing Pokémon{" "}
                    {result.unobtainable === 1 ? "has" : "have"} no wild
                    location here — they&apos;re likely gifts, in-game trades,
                    or transfers from other games.{" "}
                  </>
                )}
                {result.errored > 0 && (
                  <>
                    ⚠️ {result.errored} Pokémon couldn&apos;t be checked due to
                    network hiccups — try planning again.
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    📍 {result.groups.length}{" "}
                    {result.groups.length === 1 ? "location" : "locations"} ·{" "}
                    {result.placed} Pokémon to catch
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {result.gameLabel}
                    {result.unobtainable > 0 &&
                      ` · ${result.unobtainable} missing ${
                        result.unobtainable === 1 ? "has" : "have"
                      } no wild location here`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50 dark:text-emerald-300 dark:ring-emerald-800 dark:hover:bg-emerald-900/40"
                  >
                    Expand all
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
                  >
                    Collapse
                  </button>
                </div>
              </div>

              {result.errored > 0 && (
                <p className="mt-3 text-center text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ {result.errored} Pokémon couldn&apos;t be checked due to
                  network hiccups — plan again to include them.
                </p>
              )}

              <div className="mt-4 space-y-3">
                {result.groups.map((group) => (
                  <LocationRow
                    key={group.location}
                    location={group.location}
                    species={group.species}
                    open={openLocations.has(group.location)}
                    onToggle={() => toggleLocation(group.location)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
