/**
 * Pokémon TCG API client (pokemontcg.io, v2).
 *
 * Public API — no key needed for reasonable use. To stay gentle:
 *  - searchCards() callers should debounce (the page uses 500ms)
 *  - results are cached in-memory (Map) for this session
 *  - `select=` keeps payloads small; set card lists are fetched at 250/page
 *    and cached so completion stats don't re-hit the API
 *
 * Any network/API failure surfaces as a thrown Error with a friendly
 * message — callers show a retry state rather than breaking the page.
 */

export interface TcgCard {
  id: string;
  name: string;
  number: string;
  rarity: string | null;
  setId: string;
  setName: string;
  setSeries: string;
  /** Printed/total card count for the set (completion denominator). */
  setTotal: number | null;
  imageSmall: string;
  imageLarge: string;
}

interface ApiCard {
  id: string;
  name: string;
  number?: string;
  rarity?: string | null;
  set?: {
    id?: string;
    name?: string;
    series?: string;
    total?: number;
    printedTotal?: number;
  };
  images?: { small?: string; large?: string };
}

const BASE = "https://api.pokemontcg.io/v2";
const SEARCH_SELECT = "id,name,number,rarity,set,images";
const SET_IDS_SELECT = "id";
const PAGE_SIZE = 250;
/** Cache TTL: card data changes rarely; 1h keeps repeat visits cheap. */
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry<T> {
  at: number;
  value: T;
}

const searchCache = new Map<string, CacheEntry<TcgCard[]>>();
/** setId -> full card-id list for the set */
const setIdsCache = new Map<string, CacheEntry<string[]>>();

function fresh<T>(entry: CacheEntry<T> | undefined): T | null {
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) return null;
  return entry.value;
}

function mapCard(c: ApiCard): TcgCard {
  return {
    id: c.id,
    name: c.name,
    number: c.number ?? "?",
    rarity: c.rarity ?? null,
    setId: c.set?.id ?? "",
    setName: c.set?.name ?? "Unknown set",
    setSeries: c.set?.series ?? "",
    setTotal: c.set?.total ?? c.set?.printedTotal ?? null,
    imageSmall: c.images?.small ?? "",
    imageLarge: c.images?.large ?? "",
  };
}

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  let lastError: Error | null = null;
  // The TCG API is flaky (intermittent 500/502s) — retry a few times
  // with backoff before giving up.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url);
    } catch {
      lastError = new Error("Couldn't reach the card database — check your connection and try again.");
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }
    if (res.status === 429) {
      throw new Error("The card database is rate-limiting us — wait a few seconds and try again.");
    }
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 750 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      throw new Error(`The card database returned an error (${res.status}) — try again in a moment.`);
    }
    return res.json();
  }
  throw lastError ?? new Error("The card database is having a rough moment — try again in a bit.");
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/**
 * Search cards by name. Returns up to `pageSize` results, ordered by name.
 * Gentle by design: results are cached per normalized query.
 */
export async function searchCards(query: string, pageSize = 24): Promise<TcgCard[]> {
  const key = normalizeQuery(query);
  if (key.length < 2) return [];
  const cached = fresh(searchCache.get(key));
  if (cached) return cached;

  const params = new URLSearchParams({
    q: `name:${key}*`,
    pageSize: String(pageSize),
    select: SEARCH_SELECT,
    orderBy: "name",
  });
  const json = (await fetchJson(`${BASE}/cards?${params}`)) as {
    data?: ApiCard[];
  };
  const cards = (json.data ?? []).map(mapCard);
  searchCache.set(key, { at: Date.now(), value: cards });
  return cards;
}

/**
 * Full list of card ids in a set (paginated, cached). Used for per-set
 * completion: owned ids ⊆ these ids means the set is complete.
 */
export async function fetchSetCardIds(setId: string): Promise<string[]> {
  const cached = fresh(setIdsCache.get(setId));
  if (cached) return cached;

  const ids: string[] = [];
  let page = 1;
  for (;;) {
    const params = new URLSearchParams({
      q: `set.id:${setId}`,
      page: String(page),
      pageSize: String(PAGE_SIZE),
      select: SET_IDS_SELECT,
      orderBy: "number",
    });
    const json = (await fetchJson(`${BASE}/cards?${params}`)) as {
      data?: { id: string }[];
      totalCount?: number;
    };
    const batch = (json.data ?? []).map((c) => c.id);
    ids.push(...batch);
    const total = json.totalCount ?? ids.length;
    if (ids.length >= total || batch.length === 0) break;
    page += 1;
  }
  setIdsCache.set(setId, { at: Date.now(), value: ids });
  return ids;
}
