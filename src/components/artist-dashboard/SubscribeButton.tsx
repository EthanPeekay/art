"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface SubscribeButtonProps {
  artistId: string;
  planId: string;
  planName: string;
  durationMonths: number;
  isCurrent: boolean;
}

export function SubscribeButton({
  artistId,
  planId,
  durationMonths,
  isCurrent,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubscribe() {
    setLoading(true);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // NOTE: this is a stand-in for a real payment flow. In production,
    // create the subscription only after the payment gateway (Paystack /
    // Flutterwave) confirms a successful charge via webhook, and store the
    // gateway's subscription/transaction reference in payment_gateway_ref.
    await supabase.from("artist_subscriptions").insert({
      artist_id: artistId,
      plan_id: planId,
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      payment_gateway_ref: "MOCK-" + Date.now(),
    });

    await supabase
      .from("artist_profiles")
      .update({ subscription_status: "active" })
      .eq("id", artistId);

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={loading || isCurrent}
      variant={isCurrent ? "secondary" : "primary"}
      className="w-full"
    >
      {isCurrent ? "Current plan" : loading ? "Activating…" : "Choose plan"}
    </Button>
  );
}
