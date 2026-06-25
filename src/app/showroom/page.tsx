import { Suspense } from "react";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { ArtworkCard } from "@/components/showroom/ArtworkCard";
import { ShowroomFilterBar } from "@/components/showroom/ShowroomFilterBar";
import { getShowroomArtworks } from "@/lib/data/artworks";
import { ArtworkCategory } from "@/lib/types/database";
import Link from "next/link";

interface ShowroomPageProps {
  searchParams: Promise<{
    category?: string;
    region?: string;
    saleType?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ShowroomPage({ searchParams }: ShowroomPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const pageSize = 24;

  const { artworks, total } = await getShowroomArtworks({
    category: params.category as ArtworkCategory | undefined,
    region: params.region,
    saleType: params.saleType as "fixed" | "auction" | undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    sort: params.sort as "newest" | "price_asc" | "price_desc" | undefined,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">The showroom</h1>
        <p className="mt-2 text-ink-soft">
          {total} {total === 1 ? "piece" : "pieces"} currently exhibited.
        </p>

        <div className="mt-8">
          <Suspense>
            <ShowroomFilterBar />
          </Suspense>
        </div>

        {artworks.length === 0 ? (
          <div className="mt-20 text-center text-ink-soft">
            <p className="font-display text-2xl text-ink">No pieces match yet</p>
            <p className="mt-2">Try widening your filters.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-14 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={{
                  pathname: "/showroom",
                  query: { ...params, page: p },
                }}
                className={`rounded-sm px-3 py-1.5 font-mono text-sm ${
                  p === page
                    ? "bg-charcoal text-parchment"
                    : "bg-charcoal/8 text-ink hover:bg-charcoal/15"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
