"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllSpecies } from "@/lib/pokedex";
import { MOVES } from "@/lib/data/moves";
import { ITEMS, CATEGORY_LABEL } from "@/lib/data/items";
import { ABILITY_TYPE_EFFECTS } from "@/lib/data/ability-effects";
import {
  ATTACKER_ABILITIES,
  DEFENDER_ABILITIES,
} from "@/lib/data/damage-mods";
import { GUIDES } from "@/lib/data/guides";
import { typeColor } from "@/lib/theme";

type Category = "Pokémon" | "Moves" | "Items" | "Abilities" | "Guides";

interface SearchEntry {
  category: Category;
  label: string;
  sub: string;
  href: string;
  /** normalized label for matching */
  key: string;
  sprite?: string;
  types?: string[];
  type?: string;
}

const CATEGORY_META: Record<Category, { icon: string; order: number }> = {
  Pokémon: { icon: "🔴", order: 0 },
  Moves: { icon: "💥", order: 1 },
  Items: { icon: "🎒", order: 2 },
  Abilities: { icon: "✨", order: 3 },
  Guides: { icon: "📖", order: 4 },
};

const MAX_PER_CATEGORY = 6;

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Ability index: union of every ability name curated in the app's data files. */
function buildAbilityEntries(): SearchEntry[] {
  const names = new Map<string, string>();
  for (const a of ABILITY_TYPE_EFFECTS) names.set(a.name.toLowerCase(), a.name);
  for (const list of [ATTACKER_ABILITIES, DEFENDER_ABILITIES]) {
    for (const a of list) {
      if (a.name === "None") continue;
      const k = a.name.toLowerCase();
      if (!names.has(k)) names.set(k, a.name);
    }
  }
  return [...names.values()]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      category: "Abilities" as Category,
      label: name,
      sub: "Ability",
      href: "/abilities",
      key: norm(name),
    }));
}

function buildIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const s of getAllSpecies()) {
    out.push({
      category: "Pokémon",
      label: s.name,
      sub: `#${s.id}`,
      href: `/pokedex/${s.id}`,
      key: norm(s.name),
      sprite: s.sprites.regular,
      types: s.types,
    });
  }
  for (const m of MOVES) {
    out.push({
      category: "Moves",
      label: m.name,
      sub: `${m.category}${m.power ? ` · ${m.power} power` : ""}`,
      href: `/moves/${m.id}`,
      key: norm(m.name),
      type: m.type,
    });
  }
  for (const it of ITEMS) {
    out.push({
      category: "Items",
      label: it.name,
      sub: CATEGORY_LABEL[it.category] ?? it.category,
      href: "/items",
      key: norm(it.name),
    });
  }
  out.push(...buildAbilityEntries());
  for (const g of GUIDES) {
    out.push({
      category: "Guides",
      label: g.title,
      sub: g.tagline,
      href: `/guides/${g.slug}`,
      key: norm(g.title),
    });
  }
  return out;
}

function scoreEntry(e: SearchEntry, q: string, raw: string): number {
  // Exact dex-number match wins for Pokémon.
  if (e.category === "Pokémon" && /^\d+$/.test(raw.trim())) {
    const n = Number(raw.trim());
    const id = Number(e.sub.slice(1));
    if (id === n) return 0;
  }
  if (e.key === q) return 1;
  if (e.key.startsWith(q)) return 2;
  // No substring ("contains") tier: per Amanda's QA (Oct 5, 2026), searching
  // "ri" should not surface Altaria, Barrier, etc. Prefix matches only.
  return 99;
}

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const index = useMemo(buildIndex, []);

  // Debounce the query so fast typing doesn't re-filter every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 100);
    return () => clearTimeout(t);
  }, [query]);

  // ⌘K / Ctrl+K toggles; Esc closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  // Focus the input and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebounced("");
    setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open ]);

  const grouped = useMemo(() => {
    const q = norm(debounced.trim());
    if (q.length < 2) return [] as { category: Category; items: SearchEntry[] }[];
    const raw = debounced.trim();
    const scored = index
      .map((e) => ({ e, s: scoreEntry(e, q, raw) }))
      .filter((x) => x.s < 99)
      .sort((a, b) => a.s - b.s || a.e.label.localeCompare(b.e.label));
    const byCat = new Map<Category, SearchEntry[]>();
    for (const { e } of scored) {
      const arr = byCat.get(e.category) ?? [];
      if (arr.length < MAX_PER_CATEGORY) arr.push(e);
      byCat.set(e.category, arr);
    }
    return [...byCat.entries()]
      .map(([category, items]) => ({ category, items }))
      .sort(
        (a, b) => CATEGORY_META[a.category].order - CATEGORY_META[b.category].order,
      );
  }, [index, debounced]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  const indexOf = useMemo(() => {
    const m = new Map<SearchEntry, number>();
    flat.forEach((e, i) => m.set(e, i));
    return m;
  }, [flat]);

  useEffect(() => {
    setActive(0);
  }, [debounced]);

  // Keep the keyboard-highlighted row in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(e: SearchEntry) {
    setOpen(false);
    router.push(e.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[active];
      if (hit) go(hit);
    }
  }

  return (
    <>
      {/* Floating open button (touch-friendly). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search (Ctrl+K)"
        title="Search (Ctrl+K)"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[8vh] flex max-h-[84vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:mt-[12vh]"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                className="h-5 w-5 shrink-0 text-slate-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search Pokémon, moves, items, abilities, guides…"
                aria-label="Search"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <kbd className="hidden shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:block">
                esc
              </kbd>
            </div>

            <div ref={listRef} className="overflow-y-auto py-2">
              {debounced.trim().length < 2 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-2xl" aria-hidden="true">
                    🔍
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Search the whole Companion
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Pokémon by name or dex number, moves, items, abilities, game
                    guides. Type at least 2 characters.
                  </p>
                  <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                    <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold dark:bg-slate-800">
                      Ctrl K
                    </kbd>{" "}
                    to open anywhere
                  </p>
                </div>
              ) : flat.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-2xl" aria-hidden="true">
                    🕳️
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    No results for “{debounced.trim()}”
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Try a different spelling or a dex number.
                  </p>
                </div>
              ) : (
                grouped.map((g) => (
                  <div key={g.category}>
                    <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <span aria-hidden="true">{CATEGORY_META[g.category].icon} </span>
                      {g.category}
                    </p>
                    {g.items.map((e) => {
                      const idx = indexOf.get(e) ?? 0;
                      const isActive = idx === active;
                      return (
                        <button
                          key={`${e.category}-${e.label}-${e.href}`}
                          data-idx={idx}
                          type="button"
                          onClick={() => go(e)}
                          onMouseEnter={() => setActive(idx)}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                            isActive
                              ? "bg-emerald-50 dark:bg-emerald-950/60"
                              : "bg-transparent"
                          }`}
                        >
                          {e.sprite ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={e.sprite}
                              alt=""
                              width={36}
                              height={36}
                              loading="lazy"
                              className="h-9 w-9 shrink-0 object-contain"
                            />
                          ) : e.type ? (
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: typeColor(e.type) }}
                              aria-hidden="true"
                            >
                              {e.type.slice(0, 2)}
                            </span>
                          ) : (
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base dark:bg-slate-800"
                              aria-hidden="true"
                            >
                              {CATEGORY_META[e.category].icon}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {e.label}
                            </span>
                            <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                              {e.sub}
                              {e.types && e.types.length > 0 && (
                                <>
                                  {" · "}
                                  {e.types.join(" / ")}
                                </>
                              )}
                            </span>
                          </span>
                          {isActive && (
                            <kbd className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
