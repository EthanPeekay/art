import { requireArtistProfile } from "@/lib/data/artist-auth";
import { createClient } from "@/lib/supabase/server";
import { PostComposer } from "@/components/artist-dashboard/PostComposer";

export default async function DashboardPostsPage() {
  const { artist, userId } = await requireArtistProfile();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-ink">Feed posts</h2>
      <PostComposer artistId={artist.id} userId={userId} />

      <div className="space-y-3">
        {(posts ?? []).map((post) => (
          <div key={post.id} className="rounded-sm border border-charcoal/10 bg-parchment p-4">
            <p className="text-sm text-ink">{post.content}</p>
            {post.media_urls?.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {post.media_urls.map((url: string) => (
                  <img key={url} src={url} alt="" className="aspect-square rounded-sm object-cover" />
                ))}
              </div>
            )}
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              {new Date(post.created_at).toLocaleDateString()} · {post.like_count} likes ·{" "}
              {post.comment_count} comments
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
