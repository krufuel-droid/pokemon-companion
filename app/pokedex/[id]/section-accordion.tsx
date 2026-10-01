"use client";

import { useState, type ReactNode } from "react";

interface SectionAccordionProps {
  label: string;
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}

/**
 * Collapsed-by-default accordion section for the detail page.
 * Matches the "Where to find" (encounters) section pattern: real <button>
 * header, aria-expanded, rotating chevron, mint theme card styling.
 * Heavy data should be lazy-loaded by the child on first expand where
 * practical (see EncountersSection).
 */
export function SectionAccordion({
  label,
  title,
  subtitle,
  badge,
  children,
}: SectionAccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label={label}
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        <span>
          <span className="text-lg font-bold">
            {title}
            {badge && (
              <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
                · {badge}
              </span>
            )}
          </span>
          {subtitle && (
            <span className="mt-1 block text-sm font-normal text-slate-500 dark:text-slate-400">
              {subtitle}
            </span>
          )}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path
            d="M5 7l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
