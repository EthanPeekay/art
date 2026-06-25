import { notFound, redirect } from "next/navigation";
import { requireArtistProfile } from "@/lib/data/artist-auth";
import { createClient } from "@/lib/supabase/server";
import { ArtworkForm } from "@/components/artist-dashboard/ArtworkForm";
import { Artwork, ArtworkMedia } from "@/lib/types/database";

interface EditArtworkPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArtworkPage({ params }: EditArtworkPageProps) {
  const { id } = await params;
  const { artist, userId } = await requireArtistProfile();
  const supabase = await createClient();

  const { data: artwork, error } = await supabase
    .from("artworks")
    .select("*, media:artwork_media(*)")
    .eq("id", id)
    .single();

  if (error || !artwork) notFound();

  // Ownership check — an artist can only edit their own artworks.
  if (artwork.artist_id !== artist.id) {
    redirect("/dashboard/artworks");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-xl text-ink">Edit work</h2>
      <ArtworkForm
        artistId={artist.id}
        userId={userId}
        existingArtwork={artwork as unknown as Artwork}
        existingMedia={(artwork.media ?? []) as unknown as ArtworkMedia[]}
      />
    </div>
  );
}
