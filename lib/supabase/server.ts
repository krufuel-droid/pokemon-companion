import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "./config";

/**
 * Create a Supabase client for Server Components / Route Handlers.
 * Must be called in a server context. Throws a friendly error when
 * Supabase isn't configured — callers should check
 * isSupabaseConfigured() first and render the setup note instead.
 */
export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY to enable accounts.",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl()!, supabaseAnonKey()!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component where setting cookies is not
          // allowed; middleware refreshes the session instead.
        }
      },
    },
  });
}
