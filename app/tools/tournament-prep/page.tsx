"use client";

import { useMemo, useState } from "react";
import { effectiveness } from "@/lib/typechart";
import { searchSpecies, getSpeciesById } from "@/lib/pokedex";
import { getFormsForSpecies } from "@/lib/data/forms";
import {
  META_PICKS,
  UPCOMING_TOURNAMENTS,
  SNAPSHOT_DATE,
  REGULATION,
} from "@/lib/data/champions";
import {
  abilityDefenseMult,
  getAbilityTypeEffect,
} from "@/lib/data/ability-effects";
import { combatantStats } from "@/lib/damage-calc";
import {
  TeamSavePicker,
  savedMemberSpecies,
  type SavedTeam,
  type SavedTeamMember,
} from "../_components/team-save-picker";
import { TypePill } from "../_components/species-picker";
import { inputCls, labelCls } from "../damage-calc/shared";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

interface ThreatMon {
  label: string;
  types: string[];
  sprite: string;
}

/** Resolve the 12 meta picks to typing + sprite, preferring form data. */
function buildThreats(): ThreatMon[] {
  const out: ThreatMon[] = [];
  for (const pick of META_PICKS.slice(0, 12)) {
    const baseName = pick.speciesName ?? pick.name;
    const hits = searchSpecies(baseName);
    const base =
      hits.find((h) => h.name.toLowerCase() === baseName.toLowerCase()) ??
      hits[0];
    if (!base) continue;
    const form = getFormsForSpecies(base.id).find(
      (f) => f.formName.toLowerCase() === pick.name.toLowerCase(),
    );
    out.push({
      label: pick.name,
      types: (form?.types?.map(cap) ?? base.types) as string[],
      sprite: form?.sprite ?? base.sprites.regular,
    });
  }
  return out;
}

interface MemberHit {
  memberLabel: string;
  best: number;
  stabType: string;
}

interface ThreatReport {
  label: string;
  sprite: string;
  types: string[];
  score: number;
  maxMult: number;
  hits: MemberHit[];
}

/** Member's saved ability, but only if it's one of the modeled abilities. */
function memberAbility(m: SavedTeamMember): string | undefined {
  return getAbilityTypeEffect(m.ability) ? m.ability : undefined;
}

function memberLabel(m: SavedTeamMember): string {
  const base = savedMemberSpecies(m);
  return m.nickname?.trim() || base?.name || "Unknown";
}

function buildThreatReport(team: SavedTeam, threats: ThreatMon[]): ThreatReport[] {
  const reports: ThreatReport[] = [];
  for (const t of threats) {
    const hits: MemberHit[] = [];
    let score = 0;
    let maxMult = 0;
    for (const m of team.members) {
      const species = savedMemberSpecies(m);
      if (!species) continue;
      const ability = memberAbility(m);
      let best = 0;
      let bestType = "";
      for (const stab of t.types) {
        const mult = abilityDefenseMult(
          ability,
          stab,
          effectiveness(stab, species.types),
        );
        if (mult > best) {
          best = mult;
          bestType = stab;
        }
      }
      if (best >= 2) {
        score += best >= 4 ? 2 : 1;
        hits.push({ memberLabel: memberLabel(m), best, stabType: bestType });
      }
      if (best > maxMult) maxMult = best;
    }
    hits.sort((a, b) => b.best - a.best);
    reports.push({ label: t.label, sprite: t.sprite, types: t.types, score, maxMult, hits });
  }
  reports.sort((a, b) => b.score - a.score || b.maxMult - a.maxMult);
  return reports;
}

const EV_LABELS: Record<string, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

function fmtEVs(evs?: SavedTeamMember["evs"]): string {
  if (!evs) return "—";
  const parts: string[] = [];
  for (const k of ["hp", "atk", "def", "spa", "spd", "spe"] as const) {
    const v = evs[k] ?? 0;
    if (v > 0) parts.push(`${v} ${EV_LABELS[k]}`);
  }
  return parts.length > 0 ? parts.join(" / ") : "—";
}

function memberSpeed(m: SavedTeamMember): number | null {
  const species = savedMemberSpecies(m);
  if (!species) return null;
  const full = getSpeciesById(species.id);
  if (!full) return null;
  const stats = combatantStats(
    full,
    50,
    m.nature?.trim() || "Hardy",
    { spe: m.evs?.spe ?? 0 },
    { spe: m.ivs?.spe ?? 31 },
  );
  return stats.spe;
}

function StepCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 dark:text-slate-100">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {n}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function TournamentPrepPage() {
  const [eventId, setEventId] = useState<string>(UPCOMING_TOURNAMENTS[0]?.id ?? "");
  const [team, setTeam] = useState<SavedTeam | null>(null);

  const threats = useMemo(() => buildThreats(), []);
  const report = useMemo(
    () => (team ? buildThreatReport(team, threats) : []),
    [team, threats],
  );
  const topThreats = report.filter((r) => r.score > 0).slice(0, 8);

  const event = UPCOMING_TOURNAMENTS.find((e) => e.id === eventId) ?? null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <style>{`@media print {
        header, nav, footer, .no-print { display: none !important; }
        body { background: #fff !important; }
        main { max-width: 100% !important; padding: 0 !important; }
        section { box-shadow: none !important; break-inside: avoid; }
      }`}</style>

      <div className="no-print">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Tournament Prep Mode
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Pick your event, bring your team, get a threat report against the
          current meta — then print a cheat sheet for the venue.
        </p>
      </div>

      {/* Step 1 — event */}
      <div className="no-print">
        <StepCard n={1} title="Which event are you prepping for?">
          <label>
            <span className={labelCls}>Upcoming tournament</span>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className={`${inputCls} mt-1`}
            >
              {UPCOMING_TOURNAMENTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.dates} ({t.kind})
                </option>
              ))}
            </select>
          </label>
          {event?.broadcast && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              📺 {event.broadcast}
            </p>
          )}
        </StepCard>
      </div>

      {/* Step 2 — team */}
      <div className="no-print">
        <StepCard n={2} title="Bring your team">
          <TeamSavePicker onSelect={setTeam} actionLabel="Analyze this team" />
          {team && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {team.members.map((m, i) => {
                const species = savedMemberSpecies(m);
                return (
                  <div
                    key={`${m.speciesId}-${i}`}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-1.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                  >
                    {species && (
                      <img
                        src={species.sprites.regular}
                        alt={species.name}
                        className="h-10 w-10"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {memberLabel(m)}
                      </p>
                      {memberAbility(m) && (
                        <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                          {memberAbility(m)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </StepCard>
      </div>

      {/* Step 3 — threat report */}
      {team && (
        <div className="no-print">
          <StepCard n={3} title="Threat report">
            {topThreats.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Good news — no meta staple hits your team super-effectively on
                STAB alone. (Sets, abilities, and Tera can still change that.)
              </p>
            ) : (
              <ol className="space-y-3">
                {topThreats.map((r) => (
                  <li
                    key={r.label}
                    className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={r.sprite}
                        alt={r.label}
                        className="h-12 w-12"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {r.label}{" "}
                          <span className="ml-1 text-xs font-semibold text-red-600 dark:text-red-400">
                            threatens {r.score} pt{r.score === 1 ? "" : "s"}
                          </span>
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {r.types.map((t) => (
                            <TypePill key={t} type={t} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {r.hits.map((h) => (
                        <li
                          key={h.memberLabel}
                          className="text-xs text-slate-600 dark:text-slate-400"
                        >
                          ⚠️ {h.stabType} hits{" "}
                          <span className="font-semibold">{h.memberLabel}</span>{" "}
                          for ×{h.best}
                          {h.best >= 4 ? " — 4×, beware!" : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Threat score: +1 per team member hit super-effectively, +2 for a
              4× weakness. Your saved abilities are factored in; meta staples
              assume no ability.
            </p>
          </StepCard>
        </div>
      )}

      {/* Cheat sheet — the printable part */}
      {team && event && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Cheat sheet
            </h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              🖨️ Print cheat sheet
            </button>
          </div>

          <div className="mt-4 border-b border-slate-200 pb-3 dark:border-slate-700">
            <p className="font-bold text-slate-900 dark:text-slate-100">
              {event.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {event.dates} · {event.kind} · {REGULATION.name}
            </p>
          </div>

          <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Your team — {team.name}
          </h3>
          <div className="mt-2 space-y-2">
            {team.members.map((m, i) => {
              const species = savedMemberSpecies(m);
              const speed = memberSpeed(m);
              return (
                <div
                  key={`${m.speciesId}-${i}`}
                  className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
                >
                  <div className="flex items-center gap-2">
                    {species && (
                      <img
                        src={species.sprites.regular}
                        alt={species.name}
                        className="h-10 w-10"
                      />
                    )}
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {m.nickname?.trim()
                        ? `${m.nickname.trim()} (${species?.name ?? "?"})`
                        : (species?.name ?? "?")}
                      {m.item ? ` @ ${m.item}` : ""}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {[
                      m.ability,
                      m.nature ? `${m.nature} Nature` : null,
                      `Lv ${m.level ?? 50}`,
                      `EVs: ${fmtEVs(m.evs)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {m.moves && m.moves.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {m.moves.filter((mv) => mv.trim()).join(" / ")}
                    </p>
                  )}
                  {speed !== null && (
                    <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Speed at Lv 50: {speed}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Top threats to watch
          </h3>
          {topThreats.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              No meta staple threatens your team on STAB alone.
            </p>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-700 dark:text-slate-300">
              {topThreats.slice(0, 5).map((r) => (
                <li key={r.label}>
                  <span className="font-bold">{r.label}</span> —{" "}
                  {r.hits
                    .map(
                      (h) =>
                        `${h.stabType} ×${h.best} vs ${h.memberLabel}`,
                    )
                    .join("; ")}
                </li>
              ))}
            </ol>
          )}

          <p className="mt-5 border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Meta snapshot: {REGULATION.name} ({REGULATION.dates}), as of{" "}
            {SNAPSHOT_DATE}. Threats are type-chart math only — they ignore
            sets, items, abilities on the meta side, Tera, and speed. Scout
            your opponents; game 2 is for adapting.
          </p>
        </section>
      )}

      {/* Honest footer */}
      <p className="no-print text-xs text-slate-500 dark:text-slate-400">
        Built on the {REGULATION.name} meta snapshot in the Champions hub (as
        of {SNAPSHOT_DATE}). Threat analysis is type-math: your saved abilities
        count, meta staples assume none, and nobody's sets, items, or Tera are
        known in advance.
      </p>
    </main>
  );
}
