import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
        <p>
          <Link
            href="/feedback"
            className="font-medium text-slate-600 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-700"
          >
            Send feedback
          </Link>
        </p>
        <p>
          Pokémon Companion is an unofficial fan project, not affiliated with
          Nintendo / Creatures Inc. / GAME FREAK inc.
        </p>
        <p>
          Data via PokéAPI. Pokémon © Nintendo / Creatures Inc. / GAME FREAK
          inc.
        </p>
        <p>
          Pokémon sprites:{" "}
          <a
            href="https://www.smogon.com/forums/threads/smogon-sprite-project.3647722/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-emerald-300 underline-offset-2 hover:text-emerald-700"
          >
            Smogon Sprite Project
          </a>{" "}
          community.
        </p>
        <p>Free forever, no ads, non-commercial fan project.</p>
      </div>
    </footer>
  );
}
