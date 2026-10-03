"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { FormOption } from "./form-switcher";

interface FormContextValue {
  selected: string;
  setSelected: (name: string) => void;
  activeForm: FormOption | null;
  hasForms: boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({
  forms,
  baseTypes,
  children,
}: {
  forms: FormOption[];
  baseTypes: string[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<string>(() => {
    const baseMatch = forms.find((f) => f.types.join("/") === baseTypes.join("/"));
    return baseMatch ? baseMatch.name : (forms[0]?.name ?? "__base__");
  });

  const activeForm = forms.find((f) => f.name === selected) ?? null;

  return (
    <FormContext.Provider
      value={{ selected, setSelected, activeForm, hasForms: forms.length > 0 }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useFormSelection(): FormContextValue {
  const ctx = useContext(FormContext);
  if (!ctx) {
    return {
      selected: "__base__",
      setSelected: () => {},
      activeForm: null,
      hasForms: false,
    };
  }
  return ctx;
}
