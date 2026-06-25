"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function DeleteArtworkButton({ artworkId }: { artworkId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete() {
    setLoading(true);
    const { error } = await supabase.from("artworks").delete().eq("id", artworkId);
    setLoading(false);

    if (!error) {
      router.refresh();
    }
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex gap-1.5">
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading}>
          {loading ? "Removing…" : "Confirm"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
