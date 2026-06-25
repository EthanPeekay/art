import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an authenticated *artist* account.
const ARTIST_ROUTES = ["/dashboard"];
// Routes that require any authenticated account (audience or artist).
const AUTHENTICATED_ROUTES = ["/account", "/checkout"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: avoid writing logic between createServerClient and getUser().
  // A simple mistake here can make it very hard to debug session issues.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsArtist = ARTIST_ROUTES.some((r) => path.startsWith(r));
  const needsAuth = AUTHENTICATED_ROUTES.some((r) => path.startsWith(r));

  if ((needsArtist || needsAuth) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (needsArtist && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "artist" && profile?.role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
