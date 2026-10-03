"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { TYPES, effectiveness } from "@/lib/typechart";
import { TYPE_COLORS } from "@/lib/theme";

export default function TeamWeaknessPage() {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<SpeciesIndex[]>([]);

  const results = useMemo(() => (query.trim() ? searchSpecies(query.trim()).slice(0, 8) : []), [query]);

  const analysis = useMemo(() => {
    return TYPES.map((atk) => {
      const weak = team.filter((p) => effectiveness(atk, p.types) > 1);
      const immune = team.filter((p) => effectiveness(atk, p.types) === 0);
      const resists = team.filter((p) => { const m = effectiveness(atk, p.types); return m < 1 && m > 0; });
      return { atk, weak, immune, resists };
    });
  }, [team]);

  const dangers = analysis.filter((a) => a.weak.length >= 2).sort((a, b) => b.weak.length - a.weak.length);
  const coverage = useMemo(() => {
    const covered = new Set<string>();
    for (const p of team) {
      for (const stab of p.types) {
        for (const def of TYPES) {
          // rough: does this STAB type hit the defending type super-effectively?
          // uses single-type effectiveness as approximation
          if (effectiveness(stab, [def]) > 1) covered.add(def);
        }
      }
    }
    return TYPES.map((t) => ({ type: t, covered: covered.has(t) }));
  }, [team]);

  const addPokemon = (p: SpeciesIndex) => {
    if (team.length >= 6 || team.some((m) => m.id === p.id)) return;
    setTeam([...team, p]);
    setQuery("");
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Team Weakness Analyzer</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Add up to 6 Pokémon and see where your team is exposed — before your opponent does.
      </p>

      <div className="relative mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a Pokémon to add…"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addPokemon(p)}
                disabled={team.some((m) => m.id === p.id)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 disabled:opacity-40 dark:hover:bg-slate-800"
              >
                {p.sprites.regular && <img src={p.sprites.regular} alt={p.name} className="h-10 w-10" />}
                <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                <span className="ml-auto flex gap-1">
                  {p.types.map((t) => (
                    <span key={t} className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[t] ?? "#A8A77A" }}>
                      {t}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {team.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {team.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
              {p.sprites.regular && <img src={p.sprites.regular} alt={p.name} className="h-8 w-8" />}
              <Link href={`/pokedex/${p.slug}`} className="text-sm font-semibold text-slate-700 hover:text-emerald-600 dark:text-slate-200">
                {p.name}
              </Link>
              <button onClick={() => setTeam(team.filter((m) => m.id !== p.id))} className="text-slate-400 hover:text-rose-500" aria-label={`Remove ${p.name}`}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {team.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="text-4xl">🛡️</div>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Add some Pokémon to analyze your team's defensive profile.</p>
        </div>
      ) : (
        <>
          {dangers.length > 0 ? (
            <div className="mt-6 rounded-2xl bg-rose-50 p-6 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:ring-rose-900">
              <h2 className="text-lg font-bold text-rose-700 dark:text-rose-300">⚠️ Danger zone</h2>
              <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">These attack types threaten 2+ of your team:</p>
              <div className="mt-3 space-y-2">
                {dangers.map(({ atk, weak }) => (
                  <div key={atk} className="flex items-center gap-3">
                    <span className="w-24 rounded-full px-3 py-1 text-center text-xs font-bold text-white" style={{ backgroundColor: TYPE_COLORS[atk] }}>
                      {atk}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {weak.length}/6 weak — {weak.map((p) => p.name).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:ring-emerald-900">
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">✅ No attack type threatens 2+ of your team. Nicely balanced!</p>
            </div>
          )}

          <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200">Full defensive profile</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {analysis.map(({ atk, weak, immune, resists }) => (
              <div key={atk} className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                <span className="w-20 shrink-0 rounded-full px-2 py-1 text-center text-xs font-bold text-white" style={{ backgroundColor: TYPE_COLORS[atk] }}>
                  {atk}
                </span>
                <div className="text-xs">
                  {weak.length > 0 && <div className="text-rose-600 dark:text-rose-400">Weak: {weak.map((p) => p.name).join(", ")}</div>}
                  {resists.length > 0 && <div className="text-slate-500 dark:text-slate-400">Resists: {resists.map((p) => p.name).join(", ")}</div>}
                  {immune.length > 0 && <div className="text-slate-500 dark:text-slate-400">Immune: {immune.map((p) => p.name).join(", ")}</div>}
                  {weak.length === 0 && resists.length === 0 && immune.length === 0 && (
                    <div className="text-slate-400">All neutral</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200">Offensive coverage</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Types your team's STAB moves hit super-effectively:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {coverage.map(({ type, covered }) => (
              <span
                key={type}
                className={`rounded-full px-3 py-1.5 text-xs font-bold text-white ${covered ? "" : "opacity-25 grayscale"}`}
                style={{ backgroundColor: TYPE_COLORS[type] }}
                title={covered ? "Covered" : "Not covered"}
              >
                {type}
              </span>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
