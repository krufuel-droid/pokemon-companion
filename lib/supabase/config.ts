/**
 * Supabase configuration helpers.
 *
 * The app reads its Supabase credentials from the public env vars
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * When they are missing (e.g. a fresh clone before setup), the app must
 * degrade gracefully instead of crashing — see isSupabaseConfigured().
 */

/**
 * The bare project origin, e.g. https://xyzcompany.supabase.co
 *
 * The Supabase dashboard shows several similar-looking URLs (Project URL,
 * REST endpoint, Auth endpoint). Only the bare Project URL is correct —
 * the client appends its own service paths (/auth/v1, /rest/v1, ...).
 * If someone pastes the REST endpoint (…/rest/v1) by mistake, every
 * request 404s at the gateway with "Invalid path specified in request
 * URL", so we normalize to the origin here instead of failing cryptically.
 */
export function supabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw || raw.trim() === "") return undefined;
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    if (url.pathname && url.pathname !== "/") {
      console.warn(
        `[supabase] NEXT_PUBLIC_SUPABASE_URL should be the bare project URL ` +
          `(${url.origin}); ignoring pasted path "${url.pathname}".`,
      );
    }
    return url.origin;
  } catch {
    // Malformed URL — let the Supabase client raise its own clear error.
    return trimmed;
  }
}

export function supabaseAnonKey(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return v && v.trim() !== "" ? v : undefined;
}

/** True when both public Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}
