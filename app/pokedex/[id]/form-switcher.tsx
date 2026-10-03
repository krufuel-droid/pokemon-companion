"use client";

import { useState } from "react";
import { TypePills } from "../type-pills";
import { SpriteViewer } from "./sprite-viewer";

export interface FormOption {
  name: string;
  types: string[];
  regular: string;
  shiny: string;
}

interface FormSwitcherProps {
  baseName: string;
  baseTypes: string[];
  baseRegular: string;
  baseShiny: string;
  forms: FormOption[];
}

/** Dropdown to switch between a species' alternate forms (e.g. Ogerpon's
 *  masks). Updates the type pills and the sprite viewer together. */
export function FormSwitcher({
  baseName,
  baseTypes,
  baseRegular,
  baseShiny,
  forms,
}: FormSwitcherProps) {
  const [selected, setSelected] = useState<string>(() => {
    const baseMatch = forms.find((f) => f.types.join("/") === baseTypes.join("/"));
    return baseMatch ? baseMatch.name : "__base__";
  });

  const active =
    forms.find((f) => f.name === selected) ??
    (selected === "__base__"
      ? { name: baseName, types: baseTypes, regular: baseRegular, shiny: baseShiny }
      : {
          name: baseName,
          types: baseTypes,
          regular: baseRegular,
          shiny: baseShiny,
        });

  if (forms.length === 0) {
    return (
      <>
        <div className="mt-1">
          <TypePills types={baseTypes} />
        </div>
        <div className="mt-4">
          <SpriteViewer name={baseName} regular={baseRegular} shiny={baseShiny} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <TypePills types={active.types} />
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-slate-500 dark:text-slate-400">Form</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            aria-label="Select form"
          >
            {forms.every((f) => f.types.join("/") !== baseTypes.join("/")) && (
              <option value="__base__">{baseName} (default)</option>
            )}
            {forms.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4">
        <SpriteViewer
          key={active.name}
          name={`${baseName} ${active.name !== baseName ? active.name : ""}`.trim()}
          regular={active.regular}
          shiny={active.shiny}
        />
      </div>
    </>
  );
}
