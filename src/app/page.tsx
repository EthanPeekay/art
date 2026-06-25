import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { ArtworkCard } from "@/components/showroom/ArtworkCard";
import { getShowroomArtworks } from "@/lib/data/artworks";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const { artworks } = await getShowroomArtworks({ pageSize: 8 });

  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artist_profiles")
    .select("*, profile:profiles(*)")
    .order("follower_count", { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      {/* HERO — the thesis: the work itself, not a value-prop banner */}
      <section className="relative overflow-hidden bg-charcoal text-parchment">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-gold">
              A showroom, not a marketplace
            </p>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] md:text-6xl">
              Work that carries the hand
              <br />
              of the person who made it.
            </h1>
            <p className="mt-6 max-w-md text-parchment/75">
              Medawa Showroom connects collectors directly with sculptors and
              painters working across the continent — with the story,
              provenance, and process behind every piece, not just a price tag.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/showroom"
                className="rounded-sm bg-sienna px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-parchment hover:bg-sienna-deep"
              >
                Enter the showroom
              </Link>
              <Link
                href="/signup?role=artist"
                className="rounded-sm border border-parchment/30 px-7 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-parchment hover:border-parchment"
              >
                Exhibit your work
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {artworks.slice(0, 4).map((a, i) => {
              const img = a.media?.find((m) => m.is_primary) ?? a.media?.[0];
              return (
                <div
                  key={a.id}
                  className={`relative aspect-[4/5] overflow-hidden rounded-sm bg-charcoal-soft ${i === 1 ? "mt-6" : ""} ${i === 2 ? "-mt-6" : ""}`}
                >
                  {img && (
                    <Image
                      src={img.url}
                      alt={img.alt_text ?? a.title}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED ARTWORKS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl text-ink">Recently exhibited</h2>
          <Link
            href="/showroom"
            className="font-mono text-[12px] uppercase tracking-[0.08em] text-sienna hover:text-sienna-deep"
          >
            View all →
          </Link>
        </div>

        {artworks.length === 0 ? (
          <p className="mt-8 text-ink-soft">
            Nothing exhibited yet. Once artists publish work, it appears here.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        )}
      </section>

      {/* FEATURED ARTISTS */}
      {artists && artists.length > 0 && (
        <section className="border-t border-charcoal/10 bg-parchment-dim/60">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="font-display text-3xl text-ink">Artists to follow</h2>
            <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
              {artists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.id}`}
                  className="group"
                >
                  <div className="relative aspect-square overflow-hidden rounded-full bg-charcoal-soft">
                    {artist.cover_image_url && (
                      <Image
                        src={artist.cover_image_url}
                        alt={artist.display_name}
                        fill
                        sizes="200px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <p className="mt-3 text-center font-display text-base text-ink group-hover:text-sienna-deep">
                    {artist.display_name}
                  </p>
                  <p className="text-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                    {artist.region ?? "—"} · {artist.follower_count} followers
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-charcoal/10 px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
          Medawa Showroom — built for the artists and collectors of African
          sculpture and painting.
        </p>
      </footer>
    </div>
  );
}
