import { requireArtistProfile } from "@/lib/data/artist-auth";
import { ArtistProfileForm } from "@/components/artist-dashboard/ArtistProfileForm";

export default async function DashboardProfilePage() {
  const { artist, userId } = await requireArtistProfile();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-ink">Profile</h2>
      <ArtistProfileForm artist={artist} userId={userId} />
    </div>
  );
}
