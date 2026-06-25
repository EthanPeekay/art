import { SiteHeader } from "@/components/shared/SiteHeader";
import { PostCard } from "@/components/audience/PostCard";
import { createClient } from "@/lib/supabase/server";
import { Post } from "@/lib/types/database";
import Link from "next/link";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let followedArtistIds: string[] = [];
  let likedPostIds = new Set<string>();

  if (user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("artist_id")
      .eq("follower_id", user.id);
    followedArtistIds = (follows ?? []).map((f) => f.artist_id);

    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id);
    likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
  }

  let query = supabase
    .from("posts")
    .select("*, artist:artist_profiles(*)")
    .order("created_at", { ascending: false })
    .limit(30);

  const followingSomeone = followedArtistIds.length > 0;
  if (followingSomeone) {
    query = query.in("artist_id", followedArtistIds);
  }

  const { data: posts } = await query;

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl text-ink">
          {followingSomeone ? "Your feed" : "Trending in the showroom"}
        </h1>
        {!followingSomeone && (
          <p className="mt-2 text-ink-soft">
            Follow artists to personalize this feed.{" "}
            <Link href="/artists" className="text-sienna hover:underline">
              Browse artists →
            </Link>
          </p>
        )}

        <div className="mt-8 space-y-5">
          {(posts ?? []).length === 0 ? (
            <p className="text-ink-soft">No posts yet.</p>
          ) : (
            (posts as unknown as Post[]).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLoggedIn={isLoggedIn}
                initiallyLiked={likedPostIds.has(post.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
