"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loadSavedCalcs,
  deleteCalc,
  stageCalcHandoff,
  describeSavedCalc,
  formatSavedDate,
  type SavedCalc,
} from "@/lib/saved-calcs";

export default function SavedCalcsPage() {
  const router = useRouter();
  /** null = still reading from localStorage. */
  const [calcs, setCalcs] = useState<SavedCalc[] | null>(null);
  /** id armed for two-tap delete confirm. */
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setCalcs(loadSavedCalcs());
  }, []);

  function handleLoad(calc: SavedCalc) {
    stageCalcHandoff(calc);
    router.push("/tools/damage-calc");
  }

  function handleDelete(id: string) {
    if (confirmId === id) {
      setCalcs(deleteCalc(id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
      window.setTimeout(
        () => setConfirmId((c) => (c === id ? null : c)),
        3200,
      );
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Saved Calculations
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Your damage-calculator setups, ready to reload. Stored in this browser
        only — they don&apos;t sync across devices.
      </p>

      {calcs === null ? (
        <p className="mt-8 text-slate-500 dark:text-slate-400">Loading…</p>
      ) : calcs.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <p className="text-4xl">🧮</p>
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            No saved setups yet
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Dial in a matchup in the damage calculator, give it a name, and hit
            “Save setup”.
          </p>
          <Link
            href="/tools/damage-calc"
            className="mt-4 inline-block rounded-xl bg-emerald-500 px-5 py-2 font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Open the calculator →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {calcs.map((calc) => (
            <li
              key={calc.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                    {calc.name}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {describeSavedCalc(calc)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    Saved {formatSavedDate(calc.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoad(calc)}
                    className="rounded-xl bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Load →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(calc.id)}
                    className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${
                      confirmId === calc.id
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {confirmId === calc.id ? "Sure?" : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
