"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { BidTicker } from "@/components/showroom/BidTicker";
import { Auction } from "@/lib/types/database";
import { useRouter } from "next/navigation";

interface BidPanelProps {
  auction: Auction;
  currency: string;
  isLoggedIn: boolean;
}

export function BidPanel({ auction: initialAuction, currency, isLoggedIn }: BidPanelProps) {
  const [auction, setAuction] = useState(initialAuction);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const currentBid = auction.current_high_bid ?? auction.starting_price;
  const minNextBid = currentBid + auction.min_increment;

  // Subscribe to realtime auction updates so every viewer sees bids land instantly
  useEffect(() => {
    const channel = supabase
      .channel(`auction-${auction.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
          filter: `id=eq.${auction.id}`,
        },
        (payload) => {
          setAuction(payload.new as Auction);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auction.id, supabase]);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isLoggedIn) {
      router.push(`/login?redirect=/artwork/${auction.artwork_id}`);
      return;
    }

    const amount = Number(bidAmount);
    if (!amount || amount < minNextBid) {
      setError(`Bid must be at least ${minNextBid}.`);
      return;
    }

    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push(`/login?redirect=/artwork/${auction.artwork_id}`);
      setSubmitting(false);
      return;
    }

    const { error: rpcError } = await supabase.rpc("place_bid", {
      p_auction_id: auction.id,
      p_bidder_id: userData.user.id,
      p_amount: amount,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    setSuccess(true);
    setBidAmount("");
  }

  const ended = auction.status === "ended" || new Date(auction.end_time) < new Date();

  return (
    <div className="rounded-sm border border-charcoal/15 bg-parchment-dim/40 p-6">
      <BidTicker
        currentBid={currentBid}
        startingPrice={auction.starting_price}
        reservePrice={auction.reserve_price}
        currency={currency}
        endTime={auction.end_time}
        minIncrement={auction.min_increment}
      />

      {!ended && (
        <form onSubmit={handleBid} className="mt-6 flex gap-3">
          <input
            type="number"
            step="0.01"
            min={minNextBid}
            placeholder={`${minNextBid}`}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="flex-1 rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 font-mono text-sm text-ink"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "Placing bid…" : isLoggedIn ? "Place bid" : "Log in to bid"}
          </Button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-clay-red">{error}</p>}
      {success && (
        <p className="mt-3 text-sm text-olive">
          Bid placed — you&apos;re the current high bidder.
        </p>
      )}
      {ended && (
        <p className="mt-4 font-mono text-sm text-ink-soft">
          This auction has closed.
        </p>
      )}
    </div>
  );
}
