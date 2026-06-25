"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function PostComposer({ artistId, userId }: { artistId: string; userId: string }) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && files.length === 0) return;

    setPosting(true);
    setError(null);

    const mediaUrls: string[] = [];
    for (const file of files) {
      const path = `${userId}/posts/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("artwork-media")
        .upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { data } = supabase.storage.from("artwork-media").getPublicUrl(path);
      mediaUrls.push(data.publicUrl);
    }

    const { error: insertError } = await supabase.from("posts").insert({
      artist_id: artistId,
      content,
      media_urls: mediaUrls,
    });

    setPosting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setContent("");
    setFiles([]);
    router.refresh();
  }

  return (
    <form onSubmit={handlePost} className="rounded-sm border border-charcoal/10 bg-parchment p-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Share progress on a new piece, a studio update, or a thought…"
        className="w-full resize-none rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
      />
      <div className="mt-3 flex items-center justify-between">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
          className="text-sm text-ink-soft"
        />
        <Button type="submit" disabled={posting} size="sm">
          {posting ? "Posting…" : "Post update"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-clay-red">{error}</p>}
    </form>
  );
}
