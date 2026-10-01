"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";

const ISSUES_URL = "https://github.com/krufuel-droid/pokemon-companion/issues";
const MAX_MESSAGE = 2000;

type FeedbackType = "bug" | "idea" | "hello";

const TYPES: { value: FeedbackType; label: string; blurb: string }[] = [
  { value: "bug", label: "Bug report", blurb: "Something's broken" },
  { value: "idea", label: "Feature idea", blurb: "Something to add" },
  { value: "hello", label: "Just saying hi", blurb: "Praise welcome too" },
];

type Phase = "checking" | "form" | "sending" | "thanks" | "fallback";

function isMissingTable(error: unknown): boolean {
  return (
    error instanceof Error && /schema cache/i.test(error.message ?? "")
  );
}

function FallbackCard() {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-900">
        Send feedback on GitHub
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
        The in-app feedback form isn&apos;t switched on yet, but we still want
        to hear from you — open an issue on GitHub and it&apos;ll land right
        in our inbox.
      </p>
      <a
        href={ISSUES_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        Open an issue on GitHub
      </a>
    </div>
  );
}

export function FeedbackForm() {
  const { user, profile } = useAuth();
  // Skip straight to the fallback when Supabase isn't configured at all.
  const [phase, setPhase] = useState<Phase>(() =>
    isSupabaseConfigured() ? "checking" : "fallback",
  );
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);

  // Prefill the trainer name from the logged-in profile once it arrives.
  // Never clobbers typing: skips when the field is non-empty, and only
  // runs once per username.
  if (profile?.username && prefilledFor !== profile.username && name === "") {
    setPrefilledFor(profile.username);
    setName(profile.username);
  }

  // Probe for the feedback table: Supabase not configured, or the schema
  // hasn't been run yet, means we show the GitHub fallback instead of a
  // broken form.
  useEffect(() => {
    if (phase !== "checking") return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { error: probeError } = await supabase
          .from("feedback")
          .select("id", { head: true, count: "exact" });
        if (cancelled) return;
        setPhase(isMissingTable(probeError) ? "fallback" : "form");
      } catch (err) {
        if (!cancelled) setPhase(isMissingTable(err) ? "fallback" : "form");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      setError("Please write a message first — even a sentence helps.");
      return;
    }
    if (trimmed.length > MAX_MESSAGE) {
      setError(`Please keep it under ${MAX_MESSAGE} characters.`);
      return;
    }
    setError(null);
    setPhase("sending");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("feedback").insert({
        type,
        message: trimmed,
        trainer_name: name.trim() || null,
        user_id: user?.id ?? null,
      });
      if (insertError) throw insertError;
      setPhase("thanks");
    } catch (err) {
      if (isMissingTable(err)) {
        setPhase("fallback");
      } else {
        setPhase("form");
        setError("Couldn't send that just now — please try again.");
      }
    }
  }

  if (phase === "checking") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Loading the feedback form…</p>
      </div>
    );
  }

  if (phase === "fallback") return <FallbackCard />;

  if (phase === "thanks") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-4xl" aria-hidden="true">
          💚
        </p>
        <h2 className="mt-3 text-lg font-bold text-slate-900">
          Thank you, trainer!
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
          Your feedback is on its way. Every note gets read — seriously, we
          love hearing from you.
        </p>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setError(null);
            setPhase("form");
          }}
          className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
    >
      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">
          What kind of feedback is this?
        </legend>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                type === t.value
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="feedback-type"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-slate-900">
                {t.label}
              </span>
              <span className="block text-xs text-slate-500">{t.blurb}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label
          htmlFor="feedback-message"
          className="text-sm font-semibold text-slate-800"
        >
          Your message
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={MAX_MESSAGE + 100}
          placeholder="Tell us what's on your mind…"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
        />
        <p className="mt-1 text-right text-xs text-slate-400">
          {message.length} / {MAX_MESSAGE}
        </p>
      </div>

      <div className="mt-4">
        <label
          htmlFor="feedback-name"
          className="text-sm font-semibold text-slate-800"
        >
          Trainer name <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="feedback-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="So we know who to thank"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={phase === "sending"}
        className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {phase === "sending" ? "Sending…" : "Send feedback"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Feedback is private — only the site owner reads it.
      </p>
    </form>
  );
}
