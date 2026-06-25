"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import {
  ArtworkCategory,
  ARTWORK_CATEGORY_LABELS,
  REGIONS,
  SaleType,
  Artwork,
  ArtworkMedia,
} from "@/lib/types/database";

interface ArtworkFormProps {
  artistId: string;
  userId: string;
  existingArtwork?: Artwork;
  existingMedia?: ArtworkMedia[];
}

export function ArtworkForm({
  artistId,
  userId,
  existingArtwork,
  existingMedia = [],
}: ArtworkFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!existingArtwork;

  const [title, setTitle] = useState(existingArtwork?.title ?? "");
  const [description, setDescription] = useState(existingArtwork?.description ?? "");
  const [medium, setMedium] = useState(existingArtwork?.medium ?? "");
  const [category, setCategory] = useState<ArtworkCategory>(
    existingArtwork?.category ?? "sculpture"
  );
  const [regionOrigin, setRegionOrigin] = useState(existingArtwork?.region_origin ?? "");
  const [dimensions, setDimensions] = useState(existingArtwork?.dimensions ?? "");
  const [yearCreated, setYearCreated] = useState(
    existingArtwork?.year_created?.toString() ?? ""
  );
  const [price, setPrice] = useState(existingArtwork?.price?.toString() ?? "");
  const [saleType, setSaleType] = useState<SaleType>(existingArtwork?.sale_type ?? "fixed");
  const [editionInfo, setEditionInfo] = useState(existingArtwork?.edition_info ?? "");

  // Auction-specific fields
  const [startingPrice, setStartingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [minIncrement, setMinIncrement] = useState("10");
  const [auctionDurationDays, setAuctionDurationDays] = useState("7");

  const [files, setFiles] = useState<File[]>([]);
  const [existingMediaList, setExistingMediaList] = useState(existingMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  async function removeExistingMedia(mediaId: string) {
    await supabase.from("artwork_media").delete().eq("id", mediaId);
    setExistingMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  }

  async function handleSubmit(e: React.FormEvent, publishStatus: "draft" | "active") {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (existingMediaList.length === 0 && files.length === 0) {
      setError("At least one image is required.");
      return;
    }

    setUploading(true);

    const artworkPayload = {
      artist_id: artistId,
      title,
      description: description || null,
      medium: medium || null,
      category,
      region_origin: regionOrigin || null,
      dimensions: dimensions || null,
      year_created: yearCreated ? Number(yearCreated) : null,
      price: Number(price || 0),
      sale_type: saleType,
      status: publishStatus,
      edition_info: editionInfo || null,
    };

    let artworkId = existingArtwork?.id;

    if (isEditing && artworkId) {
      const { error: updateError } = await supabase
        .from("artworks")
        .update(artworkPayload)
        .eq("id", artworkId);
      if (updateError) {
        setError(updateError.message);
        setUploading(false);
        return;
      }
    } else {
      const { data: created, error: insertError } = await supabase
        .from("artworks")
        .insert(artworkPayload)
        .select("id")
        .single();
      if (insertError || !created) {
        setError(insertError?.message ?? "Could not create artwork.");
        setUploading(false);
        return;
      }
      artworkId = created.id;
    }

    // Upload new media files to Storage, under {userId}/{artworkId}/...
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = `${userId}/${artworkId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("artwork-media")
        .upload(path, file);

      if (uploadError) {
        setError(`Upload failed for ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("artwork-media")
        .getPublicUrl(path);

      await supabase.from("artwork_media").insert({
        artwork_id: artworkId,
        media_type: file.type.startsWith("video") ? "video" : "image",
        url: publicUrlData.publicUrl,
        is_primary: existingMediaList.length === 0 && i === 0,
        sort_order: existingMediaList.length + i,
      });
    }

    // Set up (or update) the auction if sale_type includes auction
    if ((saleType === "auction" || saleType === "both") && artworkId) {
      const { data: existingAuction } = await supabase
        .from("auctions")
        .select("id")
        .eq("artwork_id", artworkId)
        .maybeSingle();

      const startTime = new Date();
      const endTime = new Date(
        startTime.getTime() + Number(auctionDurationDays) * 86_400_000
      );

      if (!existingAuction) {
        await supabase.from("auctions").insert({
          artwork_id: artworkId,
          starting_price: Number(startingPrice || price || 0),
          reserve_price: reservePrice ? Number(reservePrice) : null,
          min_increment: Number(minIncrement || 10),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: publishStatus === "active" ? "live" : "scheduled",
        });
      }
    }

    setUploading(false);
    router.push("/dashboard/artworks");
    router.refresh();
  }

  return (
    <form className="space-y-8">
      <Section title="Basics">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            placeholder="e.g. Seated Figure in Springstone"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            placeholder="The story, process, or meaning behind this piece"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ArtworkCategory)}
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            >
              {Object.entries(ARTWORK_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Medium">
            <input
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="e.g. Springstone sculpture, Oil on canvas"
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Region of origin">
            <select
              value={regionOrigin}
              onChange={(e) => setRegionOrigin(e.target.value)}
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

          <Field label="Dimensions">
            <input
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="45cm x 30cm x 20cm"
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>

          <Field label="Year created">
            <input
              type="number"
              value={yearCreated}
              onChange={(e) => setYearCreated(e.target.value)}
              placeholder="2025"
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>
        </div>

        <Field label="Edition info" hint="Optional, e.g. 1 of 1, or 3/10">
          <input
            value={editionInfo}
            onChange={(e) => setEditionInfo(e.target.value)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          />
        </Field>
      </Section>

      <Section title="Media">
        {existingMediaList.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {existingMediaList.map((m) => (
              <div key={m.id} className="relative">
                <img
                  src={m.url}
                  alt={m.alt_text ?? ""}
                  className="aspect-square w-full rounded-sm object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingMedia(m.id)}
                  className="absolute top-1 right-1 rounded-full bg-charcoal/80 px-2 py-0.5 text-xs text-parchment"
                >
                  Remove
                </button>
                {m.is_primary && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] text-charcoal">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <Field label="Add images or video" hint="First image becomes the cover if none exists yet">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-ink"
          />
        </Field>
      </Section>

      <Section title="Sale settings">
        <Field label="Sale type">
          <select
            value={saleType}
            onChange={(e) => setSaleType(e.target.value as SaleType)}
            className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
          >
            <option value="fixed">Buy now (fixed price)</option>
            <option value="auction">Auction only</option>
            <option value="both">Both — buy now or bid</option>
          </select>
        </Field>

        {(saleType === "fixed" || saleType === "both") && (
          <Field label="Fixed price (USD)">
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
            />
          </Field>
        )}

        {(saleType === "auction" || saleType === "both") && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Starting price">
              <input
                type="number"
                step="0.01"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder={price || "0"}
                className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
              />
            </Field>
            <Field label="Reserve price" hint="Optional, hidden minimum">
              <input
                type="number"
                step="0.01"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
              />
            </Field>
            <Field label="Minimum bid increment">
              <input
                type="number"
                step="0.01"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
              />
            </Field>
            <Field label="Auction duration (days)">
              <input
                type="number"
                value={auctionDurationDays}
                onChange={(e) => setAuctionDurationDays(e.target.value)}
                className="w-full rounded-sm border border-ink/20 bg-parchment px-3 py-2.5 text-sm text-ink"
              />
            </Field>
          </div>
        )}
      </Section>

      {error && <p className="text-sm text-clay-red">{error}</p>}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={(e) => handleSubmit(e, "draft")}
        >
          Save as draft
        </Button>
        <Button type="button" disabled={uploading} onClick={(e) => handleSubmit(e, "active")}>
          {uploading ? "Publishing…" : "Publish to showroom"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-charcoal/10 bg-parchment p-6">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
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
