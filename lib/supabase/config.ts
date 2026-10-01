/**
 * Supabase configuration helpers.
 *
 * The app reads its Supabase credentials from the public env vars
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * When they are missing (e.g. a fresh clone before setup), the app must
 * degrade gracefully instead of crashing — see isSupabaseConfigured().
 */

export function supabaseUrl(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return v && v.trim() !== "" ? v : undefined;
}

export function supabaseAnonKey(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return v && v.trim() !== "" ? v : undefined;
}

/** True when both public Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}
