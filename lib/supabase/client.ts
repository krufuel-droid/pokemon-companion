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
    browserClient = createBrowserClient(supabaseUrl()!, supabaseAnonKey()!, {
      cookies: {
        getAll() {
          return document.cookie.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll(cookies) {
          for (const { name, value, options } of cookies) {
            // Explicit cookie attributes for Chrome: SameSite=Lax allows the
            // cookie on top-level navigation, Secure requires HTTPS (Vercel
            // is HTTPS), path=/ makes it site-wide, and a long Max-Age keeps
            // the session alive. Without these, Chrome's defaults can drop
            // the auth cookie, causing the TOKEN_REFRESHED death spiral.
            let cookie = `${name}=${value}; path=${options?.path ?? "/"}; Max-Age=${options?.maxAge ?? 31536000}; SameSite=Lax; Secure`;
            if (options?.domain) cookie += `; domain=${options.domain}`;
            document.cookie = cookie;
          }
        },
      },
    });
  }
  return browserClient;
}
