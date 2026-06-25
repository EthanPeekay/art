import { createClient } from "@/lib/supabase/server";
import { Artwork, ArtworkCategory } from "@/lib/types/database";

export interface ShowroomFilters {
  category?: ArtworkCategory;
  region?: string;
  artistId?: string;
  minPrice?: number;
  maxPrice?: number;
  saleType?: "fixed" | "auction";
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export async function getShowroomArtworks(filters: ShowroomFilters = {}) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("artworks")
    .select(
      `*,
      media:artwork_media(*),
      artist:artist_profiles(*),
      auction:auctions(*)`,
      { count: "exact" }
    )
    .in("status", ["active", "reserved", "sold"]);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.region) query = query.eq("region_origin", filters.region);
  if (filters.artistId) query = query.eq("artist_id", filters.artistId);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.saleType === "auction") query = query.in("sale_type", ["auction", "both"]);
  if (filters.saleType === "fixed") query = query.in("sale_type", ["fixed", "both"]);
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("getShowroomArtworks error:", error.message);
    return { artworks: [] as Artwork[], total: 0 };
  }

  return { artworks: (data ?? []) as unknown as Artwork[], total: count ?? 0 };
}

export async function getArtworkById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artworks")
    .select(
      `*,
      media:artwork_media(*),
      artist:artist_profiles(*),
      auction:auctions(*)`
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("getArtworkById error:", error.message);
    return null;
  }

  // bump view count, fire-and-forget (best-effort, not critical path)
  void supabase
    .from("artworks")
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq("id", id);

  return data as unknown as Artwork;
}

export async function getArtistProfile(artistId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artist_profiles")
    .select(`*, profile:profiles(*)`)
    .eq("id", artistId)
    .single();

  if (error) {
    console.error("getArtistProfile error:", error.message);
    return null;
  }

  return data as unknown as import("@/lib/types/database").ArtistProfile;
}

export async function getArtistArtworks(artistId: string, includeAll = false) {
  const supabase = await createClient();
  let query = supabase
    .from("artworks")
    .select(`*, media:artwork_media(*), auction:auctions(*)`)
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });

  if (!includeAll) {
    query = query.in("status", ["active", "reserved", "sold"]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getArtistArtworks error:", error.message);
    return [] as Artwork[];
  }
  return data as unknown as Artwork[];
}
