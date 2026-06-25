import { requireArtistProfile } from "@/lib/data/artist-auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Order } from "@/lib/types/database";

export default async function DashboardOrdersPage() {
  const { artist } = await requireArtistProfile();
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, artwork:artworks(title)")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-ink">Orders</h2>

      {!orders || orders.length === 0 ? (
        <p className="text-sm text-ink-soft">No orders yet.</p>
      ) : (
        <div className="divide-y divide-charcoal/10 rounded-sm border border-charcoal/10 bg-parchment">
          {(orders as unknown as (Order & { artwork: { title: string } })[]).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-display text-base text-ink">{order.artwork?.title}</p>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                  {new Date(order.created_at).toLocaleDateString()} ·{" "}
                  {order.order_type === "auction_win" ? "Auction win" : "Direct purchase"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-ink">
                  {order.currency} {order.amount} · you receive {order.currency}{" "}
                  {order.artist_payout}
                </p>
                <Badge
                  variant={
                    order.status === "delivered"
                      ? "live"
                      : order.status === "pending_payment"
                        ? "neutral"
                        : "gold"
                  }
                >
                  {order.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
