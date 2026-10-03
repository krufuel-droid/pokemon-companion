import RandomizerClient from "./RandomizerClient";

export const metadata = {
  title: "Team Randomizer | Poké Companion",
  description:
    "Pick a game and get a balanced team of early-game Pokémon for your next playthrough.",
};

export default function RandomizerPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        Team Randomizer
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Starting a new playthrough? Choose your game and let fate build your
        party — six Pokémon you can catch early, strong enough to carry their
        weight, and spread across types.
      </p>
      <div className="mt-8">
        <RandomizerClient />
      </div>
    </div>
  );
}
