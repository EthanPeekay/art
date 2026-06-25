// Core domain types — mirror the Postgres schema in supabase/migrations/0001_init_schema.sql

export type UserRole = "audience" | "artist" | "admin";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";
export type ArtworkCategory = "sculpture" | "painting" | "mixed_media" | "textile" | "photography" | "other";
export type SaleType = "fixed" | "auction" | "both";
export type ArtworkStatus = "draft" | "active" | "reserved" | "sold" | "withdrawn";
export type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";
export type OrderType = "direct_purchase" | "auction_win";
export type OrderStatus = "pending_payment" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PayoutStatus = "pending" | "processed" | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtistProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  history: string | null;
  region: string | null;
  specialties: string[];
  cover_image_url: string | null;
  social_links: Record<string, string>;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  follower_count: number;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  currency: string;
  features: { max_listings: number; featured_slots: number };
  active: boolean;
}

export interface ArtistSubscription {
  id: string;
  artist_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_gateway_ref: string | null;
  plan?: SubscriptionPlan;
}

export interface ArtworkMedia {
  id: string;
  artwork_id: string;
  media_type: "image" | "video";
  url: string;
  is_primary: boolean;
  sort_order: number;
  alt_text: string | null;
}

export interface Artwork {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  medium: string | null;
  category: ArtworkCategory;
  region_origin: string | null;
  dimensions: string | null;
  weight_kg: number | null;
  year_created: number | null;
  price: number;
  currency: string;
  sale_type: SaleType;
  status: ArtworkStatus;
  edition_info: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  media?: ArtworkMedia[];
  artist?: ArtistProfile;
  auction?: Auction;
}

export interface Auction {
  id: string;
  artwork_id: string;
  starting_price: number;
  reserve_price: number | null;
  min_increment: number;
  current_high_bid: number | null;
  current_high_bidder_id: string | null;
  start_time: string;
  end_time: string;
  status: AuctionStatus;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  is_auto_bid: boolean;
  max_auto_amount: number | null;
  created_at: string;
  bidder?: Profile;
}

export interface Order {
  id: string;
  buyer_id: string;
  artwork_id: string;
  artist_id: string;
  order_type: OrderType;
  amount: number;
  platform_fee: number;
  artist_payout: number;
  currency: string;
  status: OrderStatus;
  shipping_address: ShippingAddress | null;
  payment_ref: string | null;
  created_at: string;
  updated_at: string;
  artwork?: Artwork;
}

export interface ShippingAddress {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  region?: string;
  postal_code?: string;
  country: string;
  phone: string;
  notes?: string;
}

export interface Payout {
  id: string;
  artist_id: string;
  order_id: string;
  amount: number;
  status: PayoutStatus;
  payout_method: string | null;
  processed_at: string | null;
}

export interface Post {
  id: string;
  artist_id: string;
  artwork_id: string | null;
  content: string;
  media_urls: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  artist?: ArtistProfile;
  artwork?: Artwork;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user?: Profile;
}

export const ARTWORK_CATEGORY_LABELS: Record<ArtworkCategory, string> = {
  sculpture: "Sculpture",
  painting: "Painting",
  mixed_media: "Mixed Media",
  textile: "Textile",
  photography: "Photography",
  other: "Other",
};

export const REGIONS = [
  "Zimbabwe",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Senegal",
  "Ethiopia",
  "Mali",
  "DR Congo",
  "Tanzania",
  "Other",
] as const;
