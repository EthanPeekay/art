import Image from "next/image";
import Link from "next/link";
import { Artwork, ARTWORK_CATEGORY_LABELS } from "@/lib/types/database";
import { Badge } from "@/components/ui/Badge";

interface ArtworkCardProps {
  artwork: Artwork;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  const primaryImage =
    artwork.media?.find((m) => m.is_primary) ?? artwork.media?.[0];
  const isAuction = artwork.sale_type === "auction" || artwork.sale_type === "both";
  const isLiveAuction = isAuction && artwork.auction?.status === "live";

  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group block focus-visible:outline-none"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-charcoal-soft">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? artwork.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-parchment/40 text-sm">
            No image
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          {artwork.status === "sold" && <Badge variant="sold">Sold</Badge>}
          {isLiveAuction && <Badge variant="live">● Live auction</Badge>}
        </div>
      </div>

      {/* Museum-label metadata row */}
      <div className="label-rule mt-3 pt-3">
        <h3 className="font-display text-lg leading-snug text-ink group-hover:text-sienna-deep transition-colors">
          {artwork.title}
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
          {artwork.artist?.display_name ?? "Unknown artist"}
          {" · "}
          {ARTWORK_CATEGORY_LABELS[artwork.category]}
          {artwork.region_origin ? ` · ${artwork.region_origin}` : ""}
          {artwork.year_created ? ` · ${artwork.year_created}` : ""}
        </p>
        <p className="mt-2 font-mono text-sm text-ink">
          {isLiveAuction && artwork.auction?.current_high_bid
            ? `Current bid: ${formatPrice(artwork.auction.current_high_bid, artwork.currency)}`
            : formatPrice(artwork.price, artwork.currency)}
        </p>
      </div>
    </Link>
  );
}
