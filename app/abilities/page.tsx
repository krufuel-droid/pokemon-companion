"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface AbilitySummary {
  name: string;
  url: string;
}

interface AbilityDetail {
  name: string;
  effect: string;
  pokemon: { name: string; id: number; hidden: boolean }[];
}

function prettyName(name: string) {
  return name
    .split("-")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function AbilitiesPage() {
  const [abilities, setAbilities] = useState<AbilitySummary[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AbilityDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://pokeapi.co/api/v2/ability/?limit=400");
        const data = await res.json();
        if (!cancelled) setAbilities(data.results ?? []);
      } catch {
        // offline
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, "-");
    if (q.length < 2) return abilities.slice(0, 30);
    return abilities.filter((a) => a.name.includes(q)).slice(0, 50);
  }, [abilities, query]);

  async function selectAbility(url: string) {
    setLoading(true);
    setSelected(null);
    try {
      const res = await fetch(url);
      const data = await res.json();
      const effectEntry =
        data.effect_entries?.find((e: { language: { name: string } }) => e.language.name === "en");
      const pokemon = (data.pokemon ?? [])
        .map((p: { is_hidden: boolean; pokemon: { name: string; url: string } }) => {
          const match = p.pokemon.url.match(/\/pokemon\/(\d+)\/?$/);
          return {
            name: p.pokemon.name,
            id: match ? parseInt(match[1]) : 0,
            hidden: p.is_hidden,
          };
        })
        .filter((p: { id: number }) => p.id > 0 && p.id <= 1025)
        .sort((a: { id: number }, b: { id: number }) => a.id - b.id);
      setSelected({
        name: data.name,
        effect: effectEntry?.effect ?? effectEntry?.short_effect ?? "No description available.",
        pokemon,
      });
    } catch {
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Database
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Abilities
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Every ability, what it does, and which Pokémon have it.
      </p>

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search abilities… (try &quot;intimidate&quot;)"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
            {query.trim().length >= 2
              ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
              : `Showing ${filtered.length} of ${abilities.length}`}
          </p>
          <ul className="mt-2 max-h-[60vh] space-y-1 overflow-y-auto">
            {filtered.map((a) => (
              <li key={a.name}>
                <button
                  type="button"
                  onClick={() => void selectAbility(a.url)}
                  className={`w-full rounded-xl px-4 py-2.5 text-left font-medium transition ${
                    selected?.name === a.name
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  {prettyName(a.name)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          {loading && <p className="text-slate-400">Loading…</p>}
          {selected && !loading && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {prettyName(selected.name)}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {selected.effect}
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Pokémon with this ability ({selected.pokemon.length})
              </p>
              <div className="mt-2 grid max-h-[40vh] grid-cols-3 gap-2 overflow-y-auto">
                {selected.pokemon.map((p) => (
                  <Link
                    key={p.id}
                    href={`/pokedex/${p.id}`}
                    className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 transition hover:-translate-y-0.5 dark:bg-slate-800 dark:ring-slate-700"
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                      alt={p.name}
                      className="h-12 w-12 object-contain"
                      loading="lazy"
                    />
                    <span className="text-xs font-medium capitalize text-slate-700 dark:text-slate-200">
                      {p.name}
                    </span>
                    {p.hidden && (
                      <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-900 dark:text-violet-200">
                        Hidden
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!selected && !loading && (
            <p className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Tap an ability to see what it does and which Pokémon have it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
