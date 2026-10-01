"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MoveEntry, MoveSpecies } from "@/lib/data/moves";

const LEARNSET_PREVIEW = 24;

/** Pokémon that learn the move — sprite chips linking to each Pokémon page. */
export function Learners({
  move,
  speciesById,
}: {
  move: MoveEntry;
  speciesById: Map<number, MoveSpecies>;
}) {
  const [showAll, setShowAll] = useState(false);
  const species = useMemo(
    () =>
      move.learnedBy
        .map((id) => speciesById.get(id))
        .filter((s): s is MoveSpecies => s !== undefined),
    [move, speciesById]
  );

  if (species.length === 0) {
    return (
      <p className="text-sm text-slate-400">No Pokémon listed as learners.</p>
    );
  }

  const visible = showAll ? species : species.slice(0, LEARNSET_PREVIEW);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((s) => (
          <Link
            key={s.id}
            href={`/pokedex/${s.id}`}
            className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-xs font-medium text-slate-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
          >
            <img
              src={s.sprite}
              alt=""
              width={28}
              height={28}
              loading="lazy"
              className="h-7 w-7"
            />
            {s.name}
          </Link>
        ))}
      </div>
      {species.length > LEARNSET_PREVIEW && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          {showAll ? "Show fewer" : `Show all ${species.length} Pokémon`}
        </button>
      )}
    </div>
  );
}
