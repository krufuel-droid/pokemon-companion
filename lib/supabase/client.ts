import { createBrowserClient } from "@supabase/ssr";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "./config";

/**
 * Create a Supabase client for browser (Client Component) usage.
 * Throws a friendly error when Supabase isn't configured — callers should
 * check isSupabaseConfigured() first and render the setup note instead.
 *
 * Uses a singleton: multiple createBrowserClient() instances each run their
 * own token-refresh loop, which causes a TOKEN_REFRESHED death spiral
 * (observed Oct 2026: dozens of refreshes per second, ending in SIGNED_OUT).
 * One shared instance means one session manager.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to enable accounts.",
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl()!, supabaseAnonKey()!);
  }
  return browserClient;
}
