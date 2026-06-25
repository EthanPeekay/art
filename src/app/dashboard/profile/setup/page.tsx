import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtistProfileSetupForm } from "@/components/artist-dashboard/ArtistProfileSetupForm";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/profile/setup");
  }

  const { data: existing } = await supabase
    .from("artist_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "artist") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-parchment">
          Set up your studio
        </h1>
        <p className="mt-2 text-parchment/60">
          One more step before you can start exhibiting work.
        </p>
        <div className="mt-8 rounded-sm bg-parchment p-7">
          <ArtistProfileSetupForm
            userId={user.id}
            defaultName={profile?.full_name ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
