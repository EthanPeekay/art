import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { CheckoutForm } from "@/components/audience/CheckoutForm";
import { createClient } from "@/lib/supabase/server";
import { Order } from "@/lib/types/database";

interface CheckoutPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/checkout/${orderId}`);

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, artwork:artworks(title, currency, media:artwork_media(*), artist:artist_profiles(display_name))")
    .eq("id", orderId)
    .single();

  if (error || !order) notFound();
  if (order.buyer_id !== user.id) redirect("/account");

  if (order.status !== "pending_payment") {
    redirect(`/checkout/${orderId}/confirmation`);
  }

  const img = order.artwork?.media?.find((m: { is_primary: boolean }) => m.is_primary) ?? order.artwork?.media?.[0];

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-3xl text-ink">Checkout</h1>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-charcoal-soft">
              {img && (
                <Image src={img.url} alt={order.artwork.title} fill className="object-cover" />
              )}
            </div>
            <p className="mt-3 font-display text-lg text-ink">{order.artwork.title}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              by {order.artwork.artist?.display_name}
            </p>
            <p className="mt-2 font-mono text-xl text-ink">
              {order.currency} {order.amount}
            </p>
          </div>

          <CheckoutForm order={order as unknown as Order} />
        </div>
      </div>
    </div>
  );
}
