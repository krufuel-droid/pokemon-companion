/**
 * Saved damage-calculator setups.
 *
 * Stored in browser localStorage (no account, no migration) as an array of
 * named setups shaped like the calculator's own inputs:
 *   { id, name, createdAt, attacker, defenders, move, field }
 *
 * A one-shot "handoff" key carries a setup from the Saved Calculations page
 * to the calculator, which consumes it on mount and restores its inputs.
 */

export interface SavedCalcAttacker {
  speciesId: number | null;
  speciesName: string;
  level: number;
  attack: number;
  spAtk: number;
  nature: string;
}

export interface SavedCalcDefender {
  speciesId: number | null;
  speciesName: string;
  hp: number;
  currentHp: number;
  defense: number;
  spDef: number;
  type1: string;
  type2: string;
  nature: string;
}

export interface SavedCalcMove {
  power: number;
  moveType: string;
  category: "physical" | "special";
  stabMode: "auto" | "on" | "off";
  movePick: string;
  effOverride: string;
}

export interface SavedCalcSnapshot {
  attacker: SavedCalcAttacker;
  defenders: SavedCalcDefender[];
  move: SavedCalcMove;
  /** Simple mode has no field modifiers; kept for shape parity. */
  field: Record<string, never>;
}

export interface SavedCalc extends SavedCalcSnapshot {
  id: string;
  name: string;
  /** ISO timestamp. */
  createdAt: string;
  mode: "simple";
}

const STORAGE_KEY = "pc_saved_calcs_v1";
const HANDOFF_KEY = "pc_calc_handoff_v1";
const MAX_SAVED = 50;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `calc-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/** All saved setups, newest first. Never throws. */
export function loadSavedCalcs(): SavedCalc[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as SavedCalc[])
      .filter((c) => c && typeof c.id === "string" && c.attacker && c.move)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function persist(calcs: SavedCalc[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calcs));
  } catch {
    /* storage full or unavailable — stay silent */
  }
}

export function createSavedCalc(
  name: string,
  snapshot: SavedCalcSnapshot,
): SavedCalc {
  return {
    ...snapshot,
    id: newId(),
    name: name.trim().slice(0, 60) || "Untitled setup",
    createdAt: new Date().toISOString(),
    mode: "simple",
  };
}

/** Append a setup; returns the updated list (newest first). */
export function saveCalc(calc: SavedCalc): SavedCalc[] {
  const calcs = [calc, ...loadSavedCalcs()].slice(0, MAX_SAVED);
  persist(calcs);
  return calcs;
}

/** Remove a setup by id; returns the updated list. */
export function deleteCalc(id: string): SavedCalc[] {
  const calcs = loadSavedCalcs().filter((c) => c.id !== id);
  persist(calcs);
  return calcs;
}

/** Stage a setup for the calculator to pick up on its next mount. */
export function stageCalcHandoff(calc: SavedCalc): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(calc));
  } catch {
    /* ignore */
  }
}

/**
 * One-shot read of a staged setup. Returns the setup and clears the key,
 * or null when nothing is staged (also clears corrupt data).
 */
export function consumeCalcHandoff(): SavedCalc | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(HANDOFF_KEY);
    window.localStorage.removeItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCalc;
    if (!parsed || typeof parsed.id !== "string" || !parsed.attacker) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** One-line human summary, e.g. "Lv 50 Charizard — Fire Blast → Venusaur". */
export function describeSavedCalc(calc: SavedCalc): string {
  const a = calc.attacker;
  const d = calc.defenders[0];
  const m = calc.move;
  const moveLabel = m.movePick || `${m.moveType} ${m.power} power`;
  const vs = d ? ` → ${d.speciesName}` : "";
  return `Lv ${a.level} ${a.speciesName} — ${moveLabel}${vs}`;
}

/** Short date label, e.g. "Oct 4, 2026". */
export function formatSavedDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
