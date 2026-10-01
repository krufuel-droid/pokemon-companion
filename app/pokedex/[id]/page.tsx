import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSpeciesById } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { TypePills } from "../type-pills";
import { SpriteViewer } from "./sprite-viewer";
import { DexEntries } from "./dex-entries";
import { FormsSection } from "./forms-section";
import { EncountersSection } from "./encounters-section";
import { MatchupsSection } from "./matchups-section";
import { StatsRadar } from "./stats-radar";

const MAX_DEX_ID = 1025;

type PageParams = { id: string };

function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1 || id > MAX_DEX_ID) return null;
  return id;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { id: raw } = await params;
  const id = parseId(raw);
  const species = id === null ? undefined : getSpeciesById(id);
  return {
    title: species
      ? `#${species.id} ${species.name} — Pokédex`
      : "Pokédex",
  };
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 font-medium capitalize text-slate-800">{value}</dd>
    </div>
  );
}

export default async function SpeciesPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id: raw } = await params;
  const id = parseId(raw);
  const species = id === null ? undefined : getSpeciesById(id);
  if (!species) notFound();

  // Alternate forms whose typing differs from the base species —
  // lets the matchups section switch between typings.
  const formVariants = getFormsForSpecies(species.id)
    .filter(
      (f) =>
        f.types &&
        f.types.length > 0 &&
        f.types.join("/") !== species.types.join("/"),
    )
    .map((f) => ({ name: f.formName, types: f.types as string[] }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/pokedex"
          className="inline-block text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Pokédex
        </Link>

        {/* Header */}
        <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <img
              src={species.artwork}
              alt={`${species.name} official artwork`}
              className="h-56 w-56 shrink-0 object-contain"
            />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span className="text-sm font-medium text-slate-400">
                #{species.id}
              </span>
              <h1 className="text-3xl font-bold capitalize tracking-tight">
                {species.name}
              </h1>
              {species.genera && (
                <p className="text-sm text-slate-500">{species.genera}</p>
              )}
              <div className="mt-1">
                <TypePills types={species.types} />
              </div>
              <div className="mt-4">
                <SpriteViewer
                  name={species.name}
                  regular={species.sprites.regular}
                  shiny={species.sprites.shiny}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Type matchups */}
        <MatchupsSection types={species.types} variants={formVariants} />

        {/* Base stats radar */}
        {species.baseStats && species.baseStats.length === 6 && (
          <StatsRadar stats={species.baseStats} />
        )}

        {/* Info grid */}
        <section aria-label="Pokémon details" className="mt-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InfoItem label="Height" value={`${species.heightM} m`} />
            <InfoItem label="Weight" value={`${species.weightKg} kg`} />
            <InfoItem
              label="Egg groups"
              value={
                species.eggGroups.length > 0
                  ? species.eggGroups.join(", ")
                  : "—"
              }
            />
          </dl>
        </section>

        {/* Pokédex entries */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold">Pokédex entries</h2>
          <div className="mt-3">
            <DexEntries entries={species.dexEntries} />
          </div>
        </section>

        {/* Alternate forms */}
        <FormsSection speciesId={species.id} />

        {/* Wild encounters */}
        <EncountersSection speciesId={species.id} />

        {/* Egg moves */}
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold">Egg moves</h2>
          {species.eggMoves.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No egg moves recorded
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {species.eggMoves.map((move) => (
                <li
                  key={move}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium capitalize text-slate-700"
                >
                  {move}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
