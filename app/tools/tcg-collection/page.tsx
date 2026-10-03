"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";
import { fetchSetCardIds, searchCards, type TcgCard } from "@/lib/tcg";
import {
  TCGDEX_LANGUAGES,
  detailsForPrints,
  formatPrice,
  getPriceMovers,
  searchPrints,
  snapshotTrackedPrices,
  variantBadges,
  type PriceMover,
  type TcgdexCardDetail,
  type TcgdexCardSummary,
} from "@/lib/tcgdex";

type ListKind = "collection" | "want";
type Tab = "search" | "collection" | "want" | "master";

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
}: {
  row: TcgRow;
  rarity?: string | null;
  otherList: ListKind;
  onQty: (row: TcgRow, qty: number) => void;
  onMove: (row: TcgRow, to: ListKind) => void;
  onRemove: (row: TcgRow) => void;
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
}: {
  rows: TcgRow[];
  progress: Record<string, { owned: number; total: number }>;
  progressError: boolean;
  setupNeeded: boolean;
  onQty: (row: TcgRow, qty: number) => void;
  onMove: (row: TcgRow, to: ListKind) => void;
  onRemove: (row: TcgRow) => void;
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "search", label: "🔍 Search" },
    { id: "collection", label: "📦 My Collection", count: collection.length },
    { id: "want", label: "⭐ Want List", count: want.length },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        🃏 TCG Collection Tracker
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Search every Pokémon TCG card, track what you own and what you&apos;re hunting — by set.
      </p>

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
              <span className="ml-1.5 rounded-full bg-slate-200 px-2 py-0.5 text-xs tabular-nums dark:bg-slate-700">
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
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </main>
  );
}
