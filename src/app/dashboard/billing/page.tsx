import { requireArtistProfile } from "@/lib/data/artist-auth";
import { createClient } from "@/lib/supabase/server";
import { SubscribeButton } from "@/components/artist-dashboard/SubscribeButton";
import { Badge } from "@/components/ui/Badge";
import { SubscriptionPlan } from "@/lib/types/database";

export default async function DashboardBillingPage() {
  const { artist } = await requireArtistProfile();
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("active", true)
    .order("duration_months", { ascending: true });

  const { data: currentSub } = await supabase
    .from("artist_subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl text-ink">Billing</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Manage your subscription plan and access to the platform.
        </p>
      </div>

      <div className="rounded-sm border border-charcoal/10 bg-parchment p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
          Current status
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Badge variant={artist.subscription_status === "active" ? "live" : "neutral"}>
            {artist.subscription_status}
          </Badge>
          {currentSub?.plan && (
            <span className="font-display text-lg text-ink">
              {(currentSub.plan as SubscriptionPlan).name} plan
            </span>
          )}
        </div>
        {currentSub && (
          <p className="mt-2 text-sm text-ink-soft">
            Renews / expires:{" "}
            {new Date(currentSub.end_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {(plans as SubscriptionPlan[] | null)?.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-sm border border-charcoal/10 bg-parchment p-6"
          >
            <p className="font-display text-2xl text-ink">{plan.name}</p>
            <p className="mt-1 font-mono text-3xl text-sienna">
              ${plan.price}
              <span className="text-sm text-ink-soft">
                {" "}
                / {plan.duration_months === 1 ? "mo" : `${plan.duration_months}mo`}
              </span>
            </p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
              <li>
                {plan.features.max_listings === -1
                  ? "Unlimited listings"
                  : `Up to ${plan.features.max_listings} active listings`}
              </li>
              <li>
                {plan.features.featured_slots > 0
                  ? `${plan.features.featured_slots} featured placement${
                      plan.features.featured_slots > 1 ? "s" : ""
                    } / month`
                  : "Standard placement"}
              </li>
            </ul>
            <div className="mt-6">
              <SubscribeButton
                artistId={artist.id}
                planId={plan.id}
                planName={plan.name}
                durationMonths={plan.duration_months}
                isCurrent={currentSub?.plan_id === plan.id}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="font-mono text-[11px] text-ink-soft">
        Payment processing is not wired up in this build — choosing a plan
        marks your subscription active immediately. Connect Paystack or
        Flutterwave here when you&apos;re ready to charge real cards.
      </p>
    </div>
  );
}
