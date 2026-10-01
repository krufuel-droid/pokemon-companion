import { getFormsForSpecies, KIND_LABEL } from "@/lib/data/forms";
import { TypePills } from "../type-pills";

const KIND_BADGE: Record<string, string> = {
  mega: "bg-amber-100 text-amber-800",
  gigantamax: "bg-red-100 text-red-800",
  regional: "bg-sky-100 text-sky-800",
  champions: "bg-violet-100 text-violet-800",
};

export function FormsSection({ speciesId }: { speciesId: number }) {
  const forms = getFormsForSpecies(speciesId);
  if (forms.length === 0) return null;

  return (
    <section
      aria-label="Alternate forms"
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h2 className="text-lg font-bold">Forms</h2>
      <p className="mt-1 text-sm text-slate-500">
        Alternate forms of this Pokémon — Megas, Gigantamax, regional variants,
        and Pokémon Champions originals.
      </p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {forms.map((form) => (
          <li
            key={form.formName}
            className="flex gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"
          >
            <img
              src={form.sprite}
              alt={`${form.formName} sprite`}
              loading="lazy"
              className="h-24 w-24 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">
                  {form.formName}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${KIND_BADGE[form.kind] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {KIND_LABEL[form.kind]}
                </span>
              </div>
              {form.types && (
                <div className="mt-2 flex justify-start">
                  <TypePills types={form.types} />
                </div>
              )}
              <p className="mt-2 text-sm text-slate-600">{form.obtain}</p>
              {form.note && (
                <p className="mt-1 text-xs italic text-slate-400">{form.note}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
