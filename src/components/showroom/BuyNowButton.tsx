"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface BuyNowButtonProps {
  artworkId: string;
  isLoggedIn: boolean;
}

export function BuyNowButton({ artworkId, isLoggedIn }: BuyNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleBuyNow() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/artwork/${artworkId}`);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push(`/login?redirect=/artwork/${artworkId}`);
      setLoading(false);
      return;
    }

    // Re-fetch the artwork to confirm it's still purchasable and get current price/artist
    const { data: artwork, error: artworkError } = await supabase
      .from("artworks")
      .select("id, price, currency, status, artist_id")
      .eq("id", artworkId)
      .single();

    if (artworkError || !artwork) {
      setError("Could not load this artwork. Please refresh and try again.");
      setLoading(false);
      return;
    }

    if (artwork.status !== "active") {
      setError("This piece is no longer available for purchase.");
      setLoading(false);
      return;
    }

    const platformFeeRate = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_RATE ?? "0.10");
    const platformFee = Math.round(artwork.price * platformFeeRate * 100) / 100;
    const artistPayout = artwork.price - platformFee;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: userData.user.id,
        artwork_id: artwork.id,
        artist_id: artwork.artist_id,
        order_type: "direct_purchase",
        amount: artwork.price,
        currency: artwork.currency,
        platform_fee: platformFee,
        artist_payout: artistPayout,
        status: "pending_payment",
      })
      .select("id")
      .single();

    setLoading(false);

    if (orderError || !order) {
      setError("Could not start checkout. Please try again.");
      return;
    }

    router.push(`/checkout/${order.id}`);
  }

  return (
    <div>
      <Button onClick={handleBuyNow} disabled={loading} size="lg" className="w-full">
        {loading ? "Starting checkout…" : isLoggedIn ? "Buy now" : "Log in to buy"}
      </Button>
      {error && <p className="mt-2 text-sm text-clay-red">{error}</p>}
    </div>
  );
}
