import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { count: followingCount } = await supabase
    .from("follows")
    .select("artist_id", { count: "exact", head: true })
    .eq("follower_id", user.id);

  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", user.id);

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl text-ink">My account</h1>

        <div className="mt-8 rounded-sm border border-charcoal/10 bg-parchment-dim/40 p-6">
          <p className="font-display text-xl text-ink">{profile?.full_name}</p>
          <p className="font-mono text-sm text-ink-soft">{profile?.email}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-charcoal/10 bg-parchment p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              Following
            </p>
            <p className="mt-2 font-display text-3xl text-ink">{followingCount ?? 0}</p>
          </div>
          <div className="rounded-sm border border-charcoal/10 bg-parchment p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              Orders placed
            </p>
            <p className="mt-2 font-display text-3xl text-ink">{orderCount ?? 0}</p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/account/orders">
            <Button variant="secondary">View order history</Button>
          </Link>
          <Link href="/showroom">
            <Button variant="secondary">Continue browsing</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
