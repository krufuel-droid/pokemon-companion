"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";
import speciesIndex from "@/data/pokedex-index.json";
import { fetchSetCardIds, searchCards, type TcgCard } from "@/lib/tcg";
import {
  TCGDEX_LANGUAGES,
  detailsForPrints,
  englishDetail,
  formatPrice,
  getPriceMovers,
  searchPrints,
  snapshotTrackedPrices,
  snapshotWantListPrices,
  variantBadges,
  type CardPricing,
  type PriceMover,
  type TcgdexCardDetail,
  type TcgdexCardSummary,
} from "@/lib/tcgdex";

type ListKind = "collection" | "want";
type Tab = "search" | "collection" | "want" | "master" | "value";

interface TcgRow {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  set_id: string | null;
  set_name: string | null;
  image_url: string | null;
  quantity: number;
  list: ListKind;
  created_at: string;
}

const SETUP_NOTE =
  "One-time setup needed: run supabase/migration-tcg-collection.sql in the Supabase SQL Editor, then refresh.";

const BINDER_SETUP_NOTE =
  "One-time setup needed: run supabase/migration-binder-showcase.sql in the Supabase SQL Editor, then refresh.";

/** A card the user wants to pin to their public binder showcase. */
interface PinTarget {
  cardId: string;
  cardName: string;
  imageUrl: string | null;
  setName: string | null;
}

interface BinderPin {
  card_id: string;
  position: number;
}

/** Smallest free showcase slot (0-8), or -1 when all 9 are taken. */
function nextFreePosition(pins: BinderPin[]): number {
  const used = new Set(pins.map((p) => p.position));
  for (let i = 0; i < 9; i++) if (!used.has(i)) return i;
  return -1;
}

function getSupabase() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

/** True when the error means the tcg_collection table hasn't been migrated yet. */
function isMissingTable(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === "42P01" || (e.message ?? "").includes("does not exist");
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function RarityPill({ rarity }: { rarity: string | null }) {
  if (!rarity) return null;
  return (
    <span className="inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
      {rarity}
    </span>
  );
}

function ProgressBar({ owned, total }: { owned: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((owned / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {owned}/{total}
      </span>
    </div>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
      {message}
    </div>
  );
}

function QtyStepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(qty - 1)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
        ×{qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
      >
        +
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Search pane                                                        */
/* ------------------------------------------------------------------ */

function SearchPane({
  userId,
  rows,
  onAdd,
}: {
  userId: string | null;
  rows: TcgRow[];
  onAdd: (card: TcgCard, list: ListKind) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TcgCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const runId = useRef(0);

  const inList = useCallback(
    (cardId: string, list: ListKind): TcgRow | undefined =>
      rows.find((r) => r.card_id === cardId && r.list === list),
    [rows],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    const id = ++runId.current;
    const timer = setTimeout(() => {
      searchCards(q)
        .then((cards) => {
          if (runId.current !== id) return;
          setResults(cards);
          setSearched(true);
        })
        .catch((e: unknown) => {
          if (runId.current !== id) return;
          setError(e instanceof Error ? e.message : "Search failed — try again.");
        })
        .finally(() => {
          if (runId.current === id) setLoading(false);
        });
    }, 500); // debounce: stay gentle on the public API
    return () => clearTimeout(timer);
  }, [query, retryCount]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search cards by name — e.g. Charizard"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Powered by the public Pokémon TCG API (pokemontcg.io). Type at least 2 letters.
      </p>

      {loading && (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">Searching cards…</p>
      )}
      {error && (
        <div className="mt-8 rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-200 dark:bg-red-950/30 dark:ring-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="mt-3 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && searched && results.length === 0 && (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
          No cards found for “{query.trim()}”.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((card) => {
          const owned = inList(card.id, "collection");
          const wanted = inList(card.id, "want");
          return (
            <div
              key={card.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              {card.imageSmall ? (
                <img
                  src={card.imageSmall}
                  alt={card.name}
                  loading="lazy"
                  className="aspect-[245/337] w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex aspect-[245/337] w-full items-center justify-center bg-slate-100 text-3xl dark:bg-slate-800">
                  🃏
                </div>
              )}
              <div className="p-3">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                  {card.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  #{card.number} · {card.setName}
                </p>
                <div className="mt-1">
                  <RarityPill rarity={card.rarity} />
                </div>
                {userId ? (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {owned ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-center text-xs font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        ✓ Collection ×{owned.quantity}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAdd(card, "collection")}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        + Collection
                      </button>
                    )}
                    {wanted ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-center text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        ✓ Want ×{wanted.quantity}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAdd(card, "want")}
                        className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        + Want List
                      </button>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="mt-2 block rounded-full bg-slate-200 px-3 py-1 text-center text-xs font-semibold text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                  >
                    Sign in to save
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Owned-card tile                                                    */
/* ------------------------------------------------------------------ */

function OwnedTile({
  row,
  rarity,
  otherList,
  onQty,
  onMove,
  onRemove,
  isPinned,
  onTogglePin,
}: {
  row: TcgRow;
  rarity?: string | null;
  otherList: ListKind;
  onQty: (row: TcgRow, qty: number) => void;
  onMove: (row: TcgRow, to: ListKind) => void;
  onRemove: (row: TcgRow) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      {row.image_url ? (
        <img
          src={row.image_url}
          alt={row.card_name}
          loading="lazy"
          className="aspect-[245/337] w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex aspect-[245/337] w-full items-center justify-center bg-slate-100 text-3xl dark:bg-slate-800">
          🃏
        </div>
      )}
      <div className="p-3">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
          {row.card_name}
        </p>
        <div className="mt-1">
          <RarityPill rarity={rarity ?? null} />
        </div>
        <div className="mt-2">
          <QtyStepper qty={row.quantity} onChange={(q) => onQty(row, q)} />
        </div>
        <div className="mt-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => onMove(row, otherList)}
            className="flex-1 rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            → {otherList === "collection" ? "Collection" : "Want"}
          </button>
          <button
            type="button"
            aria-label={`Remove ${row.card_name}`}
            onClick={() => onRemove(row)}
            className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
          >
            ✕
          </button>
        </div>
        {onTogglePin && (
          <button
            type="button"
            onClick={onTogglePin}
            title={isPinned ? "Remove from your binder showcase" : "Pin to your binder showcase"}
            className={`mt-1.5 w-full rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              isPinned
                ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900"
                : "bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
            }`}
          >
            {isPinned ? "📌 Pinned to binder" : "📌 Pin to binder"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Collection pane: grouped by set with completion progress            */
/* ------------------------------------------------------------------ */

interface SetGroup {
  key: string;
  name: string;
  rows: TcgRow[];
}

function CollectionPane({
  rows,
  progress,
  progressError,
  setupNeeded,
  onQty,
  onMove,
  onRemove,
  pinnedIds,
  onTogglePin,
}: {
  rows: TcgRow[];
  progress: Record<string, { owned: number; total: number }>;
  progressError: boolean;
  setupNeeded: boolean;
  onQty: (row: TcgRow, qty: number) => void;
  onMove: (row: TcgRow, to: ListKind) => void;
  onRemove: (row: TcgRow) => void;
  pinnedIds: Set<string>;
  onTogglePin: (target: PinTarget) => void;
}) {
  const [setFilter, setSetFilter] = useState<string>("all");

  const groups = useMemo<SetGroup[]>(() => {
    const map = new Map<string, SetGroup>();
    for (const row of rows) {
      const key = row.set_id || "unknown";
      const g = map.get(key) ?? {
        key,
        name: row.set_name || "Unknown set",
        rows: [],
      };
      g.rows.push(row);
      map.set(key, g);
    }
    const list = [...map.values()];
    list.sort((a, b) => a.name.localeCompare(b.name));
    for (const g of list) g.rows.sort((a, b) => a.card_name.localeCompare(b.card_name));
    return list;
  }, [rows]);

  if (setupNeeded) {
    return (
      <p className="mt-8 rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
        {SETUP_NOTE}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
        Your collection is empty — search for cards above and tap <strong>+ Collection</strong>.
      </p>
    );
  }

  const visible = setFilter === "all" ? groups : groups.filter((g) => g.key === setFilter);

  return (
    <div>
      <label className="mb-4 block max-w-xs">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Filter by set
        </span>
        <select
          value={setFilter}
          onChange={(e) => setSetFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All sets ({groups.length})</option>
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.name} ({g.rows.length})
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-4">
        {visible.map((g) => {
          const p = progress[g.key];
          return (
            <details
              key={g.key}
              open={setFilter !== "all" || undefined}
              className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <summary className="cursor-pointer list-none px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">
                      ▸
                    </span>
                    {g.name}
                  </span>
                  {p && p.total > 0 && !progressError ? (
                    <span className="w-40 shrink-0">
                      <ProgressBar owned={p.owned} total={p.total} />
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {g.rows.length} card{g.rows.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </summary>
              <div className="grid grid-cols-2 gap-4 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-4">
                {g.rows.map((row) => (
                  <OwnedTile
                    key={row.id}
                    row={row}
                    otherList="want"
                    onQty={onQty}
                    onMove={onMove}
                    onRemove={onRemove}
                    isPinned={pinnedIds.has(row.card_id)}
                    onTogglePin={() =>
                      onTogglePin({
                        cardId: row.card_id,
                        cardName: row.card_name,
                        imageUrl: row.image_url,
                        setName: row.set_name,
                      })
                    }
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Want list pane                                                     */
/* ------------------------------------------------------------------ */

function WantPane({
  rows,
  setupNeeded,
  onQty,
  onMove,
  onRemove,
}: {
  rows: TcgRow[];
  setupNeeded: boolean;
  onQty: (row: TcgRow, qty: number) => void;
  onMove: (row: TcgRow, to: ListKind) => void;
  onRemove: (row: TcgRow) => void;
}) {
  if (setupNeeded) {
    return (
      <p className="mt-8 rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
        {SETUP_NOTE}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
        Your want list is empty — search for cards above and tap <strong>+ Want List</strong>.
      </p>
    );
  }
  const sorted = [...rows].sort((a, b) => a.card_name.localeCompare(b.card_name));
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {sorted.map((row) => (
        <OwnedTile
          key={row.id}
          row={row}
          otherList="collection"
          onQty={onQty}
          onMove={onMove}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Master Set — every print of a Pokémon in every language, with prices */
/* ------------------------------------------------------------------ */

const MASTER_SETUP_NOTE =
  "One-time setup needed: run supabase/migration-tcg-master-set.sql in the Supabase SQL Editor, then refresh.";

function TcgImage({
  baseUrl,
  alt,
  className,
}: {
  baseUrl: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!baseUrl || failed) {
    return (
      <div
        className={`flex aspect-[3/4] w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 ${className ?? ""}`}
      >
        No image
      </div>
    );
  }
  return (
    <img
      src={`${baseUrl}/low.webp`}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`aspect-[3/4] w-full object-cover ${className ?? ""}`}
    />
  );
}

function MasterSetPane({
  userId,
  pinnedIds,
  onTogglePin,
}: {
  userId: string | null;
  pinnedIds: Set<string>;
  onTogglePin: (target: PinTarget) => void;
}) {
  const [pokemon, setPokemon] = useState("");
  const [lang, setLang] = useState("en");
  const [prints, setPrints] = useState<TcgdexCardDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [ownedTotal, setOwnedTotal] = useState(0);
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [pricesUpdated, setPricesUpdated] = useState<string | null>(null);
  const [movers, setMovers] = useState<PriceMover[]>([]);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const runId = useRef(0);

  // Price movers digest — loads once when the tab mounts for a signed-in user.
  useEffect(() => {
    if (!userId) return;
    const sb = getSupabase();
    if (!sb) return;
    getPriceMovers(sb as unknown as Parameters<typeof getPriceMovers>[0], userId)
      .then(setMovers)
      .catch(() => {});
  }, [userId]);

  async function loadPrints(pokeName: string, language: string) {
    const q = pokeName.trim();
    if (q.length < 2) return;
    const id = ++runId.current;
    setLoading(true);
    setError(null);
    try {
      const summaries = await searchPrints(q);
      if (runId.current !== id) return;
      const details = await detailsForPrints(
        summaries.map((s) => s.id),
        language
      );
      if (runId.current !== id) return;
      const list = [...details.values()].sort((a, b) =>
        a.setName.localeCompare(b.setName)
      );
      setPrints(list);
      setSearched(true);
      const freshest = list
        .map((d) => d.pricing.updated)
        .filter((u): u is string => !!u)
        .sort()
        .pop();
      setPricesUpdated(freshest ? freshest.slice(0, 10) : null);

      // Owned marks for these prints (signed in only).
      const sb = getSupabase();
      if (sb && userId && list.length > 0) {
        const { data, error: ownErr } = await sb
          .from("tcg_master_set")
          .select("card_id")
          .eq("user_id", userId)
          .eq("language", language)
          .in(
            "card_id",
            list.map((d) => d.id)
          );
        if (runId.current !== id) return;
        if (ownErr && isMissingTable(ownErr)) {
          setSetupNeeded(true);
        } else if (!ownErr && data) {
          setOwned(new Set((data as { card_id: string }[]).map((r) => r.card_id)));
        }
        // Best-effort daily price snapshot for the movers digest.
        void snapshotTrackedPrices(
          sb as unknown as Parameters<typeof snapshotTrackedPrices>[0],
          userId
        ).catch(() => {});
      }
      // Total owned across all languages, for the header stat.
      if (sb && userId) {
        const { data: all } = await sb
          .from("tcg_master_set")
          .select("id")
          .eq("user_id", userId);
        if (runId.current !== id) return;
        setOwnedTotal((all as unknown[] | null)?.length ?? 0);
      }
    } catch (e) {
      if (runId.current !== id) return;
      setError(e instanceof Error ? e.message : "Could not load prints — try again.");
    } finally {
      if (runId.current === id) setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void loadPrints(pokemon, lang);
  }

  function changeLang(next: string) {
    setLang(next);
    if (searched) void loadPrints(pokemon, next);
  }

  async function toggleOwned(detail: TcgdexCardDetail) {
    const sb = getSupabase();
    if (!sb || !userId || busyIds.has(detail.id)) return;
    setBusyIds((s) => new Set(s).add(detail.id));
    try {
      if (owned.has(detail.id)) {
        const { error } = await sb
          .from("tcg_master_set")
          .delete()
          .eq("user_id", userId)
          .eq("card_id", detail.id)
          .eq("language", lang);
        if (!error) {
          setOwned((s) => {
            const n = new Set(s);
            n.delete(detail.id);
            return n;
          });
          setOwnedTotal((t) => Math.max(0, t - 1));
        }
      } else {
        const { error } = await sb.from("tcg_master_set").insert({
          user_id: userId,
          card_id: detail.id,
          card_name: detail.name,
          set_name: detail.setName,
          language: lang,
          image_url: detail.image,
        });
        if (!error) {
          if (isMissingTable(error)) setSetupNeeded(true);
          setOwned((s) => new Set(s).add(detail.id));
          setOwnedTotal((t) => t + 1);
          void unlockAchievement(userId, "master-set-first").catch(() => {});
        } else if (isMissingTable(error)) {
          setSetupNeeded(true);
        }
      }
    } finally {
      setBusyIds((s) => {
        const n = new Set(s);
        n.delete(detail.id);
        return n;
      });
    }
  }

  if (setupNeeded) {
    return (
      <p className="mt-8 rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
        {MASTER_SETUP_NOTE}
      </p>
    );
  }

  const langLabel = TCGDEX_LANGUAGES.find((l) => l.code === lang)?.label ?? lang;

  // Species autocomplete for the Pokémon picker (lightweight index, 1025 entries).
  const speciesSuggestions = useMemo(() => {
    const q = pokemon.trim().toLowerCase();
    if (q.length < 2) return [];
    return (speciesIndex as { name: string }[])
      .filter((s) => s.name.toLowerCase().startsWith(q))
      .slice(0, 8)
      .map((s) => s.name);
  }, [pokemon]);

  return (
    <div>
      {/* Price movers digest */}
      {userId && movers.length > 0 && (
        <section aria-label="Price movers" className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            📈 Price movers <span className="text-xs font-semibold text-slate-400">7-day, ±10%+</span>
          </h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {movers.map((m) => {
              const up = m.pctChange >= 0;
              const langName =
                TCGDEX_LANGUAGES.find((l) => l.code === m.language)?.label ?? m.language;
              return (
                <div
                  key={`${m.cardId}-${m.language}`}
                  className="w-44 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <TcgImage baseUrl={m.imageUrl} alt={m.cardName} />
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {m.cardName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {langName}
                      {m.setName ? ` · ${m.setName}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatPrice(m.oldPrice, m.currency)} →{" "}
                      {formatPrice(m.newPrice, m.currency)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                        up
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {up ? "▲" : "▼"} {Math.abs(m.pctChange).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pokémon + language pickers */}
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={pokemon}
          onChange={(e) => setPokemon(e.target.value)}
          placeholder="Pokémon — e.g. Sylveon"
          aria-label="Pokémon"
          list="master-set-species"
          autoComplete="off"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <datalist id="master-set-species">
          {speciesSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <select
          value={lang}
          onChange={(e) => changeLang(e.target.value)}
          aria-label="Language"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {TCGDEX_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || pokemon.trim().length < 2}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Show prints"}
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Every print of that Pokémon — all sets, all variants — in {langLabel}. Card data
        and prices via TCGdex (TCGPlayer USD + Cardmarket EUR, updated daily
        {pricesUpdated ? `, last ${pricesUpdated}` : ""}).
      </p>

      {error && (
        <div className="mt-6 rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-200 dark:bg-red-950/30 dark:ring-red-900">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void loadPrints(pokemon, lang)}
            className="mt-3 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && searched && prints.length === 0 && (
        <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
          No {langLabel} prints found for “{pokemon.trim()}”.
        </p>
      )}

      {prints.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {owned.size}/{prints.length} {langLabel} prints owned
              </p>
              <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(owned.size / prints.length) * 100}%` }}
                />
              </div>
              {userId && ownedTotal > 0 && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {ownedTotal} total across all languages
                </p>
              )}
            </div>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["USD", "EUR"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold ${
                    currency === c
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {c === "USD" ? "$ USD" : "€ EUR"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {prints.map((d) => {
              const isOwned = owned.has(d.id);
              const busy = busyIds.has(d.id);
              const price = currency === "USD" ? d.pricing.usd : d.pricing.eur;
              return (
                <div
                  key={d.id}
                  className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition dark:bg-slate-900 ${
                    isOwned
                      ? "ring-2 ring-emerald-500 dark:ring-emerald-400"
                      : "ring-slate-200 dark:ring-slate-700"
                  }`}
                >
                  <div className="relative">
                    <TcgImage
                      baseUrl={d.image}
                      alt={`${d.name} (${d.setName})`}
                    />
                    {isOwned && (
                      <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                        ✓ Owned
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {d.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {d.setName} · #{d.localId}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {variantBadges(d.variants).map((b) => (
                        <span
                          key={b}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {b}
                        </span>
                      ))}
                      {d.rarity && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {d.rarity}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-black tabular-nums text-slate-800 dark:text-slate-100">
                      {formatPrice(price, currency)}
                      <span className="ml-1 text-[11px] font-semibold text-slate-400">
                        market
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={!userId || busy}
                      onClick={() => void toggleOwned(d)}
                      title={userId ? undefined : "Sign in to track ownership"}
                      className={`mt-2 w-full rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
                        isOwned
                          ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {busy ? "Saving…" : isOwned ? "✓ In master set" : "+ I own this"}
                    </button>
                    {userId && (
                      <button
                        type="button"
                        onClick={() =>
                          onTogglePin({
                            cardId: d.id,
                            cardName: d.name,
                            imageUrl: d.image ? `${d.image}/low.webp` : null,
                            setName: d.setName,
                          })
                        }
                        title={
                          pinnedIds.has(d.id)
                            ? "Remove from your binder showcase"
                            : "Pin to your binder showcase"
                        }
                        className={`mt-1.5 w-full rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          pinnedIds.has(d.id)
                            ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900"
                            : "bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-violet-950 dark:hover:text-violet-300"
                        }`}
                      >
                        {pinnedIds.has(d.id) ? "📌 Pinned to binder" : "📌 Pin to binder"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Value dashboard — total market value, breakdown by set, top cards,  */
/* and 7-day movers (all priced live via TCGdex).                      */
/* ------------------------------------------------------------------ */

const VALUE_SETUP_NOTE =
  "One-time setup needed: run supabase/migration-tcg-collection.sql, supabase/migration-tcg-master-set.sql, and supabase/migration-tcg-price-alerts.sql in the Supabase SQL Editor, then refresh.";

/** Session-level price cache so the dashboard doesn't hammer TCGdex. */
const valuePriceCache = new Map<string, CardPricing | null>();

interface MasterSetRow {
  card_id: string;
  card_name: string;
  set_name: string | null;
  language: string;
  image_url: string | null;
}

interface ValueLine {
  key: string;
  cardId: string;
  name: string;
  setName: string;
  imageUrl: string | null;
  qty: number;
  usd: number | null;
  eur: number | null;
}

function CurrencyToggle({
  currency,
  onChange,
}: {
  currency: "USD" | "EUR";
  onChange: (c: "USD" | "EUR") => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {(["USD", "EUR"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={currency === c}
          className={`rounded-lg px-3 py-1 text-xs font-bold ${
            currency === c
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {c === "USD" ? "$ USD" : "€ EUR"}
        </button>
      ))}
    </div>
  );
}

/** Fetch prices for many card ids with a concurrency cap, using the cache. */
async function fetchValuePrices(cardIds: string[]): Promise<void> {
  const queue = [...cardIds].filter((id) => !valuePriceCache.has(id));
  const workers: Promise<void>[] = [];
  const next = async () => {
    while (queue.length > 0) {
      const id = queue.shift()!;
      try {
        const detail = await englishDetail(id);
        valuePriceCache.set(id, detail ? detail.pricing : null);
      } catch {
        valuePriceCache.set(id, null);
      }
    }
  };
  for (let i = 0; i < Math.min(6, queue.length); i++) workers.push(next());
  await Promise.all(workers);
}

function ValuePane({
  userId,
  collectionRows,
  wantRows,
  onToast,
  onViewAlertCard,
  onAlertsCount,
}: {
  userId: string;
  collectionRows: TcgRow[];
  wantRows: TcgRow[];
  onToast: (msg: string) => void;
  onViewAlertCard: (cardId: string) => void;
  onAlertsCount: (count: number) => void;
}) {
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<ValueLine[]>([]);
  const [currency, setCurrency] = useState<"USD" | "EUR">("USD");
  const [movers, setMovers] = useState<PriceMover[]>([]);
  const [alerts, setAlerts] = useState<PriceMover[]>([]);
  const unlockedRef = useRef(false);
  const dealHunterRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    void (async () => {
      // Master Set rows count as 1 each toward portfolio value.
      const { data: masterData, error: masterErr } = await sb
        .from("tcg_master_set")
        .select("card_id,card_name,set_name,language,image_url")
        .eq("user_id", userId);
      if (cancelled) return;
      let masterRows: MasterSetRow[] = [];
      if (masterErr) {
        if (isMissingTable(masterErr)) setMissing(true);
      } else {
        masterRows = (masterData as MasterSetRow[]) ?? [];
      }

      // Price movers digest (best-effort, same as Master Set tab).
      try {
        const m = await getPriceMovers(
          sb as unknown as Parameters<typeof getPriceMovers>[0],
          userId
        );
        if (!cancelled) setMovers(m);
      } catch {
        /* ignore */
      }

      // Best-effort daily snapshots for the movers digest and price alerts —
      // want-list cards first so a fresh drop shows up right away.
      try {
        await Promise.all([
          snapshotWantListPrices(
            sb as unknown as Parameters<typeof snapshotWantListPrices>[0],
            userId
          ),
          snapshotTrackedPrices(
            sb as unknown as Parameters<typeof snapshotTrackedPrices>[0],
            userId
          ),
        ]);
      } catch {
        /* ignore */
      }

      // 🔔 Price alerts: 7-day drops of 10%+ on want-listed + tracked cards,
      // minus ones the user dismissed (a dismissal expires when a NEWER
      // snapshot arrives — compare against the latest snapshot per card).
      try {
        const drops = await getPriceMovers(
          sb as unknown as Parameters<typeof getPriceMovers>[0],
          userId,
          10,
          "drops"
        );
        if (cancelled) return;
        const dismissed = new Map<string, string>();
        const { data: disData, error: disErr } = await sb
          .from("dismissed_alerts")
          .select("card_id,dismissed_at")
          .eq("user_id", userId);
        if (!disErr) {
          for (const d of (disData as { card_id: string; dismissed_at: string }[]) ?? []) {
            dismissed.set(d.card_id, d.dismissed_at.slice(0, 10));
          }
        }
        if (cancelled) return;
        const visible = drops.filter((a) => {
          const d = dismissed.get(a.cardId);
          // Hidden only while the dismissal is as fresh as the latest snapshot.
          return !d || !a.latestSnapDate || d < a.latestSnapDate;
        });
        if (!cancelled) {
          setAlerts(visible);
          onAlertsCount(visible.length);
        }
      } catch {
        /* ignore */
      }

      const ids = new Set<string>();
      for (const r of collectionRows) ids.add(r.card_id);
      for (const r of masterRows) ids.add(r.card_id);
      await fetchValuePrices([...ids]);
      if (cancelled) return;

      const built: ValueLine[] = [];
      collectionRows.forEach((r, i) => {
        const p = valuePriceCache.get(r.card_id) ?? null;
        built.push({
          key: `c-${r.card_id}-${i}`,
          cardId: r.card_id,
          name: r.card_name,
          setName: r.set_name ?? "Unknown set",
          imageUrl: r.image_url,
          qty: r.quantity,
          usd: p?.usd ?? null,
          eur: p?.eur ?? null,
        });
      });
      masterRows.forEach((r, i) => {
        const p = valuePriceCache.get(r.card_id) ?? null;
        built.push({
          key: `m-${r.card_id}-${r.language}-${i}`,
          cardId: r.card_id,
          name: r.card_name,
          setName: r.set_name ?? "Unknown set",
          imageUrl: r.image_url,
          qty: 1,
          usd: p?.usd ?? null,
          eur: p?.eur ?? null,
        });
      });
      setLines(built);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, collectionRows, onAlertsCount]);

  const totalUsd = useMemo(
    () => lines.reduce((s, l) => s + (l.usd ?? 0) * l.qty, 0),
    [lines]
  );
  const totalEur = useMemo(
    () => lines.reduce((s, l) => s + (l.eur ?? 0) * l.qty, 0),
    [lines]
  );
  const total = currency === "USD" ? totalUsd : totalEur;
  const pricedCount = useMemo(
    () => lines.filter((l) => (currency === "USD" ? l.usd : l.eur) != null).length,
    [lines, currency]
  );

  // 🏆 High Roller: portfolio passes $100 market value.
  useEffect(() => {
    if (loading || !userId || totalUsd < 100 || unlockedRef.current) return;
    unlockedRef.current = true;
    unlockAchievement(userId, "high-roller")
      .then((ok) => {
        if (ok) onToast("💎 Achievement unlocked: High Roller!");
      })
      .catch(() => {});
  }, [loading, userId, totalUsd, onToast]);

  // 🏷️ Deal Hunter: fires the first time the alerts section renders with
  // at least one alert for a signed-in user.
  useEffect(() => {
    if (!userId || alerts.length === 0 || dealHunterRef.current) return;
    dealHunterRef.current = true;
    try {
      unlockAchievement(userId, "deal-hunter")
        .then((ok) => {
          if (ok) onToast("🏷️ Achievement unlocked: Deal Hunter!");
        })
        .catch(() => {});
    } catch {
      /* never break the page over an achievement */
    }
  }, [userId, alerts, onToast]);

  // Keep the Value tab badge in sync as alerts get dismissed.
  useEffect(() => {
    onAlertsCount(alerts.length);
  }, [alerts, onAlertsCount]);

  const wantIds = useMemo(() => new Set(wantRows.map((r) => r.card_id)), [wantRows]);

  const dismissAlert = useCallback(
    async (cardId: string) => {
      const sb = getSupabase();
      if (!sb || !userId) return;
      const { error } = await sb
        .from("dismissed_alerts")
        .upsert({ user_id: userId, card_id: cardId }, { onConflict: "user_id,card_id" });
      if (!error) {
        setAlerts((prev) => prev.filter((a) => a.cardId !== cardId));
        onToast("🔕 Alert dismissed — it can reappear if the price drops again.");
      }
    },
    [userId, onToast]
  );

  const setGroups = useMemo(() => {
    const map = new Map<string, { name: string; usd: number; eur: number }>();
    for (const l of lines) {
      const g = map.get(l.setName) ?? { name: l.setName, usd: 0, eur: 0 };
      g.usd += (l.usd ?? 0) * l.qty;
      g.eur += (l.eur ?? 0) * l.qty;
      map.set(l.setName, g);
    }
    const arr = [...map.values()];
    arr.sort((a, b) => (currency === "USD" ? b.usd - a.usd : b.eur - a.eur));
    return arr;
  }, [lines, currency]);

  const topCards = useMemo(() => {
    const priced = lines
      .map((l) => ({
        ...l,
        unit: currency === "USD" ? l.usd : l.eur,
      }))
      .filter((l) => l.unit != null && l.unit > 0);
    priced.sort((a, b) => b.unit! * b.qty - a.unit! * a.qty);
    return priced.slice(0, 10);
  }, [lines, currency]);

  if (missing) {
    return (
      <p className="mt-8 rounded-2xl bg-amber-50 p-6 text-center text-sm text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900">
        {VALUE_SETUP_NOTE}
      </p>
    );
  }
  if (loading) {
    return (
      <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
        💰 Crunching card values…
      </p>
    );
  }
  if (lines.length === 0) {
    return (
      <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
        Nothing to value yet — add cards from the Search tab or mark prints in
        the Master Set tab.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Portfolio total */}
      <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Total collection value
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatPrice(total, currency)}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {pricedCount} of {lines.length} cards with{" "}
              {currency === "USD" ? "TCGPlayer market" : "Cardmarket avg"} data
              {pricedCount < lines.length ? " — cards without data count as $0" : ""}
            </p>
          </div>
          <CurrencyToggle currency={currency} onChange={setCurrency} />
        </div>
      </section>

      {/* Value by set */}
      <section aria-label="Value by set">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          📊 Value by set
        </h2>
        <div className="mt-3 space-y-2">
          {setGroups.map((g) => {
            const v = currency === "USD" ? g.usd : g.eur;
            const pct = total > 0 ? Math.min(100, (v / total) * 100) : 0;
            return (
              <div
                key={g.name}
                className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {g.name}
                  </span>
                  <span className="shrink-0 text-sm font-black tabular-nums text-slate-800 dark:text-slate-100">
                    {formatPrice(v, currency)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top 10 most valuable */}
      <section aria-label="Most valuable cards">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          🏆 Top 10 most valuable
        </h2>
        {topCards.length > 0 ? (
          <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {topCards.map((l, i) => (
              <li
                key={l.key}
                className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              >
                <span className="absolute left-2 top-2 z-10 rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-black tabular-nums text-white dark:bg-slate-100/90 dark:text-slate-900">
                  #{i + 1}
                </span>
                {l.imageUrl ? (
                  <img
                    src={l.imageUrl}
                    alt={`${l.name} (${l.setName})`}
                    loading="lazy"
                    className="aspect-[245/337] w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex aspect-[245/337] w-full items-center justify-center bg-slate-100 text-3xl dark:bg-slate-800">
                    🃏
                  </div>
                )}
                <div className="p-2.5">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {l.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {l.setName}
                    {l.qty > 1 ? ` · ×${l.qty}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatPrice(l.unit! * l.qty, currency)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            No market prices found for your cards yet.
          </p>
        )}
      </section>

      {/* 🔔 Price alerts: 7-day drops of 10%+ on want-listed + tracked cards */}
      {alerts.length > 0 && (
        <section aria-label="Price alerts">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            🔔 Price alerts{" "}
            <span className="text-xs font-semibold text-slate-400">
              7-day drops of 10%+ on your want list &amp; tracked prints
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {alerts.map((a) => {
              const langName =
                TCGDEX_LANGUAGES.find((l) => l.code === a.language)?.label ?? a.language;
              const onWantList = wantIds.has(a.cardId);
              return (
                <div
                  key={`${a.cardId}-${a.language}`}
                  className="flex items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => onViewAlertCard(a.cardId)}
                    aria-label={`View ${a.cardName}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="w-12 shrink-0">
                      <TcgImage baseUrl={a.imageUrl} alt={a.cardName} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                        {a.cardName}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {onWantList ? "⭐ Want list" : `🌍 ${langName}`}
                        {a.setName ? ` · ${a.setName}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {formatPrice(a.oldPrice, a.currency)} →{" "}
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {formatPrice(a.newPrice, a.currency)}
                        </span>
                        <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                          ▼ {Math.abs(a.pctChange).toFixed(0)}%
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      View →
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void dismissAlert(a.cardId)}
                    aria-label={`Dismiss price alert for ${a.cardName}`}
                    title="Dismiss"
                    className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Tap a card to jump to it. Dismissed alerts stay hidden until the next price snapshot.
          </p>
        </section>
      )}

      {/* 7-day movers */}
      <section aria-label="Price movers">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          📈 Biggest 7-day movers{" "}
          <span className="text-xs font-semibold text-slate-400">±10%+</span>
        </h2>
        {movers.length > 0 ? (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {movers.map((m) => {
              const up = m.pctChange >= 0;
              const langName =
                TCGDEX_LANGUAGES.find((l) => l.code === m.language)?.label ?? m.language;
              return (
                <div
                  key={`${m.cardId}-${m.language}`}
                  className="w-44 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <TcgImage baseUrl={m.imageUrl} alt={m.cardName} />
                  <div className="p-3">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {m.cardName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {langName}
                      {m.setName ? ` · ${m.setName}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatPrice(m.oldPrice, m.currency)} →{" "}
                      {formatPrice(m.newPrice, m.currency)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                        up
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {up ? "▲" : "▼"} {Math.abs(m.pctChange).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-slate-100 p-5 text-center text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            No notable 7-day price moves yet — prices get snapshotted daily for
            your want list and cards you track in the Master Set view, so check
            back once a week of history builds up.
          </p>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export default function TcgCollectionPage() {
  const [tab, setTab] = useState<Tab>("search");
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rows, setRows] = useState<TcgRow[]>([]);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [progress, setProgress] = useState<Record<string, { owned: number; total: number }>>({});
  const [progressError, setProgressError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pins, setPins] = useState<BinderPin[]>([]);
  const [binderSetupNeeded, setBinderSetupNeeded] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [pinBusyIds, setPinBusyIds] = useState<Set<string>>(new Set());
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    getSupabase()
      ?.auth.getUser()
      .then(({ data }: { data: { user?: { id?: string } | null } }) => {
        setUserId(data.user?.id ?? null);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, []);

  const loadRows = useCallback(async (uid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from("tcg_collection")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      if (isMissingTable(error)) setSetupNeeded(true);
      return;
    }
    setSetupNeeded(false);
    setRows((data as TcgRow[]) ?? []);
  }, []);

  useEffect(() => {
    if (userId) void loadRows(userId);
  }, [userId, loadRows]);

  /* Binder showcase pins (for the 📌 Pin to binder actions). */
  const loadPins = useCallback(async (uid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error } = await sb
      .from("binder_showcase")
      .select("card_id, position")
      .eq("user_id", uid);
    if (error) {
      if (isMissingTable(error)) setBinderSetupNeeded(true);
      return;
    }
    setBinderSetupNeeded(false);
    setPins((((data as BinderPin[] | null) ?? []).slice(0, 9)));
  }, []);

  useEffect(() => {
    if (!userId) return;
    void loadPins(userId);
    const sb = getSupabase();
    if (sb) {
      void sb
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }: { data: { username?: string } | null }) => {
          setProfileUsername(data?.username ?? null);
        })
        .catch(() => {});
    }
  }, [userId, loadPins]);

  const pinnedIds = useMemo(() => new Set(pins.map((p) => p.card_id)), [pins]);

  const togglePin = useCallback(
    async (target: PinTarget) => {
      const sb = getSupabase();
      if (!sb || !userId || pinBusyIds.has(target.cardId)) return;
      setPinBusyIds((s) => new Set(s).add(target.cardId));
      try {
        if (pinnedIds.has(target.cardId)) {
          const { error } = await sb
            .from("binder_showcase")
            .delete()
            .eq("user_id", userId)
            .eq("card_id", target.cardId);
          if (error) {
            setToast("Couldn't unpin that card — try again.");
            return;
          }
          setPins((prev) => prev.filter((p) => p.card_id !== target.cardId));
          setToast(`Unpinned ${target.cardName} from your binder`);
          return;
        }
        if (binderSetupNeeded) {
          setToast(BINDER_SETUP_NOTE);
          return;
        }
        if (pins.length >= 9) {
          setToast("Your binder showcase is full — unpin a card to make room.");
          return;
        }
        const position = nextFreePosition(pins);
        const { error } = await sb.from("binder_showcase").insert({
          user_id: userId,
          card_id: target.cardId,
          card_name: target.cardName,
          image_url: target.imageUrl,
          set_name: target.setName,
          position,
        });
        if (error) {
          if (isMissingTable(error)) {
            setBinderSetupNeeded(true);
            setToast(BINDER_SETUP_NOTE);
            return;
          }
          if ((error as { code?: string }).code === "23505") {
            // Already pinned (unique violation) — resync and carry on.
            void loadPins(userId);
            return;
          }
          setToast("Couldn't pin that card — try again.");
          return;
        }
        setPins((prev) => [...prev, { card_id: target.cardId, position }]);
        setToast(`📌 Pinned ${target.cardName} to your binder (${pins.length + 1}/9)`);
      } finally {
        setPinBusyIds((s) => {
          const n = new Set(s);
          n.delete(target.cardId);
          return n;
        });
      }
    },
    [userId, pins, pinnedIds, binderSetupNeeded, pinBusyIds, loadPins],
  );

  /* Per-set completion: fetch each owned set's full card list once (cached
     in lib/tcg) and compare against owned ids. Gentle: one request per set,
     then cached for the session. */
  useEffect(() => {
    const setIds = [...new Set(rows.filter((r) => r.set_id).map((r) => r.set_id as string))];
    if (setIds.length === 0) {
      setProgress({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        setIds.map(async (setId) => {
          try {
            const allIds = await fetchSetCardIds(setId);
            const ownedIds = new Set(
              rows.filter((r) => r.set_id === setId).map((r) => r.card_id),
            );
            const owned = allIds.filter((id) => ownedIds.has(id)).length;
            return [setId, { owned, total: allIds.length }] as const;
          } catch {
            return [setId, null] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, { owned: number; total: number }> = {};
      let failed = false;
      for (const [setId, p] of entries) {
        if (p) next[setId] = p;
        else failed = true;
      }
      setProgress(next);
      setProgressError(failed);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const collection = useMemo(() => rows.filter((r) => r.list === "collection"), [rows]);
  const want = useMemo(() => rows.filter((r) => r.list === "want"), [rows]);

  const totalCards = useMemo(
    () => collection.reduce((sum, r) => sum + r.quantity, 0),
    [collection],
  );
  const completedSets = useMemo(
    () =>
      Object.values(progress).filter((p) => p.total > 0 && p.owned >= p.total).length,
    [progress],
  );

  const addCard = useCallback(
    async (card: TcgCard, list: ListKind) => {
      const sb = getSupabase();
      if (!sb || !userId) return;
      const existing = rows.find((r) => r.card_id === card.id && r.list === list);
      const wasFirstCard = list === "collection" && collection.length === 0;
      if (existing) {
        const { error } = await sb
          .from("tcg_collection")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.id);
        if (!error) void loadRows(userId);
      } else {
        const { error } = await sb.from("tcg_collection").insert({
          user_id: userId,
          card_id: card.id,
          card_name: card.name,
          set_id: card.setId || null,
          set_name: card.setName,
          image_url: card.imageSmall || null,
          quantity: 1,
          list,
        });
        if (error) return;
        void loadRows(userId);
        if (wasFirstCard) {
          // Fire-and-forget: never let the achievement break the add.
          void unlockAchievement(userId, "first-card").then((ok) => {
            if (ok) setToast("🃏 Achievement unlocked: First Card!");
          });
        }
      }
      if (!wasFirstCard) {
        setToast(
          list === "collection"
            ? `Added ${card.name} to your collection`
            : `Added ${card.name} to your want list`,
        );
      }
    },
    [userId, rows, collection.length, loadRows],
  );

  const setQty = useCallback(
    async (row: TcgRow, qty: number) => {
      const sb = getSupabase();
      if (!sb || !userId) return;
      if (qty <= 0) {
        const { error } = await sb.from("tcg_collection").delete().eq("id", row.id);
        if (!error) void loadRows(userId);
      } else {
        const { error } = await sb
          .from("tcg_collection")
          .update({ quantity: qty })
          .eq("id", row.id);
        if (!error) void loadRows(userId);
      }
    },
    [userId, loadRows],
  );

  const removeRow = useCallback(
    async (row: TcgRow) => {
      const sb = getSupabase();
      if (!sb || !userId) return;
      const { error } = await sb.from("tcg_collection").delete().eq("id", row.id);
      if (!error) {
        void loadRows(userId);
        setToast(`Removed ${row.card_name}`);
      }
    },
    [userId, loadRows],
  );

  const moveRow = useCallback(
    async (row: TcgRow, to: ListKind) => {
      const sb = getSupabase();
      if (!sb || !userId) return;
      const target = rows.find((r) => r.card_id === row.card_id && r.list === to);
      if (target) {
        // Merge quantities into the existing entry on the other list.
        await sb
          .from("tcg_collection")
          .update({ quantity: target.quantity + row.quantity })
          .eq("id", target.id);
        await sb.from("tcg_collection").delete().eq("id", row.id);
      } else {
        await sb.from("tcg_collection").update({ list: to }).eq("id", row.id);
      }
      void loadRows(userId);
      setToast(`Moved ${row.card_name} to ${to === "collection" ? "collection" : "want list"}`);
    },
    [userId, rows, loadRows],
  );

  const tabs: { id: Tab; label: string; count?: number; countClass?: string }[] = [
    { id: "search", label: "🔍 Search" },
    { id: "collection", label: "📦 My Collection", count: collection.length },
    { id: "want", label: "⭐ Want List", count: want.length },
    { id: "master", label: "🌍 Master Set" },
    {
      id: "value",
      label: "💰 Value",
      count: alertCount,
      countClass: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
  ];

  /** Jump from a price alert to the card: Want List if it's there, else Master Set. */
  const jumpToAlertCard = useCallback(
    (cardId: string) => {
      const isWant = rows.some((r) => r.card_id === cardId && r.list === "want");
      setTab(isWant ? "want" : "master");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [rows]
  );

  const handleAlertsCount = useCallback((n: number) => setAlertCount(n), []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            🃏 TCG Collection Tracker
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Search every Pokémon TCG card, track what you own and what you&apos;re hunting — by set.
          </p>
        </div>
        {userId && profileUsername && (
          <Link
            href={`/binder/${encodeURIComponent(profileUsername)}`}
            className="mt-1 shrink-0 rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-mint hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
          >
            📸 View my binder
          </Link>
        )}
      </div>

      {userId && collection.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Total cards", value: String(totalCards) },
            { label: "Unique cards", value: String(collection.length) },
            { label: "Completed sets", value: String(completedSets) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
            >
              <div className="text-2xl font-black tabular-nums text-slate-800 dark:text-slate-100">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px px-4 py-2 text-sm font-semibold ${
              tab === t.id
                ? "border-b-2 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
            {typeof t.count === "number" && t.count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-xs tabular-nums ${
                  t.countClass ?? "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {authChecked && !userId && tab !== "search" && (
          <div className="mb-6 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Sign in to save your collection and want list.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sign in
            </Link>
          </div>
        )}

        {tab === "search" && <SearchPane userId={userId} rows={rows} onAdd={addCard} />}
        {tab === "collection" &&
          (userId ? (
            <CollectionPane
              rows={collection}
              progress={progress}
              progressError={progressError}
              setupNeeded={setupNeeded}
              onQty={setQty}
              onMove={moveRow}
              onRemove={removeRow}
              pinnedIds={pinnedIds}
              onTogglePin={togglePin}
            />
          ) : (
            authChecked && (
              <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
                Sign in above, then come back to see your collection.
              </p>
            )
          ))}
        {tab === "want" &&
          (userId ? (
            <WantPane
              rows={want}
              setupNeeded={setupNeeded}
              onQty={setQty}
              onMove={moveRow}
              onRemove={removeRow}
            />
          ) : (
            authChecked && (
              <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
                Sign in above, then come back to see your want list.
              </p>
            )
          ))}
        {tab === "master" && (
          <MasterSetPane userId={userId} pinnedIds={pinnedIds} onTogglePin={togglePin} />
        )}
        {tab === "value" &&
          (userId ? (
            <ValuePane
              userId={userId}
              collectionRows={collection}
              wantRows={want}
              onToast={setToast}
              onViewAlertCard={jumpToAlertCard}
              onAlertsCount={handleAlertsCount}
            />
          ) : (
            authChecked && (
              <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
                Sign in above, then come back to see your collection&apos;s value.
              </p>
            )
          ))}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </main>
  );
}
