"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAllSpecies, type SpeciesIndex } from "@/lib/pokedex";
import { createClient } from "@/lib/supabase/client";
import { incrementRecord, maxRecord } from "@/lib/achievements";

interface Round {
  answer: SpeciesIndex;
  options: SpeciesIndex[];
}

/** Generation dex ranges. */
const GENERATIONS = [
  { label: "All generations", min: 1, max: 1025 },
  { label: "Gen 1 — Kanto", min: 1, max: 151 },
  { label: "Gen 2 — Johto", min: 152, max: 251 },
  { label: "Gen 3 — Hoenn", min: 252, max: 386 },
  { label: "Gen 4 — Sinnoh", min: 387, max: 493 },
  { label: "Gen 5 — Unova", min: 494, max: 649 },
  { label: "Gen 6 — Kalos", min: 650, max: 721 },
  { label: "Gen 7 — Alola", min: 722, max: 809 },
  { label: "Gen 8 — Galar / Hisui", min: 810, max: 905 },
  { label: "Gen 9 — Paldea", min: 906, max: 1025 },
];

function makeRound(pool: SpeciesIndex[], excludeIds: Set<number>): Round {
  const available = pool.filter((s) => !excludeIds.has(s.id));
  const pickFrom = available.length > 0 ? available : pool;
  const answer = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  const others = new Set<SpeciesIndex>();
  while (others.size < 3) {
    const cand = pool[Math.floor(Math.random() * pool.length)];
    if (cand.id !== answer.id) others.add(cand);
  }
  const options = [...others, answer].sort(() => Math.random() - 0.5);
  return { answer, options };
}

export default function QuizPage() {
  const [pool, setPool] = useState<SpeciesIndex[]>([]);
  const [genIndex, setGenIndex] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const userIdRef = useRef<string | null>(null);
  /** Answer IDs already shown this session — avoids repeats until pool exhausts. */
  const usedIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const all = getAllSpecies();
    setPool(all);
    setRound(makeRound(all, usedIdsRef.current));
    setBest(Number(localStorage.getItem("quiz-best-streak") ?? 0));
    createClient().auth.getUser().then(({ data }: { data: { user?: { id?: string } | null } }) => {
      userIdRef.current = data.user?.id ?? null;
    });
  }, []);

  /** Switch generation: rebuild pool, reset session. */
  const changeGeneration = (index: number) => {
    const gen = GENERATIONS[index];
    const filtered = getAllSpecies().filter((s) => s.id >= gen.min && s.id <= gen.max);
    usedIdsRef.current = new Set();
    setGenIndex(index);
    setPool(filtered);
    setRound(makeRound(filtered, usedIdsRef.current));
    setRoundNum((n) => n + 1);
    setPicked(null);
    setNewAchievements([]);
  };

  const nextRound = useCallback(() => {
    setRound((prev) => {
      void prev;
      return makeRound(pool, usedIdsRef.current);
    });
    setRoundNum((n) => n + 1);
    setPicked(null);
    setNewAchievements([]);
  }, [pool]);

  const pick = (id: number) => {
    if (picked !== null || !round) return;
    setPicked(id);
    setRoundsPlayed((r) => r + 1);
    usedIdsRef.current.add(round.answer.id);
    const correct = id === round.answer.id;
    if (correct) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > best) {
        setBest(newStreak);
        localStorage.setItem("quiz-best-streak", String(newStreak));
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
        <div className="text-4xl">❓</div>
        <p className="mt-2 text-slate-500">Loading Pokémon…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Who's That Pokémon?</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Name the silhouette!</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-bold text-slate-700 dark:text-slate-200">Score: {score}/{roundsPlayed}</div>
          <div className="text-slate-500 dark:text-slate-400">🔥 Streak: {streak} · Best: {best}</div>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="quiz-gen" className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Generation
        </label>
        <select
          id="quiz-gen"
          value={genIndex}
          onChange={(e) => changeGeneration(Number(e.target.value))}
          className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          {GENERATIONS.map((g, i) => (
            <option key={g.label} value={i}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 rounded-2xl bg-gradient-to-b from-indigo-900 to-slate-900 p-8 text-center shadow-lg">
        {/* key forces a fresh img each round so the silhouette filter applies
            from first paint — no transition flash of the new Pokémon. */}
        <img
          key={roundNum}
          src={round.answer.sprites.regular}
          alt="Who's that Pokémon?"
          className="mx-auto h-56 w-56 object-contain transition-all duration-500"
          style={picked === null ? { filter: "brightness(0)" } : undefined}
          draggable={false}
        />
        {picked !== null && (
          <div className="mt-2 text-2xl font-black text-white animate-bounce">
            It's {round.answer.name}!
          </div>
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
          Next Pokémon →
        </button>
      )}
    </main>
  );
}
