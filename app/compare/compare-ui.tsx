"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSpeciesById,
  searchSpecies,
  type SpeciesFull,
} from "@/lib/pokedex";
import { TYPES, effectiveness } from "@/lib/typechart";
import { typeColor } from "@/lib/theme";
import { StatsRadar } from "@/app/pokedex/[id]/stats-radar";

const DEFAULT_A = 25; // Pikachu
const DEFAULT_B = 94; // Gengar

const STAT_ORDER = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
] as const;

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

const A_ACCENT = "#059669"; // emerald-700
const B_ACCENT = "#0284c7"; // sky-700

function parseId(raw: string | null, fallback: number): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isInteger(n) && getSpeciesById(n)) return n;
  return fallback;
}

function statValue(s: SpeciesFull, key: string): number {
  return s.baseStats.find((b) => b.key === key)?.value ?? 0;
}

function statTotal(s: SpeciesFull): number {
  return s.baseStats.reduce((sum, b) => sum + b.value, 0);
}

function multLabel(mult: number): string {
  if (mult === 4) return "×4";
  if (mult === 2) return "×2";
  if (mult === 0.5) return "×½";
  if (mult === 0.25) return "×¼";
  if (mult === 0) return "×0";
  return `×${mult}`;
}

function matchupGroups(types: string[]) {
  const rows = TYPES.map((type) => ({
    type,
    mult: effectiveness(type, types),
  })).filter((r) => r.mult !== 1);
  return {
    weak: rows
      .filter((r) => r.mult > 1)
      .sort((a, b) => b.mult - a.mult || a.type.localeCompare(b.type)),
    resist: rows
      .filter((r) => r.mult < 1 && r.mult > 0)
      .sort((a, b) => a.mult - b.mult || a.type.localeCompare(b.type)),
    immune: rows
      .filter((r) => r.mult === 0)
      .sort((a, b) => a.type.localeCompare(b.type)),
  };
}

/* ---------------------------------- picker --------------------------------- */

function PokemonPicker({
  value,
  onChange,
  label,
  accent,
}: {
  value: number;
  onChange: (id: number) => void;
  label: string;
  accent: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const species = getSpeciesById(value);
  const results = useMemo(() => searchSpecies(query), [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: accent }}
      >
        {label}
      </label>
      <div className="mt-1 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        {species && (
          <img
            src={species.sprites.regular}
            alt=""
            className="h-14 w-14 shrink-0"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-900">{species?.name}</p>
          <p className="text-xs text-slate-500">
            #{String(species?.id ?? 0).padStart(4, "0")}
          </p>
        </div>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Type a Pokémon name…"
        aria-label={`Search for ${label}`}
        className="mt-2 w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-400"
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          aria-label={`${label} results`}
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200"
        >
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={r.id === value}
                onClick={() => {
                  onChange(r.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-emerald-50"
              >
                <img
                  src={r.sprites.regular}
                  alt=""
                  className="h-8 w-8 shrink-0"
                  loading="lazy"
                />
                <span className="font-medium text-slate-800">{r.name}</span>
                <span className="ml-auto text-xs text-slate-400">
                  #{String(r.id).padStart(4, "0")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------- overview --------------------------------- */

function OverviewCard({
  species,
  accent,
  accentName,
}: {
  species: SpeciesFull;
  accent: string;
  accentName: string;
}) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start gap-4">
        <img
          src={species.artwork}
          alt={`${species.name} official artwork`}
          className="h-24 w-24 shrink-0"
          loading="lazy"
        />
        <div className="min-w-0">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: accent }}
          >
            {accentName}
          </p>
          <h2 className="truncate text-2xl font-extrabold text-slate-900">
            {species.name}
          </h2>
          <p className="text-sm text-slate-500">
            #{String(species.id).padStart(4, "0")}
            {species.genera ? ` · ${species.genera}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {species.types.map((t) => (
              <span
                key={t}
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: typeColor(t) }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Height</dt>
          <dd className="font-bold text-slate-800">{species.heightM} m</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">Weight</dt>
          <dd className="font-bold text-slate-800">{species.weightKg} kg</dd>
        </div>
      </dl>
      <Link
        href={`/pokedex/${species.id}`}
        className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline"
      >
        View Pokédex entry →
      </Link>
    </article>
  );
}

/* -------------------------------- stat bars -------------------------------- */

function StatBattleRow({
  label,
  aVal,
  bVal,
}: {
  label: string;
  aVal: number;
  bVal: number;
}) {
  const max = Math.max(aVal, bVal, 1);
  const aWins = aVal > bVal;
  const bWins = bVal > aVal;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
      <div className="flex items-center justify-end gap-2">
        <span
          className={`text-sm font-bold ${aWins ? "text-emerald-700" : "text-slate-600"}`}
        >
          {aVal}
        </span>
        <div className="flex h-2.5 w-full max-w-36 justify-end rounded-full bg-slate-100 sm:max-w-44">
          <div
            className="h-2.5 rounded-full"
            style={{
              width: `${(aVal / max) * 100}%`,
              backgroundColor: aWins ? A_ACCENT : "#cbd5e1",
            }}
          />
        </div>
      </div>
      <span className="w-16 text-center text-xs font-semibold text-slate-500 sm:w-20 sm:text-sm">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-full max-w-36 rounded-full bg-slate-100 sm:max-w-44">
          <div
            className="h-2.5 rounded-full"
            style={{
              width: `${(bVal / max) * 100}%`,
              backgroundColor: bWins ? B_ACCENT : "#cbd5e1",
            }}
          />
        </div>
        <span
          className={`text-sm font-bold ${bWins ? "text-sky-700" : "text-slate-600"}`}
        >
          {bVal}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------- matchups --------------------------------- */

function CompareMatchups({ species }: { species: SpeciesFull }) {
  const { weak, resist, immune } = useMemo(
    () => matchupGroups(species.types),
    [species]
  );
  const groups = [
    { title: "Weak to", items: weak, empty: "No weaknesses" },
    { title: "Resists", items: resist, empty: "No resistances" },
    { title: "Immune to", items: immune, empty: "No immunities" },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {g.title}
          </h3>
          {g.items.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">{g.empty}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.items.map(({ type, mult }) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: typeColor(type) }}
                  title={`${type} ${multLabel(mult)}`}
                >
                  {type}
                  <span className="opacity-90">{multLabel(mult)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- page ----------------------------------- */

export function CompareUI() {
  const router = useRouter();
  const params = useSearchParams();

  const [a, setA] = useState(() => parseId(params.get("a"), DEFAULT_A));
  const [b, setB] = useState(() => parseId(params.get("b"), DEFAULT_B));

  // Keep the URL in sync so comparisons are shareable (?a=25&b=94).
  useEffect(() => {
    if (params.get("a") !== String(a) || params.get("b") !== String(b)) {
      router.replace(`/compare?a=${a}&b=${b}`, { scroll: false });
    }
  }, [a, b, params, router]);

  const speciesA = getSpeciesById(a);
  const speciesB = getSpeciesById(b);

  if (!speciesA || !speciesB) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm text-slate-500">
            Couldn&apos;t load those Pokémon. Try picking again below.
          </p>
        </div>
      </main>
    );
  }

  const totalA = statTotal(speciesA);
  const totalB = statTotal(speciesB);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Compare Pokémon
        </h1>
        <p className="mt-2 text-slate-600">
          Pick any two Pokémon and see how they stack up — stats, types, and
          matchups, side by side. The URL updates as you pick, so you can share
          any comparison.
        </p>

        {/* pickers */}
        <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <PokemonPicker
            value={a}
            onChange={setA}
            label="Pokémon A"
            accent={A_ACCENT}
          />
          <button
            type="button"
            onClick={() => {
              setA(b);
              setB(a);
            }}
            aria-label="Swap Pokémon"
            title="Swap"
            className="mx-auto mt-6 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-emerald-50 sm:mt-8"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-600"
              aria-hidden="true"
            >
              <path d="M7 4 3 8l4 4M3 8h11M13 12l4 4-4 4M17 16H6" />
            </svg>
          </button>
          <PokemonPicker
            value={b}
            onChange={setB}
            label="Pokémon B"
            accent={B_ACCENT}
          />
        </div>

        {/* overview cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <OverviewCard
            species={speciesA}
            accent={A_ACCENT}
            accentName="Pokémon A"
          />
          <OverviewCard
            species={speciesB}
            accent={B_ACCENT}
            accentName="Pokémon B"
          />
        </div>

        {/* radar charts */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <p
              className="mb-1 text-sm font-bold"
              style={{ color: A_ACCENT }}
            >
              {speciesA.name}
            </p>
            <StatsRadar stats={speciesA.baseStats} />
          </div>
          <div>
            <p className="mb-1 text-sm font-bold" style={{ color: B_ACCENT }}>
              {speciesB.name}
            </p>
            <StatsRadar stats={speciesB.baseStats} />
          </div>
        </div>

        {/* stat-by-stat battle */}
        <section
          aria-label="Stat-by-stat comparison"
          className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        >
          <h2 className="text-lg font-bold">Stat battle</h2>
          <p className="mt-1 text-sm text-slate-500">
            The higher stat in each row is highlighted.
          </p>
          <div className="mt-4 space-y-3">
            {STAT_ORDER.map((key) => (
              <StatBattleRow
                key={key}
                label={STAT_LABELS[key]}
                aVal={statValue(speciesA, key)}
                bVal={statValue(speciesB, key)}
              />
            ))}
            <div className="border-t border-slate-100 pt-3">
              <StatBattleRow
                label="Total"
                aVal={totalA}
                bVal={totalB}
              />
            </div>
          </div>
        </section>

        {/* matchups */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section
            aria-label={`${speciesA.name} type matchups`}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-bold">
              <span style={{ color: A_ACCENT }}>{speciesA.name}</span> matchups
            </h2>
            <div className="mt-4">
              <CompareMatchups species={speciesA} />
            </div>
          </section>
          <section
            aria-label={`${speciesB.name} type matchups`}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <h2 className="text-lg font-bold">
              <span style={{ color: B_ACCENT }}>{speciesB.name}</span> matchups
            </h2>
            <div className="mt-4">
              <CompareMatchups species={speciesB} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
