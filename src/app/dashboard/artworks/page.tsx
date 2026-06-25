import Link from "next/link";
import Image from "next/image";
import { requireArtistProfile } from "@/lib/data/artist-auth";
import { getArtistArtworks } from "@/lib/data/artworks";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ARTWORK_CATEGORY_LABELS } from "@/lib/types/database";
import { DeleteArtworkButton } from "@/components/artist-dashboard/DeleteArtworkButton";

export default async function DashboardArtworksPage() {
  const { artist } = await requireArtistProfile();
  const artworks = await getArtistArtworks(artist.id, true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Your artworks</h2>
        <Link href="/dashboard/artworks/new">
          <Button>Upload new work</Button>
        </Link>
      </div>

      {artworks.length === 0 ? (
        <div className="rounded-sm border border-dashed border-charcoal/20 p-12 text-center">
          <p className="font-display text-lg text-ink">Nothing uploaded yet</p>
          <p className="mt-1 text-sm text-ink-soft">
            Your first piece will appear here once you upload it.
          </p>
          <Link href="/dashboard/artworks/new" className="mt-4 inline-block">
            <Button>Upload your first piece</Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-charcoal/10 rounded-sm border border-charcoal/10 bg-parchment">
          {artworks.map((artwork) => {
            const img = artwork.media?.find((m) => m.is_primary) ?? artwork.media?.[0];
            return (
              <div key={artwork.id} className="flex items-center gap-4 p-4">
                <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-charcoal-soft">
                  {img && (
                    <Image src={img.url} alt={artwork.title} fill className="object-cover" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-display text-base text-ink">{artwork.title}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                    {ARTWORK_CATEGORY_LABELS[artwork.category]} · {artwork.currency}{" "}
                    {artwork.price}
                  </p>
                </div>

                <StatusBadge status={artwork.status} />

                <div className="flex gap-2">
                  <Link href={`/dashboard/artworks/${artwork.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <DeleteArtworkButton artworkId={artwork.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "sold" ? "sold" : status === "active" ? "live" : "neutral";
  return <Badge variant={variant}>{status}</Badge>;
}
