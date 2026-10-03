"use client";

import { use, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { searchSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { unlockAchievement } from "@/lib/achievements";
import { timeAgo } from "@/lib/community";
import { unpackGame } from "../page";
import { getLocationsForGame } from "@/lib/data/games";
import RunTypeBadge from "@/components/RunTypeBadge";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";
const smallBtn =
  "rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-60";

interface Run {
  id: string;
  owner_id: string;
  title: string;
  rules: string | null;
  status: string;
  invite_code: string | null;
  run_type: string | null;
  created_at: string;
}

interface Participant {
  user_id: string;
  username: string;
}

interface TeamRow {
  id: string;
  run_id: string;
  user_id: string;
  species_id: number;
  species_name: string;
  nickname: string | null;
  status: "alive" | "dead" | "boxed";
  met_location: string | null;
  level: number | null;
  gender: "male" | "female" | "unknown";
  added_at: string;
}

interface Memorial {
  id: string;
  owner_id: string;
  species_name: string;
  nickname: string | null;
  note: string | null;
  created_at: string;
  username: string;
}

function spriteUrl(speciesId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      : status === "wiped"
        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
        : "bg-mint/25 text-slate-800 dark:text-slate-100";
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles}`}>
      {status}
    </span>
  );
}

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-mint" />
      </span>
      Live
    </span>
  );
}

function statusCardClass(status: TeamRow["status"]): string {
  if (status === "alive") return "border-mint ring-1 ring-mint";
  if (status === "boxed") return "border-slate-300 opacity-85 dark:border-slate-600";
  return "border-red-300 dark:border-red-800";
}

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { configured, loading, user } = useAuth();

  const [run, setRun] = useState<Run | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  /** Pure fetch of everything on the page; null when the run is missing. */
  const fetchRunData = useCallback(async (): Promise<{
    run: Run;
    participants: Participant[];
    team: TeamRow[];
    memorials: Memorial[];
  } | null> => {
    const supabase = createClient();
    const { data: runData, error: runError } = await supabase
      .from("nuzlockes")
      .select("id, owner_id, title, rules, status, invite_code, run_type, created_at")
      .eq("id", id)
      .maybeSingle();
    if (runError) throw runError;
    if (!runData) return null;
    const loaded = runData as Run;

    let parts: { user_id: string }[] = [];
    try {
      const { data } = await supabase
        .from("nuzlocke_participants")
        .select("user_id")
        .eq("run_id", id);
      parts = (data as { user_id: string }[] | null) ?? [];
    } catch {
      parts = [];
    }
    const userIds = [...new Set([loaded.owner_id, ...parts.map((p) => p.user_id)])];
    let nameMap: Record<string, string> = {};
    try {
      const { data } = await supabase.from("profiles").select("id, username").in("id", userIds);
      for (const p of (data as { id: string; username: string }[] | null) ?? []) {
        nameMap[p.id] = p.username;
      }
    } catch {
      nameMap = {};
    }
    const participants = userIds.map((uid) => ({ user_id: uid, username: nameMap[uid] ?? "A trainer" }));

    let team: TeamRow[] = [];
    try {
      const { data } = await supabase
        .from("nuzlocke_team")
        .select("id, run_id, user_id, species_id, species_name, nickname, status, met_location, level, gender, added_at")
        .eq("run_id", id)
        .order("added_at", { ascending: true });
      team = (data as TeamRow[] | null) ?? [];
    } catch {
      team = [];
    }

    let memorials: Memorial[] = [];
    try {
      const { data } = await supabase
        .from("memorials")
        .select("id, owner_id, species_name, nickname, note, created_at")
        .in("owner_id", userIds)
        .order("created_at", { ascending: false })
        .limit(30);
      memorials = ((data as Omit<Memorial, "username">[] | null) ?? []).map((m) => ({
        ...m,
        username: nameMap[m.owner_id] ?? "A trainer",
      }));
    } catch {
      memorials = [];
    }
    return { run: loaded, participants, team, memorials };
  }, [id]);

  const applyRunData = useCallback(
    (d: { run: Run; participants: Participant[]; team: TeamRow[]; memorials: Memorial[] }) => {
      setRun(d.run);
      setParticipants(d.participants);
      setTeam(d.team);
      setMemorials(d.memorials);
    },
    [],
  );

  /** Refetch + apply, for event handlers and realtime callbacks. */
  const refresh = useCallback(async () => {
    try {
      const d = await fetchRunData();
      if (!d) {
        setNotFound(true);
      } else {
        applyRunData(d);
      }
    } catch {
      // Sections degrade to their empty states.
    } finally {
      setDataLoading(false);
    }
  }, [fetchRunData, applyRunData]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    void fetchRunData()
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setNotFound(true);
        } else {
          applyRunData(d);
        }
        setDataLoading(false);
      })
      .catch(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, fetchRunData, applyRunData]);

  // Realtime: reload on any team, participant, or run change.
  useEffect(() => {
    if (loading || notFound) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`run:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "nuzlocke_team", filter: `run_id=eq.${id}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "nuzlocke_participants", filter: `run_id=eq.${id}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "nuzlockes", filter: `id=eq.${id}` }, () => void refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, loading, notFound, refresh]);

  const isOwner = !!user && !!run && run.owner_id === user.id;
  const isParticipant = !!user && participants.some((p) => p.user_id === user.id);

  const teamByUser = useMemo(() => {
    const map = new Map<string, TeamRow[]>();
    for (const row of team) {
      const list = map.get(row.user_id) ?? [];
      list.push(row);
      map.set(row.user_id, list);
    }
    const order: Record<TeamRow["status"], number> = { alive: 0, boxed: 1, dead: 2 };
    for (const list of map.values()) {
      list.sort((a, b) => order[a.status] - order[b.status]);
    }
    return map;
  }, [team]);

  const orderedParticipants = useMemo(() => {
    if (!user) return participants;
    return [...participants].sort((a, b) => {
      const score = (p: Participant) =>
        p.user_id === user.id ? 0 : run && p.user_id === run.owner_id ? 1 : 2;
      return score(a) - score(b) || a.username.localeCompare(b.username);
    });
  }, [participants, user, run]);

  const aliveCount = (uid: string) =>
    (teamByUser.get(uid) ?? []).filter((t) => t.status === "alive").length;

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading || dataLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading the run…
      </div>
    );
  }
  if (notFound || !run) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className={cardClass}>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Run not found</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This Nuzlocke run doesn&apos;t exist or you can&apos;t see it.
          </p>
          <Link href="/nuzlocke" className="mt-5 inline-block text-sm font-semibold text-slate-700 underline dark:text-slate-300">
            ← All runs
          </Link>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className={`${cardClass} text-center`}>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sign in to view this run</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Nuzlocke runs are for members of the community.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const { game, rules } = unpackGame(run.rules);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/nuzlocke" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
        ← All runs
      </Link>

      {/* Header */}
      <div className={`${cardClass} mt-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="break-words text-2xl font-bold text-slate-900 dark:text-slate-100">{run.title}</h1>
            {game && (
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                Playing: {game}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LiveDot />
            <RunTypeBadge type={run.run_type} />
            <StatusBadge status={run.status} />
          </div>
        </div>
        {rules.trim() !== "" && (
          <details className="mt-4 rounded-lg bg-stone-50 px-4 py-3 dark:bg-slate-800">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-300">
              House rules
            </summary>
            <p className="mt-2 break-words whitespace-pre-line text-sm text-slate-600 dark:text-slate-400">{rules}</p>
          </details>
        )}
        {isOwner && <OwnerStatusSetter run={run} onChanged={() => void refresh()} />}
      </div>

      {/* Participants */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">
          Trainers ({participants.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.user_id}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="font-semibold text-slate-900 dark:text-slate-100">{p.username}</span>
              {run.owner_id === p.user_id && (
                <span className="text-xs text-slate-400 dark:text-slate-500">(owner)</span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {aliveCount(p.user_id)}/{(teamByUser.get(p.user_id) ?? []).length} alive
              </span>
            </span>
          ))}
        </div>
        {!isParticipant && <JoinRunButton runId={id} onJoined={() => void refresh()} />}
        {isParticipant && <InviteForm runId={id} />}
        {isOwner && (
          <div className="mt-3">
            <CopyInviteLink inviteCode={run.invite_code} />
          </div>
        )}
      </section>

      {/* Teams */}
      <section className="mt-8 space-y-8">
        {isParticipant && <AddPokemonForm runId={id} game={game} team={team} onAdded={() => void refresh()} />}
        {orderedParticipants.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No trainers in this run yet.</p>
        )}
        {orderedParticipants.map((p) => {
          const rows = teamByUser.get(p.user_id) ?? [];
          return (
            <div key={p.user_id}>
              <h3 className="mb-3 flex items-baseline gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                {p.username}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {aliveCount(p.user_id)} alive
                </span>
              </h3>
              {rows.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No Pokémon caught yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {rows.map((row) => (
                    <TeamCard
                      key={row.id}
                      row={row}
                      canAct={!!user && (row.user_id === user.id || isOwner)}
                      onChanged={() => void refresh()}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Deaths feed */}
      <section className="mt-12">
        <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-100">Fallen comrades</h2>
        <div className={cardClass}>
          {memorials.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nobody has fallen yet. May it stay that way.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-slate-800">
              {memorials.map((m) => (
                <MemorialRow key={m.id} memorial={m} canDelete={!!user && m.owner_id === user.id} onChanged={refresh} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Join run                                                            */
/* ------------------------------------------------------------------ */

/** A single memorial with an optional delete button for its owner. */
function MemorialRow({ memorial: m, canDelete, onChanged }: { memorial: Memorial; canDelete: boolean; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("memorials").delete().eq("id", m.id);
      if (error) throw error;
      onChanged();
    } catch {
      // best-effort; leave the row in place on failure
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <span className="text-2xl" aria-hidden="true">🪦</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {m.nickname ? `${m.nickname} (${m.species_name})` : m.species_name}
        </p>
        {m.note && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{m.note}</p>
        )}
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {m.username} · {timeAgo(m.created_at)}
        </p>
      </div>
      {canDelete && (
        confirming ? (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void remove()}
              className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="rounded-lg bg-stone-200 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            >
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-slate-800"
            aria-label={`Delete memorial for ${m.nickname ?? m.species_name}`}
          >
            ✕
          </button>
        )
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Owner: copy a shareable invite link                                   */
/* ------------------------------------------------------------------ */
function CopyInviteLink({ inviteCode }: { inviteCode: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!inviteCode) return null;

  async function copy() {
    const url = `${window.location.origin}/nuzlocke/join/${inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers without clipboard permission.
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-mint dark:border-slate-600 dark:text-slate-300"
    >
      {copied ? "Copied! ✓" : "Copy invite link"}
    </button>
  );
}

function JoinRunButton({ runId, onJoined }: { runId: string; onJoined: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debugStep, setDebugStep] = useState<string | null>(null);

  async function join() {
    const mark = (s: string) => {
      setDebugStep(s);
      try { localStorage.setItem("join-debug", s); } catch {}
    };
    mark("start");
    if (!user) {
      mark("no-user");
      setError("Not signed in (session missing). Try signing out and back in.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      mark("creating-client");
      const supabase = createClient();
      mark("checking-profile");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      mark("profile-checked");
      if (profileError) throw profileError;
      if (!profile) {
        setError("Set up your trainer profile first, then join the run.");
        setBusy(false);
        return;
      }
      mark("inserting");
      const insertPayload = { run_id: runId, user_id: user.id };
      mark(`inserting run:${runId.slice(0,8)} user:${user.id.slice(0,8)}`);
      const { data: insertData, error } = await supabase
        .from("nuzlocke_participants")
        .insert(insertPayload)
        .select("id")
        .single();
      mark(insertData ? `inserted id:${(insertData as { id: string }).id.slice(0,8)}` : "inserted-no-data");
      if (error) {
        if (error.code === "23505") {
          mark("already-joined-reloading");
          window.location.reload();
          return;
        }
        throw error;
      }
      void unlockAchievement(user.id, "soul-link").catch(() => {});
      mark("success-waiting-3s");
      // Wait 3 seconds so the debug text is visible, then reload.
      await new Promise((r) => setTimeout(r, 3000));
      window.location.reload();
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Could not join the run.";
      console.error("Join run failed:", err);
      setError(`Join failed: ${msg} (code: ${(err as { code?: string })?.code ?? "none"})`);
    } finally {
      mark("done");
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void join()}
        disabled={busy}
        className="rounded-lg bg-mint px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
      >
        {busy ? "Joining…" : "Join run"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
          {error}{" "}
          {error.includes("trainer profile") && (
            <Link href="/profile" className="font-semibold underline underline-offset-2">
              Go to profile setup
            </Link>
          )}
        </p>
      )}
      {debugStep && (
        <p className="mt-1 text-xs text-slate-400">Debug: {debugStep}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invite a friend by trainer name (run owners can add participants).     */
/* ------------------------------------------------------------------ */
function InviteForm({ runId }: { runId: string }) {
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function invite(e: FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      const supabase = createClient();
      const { data: found, error: lookupError } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", name)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!found) {
        setMessage(`No trainer named "${name}" found.`);
        setIsError(true);
        return;
      }
      const { error } = await supabase
        .from("nuzlocke_participants")
        .insert({ run_id: runId, user_id: (found as { id: string }).id });
      if (error) throw error;
      void unlockAchievement((found as { id: string }).id, "soul-link").catch(() => {});
      setMessage(`${(found as { username: string }).username} joined the run!`);
      setUsername("");
    } catch (err) {
      setIsError(true);
      setMessage(
        err instanceof Error ? err.message : "Could not invite that trainer."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void invite(e)} className="mt-4 flex max-w-sm flex-col gap-2 sm:flex-row">
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className={inputClass}
        placeholder="Trainer's username"
        aria-label="Trainer's username"
        maxLength={24}
      />
      <button
        type="submit"
        disabled={busy || username.trim() === ""}
        className="shrink-0 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-mint disabled:opacity-60 dark:border-slate-600 dark:text-slate-300"
      >
        {busy ? "Inviting…" : "Invite friend"}
      </button>
      {message && (
        <p role="status" className={`text-sm sm:basis-full ${isError ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Owner: status setter                                                  */
/* ------------------------------------------------------------------ */

function OwnerStatusSetter({ run, onChanged }: { run: Run; onChanged: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function setStatus(status: string) {
    if (!user || status === run.status) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("nuzlockes").update({ status }).eq("id", run.id);
      if (error) throw error;
      if (status === "completed") {
        void unlockAchievement(run.owner_id, "nuzlocke-complete").catch(() => {});
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the status.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteRun() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("nuzlockes").delete().eq("id", run.id);
      if (error) throw error;
      window.location.href = "/nuzlocke";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the run.");
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4 dark:border-slate-800">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Run status:</span>
      {(["active", "completed", "wiped"] as const).map((s) => (
        <button
          key={s}
          type="button"
          disabled={busy || s === run.status}
          onClick={() => void setStatus(s)}
          className={`${smallBtn} capitalize ${
            s === run.status
              ? "bg-mint font-bold text-slate-900 dark:text-slate-100"
              : "bg-stone-100 text-slate-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          {s}
        </button>
      ))}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="mt-2 basis-full">
        <button
          type="button"
          disabled={busy}
          onClick={() => setConfirmingDelete(true)}
          className="text-xs font-semibold text-red-600 underline underline-offset-2 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          Delete this run
        </button>
      </div>
      {confirmingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-run-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { if (!busy) setConfirmingDelete(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-run-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Delete this run?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              You&apos;re about to delete <strong>{run.title}</strong> and all its teams.
              This can&apos;t be undone. Proceed?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void deleteRun()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Add a Pokémon                                                         */
/* ------------------------------------------------------------------ */

function AddPokemonForm({ runId, game, team, onAdded }: { runId: string; game: string | null; team: TeamRow[]; onAdded: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState<SpeciesIndex | null>(null);
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const matches = useMemo(() => (species ? [] : searchSpecies(query).slice(0, 6)), [query, species]);
  const locations = useMemo(() => getLocationsForGame(game), [game]);

  // Nuzlocke "one catch per area" warning: flag if this trainer already
  // caught something at the selected location.
  const duplicateCatch = useMemo(() => {
    if (!user || !location.trim()) return null;
    const loc = location.trim().toLowerCase();
    return team.find(
      (t) => t.user_id === user.id && (t.met_location ?? "").toLowerCase() === loc
    ) ?? null;
  }, [team, location, user]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("You're not signed in. Please sign in and try again.");
      return;
    }
    // If the user typed a name but didn't tap a result, auto-select an
    // exact match so the button doesn't silently do nothing.
    let chosen = species;
    if (!chosen && query.trim()) {
      const exact = searchSpecies(query.trim()).find(
        (s) => s.name.toLowerCase() === query.trim().toLowerCase()
      );
      if (exact) {
        chosen = exact;
        setSpecies(exact);
      }
    }
    if (!chosen) {
      setError("Please search for a species above and tap a result to select it.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const lvl = level.trim() === "" ? null : Math.max(1, Math.min(100, parseInt(level, 10) || 1));
      const { error } = await supabase.from("nuzlocke_team").insert({
        run_id: runId,
        user_id: user.id,
        species_id: chosen.id,
        species_name: chosen.name,
        nickname: nickname.trim() === "" ? null : nickname.trim(),
        status: "alive",
        met_location: location.trim() === "" ? null : location.trim(),
        level: lvl,
        gender,
      });
      if (error) throw error;
      const addedName = nickname.trim() === "" ? chosen.name : nickname.trim();
      setQuery("");
      setSpecies(null);
      setNickname("");
      setLocation("");
      setLevel("");
      setError(null);
      // Full reload to guarantee the new row appears — the realtime/state
      // refresh was silently showing an empty team after successful inserts.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the Pokémon.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cardClass}>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add a Pokémon</h3>
      <form onSubmit={(e) => void add(e)} className="mt-4 space-y-3">
        <div>
          <label htmlFor="add-species" className={labelClass}>Species</label>
          {species ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={species.sprites.regular} alt={species.name} width={40} height={40} className="h-10 w-10" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{species.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSpecies(null);
                  setQuery("");
                }}
                className="text-xs font-semibold text-slate-500 underline dark:text-slate-400"
              >
                change
              </button>
            </div>
          ) : (
            <>
              <input
                id="add-species"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={inputClass}
                placeholder="Search species…"
                autoComplete="off"
              />
              {matches.length > 0 && (
                <ul className="mt-1 max-h-56 overflow-auto rounded-lg border border-stone-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSpecies(m)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-slate-800"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.sprites.regular} alt={m.name} width={32} height={32} className="h-8 w-8" />
                        <span className="text-slate-900 dark:text-slate-100">{m.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="add-nickname" className={labelClass}>Nickname</label>
            <input id="add-nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} placeholder="Sparky" maxLength={30} />
          </div>
          <div>
            <label htmlFor="add-location" className={labelClass}>Met at</label>
            {locations.length > 0 ? (
              <select
                id="add-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
              >
                <option value="">— Select location —</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="add-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={inputClass}
                placeholder="Route 1"
                maxLength={60}
              />
            )}
          </div>
          {duplicateCatch && (
            <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              ⚠️ You already caught {duplicateCatch.nickname ?? duplicateCatch.species_name} at {duplicateCatch.met_location}!
              Nuzlocke rules say one catch per area — add anyway if your house rules allow it.
            </p>
          )}
          <div>
            <label htmlFor="add-level" className={labelClass}>Level</label>
            <input id="add-level" type="number" min={1} max={100} value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass} placeholder="5" />
          </div>
          <div>
            <label htmlFor="add-gender" className={labelClass}>Gender</label>
            <select
              id="add-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female" | "unknown")}
              className={inputClass}
            >
              <option value="unknown">Unknown</option>
              <option value="male">♂ Male</option>
              <option value="female">♀ Female</option>
            </select>
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-mint px-5 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
        >
          {busy ? "Adding…" : "Add to team"}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Team card with per-Pokémon actions                                    */
/* ------------------------------------------------------------------ */

function TeamCard({
  row,
  canAct,
  onChanged,
}: {
  row: TeamRow;
  canAct: boolean;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [deathOpen, setDeathOpen] = useState(false);
  const [deathNote, setDeathNote] = useState("");
  const [makeMemorial, setMakeMemorial] = useState(true);
  const [levelDraft, setLevelDraft] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Partial<Pick<TeamRow, "status" | "level">>) {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("nuzlocke_team").update(patch).eq("id", row.id);
      if (error) throw error;
      // Reviving removes the memorial — they're back among the living.
      if (patch.status === "alive" && user) {
        try {
          let q = supabase
            .from("memorials")
            .select("id")
            .eq("owner_id", user.id)
            .eq("species_name", row.species_name)
            .order("created_at", { ascending: false })
            .limit(1);
          q = row.nickname ? q.eq("nickname", row.nickname) : q.is("nickname", null);
          const { data } = await q.maybeSingle();
          const mid = (data as { id: string } | null)?.id;
          if (mid) await supabase.from("memorials").delete().eq("id", mid);
        } catch {
          // Memorial cleanup is best-effort; the revive itself succeeded.
        }
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeath() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("nuzlocke_team")
        .update({ status: "dead" })
        .eq("id", row.id);
      if (error) throw error;
      if (makeMemorial) {
        try {
          await supabase.from("memorials").insert({
            owner_id: user.id,
            species_name: row.species_name,
            nickname: row.nickname,
            note: deathNote.trim() === "" ? null : deathNote.trim(),
          });
        } catch {
          // The death still counts even if the memorial fails.
        }
      }
      void unlockAchievement(user.id, "first-death").catch(() => {});
      setDeathOpen(false);
      setDeathNote("");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark as dead.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("nuzlocke_team").delete().eq("id", row.id);
      if (error) throw error;
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  const title = row.nickname ? `${row.nickname} (${row.species_name})` : row.species_name;

  return (
    <div className={`relative rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${statusCardClass(row.status)}`}>
      {row.status === "dead" && (
        <span className="absolute right-2 top-2 text-2xl" aria-label="Fainted" role="img">🪦</span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="relative mx-auto h-[72px] w-[72px]">
        <img
          src={spriteUrl(row.species_id)}
          alt={row.species_name}
          width={72}
          height={72}
          className={`h-[72px] w-[72px] ${row.status === "dead" ? "opacity-60 grayscale" : ""}`}
        />
        {row.status === "dead" && (
          <svg
            viewBox="0 0 72 72"
            aria-hidden="true"
            className="absolute inset-0 h-[72px] w-[72px]"
          >
            <line x1="14" y1="14" x2="58" y2="58" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
            <line x1="58" y1="14" x2="14" y2="58" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <p className="mt-1 truncate text-center text-sm font-bold text-slate-900 dark:text-slate-100" title={title}>
        {row.nickname ?? row.species_name}
        {row.gender === "male" && <span className="ml-1 text-blue-500" aria-label="Male">♂</span>}
        {row.gender === "female" && <span className="ml-1 text-pink-500" aria-label="Female">♀</span>}
      </p>
      {row.nickname && (
        <p className="truncate text-center text-xs text-slate-500 dark:text-slate-400">{row.species_name}</p>
      )}
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
        {row.level != null ? `Lv ${row.level}` : "Lv —"}
        {row.met_location ? ` · ${row.met_location}` : ""}
      </p>
      <p className="mt-1 text-center text-xs font-medium capitalize text-slate-400 dark:text-slate-500">
        {row.status}
      </p>

      {canAct && (
        <div className="mt-3 space-y-2 border-t border-stone-100 pt-3 dark:border-slate-800">
          {levelDraft === null ? (
            <div className="flex flex-wrap gap-1.5">
              {row.status !== "dead" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDeathOpen((o) => !o)}
                  className={`${smallBtn} bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300`}
                >
                  Mark dead
                </button>
              )}
              {row.status !== "boxed" && row.status !== "dead" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void update({ status: "boxed" })}
                  className={`${smallBtn} bg-stone-100 text-slate-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300`}
                >
                  Box
                </button>
              )}
              {row.status !== "alive" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void update({ status: "alive" })}
                  className={`${smallBtn} bg-mint/30 text-slate-800 hover:bg-mint/50 dark:text-slate-100`}
                >
                  Revive
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => setLevelDraft(row.level != null ? String(row.level) : "")}
                className={`${smallBtn} bg-stone-100 text-slate-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300`}
              >
                Lv
              </button>
              {confirmingDelete ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove()}
                    className={`${smallBtn} bg-red-600 font-bold text-white`}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(false)}
                    className={`${smallBtn} text-slate-500`}
                  >
                    Keep
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmingDelete(true)}
                  className={`${smallBtn} text-slate-400 hover:text-red-600 dark:text-slate-500`}
                  aria-label={`Delete ${title}`}
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={100}
                value={levelDraft}
                onChange={(e) => setLevelDraft(e.target.value)}
                className={`${inputClass} !px-2 !py-1 text-xs`}
                aria-label="Level"
                autoFocus
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const lvl = levelDraft.trim() === "" ? null : Math.max(1, Math.min(100, parseInt(levelDraft, 10) || 1));
                  setLevelDraft(null);
                  void update({ level: lvl });
                }}
                className={`${smallBtn} bg-mint font-bold text-slate-900 dark:text-slate-100`}
              >
                Save
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setLevelDraft(null)}
                className={`${smallBtn} text-slate-500`}
              >
                Cancel
              </button>
            </div>
          )}

          {deathOpen && (
            <div className="space-y-2 rounded-lg bg-stone-50 p-2.5 dark:bg-slate-800">
              <label htmlFor={`death-note-${row.id}`} className={labelClass}>
                Farewell note <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id={`death-note-${row.id}`}
                rows={2}
                value={deathNote}
                onChange={(e) => setDeathNote(e.target.value)}
                className={inputClass}
                placeholder="Fell to a crit…"
                maxLength={280}
              />
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={makeMemorial}
                  onChange={(e) => setMakeMemorial(e.target.checked)}
                  className="h-4 w-4 accent-emerald-500"
                />
                Create memorial
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDeath()}
                className="w-full rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "…" : "Confirm death"}
              </button>
            </div>
          )}
          {error && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{error}</p>}
        </div>
      )}
    </div>
  );
}
