import GymRunClient from "./GymRunClient";

export const metadata = {
  title: "Gym Run Tracker | Poké Companion",
  description:
    "Track your playthrough's gyms, trials, and titans in order — log your team, results, and notes, badge by badge.",
};

export default function GymRunPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Gym Run Tracker
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick a game, log each gym, trial, or titan in order — your team, the
        result, and any notes. Your progress earns gym-badge achievements.
      </p>
      <div className="mt-8">
        <GymRunClient />
      </div>
    </div>
  );
}
