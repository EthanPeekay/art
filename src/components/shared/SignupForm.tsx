"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "artist" ? "artist" : "audience";

  const [role, setRole] = useState<"audience" | "artist">(initialRole);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If signing up as an artist, create the artist_profiles row.
    // (Requires email confirmation to be off, or the user to confirm first —
    // see README for Supabase auth settings.)
    if (role === "artist" && data.user) {
      const { error: artistError } = await supabase.from("artist_profiles").insert({
        user_id: data.user.id,
        display_name: displayName || fullName,
        region: country || null,
      });
      if (artistError) {
        // Non-fatal: the user account exists; they can complete their artist
        // profile from the dashboard if this insert is blocked by email
        // confirmation timing.
        console.error("artist_profiles insert deferred:", artistError.message);
      }
    }

    setLoading(false);
    setSubmitted(true);

    // If Supabase email confirmation is disabled, the user is already
    // signed in at this point — send them straight in.
    setTimeout(() => {
      router.push(role === "artist" ? "/dashboard" : "/showroom");
      router.refresh();
    }, 1200);
  }

  if (submitted) {
    return (
      <div className="rounded-sm border border-olive/30 bg-olive/10 p-6 text-center">
        <p className="font-display text-xl text-ink">Welcome to African Art Showroom</p>
        <p className="mt-2 text-sm text-ink-soft">
          Check your email to confirm your account if required, then continue.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <RoleCard
          active={role === "audience"}
          onClick={() => setRole("audience")}
          title="Collector"
          description="Browse, follow, bid, and buy"
        />
        <RoleCard
          active={role === "artist"}
          onClick={() => setRole("artist")}
          title="Artist"
          description="Exhibit and sell your work"
        />
      </div>

      <Field label="Full name">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      {role === "artist" && (
        <Field label="Artist / studio name" hint="Shown publicly on your profile">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={fullName || "e.g. Tendai Mukamuri Studio"}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
      )}

      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      <Field label="Password" hint="At least 8 characters">
        <input
          required
          minLength={8}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      <Field label="Country" hint="Optional">
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="e.g. Zimbabwe"
          className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
        />
      </Field>

      {error && <p className="text-sm text-clay-red">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function RoleCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-sm border p-4 text-left transition-colors",
        active
          ? "border-sienna bg-sienna/8"
          : "border-ink/15 hover:border-ink/30"
      )}
    >
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mt-1 text-xs text-ink-soft">{description}</p>
    </button>
  );
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
