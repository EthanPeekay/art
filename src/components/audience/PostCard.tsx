"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Post } from "@/lib/types/database";
import { Heart, MessageCircle } from "lucide-react";

interface PostCardProps {
  post: Post;
  isLoggedIn: boolean;
  initiallyLiked: boolean;
}

export function PostCard({ post, isLoggedIn, initiallyLiked }: PostCardProps) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [showComments, setShowComments] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function toggleLike() {
    if (!isLoggedIn) {
      router.push("/login?redirect=/feed");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    if (liked) {
      await supabase.from("likes").delete().eq("user_id", userData.user.id).eq("post_id", post.id);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("likes").insert({ user_id: userData.user.id, post_id: post.id });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  return (
    <article className="rounded-sm border border-charcoal/10 bg-parchment p-5">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-charcoal-soft">
          {post.artist?.cover_image_url && (
            <img
              src={post.artist.cover_image_url}
              alt={post.artist.display_name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div>
          <Link
            href={`/artists/${post.artist_id}`}
            className="font-display text-base text-ink hover:text-sienna-deep"
          >
            {post.artist?.display_name}
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink">{post.content}</p>

      {post.media_urls?.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {post.media_urls.map((url) => (
            <img key={url} src={url} alt="" className="aspect-square rounded-sm object-cover" />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 border-t border-charcoal/10 pt-3">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm ${liked ? "text-clay-red" : "text-ink-soft"}`}
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
          {likeCount}
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-ink-soft"
        >
          <MessageCircle size={16} />
          {post.comment_count}
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} isLoggedIn={isLoggedIn} />
      )}
    </article>
  );
}

function CommentSection({ postId, isLoggedIn }: { postId: string; isLoggedIn: boolean }) {
  const [comments, setComments] = useState<{ id: string; content: string; user?: { full_name: string } }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("id, content, user:profiles(full_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data ?? []) as unknown as typeof comments);
    setLoaded(true);
  }

  if (!loaded) {
    loadComments();
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login?redirect=/feed");
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSubmitting(false);
      return;
    }

    await supabase.from("comments").insert({
      user_id: userData.user.id,
      post_id: postId,
      content: newComment,
    });

    setNewComment("");
    setSubmitting(false);
    loadComments();
  }

  return (
    <div className="mt-3 space-y-2 border-t border-charcoal/10 pt-3">
      {comments.map((c) => (
        <p key={c.id} className="text-sm text-ink-soft">
          <span className="font-medium text-ink">{c.user?.full_name ?? "Someone"}: </span>
          {c.content}
        </p>
      ))}
      <form onSubmit={submitComment} className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-sm border border-ink/20 bg-parchment px-3 py-1.5 text-sm text-ink"
        />
        <button
          type="submit"
          disabled={submitting}
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-sienna"
        >
          Post
        </button>
      </form>
    </div>
  );
}
