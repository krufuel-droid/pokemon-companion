"use client";

import { useState } from "react";

/** Live name filter for the roster table. */
export function RosterSearch() {
  const [q, setQ] = useState("");
  return (
    <input
      value={q}
      onChange={(e) => {
        const query = e.target.value;
        setQ(query);
        const needle = query.trim().toLowerCase();
        document
          .querySelectorAll<HTMLTableRowElement>("[data-roster-name]")
          .forEach((row) => {
            const name = row.getAttribute("data-roster-name") ?? "";
            row.style.display =
              needle === "" || name.toLowerCase().includes(needle)
                ? ""
                : "none";
          });
      }}
      placeholder="Check a name… (e.g. Lucario)"
      aria-label="Filter roster by Pokémon name"
      className="w-full max-w-sm rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-teal-300/60 focus:outline-none"
    />
  );
}
