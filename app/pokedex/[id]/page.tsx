import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSpeciesById } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import { MOVES } from "@/lib/data/moves";
import { DexEntries } from "./dex-entries";
import { FormsSection } from "./forms-section";
import { FormProvider } from "./form-context";
import { FormSwitcher } from "./form-switcher";
import { EncountersSection } from "./encounters-section";
import { MatchupsSection } from "./matchups-section";
import { LearnsetSection } from "./learnset-section";
import { StatsRadar } from "./stats-radar";
import { SectionAccordion } from "./section-accordion";
import { EvolutionSection, type EvoNode } from "./evolution-section";
import evolutions from "@/data/evolutions.json";

const MAX_DEX_ID = 1025;

/** PokéAPI move id by pretty move name — for linking egg moves to move pages. */
const MOVE_ID_BY_NAME = new Map(MOVES.map((m) => [m.name, m.id]));

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
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium capitalize text-slate-800 dark:text-slate-100">{value}</dd>
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

  // Evolution chain for this species (hidden for single-stage Pokémon).
  const evoChainIndex =
    evolutions.speciesToChain[String(species.id) as keyof typeof evolutions.speciesToChain];
  const evoChain =
    evoChainIndex !== undefined
      ? (evolutions.chains[evoChainIndex] as EvoNode)
      : null;

  // Mask forms (e.g. Ogerpon) with sprites for the header form switcher.
  // Tera-only entries carry no types and are excluded here.
  const maskFormOptions = getFormsForSpecies(species.id)
    .filter((f) => f.kind === "mask" && f.types && f.types.length > 0)
    .map((f) => {
      // Showdown's shiny sprites for the three alternate masks are
      // pixel-identical to regular; use our corrected local shinies.
      // (Teal Mask's Showdown shiny is correct.)
      const slug = f.formName.toLowerCase().replace(/ mask/g, "");
      const needsLocalShiny = species.id === 1017 && slug !== "teal";
      return {
        name: f.formName,
        types: f.types as string[],
        regular: f.sprite,
        shiny: needsLocalShiny
          ? `/sprites/ogerpon-${slug}-shiny.png`
          : f.sprite.replace("/gen5/", "/gen5-shiny/"),
      };
    });

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
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/pokedex"
          className="inline-block text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Pokédex
        </Link>

        {/* Header — form selection also drives the matchup section below */}
        <FormProvider forms={maskFormOptions} baseTypes={species.types}>
        <section className="mt-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <img
              src={species.artwork}
              alt={`${species.name} official artwork`}
              className="h-56 w-56 shrink-0 object-contain"
            />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                #{species.id}
              </span>
              <h1 className="text-3xl font-bold capitalize tracking-tight">
                {species.name}
              </h1>
              {species.genera && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{species.genera}</p>
              )}
              <div className="mt-1">
                <FormSwitcher
                  baseName={species.name}
                  baseTypes={species.types}
                  baseRegular={species.sprites.regular}
                  baseShiny={species.sprites.shiny}
                  forms={maskFormOptions}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Evolution chain */}
        {evoChain && evoChain.evolvesTo.length > 0 && (
          <EvolutionSection chain={evoChain} currentId={species.id} />
        )}

        {/* Type matchups — follows the header form selection */}
        <MatchupsSection types={species.types} variants={formVariants} />
        </FormProvider>

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
        <SectionAccordion
          label="Pokédex entries"
          title="Pokédex entries"
          subtitle="Flavor text by game."
          badge={
            species.dexEntries.length > 0
              ? `${species.dexEntries.length} games`
              : undefined
          }
        >
          <DexEntries entries={species.dexEntries} />
        </SectionAccordion>

        {/* Alternate forms */}
        <FormsSection speciesId={species.id} />

        {/* Wild encounters */}
        <EncountersSection speciesId={species.id} />

        {/* Level-up moves by game */}
        <LearnsetSection speciesId={species.id} />

        {/* Egg moves */}
        <SectionAccordion
          label="Egg moves"
          title="Egg moves"
          badge={
            species.eggMoves.length > 0
              ? `${species.eggMoves.length} moves`
              : undefined
          }
        >
          {species.eggMoves.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No egg moves recorded</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {species.eggMoves.map((move) => {
                const id = MOVE_ID_BY_NAME.get(move);
                return (
                  <li key={move}>
                    {id ? (
                      <Link
                        href={`/moves/${id}`}
                        className="block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium capitalize text-slate-700 hover:bg-emerald-200 hover:text-emerald-900 dark:bg-emerald-900 dark:text-slate-300 dark:hover:bg-emerald-800 dark:hover:text-emerald-100"
                      >
                        {move}
                      </Link>
                    ) : (
                      <span className="block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium capitalize text-slate-700 dark:bg-emerald-900 dark:text-slate-300">
                        {move}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SectionAccordion>
      </div>
    </main>
  );
}
