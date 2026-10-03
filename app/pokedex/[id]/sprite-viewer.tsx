"use client";

import { useState } from "react";

type SpriteViewerProps = {
  name: string;
  regular: string;
  shiny: string;
};

export function SpriteViewer({ name, regular, shiny }: SpriteViewerProps) {
  const [shinyMode, setShinyMode] = useState(false);
  const src = shinyMode ? shiny : regular;

  const buttonClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition ${
      active
        ? "bg-emerald-300 text-slate-800 dark:bg-emerald-600 dark:text-slate-100"
        : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
    }`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Soft glow backdrop so dark-bodied sprites (e.g. shiny Ogerpon)
            stay visible against the dark theme background. */}
        <div
          aria-hidden="true"
          className="absolute inset-[-1rem] rounded-full bg-[radial-gradient(circle,rgba(148,163,184,0.28)_0%,rgba(148,163,184,0)_70%)] dark:bg-[radial-gradient(circle,rgba(203,213,225,0.22)_0%,rgba(203,213,225,0)_70%)]"
        />
        <img
          src={src}
          alt={`${name} ${shinyMode ? "shiny" : "regular"} sprite`}
          className="relative h-40 w-40 object-contain"
        />
      </div>
      <div className="flex gap-2" role="group" aria-label="Sprite variant">
        <button
          type="button"
          onClick={() => setShinyMode(false)}
          aria-pressed={!shinyMode}
          className={buttonClass(!shinyMode)}
        >
          Regular
        </button>
        <button
          type="button"
          onClick={() => setShinyMode(true)}
          aria-pressed={shinyMode}
          className={buttonClass(shinyMode)}
        >
          Shiny ✨
        </button>
      </div>
    </div>
  );
}
