import { requireArtistProfile } from "@/lib/data/artist-auth";
import { ArtworkForm } from "@/components/artist-dashboard/ArtworkForm";

export default async function NewArtworkPage() {
  const { artist, userId } = await requireArtistProfile();

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-xl text-ink">Upload new work</h2>
      <ArtworkForm artistId={artist.id} userId={userId} />
    </div>
  );
}
