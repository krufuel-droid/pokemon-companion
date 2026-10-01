"use client";

import { useEffect, useMemo, useState } from "react";

const VERSION_TITLES: Record<string, string> = {
  red: "Pokémon Red",
  blue: "Pokémon Blue",
  yellow: "Pokémon Yellow",
  green: "Pokémon Green",
  "green-japan": "Pokémon Green (Japan)",
  gold: "Pokémon Gold",
  silver: "Pokémon Silver",
  crystal: "Pokémon Crystal",
  ruby: "Pokémon Ruby",
  sapphire: "Pokémon Sapphire",
  emerald: "Pokémon Emerald",
  firered: "Pokémon FireRed",
  leafgreen: "Pokémon LeafGreen",
  diamond: "Pokémon Diamond",
  pearl: "Pokémon Pearl",
  platinum: "Pokémon Platinum",
  heartgold: "Pokémon HeartGold",
  soulsilver: "Pokémon SoulSilver",
  black: "Pokémon Black",
  white: "Pokémon White",
  "black-2": "Pokémon Black 2",
  "white-2": "Pokémon White 2",
  x: "Pokémon X",
  y: "Pokémon Y",
  "omega-ruby": "Pokémon Omega Ruby",
  "alpha-sapphire": "Pokémon Alpha Sapphire",
  sun: "Pokémon Sun",
  moon: "Pokémon Moon",
  "ultra-sun": "Pokémon Ultra Sun",
  "ultra-moon": "Pokémon Ultra Moon",
  "lets-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Eevee!",
  sword: "Pokémon Sword",
  shield: "Pokémon Shield",
  "brilliant-diamond": "Brilliant Diamond",
  "shining-pearl": "Shining Pearl",
  "legends-arceus": "Legends: Arceus",
  scarlet: "Pokémon Scarlet",
  violet: "Pokémon Violet",
};

const METHOD_LABELS: Record<string, string> = {
  walk: "Walking",
  surf: "Surfing",
  "old-rod": "Old Rod",
  "good-rod": "Good Rod",
  "super-rod": "Super Rod",
  "rock-smash": "Rock Smash",
  headbutt: "Headbutt",
  "headbutt-low": "Headbutt (low trees)",
  "headbutt-normal": "Headbutt",
  "headbutt-high": "Headbutt (high trees)",
  "dark-grass": "Dark grass",
  "grass-spots": "Tall grass",
  "cave-spots": "Cave",
  "bridge-spots": "Bridge shadow",
  "super-rod-spots": "Fishing spot",
  "surf-spots": "Surfing",
  gift: "Gift",
  "gift-egg": "Egg gift",
  "only-one": "One-time encounter",
};

interface EncounterRow {
  location: string;
  method: string;
  minLevel: number;
  maxLevel: number;
  chance: number | null;
}

interface GameEncounters {
  game: string;
  rows: EncounterRow[];
}

function cleanLocationArea(name: string): string {
  return name
    .replace(/-area$/, "")
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function methodLabel(name: string): string {
  return (
    METHOD_LABELS[name] ??
    name
      .split("-")
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ")
  );
}

function levelRange(min: number, max: number): string {
  return min === max ? `Lv. ${min}` : `Lv. ${min}–${max}`;
}

interface ApiEncounterDetail {
  min_level: number;
  max_level: number;
  chance: number;
  method: { name: string };
}

interface ApiVersionDetail {
  version: { name: string };
  encounter_details: ApiEncounterDetail[];
}

interface ApiLocationArea {
  location_area: { name: string };
  version_details: ApiVersionDetail[];
}

async function loadEncounters(
  speciesId: number,
  signal: AbortSignal
): Promise<GameEncounters[]> {
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${speciesId}/encounters`,
    { signal }
  );
  if (!res.ok) throw new Error(`PokéAPI responded ${res.status}`);
  const areas = (await res.json()) as ApiLocationArea[];

  const byVersion = new Map<string, EncounterRow[]>();
  for (const area of areas) {
    const location = cleanLocationArea(area.location_area.name);
    for (const vd of area.version_details) {
      const rows = byVersion.get(vd.version.name) ?? [];
      for (const d of vd.encounter_details) {
        rows.push({
          location,
          method: methodLabel(d.method.name),
          minLevel: d.min_level,
          maxLevel: d.max_level,
          chance: typeof d.chance === "number" ? d.chance : null,
        });
      }
      byVersion.set(vd.version.name, rows);
    }
  }

  return [...byVersion.entries()]
    .map(([version, rows]) => ({
      game: VERSION_TITLES[version] ?? version,
      rows,
    }))
    .sort((a, b) => a.game.localeCompare(b.game));
}

type Status =
  | { state: "loading" }
  | { state: "error" }
  | { state: "empty" }
  | { state: "ready"; games: GameEncounters[] };

interface LocationGroup {
  location: string;
  method: string;
  entries: EncounterRow[];
  minLevel: number;
  maxLevel: number;
}

function groupRows(rows: EncounterRow[]): LocationGroup[] {
  const byKey = new Map<string, LocationGroup>();
  for (const row of rows) {
    const key = `${row.location}|${row.method}`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        location: row.location,
        method: row.method,
        entries: [],
        minLevel: row.minLevel,
        maxLevel: row.maxLevel,
      };
      byKey.set(key, group);
    }
    group.entries.push(row);
    group.minLevel = Math.min(group.minLevel, row.minLevel);
    group.maxLevel = Math.max(group.maxLevel, row.maxLevel);
  }
  return [...byKey.values()].sort(
    (a, b) =>
      a.location.localeCompare(b.location) || a.method.localeCompare(b.method)
  );
}

/**
 * One collapsible location group, e.g. "Mt Moon 1f · Walking · Lv. 6–11".
 * Collapsed by default so long encounter lists don't overwhelm the page —
 * the + expander reveals the per-level/chance breakdown.
 */
function LocationGroupRow({ group }: { group: LocationGroup }) {
  const [open, setOpen] = useState(false);
  const single = group.entries.length === 1;

  const header = (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-medium text-slate-800">
        {group.location}
      </span>
      <span className="mt-0.5 block text-sm text-slate-500">
        {group.method} · {levelRange(group.minLevel, group.maxLevel)}
      </span>
    </span>
  );

  // A single encounter entry needs no expander — render it directly.
  if (single) {
    const entry = group.entries[0];
    return (
      <li className="flex flex-wrap items-baseline gap-x-3 px-4 py-2.5 text-sm">
        {header}
        {entry.chance !== null && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {entry.chance}% chance
          </span>
        )}
      </li>
    );
  }

  return (
    <li className="rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} encounters at ${
          group.location
        } (${group.method})`}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-100/60"
      >
        {header}
        <span className="shrink-0 text-xs font-medium text-slate-400">
          {group.entries.length} encounters
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-lg font-bold leading-none text-slate-400"
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <ul className="border-t border-slate-100 bg-white/60">
          {group.entries
            .slice()
            .sort((a, b) => a.minLevel - b.minLevel)
            .map((entry, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-3 py-2 pl-8 pr-4 text-sm"
              >
                <span className="text-slate-500">
                  {levelRange(entry.minLevel, entry.maxLevel)}
                </span>
                {entry.chance !== null && (
                  <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {entry.chance}% chance
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}
    </li>
  );
}

export function EncountersSection({ speciesId }: { speciesId: number }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    if (!open || status.state !== "loading") return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let cancelled = false;

    loadEncounters(speciesId, controller.signal).then(
      (games) => {
        if (cancelled) return;
        clearTimeout(timeout);
        setStatus(
          games.length === 0 ? { state: "empty" } : { state: "ready", games }
        );
      },
      () => {
        if (cancelled) return;
        clearTimeout(timeout);
        setStatus({ state: "error" });
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [speciesId, open, status]);

  return (
    <section
      aria-label="Where to find"
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <span>
          <span className="text-lg font-bold">
            Where to find
            {status.state === "ready" && (
              <span className="ml-2 text-sm font-medium text-slate-400">
                · {status.games.length}{" "}
                {status.games.length === 1 ? "game" : "games"}
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm font-normal text-slate-500">
            Wild encounter locations by game, via PokéAPI.
          </span>
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5 7l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          {status.state === "loading" && (
            <p className="mt-3 text-sm text-slate-500">
              Looking up encounter data…
            </p>
          )}

          {status.state === "error" && (
            <p className="mt-3 text-sm text-slate-500">
              Couldn&apos;t load encounter data right now — the rest of the page
              is unaffected.
            </p>
          )}

          {status.state === "empty" && (
            <p className="mt-3 text-sm text-slate-500">
              No wild encounter data recorded for this Pokémon.
            </p>
          )}

          {status.state === "ready" && (
            <GameList games={status.games} />
          )}
        </>
      )}
    </section>
  );
}

function GameList({ games }: { games: GameEncounters[] }) {
  return (
    <div className="mt-4 space-y-5">
      {games.map((g) => (
        <GameBlock key={g.game} game={g} />
      ))}
    </div>
  );
}

function GameBlock({ game }: { game: GameEncounters }) {
  const groups = useMemo(() => groupRows(game.rows), [game.rows]);
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-800">{game.game}</h3>
      <ul className="mt-2 divide-y divide-slate-100 rounded-xl bg-slate-50 ring-1 ring-slate-200">
        {groups.map((group) => (
          <LocationGroupRow
            key={`${group.location}|${group.method}`}
            group={group}
          />
        ))}
      </ul>
    </div>
  );
}
