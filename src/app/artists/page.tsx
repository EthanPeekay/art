import Link from "next/link";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { createClient } from "@/lib/supabase/server";

export default async function ArtistsDirectoryPage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artist_profiles")
    .select("*")
    .order("follower_count", { ascending: false });

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">Artists</h1>
        <p className="mt-2 text-ink-soft">{artists?.length ?? 0} artists exhibiting on Medawa.</p>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {(artists ?? []).map((artist) => (
            <Link key={artist.id} href={`/artists/${artist.id}`} className="group text-center">
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-charcoal-soft">
                {artist.cover_image_url && (
                  <img
                    src={artist.cover_image_url}
                    alt={artist.display_name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="mt-3 font-display text-lg text-ink group-hover:text-sienna-deep">
                {artist.display_name}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                {artist.region ?? "—"} · {artist.follower_count} followers
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
