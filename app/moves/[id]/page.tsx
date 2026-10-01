import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOVES, MOVE_SPECIES, genLabel, type MoveEntry } from "@/lib/data/moves";
import { typeColor } from "@/lib/theme";
import { Learners } from "./learners";

const CATEGORY_BADGE: Record<string, string> = {
  Physical: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Special: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Status: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white"
      style={{ backgroundColor: typeColor(type) }}
    >
      {type}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export function generateStaticParams() {
  return MOVES.map((m) => ({ id: String(m.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const move = MOVES.find((m) => m.id === Number(id));
  return {
    title: move ? `${move.name} | Pokémon Companion` : "Move | Pokémon Companion",
  };
}

export default async function MovePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const move: MoveEntry | undefined = MOVES.find((m) => m.id === Number(id));
  if (!move) notFound();

  const speciesById = new Map(MOVE_SPECIES.map((s) => [s.id, s]));
  const gen = genLabel(move.gen);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/moves"
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
      >
        ← All moves
      </Link>

      <section
        aria-label={`${move.name} details`}
        className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-700"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {move.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TypeBadge type={move.type} />
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
              CATEGORY_BADGE[move.category] ?? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {move.category}
          </span>
          {gen && (
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Introduced in {gen}
            </span>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Power" value={move.power === null ? "—" : String(move.power)} />
          <StatCard
            label="Accuracy"
            value={move.accuracy === null ? "—" : String(move.accuracy)}
          />
          <StatCard label="PP" value={String(move.pp)} />
          <StatCard
            label="Priority"
            value={move.priority > 0 ? `+${move.priority}` : String(move.priority)}
          />
        </div>

        {move.shortEffect && (
          <p className="mt-6 text-slate-700 dark:text-slate-300">{move.shortEffect}</p>
        )}
        {move.effect && move.effect !== move.shortEffect && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{move.effect}</p>
        )}
      </section>

      <section
        aria-label="Pokémon that learn this move"
        className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-700"
      >
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Pokémon that learn it
          {move.learnedBy.length > 0 && (
            <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
              · {move.learnedBy.length}
            </span>
          )}
        </h2>
        <div className="mt-3">
          <Learners move={move} speciesById={speciesById} />
        </div>
      </section>
    </main>
  );
}
