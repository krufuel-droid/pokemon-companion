"use client";

import { useMemo, useState } from "react";
import { TYPES, effectiveness } from "@/lib/typechart";
import { typeColor } from "@/lib/theme";

export interface FormVariant {
  name: string;
  types: string[];
}

/**
 * Capitalize a type name ("ice" → "Ice") so form-variant types from
 * lib/data/forms.ts match the capitalized keys in the type chart.
 */
function normalizeType(t: string): string {
  return t.length > 0 ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;
}

function multLabel(mult: number): string {
  if (mult === 4) return "×4";
  if (mult === 2) return "×2";
  if (mult === 0.5) return "×½";
  if (mult === 0.25) return "×¼";
  if (mult === 0) return "×0";
  return `×${mult}`;
}

function TypeChip({ type, mult }: { type: string; mult: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: typeColor(type) }}
      title={`${type} ${multLabel(mult)}`}
    >
      {type}
      <span className="opacity-90">{multLabel(mult)}</span>
    </span>
  );
}

function MatchupGroup({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { type: string; mult: number }[];
  emptyText: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">{emptyText}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map(({ type, mult }) => (
            <TypeChip key={type} type={type} mult={mult} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MatchupsSection({
  types,
  variants,
}: {
  types: string[];
  variants: FormVariant[];
}) {
  const [selected, setSelected] = useState<string>("__base__");

  const activeTypes =
    selected === "__base__"
      ? types.map(normalizeType)
      : ((variants.find((v) => v.name === selected)?.types ?? types).map(
          normalizeType
        ));

  const { weak, resist, immune } = useMemo(() => {
    const rows = TYPES.map((atk) => ({
      type: atk,
      mult: effectiveness(atk, activeTypes),
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
  }, [activeTypes]);

  return (
    <section
      aria-label="Type matchups"
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Weaknesses &amp; resistances</h2>
        {variants.length > 0 && (
          <div
            role="group"
            aria-label="Choose form"
            className="flex flex-wrap gap-1.5"
          >
            <button
              type="button"
              onClick={() => setSelected("__base__")}
              aria-pressed={selected === "__base__"}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selected === "__base__"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              Base
            </button>
            {variants.map((v) => (
              <button
                key={v.name}
                type="button"
                onClick={() => setSelected(v.name)}
                aria-pressed={selected === v.name}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selected === v.name
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-4">
        <MatchupGroup title="Weak to" items={weak} emptyText="No weaknesses" />
        <MatchupGroup
          title="Resists"
          items={resist}
          emptyText="No resistances"
        />
        <MatchupGroup
          title="Immune to"
          items={immune}
          emptyText="No immunities"
        />
      </div>
    </section>
  );
}
