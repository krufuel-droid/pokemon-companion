"use client";

import { ABILITY_TYPE_EFFECTS } from "@/lib/data/ability-effects";
import { TYPES } from "@/lib/typechart";

const SELECT_CLS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800";

const LABEL_CLS =
  "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400";

/**
 * Ability dropdown for the type-math tools. Only abilities with clean
 * type-level effects (lib/data/ability-effects.ts) are listed; "None" is
 * the default no-op.
 */
export function AbilitySelect({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      <select
        id={id}
        className={SELECT_CLS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="None">None</option>
        {ABILITY_TYPE_EFFECTS.map((a) => (
          <option key={a.name} value={a.name} title={a.desc}>
            {a.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * "Assume they Terastallize into…" dropdown. Recomputes the opponent's
 * defensive typing as the single Tera type. Stellar is excluded — it has
 * no defensive change.
 */
export function TeraSelect({
  label,
  value,
  onChange,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      <select
        id={id}
        className={SELECT_CLS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="None">None</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
