"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface FollowButtonProps {
  artistId: string;
  isLoggedIn: boolean;
}

export function FollowButton({ artistId, isLoggedIn }: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkFollowing() {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("follows")
        .select("artist_id")
        .eq("follower_id", userData.user.id)
        .eq("artist_id", artistId)
        .maybeSingle();
      setFollowing(!!data);
      setLoading(false);
    }
    checkFollowing();
  }, [artistId, isLoggedIn, supabase]);

  async function toggleFollow() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/artists/${artistId}`);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userData.user.id)
        .eq("artist_id", artistId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: userData.user.id,
        artist_id: artistId,
      });
      setFollowing(true);
    }
    router.refresh();
  }

  return (
    <Button
      onClick={toggleFollow}
      variant={following ? "secondary" : "primary"}
      disabled={loading}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
