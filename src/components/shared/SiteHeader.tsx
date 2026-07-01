import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/shared/LogoutButton";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-parchment/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          African Art <span className="text-sienna">Showroom</span>
        </Link>

        <nav className="hidden items-center gap-7 font-mono text-[12px] uppercase tracking-[0.08em] text-ink-soft md:flex">
          <Link href="/showroom" className="hover:text-ink">
            Showroom
          </Link>
          <Link href="/artists" className="hover:text-ink">
            Artists
          </Link>
          <Link href="/feed" className="hover:text-ink">
            Feed
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                href="/login"
                className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-sm bg-sienna px-4 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-parchment hover:bg-sienna-deep"
              >
                Join
              </Link>
            </>
          )}

          {user && role === "artist" && (
            <Link
              href="/dashboard"
              className="rounded-sm bg-charcoal px-4 py-2 font-mono text-[12px] uppercase tracking-[0.08em] text-parchment hover:bg-charcoal-soft"
            >
              Studio dashboard
            </Link>
          )}

          {user && role === "audience" && (
            <Link
              href="/account"
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-soft hover:text-ink"
            >
              My account
            </Link>
          )}

          {user && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
