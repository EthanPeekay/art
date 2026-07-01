import Link from "next/link";
import { DashboardNav } from "@/components/artist-dashboard/DashboardNav";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { requireArtistProfile } from "@/lib/data/artist-auth";
import { Badge } from "@/components/ui/Badge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { artist } = await requireArtistProfile();

  const trialDaysLeft = artist.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(artist.trial_ends_at).getTime() - Date.now()) / 86_400_000
        )
      )
    : null;

  const showTrialBanner =
    artist.subscription_status === "trial" && trialDaysLeft !== null;
  const showLockedBanner =
    artist.subscription_status === "expired" || artist.subscription_status === "past_due";

  return (
    <div className="min-h-screen bg-parchment-dim/40">
      <header className="border-b border-charcoal/10 bg-charcoal">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg text-parchment">
            African Art <span className="text-sienna">Studio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/showroom"
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-parchment/60 hover:text-parchment"
            >
              View showroom
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {showTrialBanner && (
        <div className="bg-olive/15 px-6 py-2.5 text-center font-mono text-[12px] text-olive">
          Trial period — {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left.{" "}
          <Link href="/dashboard/billing" className="underline">
            Choose a plan
          </Link>
        </div>
      )}
      {showLockedBanner && (
        <div className="bg-clay-red/15 px-6 py-2.5 text-center font-mono text-[12px] text-clay-red">
          Your subscription has lapsed. New uploads are paused until you renew.{" "}
          <Link href="/dashboard/billing" className="underline">
            Renew now
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="font-display text-2xl text-ink">{artist.display_name}</h1>
          {artist.is_verified && <Badge variant="gold">Verified</Badge>}
          <Badge variant={artist.subscription_status === "active" ? "live" : "neutral"}>
            {artist.subscription_status}
          </Badge>
        </div>

        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
          <DashboardNav />
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
