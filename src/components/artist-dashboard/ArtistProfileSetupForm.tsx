"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function ArtistProfileSetupForm({
  userId,
  defaultName,
}: {
  userId: string;
  defaultName: string;
}) {
  const [displayName, setDisplayName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("artist_profiles").insert({
      user_id: userId,
      display_name: displayName,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
          Artist / studio name
        </span>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1.5 w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </label>
      {error && <p className="text-sm text-clay-red">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Creating studio…" : "Create studio profile"}
      </Button>
    </form>
  );
}
