"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAllSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { createClient } from "@/lib/supabase/client";
import { incrementRecord, maxRecord } from "@/lib/achievements";

interface Round {
  answer: SpeciesIndex;
  options: SpeciesIndex[];
}

function makeRound(pool: SpeciesIndex[]): Round {
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const others = new Set<SpeciesIndex>();
  while (others.size < 3) {
    const cand = pool[Math.floor(Math.random() * pool.length)];
    if (cand.id !== answer.id) others.add(cand);
  }
  const options = [...others, answer].sort(() => Math.random() - 0.5);
  return { answer, options };
}

const cryUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;

export default function CryQuizPage() {
  const [pool, setPool] = useState<SpeciesIndex[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const all = getAllSpecies();
    setPool(all);
    setRound(makeRound(all));
    setBest(Number(localStorage.getItem("cry-quiz-best-streak") ?? 0));
    createClient().auth.getUser().then(({ data }: { data: { user?: { id?: string } | null } }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, []);

  const nextRound = useCallback(() => {
    setRound(makeRound(pool));
    setPicked(null);
    setNewAchievements([]);
    setPlaying(false);
  }, [pool]);

  const playCry = () => {
    if (!round || !audioRef.current) return;
    audioRef.current.src = cryUrl(round.answer.id);
    void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const pick = (id: number) => {
    if (picked !== null || !round) return;
    setPicked(id);
    setRoundsPlayed((r) => r + 1);
    const correct = id === round.answer.id;
    if (correct) {
      const newStreak = streak + 1;
      setScore((s) => s + 1);
      setStreak(newStreak);
      if (newStreak > best) {
        setBest(newStreak);
        localStorage.setItem("cry-quiz-best-streak", String(newStreak));
      }
      const uid = userIdRef.current;
      if (uid) {
        void incrementRecord(uid, "quiz_correct", 1).then((ids) => {
          if (ids.length > 0) setNewAchievements((prev) => [...prev, ...ids]);
        });
        void maxRecord(uid, "quiz_best_streak", newStreak).then((ids) => {
          if (ids.length > 0) setNewAchievements((prev) => [...prev, ...ids]);
        });
      }
    } else {
      setStreak(0);
    }
  };

  if (!round) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 text-center">
        <div className="text-4xl">🔊</div>
        <p className="mt-2 text-slate-500">Loading Pokémon…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Cry Quiz</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Listen — who&apos;s that Pokémon?</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-bold text-slate-700 dark:text-slate-200">Score: {score}/{roundsPlayed}</div>
          <div className="text-slate-500 dark:text-slate-400">🔥 Streak: {streak} · Best: {best}</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-b from-indigo-900 to-slate-900 p-10 text-center shadow-lg">
        <audio ref={audioRef} preload="none" onEnded={() => setPlaying(false)} />
        <button
          onClick={playCry}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-4xl shadow-lg ring-2 ring-white/30 transition hover:scale-105 hover:bg-white/20"
          aria-label="Play cry"
        >
          {playing ? "🔊" : "▶️"}
        </button>
        <p className="mt-4 text-sm text-indigo-200">
          {picked === null ? "Tap to hear its cry" : `It was ${round.answer.name}!`}
        </p>
        {picked !== null && (
          <img
            src={round.answer.sprites.regular}
            alt={round.answer.name}
            className="mx-auto mt-2 h-32 w-32 object-contain"
          />
        )}
      </div>

      {newAchievements.length > 0 && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-300 dark:bg-amber-950/40 dark:ring-amber-800">
          <span className="font-bold text-amber-700 dark:text-amber-300">🏆 Achievement unlocked!</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {round.options.map((opt) => {
          const isAnswer = opt.id === round.answer.id;
          const isPicked = picked === opt.id;
          let cls = "bg-white ring-slate-200 hover:ring-emerald-300 dark:bg-slate-900 dark:ring-slate-700 dark:hover:ring-emerald-700";
          if (picked !== null) {
            if (isAnswer) cls = "bg-emerald-100 ring-emerald-400 dark:bg-emerald-900 dark:ring-emerald-600";
            else if (isPicked) cls = "bg-rose-100 ring-rose-400 dark:bg-rose-950 dark:ring-rose-700";
            else cls = "bg-white ring-slate-200 opacity-50 dark:bg-slate-900 dark:ring-slate-700";
          }
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={picked !== null}
              className={`rounded-2xl px-6 py-4 text-lg font-bold text-slate-700 shadow-sm ring-1 transition dark:text-slate-100 ${cls}`}
            >
              {opt.name}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <button
          onClick={nextRound}
          className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-white shadow hover:bg-emerald-600"
        >
          Next cry →
        </button>
      )}
    </main>
  );
}
