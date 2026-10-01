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
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to enable accounts.",
    );
  }
  return createBrowserClient(supabaseUrl()!, supabaseAnonKey()!);
}
