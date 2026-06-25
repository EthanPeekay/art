import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArtistProfile } from "@/lib/types/database";

/**
 * Loads the artist_profiles row for the currently logged-in user.
 * Redirects to /login if not authenticated, and to / if the user
 * isn't an artist. Middleware already guards /dashboard routes, but
 * this gives each page direct access to the artist's data.
 */
export async function requireArtistProfile(): Promise<{
  artist: ArtistProfile;
  userId: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: artist, error } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !artist) {
    redirect("/dashboard/profile/setup");
  }

  return { artist: artist as ArtistProfile, userId: user.id };
}
