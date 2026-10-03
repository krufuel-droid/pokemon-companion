"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import { unlockAchievement } from "@/lib/achievements";
import { unpackGame } from "../../page";
import RunTypeBadge from "@/components/RunTypeBadge";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900";

interface RunInvite {
  id: string;
  owner_id: string;
  title: string;
  rules: string | null;
  status: string;
  run_type: string | null;
}

export default function JoinByInvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { configured, loading, user } = useAuth();

  const [run, setRun] = useState<RunInvite | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("nuzlockes")
          .select("id, owner_id, title, rules, status, run_type")
          .eq("invite_code", code)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (!data) {
          setNotFound(true);
          return;
        }
        const found = data as RunInvite;
        setRun(found);
        const { data: owner } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", found.owner_id)
          .maybeSingle();
        if (!cancelled && owner) setOwnerName((owner as { username: string }).username);
        if (user) {
          const { data: part } = await supabase
            .from("nuzlocke_participants")
            .select("run_id")
            .eq("run_id", found.id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (!cancelled && part) setAlreadyIn(true);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, user]);

  async function join() {
    if (!user || !run) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      // A trainer profile is required — participants reference profiles(id).
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) {
        setError("Set up your trainer profile first, then join the run.");
        setBusy(false);
        return;
      }
      const { error } = await supabase
        .from("nuzlocke_participants")
        .insert({ run_id: run.id, user_id: user.id });
      if (error) throw error;
      void unlockAchievement(user.id, "soul-link").catch(() => {});
      router.push(`/nuzlocke/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the run.");
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading || fetching) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading invite…
      </div>
    );
  }
  if (notFound || !run) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className={`${cardClass} text-center`}>
          <p className="text-3xl" aria-hidden="true">💀</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">
            This invite link doesn&apos;t work
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The link may be mistyped, or the run may have been deleted.
          </p>
          <Link
            href="/nuzlocke"
            className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
          >
            Browse runs
          </Link>
        </div>
      </div>
    );
  }

  const { game } = unpackGame(run.rules);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          You&apos;re invited to a Nuzlocke run
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{run.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <RunTypeBadge type={run.run_type} />
          {game && <span>Playing: {game}</span>}
          {ownerName && <span>by {ownerName}</span>}
          <span className="capitalize text-slate-400 dark:text-slate-500">· {run.status}</span>
        </div>

        {!user ? (
          <div className="mt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Sign in to join this run.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
            >
              Sign in
            </Link>
          </div>
        ) : alreadyIn ? (
          <div className="mt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You&apos;re already in this run — good luck, trainer!
            </p>
            <Link
              href={`/nuzlocke/${run.id}`}
              className="mt-4 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 dark:text-slate-100"
            >
              Open the run
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void join()}
              disabled={busy}
              className="rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60 dark:text-slate-100"
            >
              {busy ? "Joining…" : "Join run"}
            </button>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                {error}{" "}
                {error.includes("trainer profile") && (
                  <Link href="/profile" className="font-semibold underline underline-offset-2">
                    Go to profile setup
                  </Link>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
