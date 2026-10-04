"use client";

import { useMemo, useState } from "react";
import { baseOf, clamp, combatantStats, resolveSpecies } from "@/lib/damage-calc";
import { META_PICKS } from "@/lib/data/champions";
import { NATURES } from "@/lib/data/natures";
import { SpeciesPicker } from "../_components/species-picker";
import type { SpeciesIndex } from "@/lib/pokedex";
import { inputCls, labelCls, sectionCls } from "../damage-calc/shared";

interface TierEntry {
  key: string;
  species: SpeciesIndex;
  nature: string;
  evs: number;
  ivs: number;
  scarf: boolean;
  tailwind: boolean;
  paralyzed: boolean;
  speedAbility: boolean; // Swift Swim / Chlorophyll / Surge Surfer ×2
}

/** Sensible +Spe default: Timid for special attackers, Jolly otherwise. */
function defaultNature(s: SpeciesIndex): string {
  return baseOf(s, "spa") > baseOf(s, "atk") ? "Timid" : "Jolly";
}

function makeEntry(species: SpeciesIndex, key: string): TierEntry {
  return {
    key,
    species,
    nature: defaultNature(species),
    evs: 252,
    ivs: 31,
    scarf: false,
    tailwind: false,
    paralyzed: false,
    speedAbility: false,
  };
}

function initialEntries(): TierEntry[] {
  const out: TierEntry[] = [];
  META_PICKS.forEach((p, i) => {
    try {
      const s = resolveSpecies(p.speciesName ?? p.name);
      if (s) out.push(makeEntry(s, `meta-${i}-${s.id}`));
    } catch {
      // skip unresolvable names
    }
  });
  return out;
}

/** Final Speed after item/ability/field modifiers, floored at each step. */
function finalSpeed(e: TierEntry, level: number): number {
  const st = combatantStats(
    e.species,
    level,
    e.nature,
    { spe: clamp(e.evs, 0, 252) },
    { spe: clamp(e.ivs, 0, 31) },
  );
  let s = st.spe;
  if (e.scarf) s = Math.floor(s * 1.5);
  if (e.speedAbility) s = Math.floor(s * 2);
  if (e.tailwind) s = Math.floor(s * 2);
  if (e.paralyzed) s = Math.floor(s * 0.5);
  return Math.max(1, s);
}

let keyCounter = 0;
const nextKey = () => `custom-${Date.now()}-${keyCounter++}`;

const TOGGLES: { key: keyof TierEntry; label: string; hint: string }[] = [
  { key: "scarf", label: "Scarf", hint: "Choice Scarf ×1.5" },
  { key: "tailwind", label: "TW", hint: "Tailwind ×2" },
  { key: "paralyzed", label: "Para", hint: "Paralysis ×0.5" },
  { key: "speedAbility", label: "×2", hint: "Swift Swim / Chlorophyll / Surge Surfer ×2" },
];

export default function SpeedTiersPage() {
  const [level, setLevel] = useState(50);
  const [entries, setEntries] = useState<TierEntry[]>(initialEntries);

  const patch = (key: string, p: Partial<TierEntry>) =>
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...p } : e)));
  const remove = (key: string) =>
    setEntries((prev) => prev.filter((e) => e.key !== key));
  const add = (s: SpeciesIndex) => {
    if (entries.some((e) => e.species.id === s.id)) return;
    setEntries((prev) => [...prev, makeEntry(s, nextKey())]);
  };

  const tiers = useMemo(() => {
    const rows = entries.map((e) => {
      const speed = finalSpeed(e, level);
      const twSpeed = finalSpeed({ ...e, tailwind: true }, level);
      const paraSpeed = finalSpeed({ ...e, paralyzed: true, tailwind: false }, level);
      return { e, speed, twSpeed, paraSpeed };
    });
    rows.sort((a, b) => b.speed - a.speed);
    // Group ties.
    const groups: typeof rows[] = [];
    for (const r of rows) {
      const last = groups[groups.length - 1];
      if (last && last[0].speed === r.speed) last.push(r);
      else groups.push([r]);
    }
    return groups;
  }, [entries, level]);

  const total = entries.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        Speed Tiers
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Who outspeeds whom? Starts with the 12 Regulation M-C meta staples —
        add or remove anything, tweak natures and EVs, flip Tailwind or
        paralysis, and watch the order reshuffle. Gen 7+ stat formula;
        modifiers floored per step.
      </p>

      <div className={`${sectionCls} mt-6`}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-28">
            <span className={labelCls}>Level</span>
            <input
              type="number"
              min={1}
              max={100}
              value={level}
              onChange={(e) => setLevel(clamp(e.target.valueAsNumber, 1, 100))}
              className={`${inputCls} mt-1`}
            />
          </div>
          <div className="min-w-52 flex-1">
            <SpeciesPicker
              label="Add Pokémon"
              onPick={add}
              excludeIds={entries.map((e) => e.species.id)}
              placeholder="Search to add…"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {tiers.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && group[0].speed < tiers[gi - 1][0].speed && (
              <div className="my-1 flex items-center gap-2 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                <span>
                  {tiers[gi - 1][0].speed} → {group[0].speed}
                </span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
            )}
            {group.map(({ e, speed, twSpeed, paraSpeed }) => {
              const outspeeds = entries.filter(
                (o) => o.key !== e.key && finalSpeed(o, level) < speed,
              ).length;
              return (
                <div
                  key={e.key}
                  className={`${sectionCls} mb-3 !p-4`}
                >
                  <div className="flex items-center gap-3">
                    {e.species.sprites.regular && (
                      <img
                        src={e.species.sprites.regular}
                        alt={e.species.name}
                        className="h-12 w-12 shrink-0 object-contain"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate font-bold text-slate-800 dark:text-slate-100">
                          {e.species.name}
                        </span>
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          {speed}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {e.nature} · {e.evs} EVs · outspeeds {outspeeds} of{" "}
                        {total - 1}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Tailwind → {twSpeed} · Paralyzed → {paraSpeed}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(e.key)}
                      aria-label={`Remove ${e.species.name}`}
                      className="shrink-0 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div>
                      <span className={labelCls}>Nature</span>
                      <select
                        value={e.nature}
                        onChange={(ev) => patch(e.key, { nature: ev.target.value })}
                        className={`${inputCls} mt-1 !py-1.5 text-sm`}
                      >
                        {NATURES.map((n) => (
                          <option key={n.name} value={n.name}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className={labelCls}>Spe EVs</span>
                      <input
                        type="number"
                        min={0}
                        max={252}
                        step={4}
                        value={e.evs}
                        onChange={(ev) =>
                          patch(e.key, { evs: clamp(ev.target.valueAsNumber, 0, 252) })
                        }
                        className={`${inputCls} mt-1 !py-1.5 text-sm`}
                      />
                    </div>
                    <div className="col-span-2 flex flex-wrap items-end gap-1.5 sm:col-span-1">
                      {TOGGLES.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          title={t.hint}
                          onClick={() =>
                            patch(e.key, { [t.key]: !e[t.key] } as Partial<TierEntry>)
                          }
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                            e[t.key]
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {entries.length === 0 && (
          <div className={`${sectionCls} text-sm text-slate-500 dark:text-slate-400`}>
            Add some Pokémon above to build your speed tiers.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Ties are grouped. “Outspeeds” counts entries strictly slower at current
        settings. In-game rounding floors after each modifier; held-item and
        ability interactions beyond the four toggles aren&apos;t modeled.
      </p>
    </div>
  );
}
