import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "./lib/supabase/config";

/**
 * Refresh the Supabase auth session on every request so server-rendered
 * pages always see a fresh session. When Supabase isn't configured yet,
 * this is a no-op and the rest of the site works untouched.
 *
 * NOTE (Next.js 16): uses the `proxy.ts` file convention (the `middleware`
 * convention is deprecated as of Next 16).
 */
export async function proxy(request: NextRequest) {
  // Use the normalized helpers (not the raw env vars): if
  // NEXT_PUBLIC_SUPABASE_URL was pasted as the REST endpoint
  // (…/rest/v1) the auth client would build broken API URLs and every
  // session refresh would fail.
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session when expired; also surfaces auth errors early.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
