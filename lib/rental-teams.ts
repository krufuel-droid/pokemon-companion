import type { TeamMember } from "@/app/tools/team-builder/team-builder";

/**
 * Rental-team share links. A full team (species, nickname, item, ability,
 * nature, level, EVs, IVs, moves) is compacted to JSON and base64url-encoded
 * into `?team=` on /tools/rental-teams. No server storage — the link IS the
 * data, like real VGC rental teams.
 *
 * NOTE: TeamMember.speciesId uses the team builder's numeric scheme (base dex
 * number, or speciesId * 100000 + variant index for regional forms — see the
 * VARIANTS comment in app/tools/team-builder/team-builder.tsx). Everything
 * stays numeric so links survive data updates.
 */

const MAX_TEAM = 6;
const MAX_STR = 100;
const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const bin = atob(pad === 0 ? b64 : b64 + "=".repeat(4 - pad));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Drop empty/default fields so shared URLs stay short. */
function compactMember(m: TeamMember): Record<string, unknown> {
  const o: Record<string, unknown> = { speciesId: m.speciesId };
  const str = (v: string | undefined) => v?.trim() || undefined;
  const nickname = str(m.nickname);
  const item = str(m.item);
  const ability = str(m.ability);
  const nature = str(m.nature);
  if (nickname) o.nickname = nickname;
  if (item) o.item = item;
  if (ability) o.ability = ability;
  if (nature) o.nature = nature;
  if (typeof m.level === "number" && m.level !== 50) o.level = m.level;
  const evs = compactEvs(m.evs);
  const ivs = compactIvs(m.ivs);
  if (evs) o.evs = evs;
  if (ivs) o.ivs = ivs;
  const moves = (m.moves ?? []).map((x) => x.trim()).filter(Boolean).slice(0, 4);
  if (moves.length > 0) o.moves = moves;
  return o;
}

/** EVs: 0 is the same as unset, so keep only positive stats. */
function compactEvs(evs: TeamMember["evs"]): Record<string, number> | undefined {
  if (!evs) return undefined;
  const out: Record<string, number> = {};
  for (const k of STAT_KEYS) {
    const v = evs[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      out[k] = Math.max(1, Math.min(252, Math.floor(v)));
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * IVs: 0 is meaningful (e.g. 0 Atk / 0 Spe), so keep the whole spread unless
 * every provided stat is the 31 default.
 */
function compactIvs(ivs: TeamMember["ivs"]): Record<string, number> | undefined {
  if (!ivs) return undefined;
  const out: Record<string, number> = {};
  let nonDefault = false;
  for (const k of STAT_KEYS) {
    const v = ivs[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      const n = Math.max(0, Math.min(31, Math.floor(v)));
      out[k] = n;
      if (n !== 31) nonDefault = true;
    }
  }
  if (Object.keys(out).length === 0 || !nonDefault) return undefined;
  return out;
}

/** Encode a team into the base64url payload for a rental link. */
export function encodeTeamForShare(members: TeamMember[]): string {
  return toBase64Url(JSON.stringify(members.slice(0, MAX_TEAM).map(compactMember)));
}

/** Build the full shareable rental-teams URL for a team. */
export function buildRentalUrl(origin: string, members: TeamMember[]): string {
  return `${origin}/tools/rental-teams?team=${encodeTeamForShare(members)}`;
}

function cleanStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().slice(0, MAX_STR);
  return t ? t : undefined;
}

function sanitizeSpread(
  v: unknown,
  max: number,
): { hp: number; atk: number; def: number; spa: number; spd: number; spe: number } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const k of STAT_KEYS) {
    const n = r[k];
    if (typeof n === "number" && Number.isFinite(n)) {
      out[k] = Math.max(0, Math.min(max, Math.floor(n)));
    }
  }
  if (Object.keys(out).length === 0) return undefined;
  return {
    hp: out.hp ?? 0,
    atk: out.atk ?? 0,
    def: out.def ?? 0,
    spa: out.spa ?? 0,
    spd: out.spd ?? 0,
    spe: out.spe ?? 0,
  };
}

function sanitizeMember(raw: unknown): TeamMember | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const speciesId = r.speciesId;
  if (typeof speciesId !== "number" || !Number.isInteger(speciesId) || speciesId <= 0) return null;
  const m: TeamMember = { speciesId };
  const nickname = cleanStr(r.nickname);
  const item = cleanStr(r.item);
  const ability = cleanStr(r.ability);
  const nature = cleanStr(r.nature);
  if (nickname) m.nickname = nickname;
  if (item) m.item = item;
  if (ability) m.ability = ability;
  if (nature) m.nature = nature;
  if (
    typeof r.level === "number" &&
    Number.isInteger(r.level) &&
    r.level >= 1 &&
    r.level <= 100
  ) {
    m.level = r.level;
  }
  const evs = sanitizeSpread(r.evs, 252);
  const ivs = sanitizeSpread(r.ivs, 31);
  if (evs) m.evs = evs;
  if (ivs) m.ivs = ivs;
  if (Array.isArray(r.moves)) {
    const moves = r.moves
      .map(cleanStr)
      .filter((x): x is string => Boolean(x))
      .slice(0, 4);
    if (moves.length > 0) m.moves = moves;
  }
  return m;
}

/**
 * Decode and validate a `?team=` payload. Returns the team, or null when the
 * payload is missing, corrupt, or fails validation (bad links get a graceful
 * error page instead of a crash).
 */
export function decodeSharedTeam(param: string | null): TeamMember[] | null {
  if (!param) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(param));
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_TEAM) return null;
    const out: TeamMember[] = [];
    for (const raw of parsed) {
      const m = sanitizeMember(raw);
      if (!m) return null;
      out.push(m);
    }
    return out;
  } catch {
    return null;
  }
}
