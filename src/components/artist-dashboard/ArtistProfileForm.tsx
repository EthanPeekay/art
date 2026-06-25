"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ArtistProfile, REGIONS } from "@/lib/types/database";

export function ArtistProfileForm({
  artist,
  userId,
}: {
  artist: ArtistProfile;
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(artist.display_name);
  const [bio, setBio] = useState(artist.bio ?? "");
  const [history, setHistory] = useState(artist.history ?? "");
  const [region, setRegion] = useState(artist.region ?? "");
  const [specialties, setSpecialties] = useState(artist.specialties.join(", "));
  const [instagram, setInstagram] = useState(artist.social_links?.instagram ?? "");
  const [website, setWebsite] = useState(artist.social_links?.website ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    let coverImageUrl = artist.cover_image_url;

    if (coverFile) {
      const path = `${userId}/cover-${Date.now()}-${coverFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, coverFile, { upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      coverImageUrl = publicUrlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("artist_profiles")
      .update({
        display_name: displayName,
        bio: bio || null,
        history: history || null,
        region: region || null,
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        social_links: { instagram, website },
        cover_image_url: coverImageUrl,
      })
      .eq("id", artist.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div className="rounded-sm border border-charcoal/10 bg-parchment p-6 space-y-4">
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>

        <Field label="Bio" hint="A short summary shown at the top of your profile">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>

        <Field label="History" hint="Your journey, training, and influences — shown further down your profile">
          <textarea
            value={history}
            onChange={(e) => setHistory(e.target.value)}
            rows={5}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Region">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            >
              <option value="">Select…</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Specialties" hint="Comma-separated">
            <input
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="sculpture, painting"
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram" hint="Optional, full URL">
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>
          <Field label="Website" hint="Optional, full URL">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>
        </div>

        <Field label="Cover image">
          {artist.cover_image_url && (
            <img
              src={artist.cover_image_url}
              alt="Current cover"
              className="mb-2 h-32 w-32 rounded-sm object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-clay-red">{error}</p>}
      {saved && <p className="text-sm text-olive">Profile updated.</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
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
