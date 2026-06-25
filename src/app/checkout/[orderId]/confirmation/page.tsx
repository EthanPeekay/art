import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, artwork:artworks(title)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-olive">
          Order confirmed
        </p>
        <h1 className="mt-3 font-display text-3xl text-ink">
          {order.artwork?.title} is on its way to you
        </h1>
        <p className="mt-3 text-ink-soft">
          We&apos;ve notified the artist. You can track this order any time from
          your account.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/account/orders">
            <Button>View order history</Button>
          </Link>
          <Link href="/showroom">
            <Button variant="secondary">Continue browsing</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
