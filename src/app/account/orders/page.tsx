import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { Order } from "@/lib/types/database";

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, artwork:artworks(title, media:artwork_media(*))")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl text-ink">Order history</h1>

        {!orders || orders.length === 0 ? (
          <p className="mt-6 text-ink-soft">
            No orders yet.{" "}
            <Link href="/showroom" className="text-sienna hover:underline">
              Browse the showroom →
            </Link>
          </p>
        ) : (
          <div className="mt-8 divide-y divide-charcoal/10 rounded-sm border border-charcoal/10 bg-parchment">
            {(orders as unknown as (Order & {
              artwork: { title: string; media: { url: string; is_primary: boolean }[] };
            })[]).map((order) => {
              const img =
                order.artwork?.media?.find((m) => m.is_primary) ?? order.artwork?.media?.[0];
              return (
                <div key={order.id} className="flex items-center gap-4 p-4">
                  <div className="relative h-16 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-charcoal-soft">
                    {img && (
                      <Image src={img.url} alt={order.artwork.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-base text-ink">{order.artwork?.title}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                      {new Date(order.created_at).toLocaleDateString()} · {order.currency}{" "}
                      {order.amount}
                    </p>
                  </div>
                  <Badge variant={order.status === "pending_payment" ? "neutral" : "live"}>
                    {order.status.replace("_", " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
