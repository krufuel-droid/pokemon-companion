/**
 * Friendly placeholder shown on account-related pages when the Supabase
 * env vars aren't set yet. The rest of the site renders normally.
 */
export default function SupabaseNeeded() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Trainer accounts aren&apos;t connected yet
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          This part of the site needs a Supabase project. Everything else —
          the Pokédex, calculators, and guides — works fine without it.
        </p>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
          To enable accounts, set these environment variables and redeploy:
        </p>
        <code className="mt-3 block rounded-lg bg-stone-100 px-4 py-3 text-left text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          NEXT_PUBLIC_SUPABASE_URL
          <br />
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>
      </div>
    </div>
  );
}
