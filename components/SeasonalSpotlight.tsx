/**
 * SeasonalSpotlight — self-contained homepage banner for seasonal events.
 *
 * Renders nothing unless a seasonal event is active today. Compact and
 * dismissible (dismissal is per event + year, stored in localStorage, so next
 * year's event shows again).
 *
 * COORDINATOR MOUNT (app/page.tsx — do NOT edit that file here): render
 * <SeasonalSpotlight /> anywhere on the homepage, e.g. directly above the
 * Pokémon of the Day section:
 *
 *   import SeasonalSpotlight from "@/components/SeasonalSpotlight";
 *   ...
 *   <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
 *     <SeasonalSpotlight />
 *     <PokemonOfTheDay />
 *   </section>
 */
"use client";

import { useEffect, useState } from "react";
import { eventDateRange, getActiveSeasonalEvent } from "@/lib/data/seasonal-events";
import { windowYear } from "@/lib/achievements-seasonal";

export default function SeasonalSpotlight() {
  const [visible, setVisible] = useState(false);
  const event = getActiveSeasonalEvent();

  useEffect(() => {
    let show = false;
    if (event) {
      const year = windowYear(event, new Date());
      const key = `seasonal-spotlight:dismissed:${event.id}:${year}`;
      try {
        show = localStorage.getItem(key) !== "1";
      } catch {
        show = true; // private mode: show, dismissal just won't persist
      }
    }
    // The localStorage check must run client-side (SSR has no localStorage),
    // so this one-time setState in the effect is intentional — the same
    // pattern already used elsewhere in the codebase.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(show);
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!event || !visible) return null;

  const dismiss = () => {
    const year = windowYear(event, new Date());
    try {
      localStorage.setItem(`seasonal-spotlight:dismissed:${event.id}:${year}`, "1");
    } catch {
      /* private mode — just hide for this render */
    }
    setVisible(false);
  };

  const [from, to] = event.themeGradient ?? [event.themeColor, event.themeColor];

  return (
    <div
      role="region"
      aria-label={`${event.name} event`}
      className="relative mb-6 overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/20"
      style={{ background: `linear-gradient(120deg, ${from} 0%, ${to} 100%)` }}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5">
        <span className="shrink-0 text-3xl sm:text-4xl" aria-hidden="true">
          {event.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-white">
            {event.name}
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
              {eventDateRange(event)}
            </span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/90 sm:text-sm">
            {event.tagline}
          </p>
          <p className="mt-1 hidden text-xs font-medium text-white/80 sm:block">
            👻 Themed Pokémon of the Day · 🏆 Limited-time achievements & profile emblem
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label={`Dismiss ${event.name} banner`}
          className="shrink-0 rounded-full bg-black/20 px-2.5 py-1 text-sm font-bold text-white transition hover:bg-black/35"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
