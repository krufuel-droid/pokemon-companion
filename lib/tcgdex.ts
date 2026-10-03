/**
 * TCGdex API client (https://api.tcgdex.net/v2) — the multi-language
 * Pokémon TCG database. Powers the "Master Set" collector view:
 * every print of a Pokémon's cards in every supported language.
 *
 * Key facts (verified Oct 2026):
 * - Card IDs are STABLE across languages (base2-4 = Jungle Jolteon in
 *   en/fr/de). Name search is per-language, so search in ENGLISH to get
 *   IDs, then fetch each ID in the target language.
 * - Supported languages with real data: en, fr, de, es, it, pt.
 *   (ja exists but uses a different set-ID scheme — excluded.)
 * - Card detail includes `variants` (firstEdition/holo/normal/reverse/wPromo)
 *   and `pricing` (tcgplayer USD per finish + cardmarket EUR averages).
 * - Card images: the detail's `image` field, or construct by swapping the
 *   language segment of the English URL.
 *
 * Gentle by design: in-memory caches (1h TTL), concurrency-limited detail
 * fetching, and 5xx retries with backoff.
 */

export interface TcgdexLang {
  code: string;
  label: string;
}

export const TCGDEX_LANGUAGES: TcgdexLang[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
];

export interface TcgdexCardSummary {
  id: string;
  localId: string;
  name: string;
  image: string | null;
}

export interface TcgdexVariants {
  firstEdition: boolean;
  holo: boolean;
  normal: boolean;
  reverse: boolean;
  wPromo: boolean;
}

export interface TcgplayerFinishPrice {
  marketPrice: number | null;
  lowPrice: number | null;
}

export interface CardPricing {
  /** Best-guess market price in USD, matched to the card's finish. */
  usd: number | null;
  /** Best-guess market price in EUR (cardmarket avg). */
  eur: number | null;
  /** ISO timestamp of the freshest price source. */
  updated: string | null;
  /** Which tcgplayer finish key the USD price came from (for transparency). */
  usdFinish: string | null;
}

export interface TcgdexCardDetail {
  id: string;
  name: string;
  localId: string;
  setId: string;
  setName: string;
  rarity: string | null;
  image: string | null;
  variants: TcgdexVariants;
  pricing: CardPricing;
}

const BASE = "https://api.tcgdex.net/v2";
const CACHE_TTL_MS = 60 * 60 * 1000;
const DETAIL_CONCURRENCY = 6;

interface CacheEntry<T> {
  at: number;
  value: T;
}

const searchCache = new Map<string, CacheEntry<TcgdexCardSummary[]>>();
const detailCache = new Map<string, CacheEntry<TcgdexCardDetail | null>>();

function fresh<T>(entry: CacheEntry<T> | undefined): T | null {
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) return null;
  return entry.value;
}

async function fetchJson(url: string): Promise<unknown> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      lastError = new Error("Couldn't reach the card database.");
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }
    if (res.status === 404) return null;
    if (res.status === 429) throw new Error("Rate-limited — wait a moment and try again.");
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 750 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Card database error (${res.status}).`);
    return res.json();
  }
  throw lastError ?? new Error("Card database is having a rough moment.");
}

/**
 * Search cards by Pokémon name in ENGLISH. Returns one entry per print.
 */
export async function searchPrints(pokemonName: string): Promise<TcgdexCardSummary[]> {
  const key = pokemonName.trim().toLowerCase();
  if (key.length < 2) return [];
  const cached = fresh(searchCache.get(key));
  if (cached) return cached;
  const json = (await fetchJson(
    `${BASE}/en/cards?name=${encodeURIComponent(key)}`
  )) as { id: string; localId: string; name: string; image?: string }[] | null;
  const cards = (json ?? []).map((c) => ({
    id: c.id,
    localId: c.localId,
    name: c.name,
    image: c.image ?? null,
  }));
  searchCache.set(key, { at: Date.now(), value: cards });
  return cards;
}

function pickUsdPrice(
  finishes: Record<string, { marketPrice?: number | null; lowPrice?: number | null }>,
  variants: TcgdexVariants
): { price: number | null; finish: string | null } {
  const keys = Object.keys(finishes);
  if (keys.length === 0) return { price: null, finish: null };
  const candidates: string[] = [];
  if (variants.firstEdition) {
    candidates.push("1st-edition-holofoil", "1st-edition-normal", "1st-edition");
  }
  if (variants.holo) candidates.push("holofoil", "unlimited-holofoil");
  if (variants.reverse) candidates.push("reverse-holofoil", "reverse-holo");
  if (variants.normal) candidates.push("normal");
  candidates.push(...keys); // fall back to whatever exists
  for (const c of candidates) {
    const f = finishes[c];
    if (f && typeof f.marketPrice === "number") return { price: f.marketPrice, finish: c };
  }
  for (const c of candidates) {
    const f = finishes[c];
    if (f && typeof f.lowPrice === "number") return { price: f.lowPrice, finish: c };
  }
  return { price: null, finish: null };
}

function parsePricing(
  pricing: {
    tcgplayer?: { unit?: string; updated?: string } & Record<
      string,
      { marketPrice?: number | null; lowPrice?: number | null } | string | undefined
    >;
    cardmarket?: {
      unit?: string;
      updated?: string;
      avg?: number | null;
      trend?: number | null;
      "avg-holo"?: number | null;
      "trend-holo"?: number | null;
    };
  } | undefined,
  variants: TcgdexVariants
): CardPricing {
  const tp = pricing?.tcgplayer;
  const cm = pricing?.cardmarket;
  const finishes: Record<string, { marketPrice?: number | null; lowPrice?: number | null }> = {};
  if (tp) {
    for (const [k, v] of Object.entries(tp)) {
      if (k === "unit" || k === "updated") continue;
      if (v && typeof v === "object") finishes[k] = v;
    }
  }
  const { price: usd, finish: usdFinish } = pickUsdPrice(finishes, variants);
  const eur =
    (variants.holo ? (cm?.["avg-holo"] ?? cm?.["trend-holo"]) : null) ??
    cm?.avg ??
    cm?.trend ??
    null;
  const updated =
    (tp?.updated as string | undefined) ?? (cm?.updated as string | undefined) ?? null;
  return { usd, eur: typeof eur === "number" ? eur : null, updated, usdFinish };
}

/**
 * Full card detail in a given language. Pricing always comes from the
 * English record (tcgplayer/cardmarket are English-market sources), so
 * non-English callers should pass the English pricing through.
 */
export async function cardDetail(
  cardId: string,
  lang: string,
  englishPricing?: CardPricing
): Promise<TcgdexCardDetail | null> {
  const cacheKey = `${lang}:${cardId}`;
  const cached = detailCache.get(cacheKey);
  const hit = fresh(cached);
  if (hit !== null || (cached && Date.now() - cached.at <= CACHE_TTL_MS)) return hit;

  const json = (await fetchJson(`${BASE}/${lang}/cards/${encodeURIComponent(cardId)}`)) as {
    id: string;
    name: string;
    localId: string;
    rarity?: string;
    set?: { id?: string; name?: string };
    variants?: Partial<TcgdexVariants>;
    pricing?: {
      tcgplayer?: { unit?: string; updated?: string } & Record<
        string,
        { marketPrice?: number | null; lowPrice?: number | null } | string | undefined
      >;
      cardmarket?: {
        unit?: string;
        updated?: string;
        avg?: number | null;
        trend?: number | null;
        "avg-holo"?: number | null;
        "trend-holo"?: number | null;
      };
    };
  } | null;

  if (!json) {
    detailCache.set(cacheKey, { at: Date.now(), value: null });
    return null;
  }

  const variants: TcgdexVariants = {
    firstEdition: !!json.variants?.firstEdition,
    holo: !!json.variants?.holo,
    normal: !!json.variants?.normal,
    reverse: !!json.variants?.reverse,
    wPromo: !!json.variants?.wPromo,
  };

  // Pricing: prefer the passed English pricing for non-English languages;
  // otherwise parse it from this record (English fetches).
  const pricing = englishPricing ?? parsePricing(json.pricing, variants);

  // Image: resolved by the caller (detailsForPrints) via the English URL.
  const image: string | null = null;

  const detail: TcgdexCardDetail = {
    id: json.id,
    name: json.name,
    localId: json.localId,
    setId: json.set?.id ?? "",
    setName: json.set?.name ?? "Unknown set",
    rarity: json.rarity ?? null,
    image,
    variants,
    pricing,
  };
  detailCache.set(cacheKey, { at: Date.now(), value: detail });
  return detail;
}

/** English detail with image + pricing resolved. */
export async function englishDetail(cardId: string): Promise<TcgdexCardDetail | null> {
  const cacheKey = `en-full:${cardId}`;
  const cached = detailCache.get(cacheKey);
  const hit = fresh(cached);
  if (hit !== null || (cached && Date.now() - cached.at <= CACHE_TTL_MS)) return hit;

  const json = (await fetchJson(`${BASE}/en/cards/${encodeURIComponent(cardId)}`)) as {
    id: string;
    name: string;
    localId: string;
    rarity?: string;
    image?: string;
    set?: { id?: string; name?: string };
    variants?: Partial<TcgdexVariants>;
    pricing?: {
      tcgplayer?: { unit?: string; updated?: string } & Record<
        string,
        { marketPrice?: number | null; lowPrice?: number | null } | string | undefined
      >;
      cardmarket?: {
        unit?: string;
        updated?: string;
        avg?: number | null;
        trend?: number | null;
        "avg-holo"?: number | null;
        "trend-holo"?: number | null;
      };
    };
  } | null;

  if (!json) {
    detailCache.set(cacheKey, { at: Date.now(), value: null });
    return null;
  }
  const variants: TcgdexVariants = {
    firstEdition: !!json.variants?.firstEdition,
    holo: !!json.variants?.holo,
    normal: !!json.variants?.normal,
    reverse: !!json.variants?.reverse,
    wPromo: !!json.variants?.wPromo,
  };
  const pricing = parsePricing(json.pricing, variants);

  const detail: TcgdexCardDetail = {
    id: json.id,
    name: json.name,
    localId: json.localId,
    setId: json.set?.id ?? "",
    setName: json.set?.name ?? "Unknown set",
    rarity: json.rarity ?? null,
    image: json.image ?? null,
    variants,
    pricing,
  };
  detailCache.set(cacheKey, { at: Date.now(), value: detail });
  return detail;
}

/**
 * Fetch details for many cards with a concurrency cap. Returns a map of
 * cardId -> detail (missing entries = no data in that language).
 */
export async function detailsForPrints(
  cardIds: string[],
  lang: string
): Promise<Map<string, TcgdexCardDetail>> {
  const out = new Map<string, TcgdexCardDetail>();
  // English pricing is fetched once per card and reused across languages.
  const queue = [...cardIds];
  const workers: Promise<void>[] = [];
  const next = async () => {
    while (queue.length > 0) {
      const id = queue.shift()!;
      try {
        const en = await englishDetail(id);
        if (!en) continue;
        if (lang === "en") {
          out.set(id, en);
        } else {
          const loc = await cardDetail(id, lang, en.pricing);
          if (loc) {
            // Localized image: swap the language segment of the English URL.
            loc.image = en.image ? en.image.replace("/en/", `/${lang}/`) : null;
            out.set(id, loc);
          }
          // else: this print simply doesn't exist in that language — skip.
        }
      } catch {
        // Skip failed cards; the grid shows what loaded.
      }
    }
  };
  for (let i = 0; i < Math.min(DETAIL_CONCURRENCY, queue.length); i++) {
    workers.push(next());
  }
  await Promise.all(workers);
  return out;
}

/** Human-readable variant badges for a card. */
export function variantBadges(v: TcgdexVariants): string[] {
  const badges: string[] = [];
  if (v.firstEdition) badges.push("1st Ed");
  if (v.holo) badges.push("Holo");
  if (v.reverse) badges.push("Reverse");
  if (v.normal) badges.push("Normal");
  if (v.wPromo) badges.push("Promo");
  return badges;
}

export function formatPrice(value: number | null, currency: "USD" | "EUR"): string {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/* ------------------------------------------------------------------ */
/* Price snapshots + movers digest                                    */
/* ------------------------------------------------------------------ */

/**
 * Minimal Supabase-client shape (works with both the browser client and a
 * service-role client, so a future daily cron can call this directly).
 */
export interface SupabaseLike {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }>;
      order: (
        col: string,
        opts?: { ascending?: boolean }
      ) => Promise<{ data: unknown; error: unknown }>;
    };
    upsert: (
      row: Record<string, unknown>,
      opts?: { onConflict?: string; ignoreDuplicates?: boolean }
    ) => Promise<{ error: unknown }>;
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Snapshot today's market prices for every card the user tracks in the
 * Master Set view. One row per (card, language) per day max — the unique
 * constraint makes re-runs no-ops. Returns the number of snapshots written.
 *
 * Cron recipe (out of scope, for later): a daily job with a service-role
 * Supabase client can call `snapshotTrackedPrices(serviceClient, userId)`
 * for each user with tracked cards (or loop all users). Because snapshots
 * are keyed by snap_date, the cron is naturally idempotent.
 */
export async function snapshotTrackedPrices(
  supabase: SupabaseLike,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("tcg_master_set")
    .select("card_id,language")
    .eq("user_id", userId);
  if (error || !data) return 0;
  const pairs = [...new Set((data as { card_id: string; language: string }[]).map((r) => `${r.card_id}|||${r.language}`))];
  if (pairs.length === 0) return 0;

  const snapDate = todayISO();
  let written = 0;
  const queue = [...pairs];
  const next = async () => {
    while (queue.length > 0) {
      const pair = queue.shift()!;
      const [cardId, language] = pair.split("|||");
      try {
        const en = await englishDetail(cardId);
        if (!en) continue;
        const { error: upErr } = await supabase.from("tcg_price_snapshots").upsert(
          {
            user_id: userId,
            card_id: cardId,
            language,
            market_usd: en.pricing.usd,
            market_eur: en.pricing.eur,
            snap_date: snapDate,
          },
          { onConflict: "user_id,card_id,language,snap_date", ignoreDuplicates: true }
        );
        if (!upErr) written++;
      } catch {
        // Skip failed cards; snapshots are best-effort.
      }
    }
  };
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(4, queue.length); i++) workers.push(next());
  await Promise.all(workers);
  return written;
}

export interface PriceMover {
  cardId: string;
  cardName: string;
  setName: string | null;
  imageUrl: string | null;
  language: string;
  oldPrice: number | null;
  newPrice: number | null;
  pctChange: number;
  currency: "USD" | "EUR";
}

interface SnapshotRow {
  card_id: string;
  language: string;
  market_usd: number | null;
  market_eur: number | null;
  snap_date: string;
}

/**
 * Notable 7-day price moves (≥ minPct %, default 10) for the user's tracked
 * cards, from tcg_price_snapshots. Compares each card's latest snapshot
 * against the oldest snapshot within the trailing 7-day window.
 */
export async function getPriceMovers(
  supabase: SupabaseLike,
  userId: string,
  minPct = 10
): Promise<PriceMover[]> {
  const { data: snapData, error: snapErr } = await supabase
    .from("tcg_price_snapshots")
    .select("card_id,language,market_usd,market_eur,snap_date")
    .eq("user_id", userId);
  if (snapErr || !snapData) return [];
  const snaps = snapData as SnapshotRow[];
  if (snaps.length === 0) return [];

  const { data: trackData } = await supabase
    .from("tcg_master_set")
    .select("card_id,card_name,set_name,language,image_url")
    .eq("user_id", userId);
  const meta = new Map(
    ((trackData as { card_id: string; card_name: string; set_name: string | null; language: string; image_url: string | null }[] | null) ?? []).map(
      (r) => [`${r.card_id}|||${r.language}`, r]
    )
  );

  const groups = new Map<string, SnapshotRow[]>();
  for (const s of snaps) {
    const k = `${s.card_id}|||${s.language}`;
    const g = groups.get(k) ?? [];
    g.push(s);
    groups.set(k, g);
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const movers: PriceMover[] = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    const sorted = [...rows].sort((a, b) => (a.snap_date < b.snap_date ? -1 : 1));
    const latest = sorted[sorted.length - 1];
    const inWindow = sorted.filter((r) => r.snap_date >= cutoffISO);
    const oldest = inWindow.length > 0 ? inWindow[0] : sorted[0];
    if (oldest.snap_date === latest.snap_date) continue;

    // Prefer USD; fall back to EUR.
    let oldP: number | null = null;
    let newP: number | null = null;
    let currency: "USD" | "EUR" = "USD";
    if (oldest.market_usd != null && latest.market_usd != null) {
      oldP = oldest.market_usd;
      newP = latest.market_usd;
    } else if (oldest.market_eur != null && latest.market_eur != null) {
      oldP = oldest.market_eur;
      newP = latest.market_eur;
      currency = "EUR";
    } else {
      continue;
    }
    if (oldP === 0) continue;
    const pctChange = ((newP - oldP) / oldP) * 100;
    if (Math.abs(pctChange) < minPct) continue;
    const m = meta.get(key);
    movers.push({
      cardId: latest.card_id,
      cardName: m?.card_name ?? latest.card_id,
      setName: m?.set_name ?? null,
      imageUrl: m?.image_url ?? null,
      language: latest.language,
      oldPrice: oldP,
      newPrice: newP,
      pctChange,
      currency,
    });
  }
  movers.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  return movers;
}
