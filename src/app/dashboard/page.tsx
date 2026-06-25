import Link from "next/link";
import { requireArtistProfile } from "@/lib/data/artist-auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function DashboardOverviewPage() {
  const { artist } = await requireArtistProfile();
  const supabase = await createClient();

  const [{ count: activeCount }, { count: soldCount }, { data: orders }] =
    await Promise.all([
      supabase
        .from("artworks")
        .select("id", { count: "exact", head: true })
        .eq("artist_id", artist.id)
        .eq("status", "active"),
      supabase
        .from("artworks")
        .select("id", { count: "exact", head: true })
        .eq("artist_id", artist.id)
        .eq("status", "sold"),
      supabase
        .from("orders")
        .select("amount, artist_payout, status")
        .eq("artist_id", artist.id),
    ]);

  const totalRevenue = (orders ?? [])
    .filter((o) => o.status === "paid" || o.status === "delivered" || o.status === "shipped")
    .reduce((sum, o) => sum + Number(o.artist_payout), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Overview</h2>
        <Link href="/dashboard/artworks/new">
          <Button>Upload new work</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active listings" value={activeCount ?? 0} />
        <StatCard label="Pieces sold" value={soldCount ?? 0} />
        <StatCard label="Followers" value={artist.follower_count} />
        <StatCard
          label="Net revenue"
          value={new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }).format(totalRevenue)}
        />
      </div>

      <div className="rounded-sm border border-charcoal/10 bg-parchment p-6">
        <h3 className="font-display text-lg text-ink">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/artworks/new">
            <Button variant="secondary">Upload artwork</Button>
          </Link>
          <Link href="/dashboard/posts">
            <Button variant="secondary">Share an update</Button>
          </Link>
          <Link href="/dashboard/profile">
            <Button variant="secondary">Edit profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-sm border border-charcoal/10 bg-parchment p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}
