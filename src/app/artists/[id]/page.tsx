import { notFound } from "next/navigation";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { ArtworkCard } from "@/components/showroom/ArtworkCard";
import { FollowButton } from "@/components/audience/FollowButton";
import { Badge } from "@/components/ui/Badge";
import { getArtistProfile, getArtistArtworks } from "@/lib/data/artworks";
import { createClient } from "@/lib/supabase/server";

interface ArtistProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { id } = await params;
  const artist = await getArtistProfile(id);

  if (!artist) notFound();

  const artworks = await getArtistArtworks(id);
  const activeWorks = artworks.filter((a) => a.status === "active" || a.status === "reserved");
  const soldWorks = artworks.filter((a) => a.status === "sold");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden bg-charcoal">
        {artist.cover_image_url && (
          <Image
            src={artist.cover_image_url}
            alt={artist.display_name}
            fill
            className="object-cover opacity-80"
          />
        )}
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 -mt-10">
          <div className="rounded-sm bg-parchment p-5">
            <h1 className="font-display text-3xl text-ink">{artist.display_name}</h1>
            <div className="mt-1 flex items-center gap-2">
              {artist.is_verified && <Badge variant="gold">Verified</Badge>}
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                {artist.region ?? "—"} · {artist.follower_count} followers
              </span>
            </div>
          </div>
          <FollowButton artistId={artist.id} isLoggedIn={!!user} />
        </div>

        {artist.bio && <p className="mt-6 max-w-2xl text-ink-soft">{artist.bio}</p>}

        {artist.specialties.length > 0 && (
          <div className="mt-4 flex gap-2">
            {artist.specialties.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        )}

        {artist.history && (
          <div className="mt-10 max-w-2xl">
            <h2 className="font-display text-xl text-ink">History</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">{artist.history}</p>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-display text-xl text-ink">
            Active work ({activeWorks.length})
          </h2>
          {activeWorks.length === 0 ? (
            <p className="mt-4 text-ink-soft">Nothing currently exhibited.</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {activeWorks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={{ ...artwork, artist }} />
              ))}
            </div>
          )}
        </div>

        {soldWorks.length > 0 && (
          <div className="mt-14 border-t border-charcoal/10 pt-10 pb-16">
            <h2 className="font-display text-xl text-ink">Sold ({soldWorks.length})</h2>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
              {soldWorks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={{ ...artwork, artist }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
