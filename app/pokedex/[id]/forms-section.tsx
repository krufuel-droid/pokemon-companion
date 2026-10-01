import { getFormsForSpecies, KIND_LABEL } from "@/lib/data/forms";
import { TypePills } from "../type-pills";
import { SectionAccordion } from "./section-accordion";

const KIND_BADGE: Record<string, string> = {
  mega: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  gigantamax: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  regional: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  champions: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
};

export function FormsSection({ speciesId }: { speciesId: number }) {
  const forms = getFormsForSpecies(speciesId);
  if (forms.length === 0) return null;

  return (
    <SectionAccordion
      label="Alternate forms"
      title="Forms"
      subtitle="Alternate forms of this Pokémon — Megas, Gigantamax, regional variants, and Pokémon Champions originals."
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
            </div>
          </li>
        ))}
      </ul>
    </SectionAccordion>
  );
}
