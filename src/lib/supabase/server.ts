import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use this inside Server Components, Route Handlers, and Server Actions.
// Each call reads the current request's cookies, so auth state stays in sync
// with the user's session on every request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from a Server Component, where cookies
            // can't be mutated. Safe to ignore if middleware refreshes
            // the session for you (see middleware.ts).
          }
        },
      },
    }
  );
}
