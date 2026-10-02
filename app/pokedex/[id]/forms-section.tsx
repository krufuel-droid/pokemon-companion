import { getFormsForSpecies, KIND_LABEL } from "@/lib/data/forms";
import { FORM_STATS } from "@/lib/data/form-stats";
import { TypePills } from "../type-pills";
import { SectionAccordion } from "./section-accordion";

const STAT_KEYS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  "special-attack": "SpA",
  "special-defense": "SpD",
  speed: "Spe",
};

function FormStats({ formName }: { formName: string }) {
  const stats = FORM_STATS[formName];
  if (!stats) return null;
  const total = stats.reduce((a, b) => a + b, 0);
  return (
    <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Base stats · total {total}
      </p>
      <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5">
        {stats.map((value, i) => (
          <div key={STAT_KEYS[i]} className="flex items-baseline justify-between gap-2">
            <dt className="text-xs text-slate-500 dark:text-slate-400">
              {STAT_LABELS[STAT_KEYS[i]]}
            </dt>
            <dd className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const KIND_BADGE: Record<string, string> = {
  mega: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  gigantamax: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  regional: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  champions: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  mask: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export function FormsSection({ speciesId }: { speciesId: number }) {
  const forms = getFormsForSpecies(speciesId);
  if (forms.length === 0) return null;

  return (
    <SectionAccordion
      label="Alternate forms"
      title="Forms"
      subtitle="Alternate forms of this Pokémon — Megas, Gigantamax, regional variants, mask forms, and Pokémon Champions originals."
      badge={`${forms.length} ${forms.length === 1 ? "form" : "forms"}`}
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {forms.map((form) => (
          <li
            key={form.formName}
            className="flex gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <img
              src={form.sprite}
              alt={`${form.formName} sprite`}
              loading="lazy"
              className="h-24 w-24 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {form.formName}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KIND_BADGE[form.kind] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  {KIND_LABEL[form.kind]}
                </span>
              </div>
              {form.types && (
                <div className="mt-2 flex justify-start">
                  <TypePills types={form.types} />
                </div>
              )}
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{form.obtain}</p>
              {form.note && (
                <p className="mt-1 text-xs italic text-slate-400 dark:text-slate-500">{form.note}</p>
              )}
              <FormStats formName={form.formName} />
            </div>
          </li>
        ))}
      </ul>
    </SectionAccordion>
  );
}
