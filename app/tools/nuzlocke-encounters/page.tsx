"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API = "https://pokeapi.co/api/v2";

/** Game → PokéAPI regions + version names for encounter filtering. */
const GAME_MAP: Record<string, { regions: string[]; versions: string[]; note?: string }> = {
  "Pokémon Red, Blue & Yellow": { regions: ["kanto"], versions: ["red", "blue", "yellow"] },
  "Pokémon FireRed & LeafGreen": { regions: ["kanto"], versions: ["firered", "leafgreen"] },
  "Pokémon Let's Go, Pikachu! & Let's Go, Eevee!": { regions: ["kanto"], versions: ["lets-go-pikachu", "lets-go-eevee"] },
  "Pokémon Gold, Silver & Crystal": { regions: ["johto", "kanto"], versions: ["gold", "silver", "crystal"] },
  "Pokémon HeartGold & SoulSilver": { regions: ["johto", "kanto"], versions: ["heartgold", "soulsilver"] },
  "Pokémon Ruby, Sapphire & Emerald": { regions: ["hoenn"], versions: ["ruby", "sapphire", "emerald"] },
  "Pokémon Omega Ruby & Alpha Sapphire": { regions: ["hoenn"], versions: ["omega-ruby", "alpha-sapphire"] },
  "Pokémon Diamond & Pearl": { regions: ["sinnoh"], versions: ["diamond", "pearl"] },
  "Pokémon Platinum": { regions: ["sinnoh"], versions: ["platinum"] },
  "Pokémon Brilliant Diamond & Shining Pearl": { regions: ["sinnoh"], versions: ["brilliant-diamond", "shining-pearl"] },
  "Pokémon Black & White": { regions: ["unova"], versions: ["black", "white"] },
  "Pokémon Black 2 & White 2": { regions: ["unova"], versions: ["black-2", "white-2"] },
  "Pokémon X & Y": { regions: ["kalos"], versions: ["x", "y"] },
  "Pokémon Sun & Moon": { regions: ["alola"], versions: ["sun", "moon"] },
  "Pokémon Ultra Sun & Ultra Moon": { regions: ["alola"], versions: ["ultra-sun", "ultra-moon"] },
  "Pokémon Sword & Shield": { regions: ["galar", "isle-of-armor", "crown-tundra"], versions: ["sword", "shield"] },
  "Pokémon Legends: Arceus": { regions: ["hisui"], versions: ["legends-arceus"] },
  "Pokémon Scarlet & Violet": { regions: ["paldea"], versions: ["scarlet", "violet"], note: "PokéAPI has no encounter data for Paldea yet — this game isn't supported here." },
  "Pokémon Legends: Z-A": { regions: [], versions: [], note: "No encounter data available for this game yet." },
};

const GAMES = Object.keys(GAME_MAP);

const METHOD_LABEL: Record<string, string> = {
  walk: "🌿 Grass",
  surf: "🌊 Surf",
  "old-rod": "🎣 Fishing",
  "good-rod": "🎣 Fishing",
  "super-rod": "🎣 Fishing",
  "rock-smash": "🪨 Rock Smash",
  headbutt: "🌳 Headbutt",
  "headbutt-low": "🌳 Headbutt",
  "headbutt-normal": "🌳 Headbutt",
  "headbutt-high": "🌳 Headbutt",
  "dark-grass": "🌿 Dark grass",
  "rustling-grass": "🌿 Rustling grass",
  "bridge-shadows": "🌉 Bridge shadow",
  "cave-spots": "🕳️ Cave spot",
  "super-rod-spots": "🎣 Fishing spot",
  "surf-spots": "🌊 Surf spot",
  "yellow-flowers": "🌼 Flowers",
  "purple-flowers": "🌼 Flowers",
  "red-flowers": "🌼 Flowers",
  "rough-terrain": "⛰️ Rough terrain",
  gift: "🎁 Gift",
  "gift-egg": "🥚 Egg",
};

const CONDITION_LABEL: Record<string, string> = {
  "time-morning": "🌅 Morning",
  "time-day": "☀️ Day",
  "time-night": "🌙 Night",
  "season-spring": "🌸 Spring",
  "season-summer": "☀️ Summer",
  "season-autumn": "🍂 Autumn",
  "season-winter": "❄️ Winter",
  "slot1": "🥇 Slot 1",
  "slot2": "🥈 Slot 2",
  "radio-hoenn": "📻 Hoenn radio",
  "radio-sinnoh": "📻 Sinnoh radio",
  "swarm-yes": "🦟 Swarm",
  "swarm-no": "🚫 No swarm",
};

interface PokeApiNamed { name: string; url: string }
interface EncounterDetail {
  min_level: number;
  max_level: number;
  chance: number;
  method: PokeApiNamed;
  condition_values: PokeApiNamed[];
}
interface VersionDetail {
  version: PokeApiNamed;
  max_chance: number;
  encounter_details: EncounterDetail[];
}
interface PokeEncounter {
  pokemon: PokeApiNamed;
  version_details: VersionDetail[];
}

interface AreaEncounters {
  areaName: string;
  encounters: {
    id: number;
    name: string;
    minLevel: number;
    maxLevel: number;
    chance: number;
    method: string;
    conditions: string[];
  }[];
}

function prettyName(s: string): string {
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function prettyArea(areaName: string, locationName: string): string {
  const loc = prettyName(locationName);
  const rest = areaName.startsWith(locationName + "-")
    ? areaName.slice(locationName.length + 1)
    : areaName;
  if (!rest || rest === locationName) return loc;
  return `${loc} — ${prettyName(rest)}`;
}

function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? parseInt(m[1], 10) : 0;
}

const SPRITE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export default function NuzlockeEncountersPage() {
  const [game, setGame] = useState(GAMES[0]);
  const [locations, setLocations] = useState<{ region: string; name: string }[]>([]);
  const [location, setLocation] = useState("");
  const [areas, setAreas] = useState<AreaEncounters[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [error, setError] = useState("");

  const cfg = GAME_MAP[game];

  // Load locations for the game's regions.
  useEffect(() => {
    setLocations([]);
    setLocation("");
    setAreas([]);
    setError("");
    if (cfg.regions.length === 0) return;
    let cancelled = false;
    setLoadingLocs(true);
    (async () => {
      try {
        const all: { region: string; name: string }[] = [];
        for (const region of cfg.regions) {
          const res = await fetch(`${API}/region/${region}`);
          if (!res.ok) throw new Error(`region ${region}`);
          const data = await res.json();
          for (const loc of data.locations as PokeApiNamed[]) {
            all.push({ region, name: loc.name });
          }
        }
        all.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) {
          setLocations(all);
          const first = all.find((l) => l.name.includes("route-1") || l.name.includes("route-29") || l.name.includes("route-101") || l.name.includes("route-201")) ?? all[0];
          setLocation(first?.name ?? "");
        }
      } catch {
        if (!cancelled) setError("Couldn't load locations from PokéAPI. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoadingLocs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load encounter areas for the selected location.
  useEffect(() => {
    setAreas([]);
    if (!location) return;
    let cancelled = false;
    setLoadingAreas(true);
    (async () => {
      try {
        const locRes = await fetch(`${API}/location/${location}`);
        if (!locRes.ok) throw new Error("location");
        const locData = await locRes.json();
        const areaList = (locData.areas as PokeApiNamed[]).filter((a) => !a.name.includes("mansion"));
        const results: AreaEncounters[] = [];
        for (const area of areaList) {
          const aRes = await fetch(area.url);
          if (!aRes.ok) continue;
          const aData = await aRes.json();
          const encounters: AreaEncounters["encounters"] = [];
          for (const enc of aData.pokemon_encounters as PokeEncounter[]) {
            const vd = enc.version_details.find((v) => cfg.versions.includes(v.version.name));
            if (!vd || vd.encounter_details.length === 0) continue;
            // Merge details across matching version entries (e.g. red + blue).
            const merged = new Map<string, { min: number; max: number; chance: number; conditions: Set<string> }>();
            for (const v of enc.version_details) {
              if (!cfg.versions.includes(v.version.name)) continue;
              for (const d of v.encounter_details) {
                const key = d.method.name;
                const cur = merged.get(key) ?? { min: 999, max: 0, chance: 0, conditions: new Set<string>() };
                cur.min = Math.min(cur.min, d.min_level);
                cur.max = Math.max(cur.max, d.max_level);
                cur.chance = Math.max(cur.chance, d.chance);
                d.condition_values.forEach((c) => cur.conditions.add(c.name));
                merged.set(key, cur);
              }
            }
            for (const [method, m] of merged) {
              encounters.push({
                id: idFromUrl(enc.pokemon.url),
                name: enc.pokemon.name,
                minLevel: m.min === 999 ? 0 : m.min,
                maxLevel: m.max,
                chance: m.chance,
                method,
                conditions: [...m.conditions],
              });
            }
          }
          encounters.sort((a, b) => b.chance - a.chance);
          if (encounters.length > 0) {
            results.push({ areaName: prettyArea(area.name, location), encounters });
          }
        }
        if (!cancelled) setAreas(results);
      } catch {
        if (!cancelled) setError("Couldn't load encounters from PokéAPI. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoadingAreas(false);
      }
    })();
    return () => { cancelled = true; };
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const g = new Map<string, { region: string; name: string }[]>();
    for (const l of locations) {
      if (!g.has(l.region)) g.set(l.region, []);
      g.get(l.region)!.push(l);
    }
    return [...g.entries()];
  }, [locations]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        🎲 Nuzlocke Encounters
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Planning a Nuzlocke? The first rule is <em>first encounter per area</em> — so here's
        what that first encounter could be. Pick your game and location to see every wild
        Pokémon, their levels, rates, and conditions, straight from encounter data.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Game</span>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
          >
            {GAMES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loadingLocs || locations.length === 0}
            className="w-full rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-slate-200 disabled:opacity-50 dark:bg-slate-900 dark:ring-slate-700"
          >
            {grouped.map(([region, locs]) => (
              <optgroup key={region} label={prettyName(region)}>
                {locs.map((l) => (
                  <option key={l.name} value={l.name}>{prettyName(l.name)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {cfg.note && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800">
          ⚠️ {cfg.note}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-800">
          {error}
        </p>
      )}
      {loadingLocs && <p className="mt-4 text-sm text-slate-500">Loading locations…</p>}
      {loadingAreas && <p className="mt-4 text-sm text-slate-500">Loading encounters…</p>}

      {!loadingAreas && areas.length === 0 && location && !error && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No wild encounters here in {game} — try another location.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {areas.map((area) => (
          <section key={area.areaName} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {area.areaName}
            </h2>
            <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
              {area.encounters.map((e, i) => (
                <li key={`${e.id}-${e.method}-${i}`} className="flex items-center gap-3 py-2">
                  <Link href={`/pokedex/${e.id}`} title={prettyName(e.name)} className="shrink-0 rounded-lg transition hover:ring-2 hover:ring-emerald-400">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={SPRITE(e.id)} alt={prettyName(e.name)} width={48} height={48} loading="lazy" className="h-12 w-12 object-contain" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <Link href={`/pokedex/${e.id}`} className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                        {prettyName(e.name)}
                      </Link>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Lv. {e.minLevel}{e.maxLevel !== e.minLevel ? `–${e.maxLevel}` : ""}
                      </span>
                      <span className="text-xs text-slate-400">{e.chance}%</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {METHOD_LABEL[e.method] ?? prettyName(e.method)}
                      </span>
                      {e.conditions.map((c) => (
                        <span key={c} className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                          {CONDITION_LABEL[c] ?? prettyName(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-5 text-slate-400 dark:text-slate-500">
        Encounter data via PokéAPI. Rates are per-method encounter slots — your actual first
        encounter is one roll of these dice. Dupes clause? That's between you and your rules.
      </p>
    </main>
  );
}
