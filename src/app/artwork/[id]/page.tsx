import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { BidPanel } from "@/components/showroom/BidPanel";
import { BuyNowButton } from "@/components/showroom/BuyNowButton";
import { FollowButton } from "@/components/audience/FollowButton";
import { getArtworkById } from "@/lib/data/artworks";
import { ARTWORK_CATEGORY_LABELS } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/server";

interface ArtworkDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ArtworkDetailPage({ params }: ArtworkDetailPageProps) {
  const { id } = await params;
  const artwork = await getArtworkById(id);

  if (!artwork) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const sortedMedia = [...(artwork.media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const isAuction = artwork.sale_type === "auction" || artwork.sale_type === "both";
  const isFixed = artwork.sale_type === "fixed" || artwork.sale_type === "both";
  const auctionLive = isAuction && artwork.auction?.status === "live";

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 md:grid-cols-2">
          {/* GALLERY */}
          <div>
            <div className="relative aspect-[4/5] overflow-hidden bg-charcoal-soft">
              {sortedMedia[0] && (
                <Image
                  src={sortedMedia[0].url}
                  alt={sortedMedia[0].alt_text ?? artwork.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              )}
              {artwork.status === "sold" && (
                <div className="absolute top-4 left-4">
                  <Badge variant="sold">Sold</Badge>
                </div>
              )}
            </div>
            {sortedMedia.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {sortedMedia.slice(1).map((m) => (
                  <div
                    key={m.id}
                    className="relative aspect-square overflow-hidden bg-charcoal-soft"
                  >
                    {m.media_type === "image" && (
                      <Image
                        src={m.url}
                        alt={m.alt_text ?? artwork.title}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-sienna">
              {ARTWORK_CATEGORY_LABELS[artwork.category]}
            </p>
            <h1 className="mt-2 font-display text-4xl text-ink">{artwork.title}</h1>

            {artwork.artist && (
              <Link
                href={`/artists/${artwork.artist.id}`}
                className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-ink-soft hover:text-ink"
              >
                by {artwork.artist.display_name}
                {artwork.artist.is_verified && <Badge variant="gold">Verified</Badge>}
              </Link>
            )}

            <dl className="label-rule mt-6 grid grid-cols-2 gap-y-3 pt-4 text-sm">
              <dt className="text-ink-soft">Medium</dt>
              <dd className="text-ink">{artwork.medium ?? "—"}</dd>
              <dt className="text-ink-soft">Region</dt>
              <dd className="text-ink">{artwork.region_origin ?? "—"}</dd>
              <dt className="text-ink-soft">Dimensions</dt>
              <dd className="text-ink">{artwork.dimensions ?? "—"}</dd>
              <dt className="text-ink-soft">Year</dt>
              <dd className="text-ink">{artwork.year_created ?? "—"}</dd>
              {artwork.edition_info && (
                <>
                  <dt className="text-ink-soft">Edition</dt>
                  <dd className="text-ink">{artwork.edition_info}</dd>
                </>
              )}
            </dl>

            {artwork.description && (
              <p className="mt-6 leading-relaxed text-ink-soft">{artwork.description}</p>
            )}

            <div className="mt-8 space-y-4">
              {isFixed && artwork.status === "active" && (
                <div>
                  <p className="font-mono text-2xl text-ink">
                    {formatPrice(artwork.price, artwork.currency)}
                  </p>
                  <div className="mt-3">
                    <BuyNowButton artworkId={artwork.id} isLoggedIn={isLoggedIn} />
                  </div>
                </div>
              )}

              {isAuction && artwork.auction && auctionLive && (
                <BidPanel
                  auction={artwork.auction}
                  currency={artwork.currency}
                  isLoggedIn={isLoggedIn}
                />
              )}

              {artwork.status === "sold" && (
                <p className="font-mono text-sm text-ink-soft">
                  This piece has found its collector.
                </p>
              )}
            </div>

            {artwork.artist && (
              <div className="mt-10 border-t border-charcoal/10 pt-6">
                <FollowButton artistId={artwork.artist.id} isLoggedIn={isLoggedIn} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
