"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Order, ShippingAddress } from "@/lib/types/database";

export function CheckoutForm({ order }: { order: Order }) {
  const router = useRouter();
  const supabase = createClient();

  const [address, setAddress] = useState<ShippingAddress>({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    region: "",
    postal_code: "",
    country: "",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ShippingAddress>(key: K, value: string) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!address.full_name || !address.address_line1 || !address.city || !address.country || !address.phone) {
      setError("Please fill in all required shipping fields.");
      return;
    }

    setSubmitting(true);

    // ---------------------------------------------------------------
    // PAYMENT INTEGRATION POINT
    // In production: redirect to Paystack/Flutterwave checkout here with
    // order.amount + order.currency, then mark the order 'paid' only after
    // the gateway confirms via webhook (never trust the client redirect
    // alone). This build marks the order paid directly so the rest of the
    // flow (order history, artist payouts) can be exercised end-to-end.
    // ---------------------------------------------------------------
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        shipping_address: address,
        status: "paid",
        payment_ref: "MOCK-PAYMENT-" + Date.now(),
      })
      .eq("id", order.id);

    // Mark the artwork sold
    if (!updateError) {
      await supabase.from("artworks").update({ status: "sold" }).eq("id", order.artwork_id);
    }

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(`/checkout/${order.id}/confirmation`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Row>
        <Field label="Full name">
          <input
            required
            value={address.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
        <Field label="Phone">
          <input
            required
            value={address.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
      </Row>

      <Field label="Address line 1">
        <input
          required
          value={address.address_line1}
          onChange={(e) => update("address_line1", e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      <Field label="Address line 2" hint="Optional">
        <input
          value={address.address_line2}
          onChange={(e) => update("address_line2", e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      <Row>
        <Field label="City">
          <input
            required
            value={address.city}
            onChange={(e) => update("city", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
        <Field label="Region / province" hint="Optional">
          <input
            value={address.region}
            onChange={(e) => update("region", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Postal code" hint="Optional">
          <input
            value={address.postal_code}
            onChange={(e) => update("postal_code", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
        <Field label="Country">
          <input
            required
            value={address.country}
            onChange={(e) => update("country", e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
      </Row>

      <Field label="Shipping notes" hint="Fragile items, customs notes, anything the courier should know">
        <textarea
          value={address.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      {error && <p className="text-sm text-clay-red">{error}</p>}

      <div className="rounded-sm border border-gold/30 bg-gold/10 p-4 text-sm text-sienna-deep">
        Payment processing isn&apos;t connected in this build. Confirming below
        will mark this order as paid directly so you can see the full order
        flow — wire Paystack or Flutterwave here before going live.
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Confirming order…" : `Confirm order — ${order.currency} ${order.amount}`}
      </Button>
    </form>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ink-soft/80">{hint}</span>}
    </label>
  );
}
