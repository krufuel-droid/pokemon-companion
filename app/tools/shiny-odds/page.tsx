"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchSpecies } from "@/lib/pokedex";

const SHINY_METHODS = [
  { label: "Base odds (Gen 6+)", odds: 4096 },
  { label: "Base odds (Gen 2–5)", odds: 8192 },
  { label: "Shiny Charm (Gen 6+)", odds: 1365 },
  { label: "Masuda Method", odds: 683 },
  { label: "Masuda + Shiny Charm", odds: 512 },
  { label: "Outbreak 60+ KO (S/V)", odds: 2048 },
  { label: "Outbreak 60+ KO + Charm (S/V)", odds: 1024 },
  { label: "Outbreak + Sparkling sandwich (S/V)", odds: 1024 },
  { label: "Outbreak + Sandwich + Charm (S/V)", odds: 512 },
  { label: "SOS chain 30+ (S/M)", odds: 1024 },
  { label: "SOS chain 70+ + Charm (US/UM)", odds: 273 },
  { label: "Chain fishing 20+ (X/Y)", odds: 100 },
  { label: "Dynamax Adventures (legendary)", odds: 100 },
  { label: "Ultra Wormhole far (US/UM)", odds: 25 },
];

interface EncounterOption {
  game: string;
  location: string;
  method: string;
  chance: number;
}

const VERSION_TITLES: Record<string, string> = {
  scarlet: "Scarlet", violet: "Violet",
  sword: "Sword", shield: "Shield",
  "legends-arceus": "Legends: Arceus",
  "brilliant-diamond": "Brilliant Diamond", "shining-pearl": "Shining Pearl",
  sun: "Sun", moon: "Moon", "ultra-sun": "Ultra Sun", "ultra-moon": "Ultra Moon",
  "omega-ruby": "Omega Ruby", "alpha-sapphire": "Alpha Sapphire",
  x: "X", y: "Y",
  "black-2": "Black 2", "white-2": "White 2", black: "Black", white: "White",
  heartgold: "HeartGold", soulsilver: "SoulSilver",
  platinum: "Platinum", diamond: "Diamond", pearl: "Pearl",
  emerald: "Emerald", ruby: "Ruby", sapphire: "Sapphire",
  firered: "FireRed", leafgreen: "LeafGreen",
  crystal: "Crystal", gold: "Gold", silver: "Silver",
  yellow: "Yellow", red: "Red", blue: "Blue",
};

export default function ShinyOddsCalculator() {
  const [pokeQuery, setPokeQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [encounters, setEncounters] = useState<EncounterOption[]>([]);
  const [gameFilter, setGameFilter] = useState<string>("all");
  const [encounterIdx, setEncounterIdx] = useState(0);
  const [loadingEncounters, setLoadingEncounters] = useState(false);

  const [spawnRate, setSpawnRate] = useState("20");
  const [methodIdx, setMethodIdx] = useState(0);
  const [huntEncounters, setHuntEncounters] = useState("500");

  const suggestions = useMemo(() => {
    const q = pokeQuery.trim().toLowerCase();
    if (q.length < 2 || selectedId) return [];
    return searchSpecies(q).slice(0, 6);
  }, [pokeQuery, selectedId]);

  async function selectPokemon(id: number, name: string) {
    setSelectedId(id);
    setSelectedName(name);
    setPokeQuery("");
    setLoadingEncounters(true);
    setEncounters([]);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`);
      if (!res.ok) throw new Error("no data");
      const areas = await res.json();
      const opts: EncounterOption[] = [];
      for (const area of areas) {
        const location = area.location_area.name
          .replace(/-area$/, "")
          .split("-")
          .map((w: string) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
          .join(" ");
        for (const vd of area.version_details) {
          const game = VERSION_TITLES[vd.version.name] ?? vd.version.name;
          for (const d of vd.encounter_details) {
            if (typeof d.chance === "number") {
              opts.push({
                game,
                location,
                method: d.method.name.split("-").map((w: string) => w[0].toUpperCase() + w.slice(1)).join(" "),
                chance: d.chance,
              });
            }
          }
        }
      }
      // Prefer newest games first
      const gameOrder = ["Scarlet", "Violet", "Legends: Arceus", "Sword", "Shield"];
      opts.sort((a, b) => {
        const ai = gameOrder.indexOf(a.game);
        const bi = gameOrder.indexOf(b.game);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || b.chance - a.chance;
      });
      setEncounters(opts);
      setGameFilter("all");
      setEncounterIdx(0);
      if (opts.length > 0) setSpawnRate(String(opts[0].chance));
    } catch {
      // no encounter data; user can type manually
    } finally {
      setLoadingEncounters(false);
    }
  }

  function clearPokemon() {
    setSelectedId(null);
    setSelectedName("");
    setEncounters([]);
    setGameFilter("all");
  }

  const availableGames = useMemo(() => {
    const games: string[] = [];
    for (const o of encounters) {
      if (!games.includes(o.game)) games.push(o.game);
    }
    return games;
  }, [encounters]);

  const filteredEncounters = useMemo(
    () =>
      gameFilter === "all"
        ? encounters
        : encounters.filter((o) => o.game === gameFilter),
    [encounters, gameFilter]
  );

  const calc = useMemo(() => {
    const spawn = Math.min(100, Math.max(0.01, parseFloat(spawnRate) || 0)) / 100;
    const shinyOdds = SHINY_METHODS[methodIdx].odds;
    const perEncounter = spawn * (1 / shinyOdds);
    const oneIn = perEncounter > 0 ? Math.round(1 / perEncounter) : 0;
    const n = Math.max(1, parseInt(huntEncounters) || 1);
    const cumulative = 1 - Math.pow(1 - perEncounter, n);
    const expected = perEncounter > 0 ? Math.round(1 / perEncounter) : 0;
    return { spawn, shinyOdds, perEncounter, oneIn, cumulative, expected, n };
  }, [spawnRate, methodIdx, huntEncounters]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/tools"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All tools
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Calculator
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Shiny Odds Calculator
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Look up a Pokémon&apos;s real spawn rate, combine it with your hunting
        method, and get the true odds per encounter.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        {/* Pokémon lookup */}
        <div>
          <label htmlFor="poke" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Pokémon (optional — look up real spawn rates)
          </label>
          {selectedId ? (
            <div className="mt-1 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-100">
                #{selectedId} {selectedName}
              </span>
              <button
                type="button"
                onClick={clearPokemon}
                className="text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                id="poke"
                type="search"
                value={pokeQuery}
                onChange={(e) => setPokeQuery(e.target.value)}
                placeholder="Search Pokémon…"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => void selectPokemon(s.id, s.name)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        <img src={s.sprites.regular} alt="" className="h-8 w-8 object-contain" />
                        <span className="text-sm text-slate-500 dark:text-slate-400">#{s.id}</span>
                        <span className="text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
                          {s.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {loadingEncounters && (
            <p className="mt-2 text-sm text-slate-400">Loading spawn rates…</p>
          )}

          {!loadingEncounters && selectedId && encounters.length === 0 && (
            <p className="mt-2 text-sm text-slate-400">
              No wild encounter data for this Pokémon — type the spawn rate manually below.
            </p>
          )}

          {encounters.length > 0 && (
            <div className="mt-2 space-y-2">
              <div>
                <label htmlFor="gamefilter" className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Game ({availableGames.length})
                </label>
                <select
                  id="gamefilter"
                  value={gameFilter}
                  onChange={(e) => {
                    setGameFilter(e.target.value);
                    setEncounterIdx(0);
                    const filtered = e.target.value === "all"
                      ? encounters
                      : encounters.filter((o) => o.game === e.target.value);
                    if (filtered.length > 0) setSpawnRate(String(filtered[0].chance));
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="all">All games ({encounters.length} spots)</option>
                  {availableGames.map((g) => {
                    const count = encounters.filter((o) => o.game === g).length;
                    return (
                      <option key={g} value={g}>
                        {g} ({count} {count === 1 ? "spot" : "spots"})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label htmlFor="encounter" className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Where are you hunting? ({filteredEncounters.length})
                </label>
                <select
                  id="encounter"
                  value={encounterIdx}
                  onChange={(e) => {
                    const i = parseInt(e.target.value);
                    setEncounterIdx(i);
                    setSpawnRate(String(filteredEncounters[i].chance));
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {filteredEncounters.map((o, i) => (
                    <option key={i} value={i}>
                      {gameFilter === "all" ? `${o.game} — ` : ""}{o.location} ({o.method}, {o.chance}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="spawn" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Spawn rate (% of encounters)
          </label>
          <input
            id="spawn"
            type="number"
            min="0.01"
            max="100"
            step="any"
            value={spawnRate}
            onChange={(e) => setSpawnRate(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Shiny hunting method
          </label>
          <select
            id="method"
            value={methodIdx}
            onChange={(e) => setMethodIdx(parseInt(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {SHINY_METHODS.map((m, i) => (
              <option key={m.label} value={i}>
                {m.label} (1/{m.odds})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl bg-emerald-50 p-5 dark:bg-emerald-950">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Odds per encounter
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
            1 in {calc.oneIn.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            That&apos;s a {(calc.spawn * 100).toFixed(1)}% spawn rate × 1/{calc.shinyOdds} shiny odds.
            On average you&apos;d need ~{calc.expected.toLocaleString()} encounters.
          </p>
        </div>

        <div>
          <label htmlFor="enc" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            After how many encounters?
          </label>
          <input
            id="enc"
            type="number"
            min="1"
            value={huntEncounters}
            onChange={(e) => setHuntEncounters(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="mt-3">
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
                style={{ width: `${Math.min(100, calc.cumulative * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {(calc.cumulative * 100).toFixed(1)}%
              </span>{" "}
              chance of finding at least one shiny in {calc.n.toLocaleString()} encounters.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/shiny-hunts" className="font-semibold text-emerald-600 underline underline-offset-2 dark:text-emerald-400">
          Track your hunts →
        </Link>
      </p>
    </div>
  );
}

