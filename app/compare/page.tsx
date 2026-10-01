import { Suspense } from "react";
import type { Metadata } from "next";
import { CompareUI } from "./compare-ui";

export const metadata: Metadata = {
  title: "Compare Pokémon",
  description:
    "Compare two Pokémon side by side: sprites, types, base stats, and type matchups.",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 text-slate-800">
          <div className="mx-auto max-w-6xl px-4 py-8">
            <p className="text-sm text-slate-500">Loading comparison…</p>
          </div>
        </main>
      }
    >
      <CompareUI />
    </Suspense>
  );
}
