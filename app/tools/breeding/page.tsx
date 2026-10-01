"use client";

import { useMemo, useState } from "react";
import { getAllSpecies, getSpeciesById } from "@/lib/pokedex";
import type { SpeciesIndex, SpeciesFull } from "@/lib/pokedex";

function cap(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isDitto(d: SpeciesFull): boolean {
  return d.id === 132 || d.name.toLowerCase() === "ditto";
}

/** Species that cannot breed: "No-eggs" in the dataset ("Undiscovered" in some sources). */
function cannotBreed(d: SpeciesFull): boolean {
  return (d.eggGroups ?? []).some((g) => {
    const n = g.toLowerCase();
    return n === "no-eggs" || n === "undiscovered";
  });
}

interface Verdict {
  ok: boolean;
  reason: string;
  shared: string[];
}

function compatibility(a: SpeciesFull, b: SpeciesFull): Verdict {
  const aDitto = isDitto(a);
  const bDitto = isDitto(b);

  if (aDitto || bDitto) {
    if (aDitto && bDitto) {
      return { ok: false, reason: "Ditto cannot breed with Ditto.", shared: [] };
    }
    const other = aDitto ? b : a;
    if (cannotBreed(other)) {
      return {
        ok: false,
        reason: `${cap(other.name)} cannot breed (No-eggs group).`,
        shared: [],
      };
    }
    return {
      ok: true,
      reason:
        "Ditto can breed with almost anything outside the No-eggs group.",
      shared: [],
    };
  }

  if (cannotBreed(a) || cannotBreed(b)) {
    return {
      ok: false,
      reason:
        "One or both species are in the No-eggs group (legendaries, mythicals, and babies can't breed).",
      shared: [],
    };
  }

  const groupsA = a.eggGroups ?? [];
  const groupsB = (b.eggGroups ?? []).map((g) => g.toLowerCase());
  const shared: string[] = [];
  for (const g of groupsA) {
    const gl = g.toLowerCase();
    if (
      groupsB.includes(gl) &&
      !shared.some((s) => s.toLowerCase() === gl) &&
      gl !== "ditto"
    ) {
      shared.push(g);
    }
  }

  if (shared.length === 0) {
    return {
      ok: false,
      reason: "They share no egg groups, so they can't produce an egg together.",
      shared: [],
    };
  }
  return {
    ok: true,
    reason: `They share ${shared.length} egg group${shared.length > 1 ? "s" : ""}.`,
    shared,
  };
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-800";

function SpeciesPicker({
  label,
  species,
  selectedId,
  onSelect,
}: {
  label: string;
  species: SpeciesIndex[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? species.filter((s) => s.name.toLowerCase().includes(q))
      : species;
    return list.slice(0, 30);
  }, [query, species]);

  const selected = species.find((s) => s.id === selectedId) ?? null;

  return (
    <div>
      <span className="block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      {selected ? (
        <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-300/30 px-3 py-2 ring-1 ring-emerald-300 dark:bg-emerald-600/30 dark:ring-emerald-700">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {cap(selected.name)}{" "}
            <span className="font-normal text-slate-500 dark:text-slate-400">#{selected.id}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          >
            ✕ Clear
          </button>
        </div>
      ) : (
        <div className="relative mt-1">
          <input
            type="text"
            placeholder="Type a name…"
            className={inputCls}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
          {open && (
            <>
              <button
                type="button"
                aria-label="Close"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setOpen(false)}
              />
              <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                {matches.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
                    No matches found.
                  </li>
                )}
                {matches.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-300/20 dark:text-slate-300 dark:hover:bg-emerald-600/20"
                      onClick={() => {
                        onSelect(s.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="font-medium">{cap(s.name)}</span>
                      <span className="text-slate-400 dark:text-slate-500">#{s.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EggGroups({ groups }: { groups: string[] }) {
  return (
    <div className="mt-4">
      <div className="text-sm text-slate-500 dark:text-slate-400">Egg groups</div>
      {groups.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">None listed.</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <span
              key={g}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            >
              {cap(g)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MoveChips({ title, moves }: { title: string; moves: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {moves.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">No egg moves listed.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {moves.map((m) => (
            <span
              key={m}
              className="rounded-full bg-emerald-300/25 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-emerald-200 dark:bg-emerald-600/25 dark:text-slate-300 dark:ring-emerald-800"
            >
              {cap(m)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BreedingCompatibility() {
  const species = useMemo<SpeciesIndex[]>(() => getAllSpecies(), []);

  const [idA, setIdA] = useState<number | null>(null);
  const [idB, setIdB] = useState<number | null>(null);

  const detailA: SpeciesFull | undefined =
    idA == null ? undefined : getSpeciesById(idA);
  const detailB: SpeciesFull | undefined =
    idB == null ? undefined : getSpeciesById(idB);

  const verdict: Verdict | null =
    detailA && detailB ? compatibility(detailA, detailB) : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Breeding Compatibility</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick two Pokémon to see if they can breed — and which egg moves their
        offspring could inherit.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <SpeciesPicker
            label="Parent 1"
            species={species}
            selectedId={idA}
            onSelect={setIdA}
          />
          {detailA && (
            <>
              <EggGroups groups={detailA.eggGroups ?? []} />
              <MoveChips
                title={`Egg moves — moves ${cap(detailA.name)}'s offspring could inherit`}
                moves={detailA.eggMoves ?? []}
              />
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <SpeciesPicker
            label="Parent 2"
            species={species}
            selectedId={idB}
            onSelect={setIdB}
          />
          {detailB && (
            <>
              <EggGroups groups={detailB.eggGroups ?? []} />
              <MoveChips
                title={`Egg moves — moves ${cap(detailB.name)}'s offspring could inherit`}
                moves={detailB.eggMoves ?? []}
              />
            </>
          )}
        </div>
      </div>

      {/* Verdict */}
      <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        {verdict == null ? (
          <p className="text-center text-slate-400 dark:text-slate-500">
            {idA == null || idB == null
              ? "Select both parents above to check compatibility."
              : "Species data isn't available yet."}
          </p>
        ) : (
          <div className="text-center">
            <div
              className={`inline-block rounded-full px-6 py-2 text-xl font-bold ${
                verdict.ok
                  ? "bg-emerald-300 text-slate-800 dark:bg-emerald-600 dark:text-slate-100"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {verdict.ok ? "✓ Compatible" : "✕ Not compatible"}
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{verdict.reason}</p>
            {verdict.shared.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {verdict.shared.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-emerald-300/30 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-emerald-300 dark:bg-emerald-600/30 dark:text-slate-300 dark:ring-emerald-700"
                  >
                    Shared: {cap(g)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400 dark:text-slate-500">
        Rules: Ditto (#132) breeds with anything except Ditto itself or
        No-eggs-group Pokémon. Otherwise both parents must share at least one
        egg group, and neither may be in the No-eggs group.
      </p>
    </div>
  );
}
