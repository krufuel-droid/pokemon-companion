"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllSpecies, getSpeciesById } from "@/lib/pokedex";
import type { SpeciesIndex, SpeciesFull } from "@/lib/pokedex";
import evolutions from "@/data/evolutions.json";
import type { EvoNode } from "@/app/pokedex/[id]/evolution-section";

type Gender = "male" | "female";

/** Base form of a species' evolution line (what hatches from its eggs). */
function baseFormId(speciesId: number): number {
  const idx =
    evolutions.speciesToChain[String(speciesId) as keyof typeof evolutions.speciesToChain];
  if (idx === undefined) return speciesId;
  const root = evolutions.chains[idx] as EvoNode;
  return root.id ?? speciesId;
}

/** Possible genders from PokéAPI's gender_rate (-1 = genderless, 0 = all male, 8 = all female). */
function gendersFromRate(rate: number): Gender[] {
  if (rate < 0) return [];
  if (rate === 0) return ["male"];
  if (rate === 8) return ["female"];
  return ["male", "female"];
}

async function fetchGenders(speciesId: number): Promise<Gender[]> {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}/`);
    if (!res.ok) return ["male", "female"];
    const data = await res.json();
    return gendersFromRate(data.gender_rate ?? 4);
  } catch {
    return ["male", "female"];
  }
}

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
  /** Species ID of the baby that would hatch, when known. */
  babyId?: number;
}

function compatibility(
  a: SpeciesFull,
  b: SpeciesFull,
  genderA: Gender | null,
  genderB: Gender | null,
  gendersA: Gender[],
  gendersB: Gender[]
): Verdict {
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
      reason: "Ditto can breed with almost anything outside the No-eggs group.",
      shared: [],
      babyId: baseFormId(other.id),
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

  // Genderless (non-Ditto) Pokémon can't breed at all.
  if (gendersA.length === 0 || gendersB.length === 0) {
    const genderless = gendersA.length === 0 ? a : b;
    return {
      ok: false,
      reason: `${cap(genderless.name)} is genderless — it can only breed with Ditto.`,
      shared: [],
    };
  }

  // Same explicitly-chosen gender = incompatible.
  if (genderA && genderB && genderA === genderB) {
    return {
      ok: false,
      reason: `They're both ${genderA === "male" ? "male" : "female"} — breeding needs one male and one female.`,
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

  // The mother determines the offspring: explicit female parent wins,
  // otherwise we can't know which one is the mom.
  let babyId: number | undefined;
  let reason = `They share ${shared.length} egg group${shared.length > 1 ? "s" : ""}.`;
  if (genderA === "female" && genderB === "male") {
    babyId = baseFormId(a.id);
  } else if (genderB === "female" && genderA === "male") {
    babyId = baseFormId(b.id);
  } else {
    reason += " Pick which parent is female to see what hatches.";
  }
  return { ok: true, reason, shared, babyId };
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

function GenderSelector({
  possible,
  value,
  onChange,
  loading,
}: {
  possible: Gender[];
  value: Gender | null;
  onChange: (g: Gender | null) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Checking genders…</p>
    );
  }
  if (possible.length === 0) {
    return (
      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        Genderless
      </p>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">Gender:</span>
      {(["male", "female"] as Gender[]).map((g) => {
        const allowed = possible.includes(g);
        const active = value === g;
        return (
          <button
            key={g}
            type="button"
            disabled={!allowed}
            onClick={() => onChange(active ? null : g)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1 text-sm font-bold ring-1 transition ${
              active
                ? g === "male"
                  ? "bg-sky-500 text-white ring-sky-500"
                  : "bg-pink-500 text-white ring-pink-500"
                : allowed
                  ? "bg-white text-slate-600 ring-slate-300 hover:ring-slate-400 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600"
                  : "cursor-not-allowed bg-slate-100 text-slate-300 ring-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:ring-slate-700"
            }`}
          >
            {g === "male" ? "♂" : "♀"}
          </button>
        );
      })}
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
  const [genderA, setGenderA] = useState<Gender | null>(null);
  const [genderB, setGenderB] = useState<Gender | null>(null);
  const [gendersA, setGendersA] = useState<Gender[]>([]);
  const [gendersB, setGendersB] = useState<Gender[]>([]);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    if (idA == null) {
      setGendersA([]);
      setGenderA(null);
      return;
    }
    setLoadingA(true);
    fetchGenders(idA).then((g) => {
      setGendersA(g);
      setGenderA((prev) => (prev && g.includes(prev) ? prev : null));
      setLoadingA(false);
    });
  }, [idA]);

  useEffect(() => {
    if (idB == null) {
      setGendersB([]);
      setGenderB(null);
      return;
    }
    setLoadingB(true);
    fetchGenders(idB).then((g) => {
      setGendersB(g);
      setGenderB((prev) => (prev && g.includes(prev) ? prev : null));
      setLoadingB(false);
    });
  }, [idB]);

  const detailA: SpeciesFull | undefined =
    idA == null ? undefined : getSpeciesById(idA);
  const detailB: SpeciesFull | undefined =
    idB == null ? undefined : getSpeciesById(idB);

  const verdict: Verdict | null =
    detailA && detailB
      ? compatibility(detailA, detailB, genderA, genderB, gendersA, gendersB)
      : null;

  const baby: SpeciesFull | undefined =
    verdict?.babyId != null ? getSpeciesById(verdict.babyId) : undefined;

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
              <GenderSelector
                possible={gendersA}
                value={genderA}
                onChange={setGenderA}
                loading={loadingA}
              />
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
              <GenderSelector
                possible={gendersB}
                value={genderB}
                onChange={setGenderB}
                loading={loadingB}
              />
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
            {verdict.ok && baby && (
              <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950 dark:ring-amber-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={baby.sprites.regular}
                  alt={baby.name}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-16 object-contain"
                />
                <p className="text-left text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    Their egg hatches into {cap(baby.name)}!
                  </span>
                  <br />
                  The mother&apos;s species decides what hatches.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400 dark:text-slate-500">
        Rules: Ditto (#132) breeds with anything except Ditto itself or
        No-eggs-group Pokémon. Otherwise both parents must share at least one
        egg group, be opposite genders, and neither may be in the No-eggs
        group. The mother&apos;s species decides what hatches from the egg.
      </p>
    </div>
  );
}
