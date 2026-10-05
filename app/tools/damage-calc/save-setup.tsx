"use client";

import { useState } from "react";
import Link from "next/link";
import { inputCls, labelCls } from "./shared";
import {
  createSavedCalc,
  saveCalc,
  type SavedCalcSnapshot,
} from "@/lib/saved-calcs";

/**
 * Compact "save this setup" row for the damage calculator.
 * The page passes a closure capturing its current inputs; this component
 * only handles naming + persisting to localStorage.
 */
export default function SaveSetupForm({
  getSnapshot,
}: {
  getSnapshot: () => SavedCalcSnapshot;
}) {
  const [name, setName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  function handleSave() {
    const snap = getSnapshot();
    const fallback = `${snap.attacker.speciesName} vs ${snap.defenders[0]?.speciesName ?? "—"}`;
    const calc = createSavedCalc(name.trim() || fallback, snap);
    saveCalc(calc);
    setName("");
    setFlash(`Saved “${calc.name}” ✓`);
    window.setTimeout(() => setFlash(null), 2600);
  }

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className={labelCls} htmlFor="save-setup-name">
            Save this setup
          </label>
          <input
            id="save-setup-name"
            type="text"
            className={inputCls}
            value={name}
            maxLength={60}
            placeholder="e.g. Charizard vs Venusaur"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-slate-700 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500"
        >
          💾 Save setup
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm text-emerald-600 dark:text-emerald-400">
          {flash ?? "\u00A0"}
        </p>
        <Link
          href="/tools/saved-calcs"
          className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          View saved setups →
        </Link>
      </div>
    </div>
  );
}
