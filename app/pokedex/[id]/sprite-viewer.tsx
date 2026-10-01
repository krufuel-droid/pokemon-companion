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
        ? "bg-emerald-300 text-slate-800"
        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
    }`;

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={src}
        alt={`${name} ${shinyMode ? "shiny" : "regular"} sprite`}
        className="h-40 w-40 object-contain"
      />
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
