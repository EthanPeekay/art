-- ============================================================
-- MEDAWA ART SHOWROOM — INITIAL SCHEMA
-- African Art Showroom & Exhibition Platform
-- Run this in the Supabase SQL editor, or via `supabase db push`
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('audience', 'artist', 'admin');
create type subscription_status as enum ('trial', 'active', 'past_due', 'cancelled', 'expired');
create type artwork_category as enum ('sculpture', 'painting', 'mixed_media', 'textile', 'photography', 'other');
create type sale_type as enum ('fixed', 'auction', 'both');
create type artwork_status as enum ('draft', 'active', 'reserved', 'sold', 'withdrawn');
create type auction_status as enum ('scheduled', 'live', 'ended', 'cancelled');
create type order_type as enum ('direct_purchase', 'auction_win');
create type order_status as enum ('pending_payment', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payout_status as enum ('pending', 'processed', 'failed');

-- ------------------------------------------------------------
-- PROFILES (extends auth.users from Supabase Auth)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  phone text,
  role user_role not null default 'audience',
  avatar_url text,
  country text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extends auth.users with app-specific profile data and role.';

-- ------------------------------------------------------------
-- ARTIST PROFILES (1:1 extension of profiles where role = artist)
-- ------------------------------------------------------------
create table public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text not null,
  bio text,
  history text,
  region text,
  specialties text[] default '{}',
  cover_image_url text,
  social_links jsonb default '{}'::jsonb,
  is_verified boolean not null default false,
  subscription_status subscription_status not null default 'trial',
  follower_count integer not null default 0,
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_artist_profiles_subscription_status on public.artist_profiles(subscription_status);

-- ------------------------------------------------------------
-- SUBSCRIPTION PLANS
-- ------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_months integer not null,
  price numeric(10,2) not null,
  currency text not null default 'USD',
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.subscription_plans (name, duration_months, price, currency, features) values
  ('Monthly', 1, 15.00, 'USD', '{"max_listings": 25, "featured_slots": 0}'),
  ('Quarterly', 3, 38.00, 'USD', '{"max_listings": 75, "featured_slots": 1}'),
  ('Yearly', 12, 120.00, 'USD', '{"max_listings": -1, "featured_slots": 4}');

-- ------------------------------------------------------------
-- ARTIST SUBSCRIPTIONS
-- ------------------------------------------------------------
create table public.artist_subscriptions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status subscription_status not null default 'active',
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  auto_renew boolean not null default true,
  payment_gateway_ref text,
  created_at timestamptz not null default now()
);

create index idx_artist_subscriptions_artist on public.artist_subscriptions(artist_id);

-- ------------------------------------------------------------
-- ARTWORKS
-- ------------------------------------------------------------
create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  title text not null,
  description text,
  medium text,
  category artwork_category not null default 'other',
  region_origin text,
  dimensions text,
  weight_kg numeric(8,2),
  year_created integer,
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  sale_type sale_type not null default 'fixed',
  status artwork_status not null default 'draft',
  edition_info text,
  view_count integer not null default 0,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_artworks_artist on public.artworks(artist_id);
create index idx_artworks_status on public.artworks(status);
create index idx_artworks_category on public.artworks(category);
create index idx_artworks_region on public.artworks(region_origin);
create index idx_artworks_price on public.artworks(price);

-- ------------------------------------------------------------
-- ARTWORK MEDIA (images / video)
-- ------------------------------------------------------------
create table public.artwork_media (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references public.artworks(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now()
);

create index idx_artwork_media_artwork on public.artwork_media(artwork_id);

-- ------------------------------------------------------------
-- AUCTIONS
-- ------------------------------------------------------------
create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null unique references public.artworks(id) on delete cascade,
  starting_price numeric(10,2) not null,
  reserve_price numeric(10,2),
  min_increment numeric(10,2) not null default 10.00,
  current_high_bid numeric(10,2),
  current_high_bidder_id uuid references public.profiles(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status auction_status not null default 'scheduled',
  created_at timestamptz not null default now()
);

create index idx_auctions_status on public.auctions(status);
create index idx_auctions_end_time on public.auctions(end_time);

-- ------------------------------------------------------------
-- BIDS
-- ------------------------------------------------------------
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id),
  amount numeric(10,2) not null,
  is_auto_bid boolean not null default false,
  max_auto_amount numeric(10,2),
  created_at timestamptz not null default now()
);

create index idx_bids_auction on public.bids(auction_id, amount desc);
create index idx_bids_bidder on public.bids(bidder_id);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id),
  artwork_id uuid not null references public.artworks(id),
  artist_id uuid not null references public.artist_profiles(id),
  order_type order_type not null,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null default 0,
  artist_payout numeric(10,2) not null,
  currency text not null default 'USD',
  status order_status not null default 'pending_payment',
  shipping_address jsonb,
  payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_artist on public.orders(artist_id);
create index idx_orders_status on public.orders(status);

-- ------------------------------------------------------------
-- PAYOUTS
-- ------------------------------------------------------------
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id),
  order_id uuid not null references public.orders(id),
  amount numeric(10,2) not null,
  status payout_status not null default 'pending',
  payout_method text,
  processed_at timestamptz
);

-- ------------------------------------------------------------
-- FOLLOWS
-- ------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, artist_id)
);

-- ------------------------------------------------------------
-- POSTS (artist feed updates)
-- ------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artist_profiles(id) on delete cascade,
  artwork_id uuid references public.artworks(id) on delete set null,
  content text not null,
  media_urls text[] default '{}',
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_posts_artist on public.posts(artist_id, created_at desc);

-- ------------------------------------------------------------
-- LIKES
-- ------------------------------------------------------------
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_post on public.comments(post_id, created_at);

-- ============================================================
-- TRIGGERS — keep updated_at fresh, sync counters
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_artist_profiles_touch before update on public.artist_profiles
  for each row execute function public.touch_updated_at();
create trigger trg_artworks_touch before update on public.artworks
  for each row execute function public.touch_updated_at();
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever a new auth.users row appears
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'audience')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep follower_count in sync
create or replace function public.handle_follow_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.artist_profiles set follower_count = follower_count + 1 where id = new.artist_id;
  elsif (tg_op = 'DELETE') then
    update public.artist_profiles set follower_count = greatest(follower_count - 1, 0) where id = old.artist_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_follows_change
  after insert or delete on public.follows
  for each row execute function public.handle_follow_change();

-- Keep post like_count / comment_count in sync
create or replace function public.handle_like_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_likes_change
  after insert or delete on public.likes
  for each row execute function public.handle_like_change();

create or replace function public.handle_comment_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger trg_comments_change
  after insert or delete on public.comments
  for each row execute function public.handle_comment_change();

-- Validate + apply a new bid atomically (prevents race conditions on concurrent bids)
create or replace function public.place_bid(
  p_auction_id uuid,
  p_bidder_id uuid,
  p_amount numeric
)
returns public.bids as $$
declare
  v_auction public.auctions;
  v_new_bid public.bids;
  v_min_required numeric;
begin
  select * into v_auction from public.auctions where id = p_auction_id for update;

  if v_auction is null then
    raise exception 'Auction not found';
  end if;

  if v_auction.status <> 'live' then
    raise exception 'Auction is not currently live';
  end if;

  if now() > v_auction.end_time then
    raise exception 'Auction has already ended';
  end if;

  v_min_required := coalesce(v_auction.current_high_bid, v_auction.starting_price - v_auction.min_increment) + v_auction.min_increment;

  if p_amount < v_min_required then
    raise exception 'Bid must be at least %', v_min_required;
  end if;

  insert into public.bids (auction_id, bidder_id, amount)
  values (p_auction_id, p_bidder_id, p_amount)
  returning * into v_new_bid;

  update public.auctions
  set current_high_bid = p_amount, current_high_bidder_id = p_bidder_id
  where id = p_auction_id;

  return v_new_bid;
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.artist_subscriptions enable row level security;
alter table public.artworks enable row level security;
alter table public.artwork_media enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;
alter table public.orders enable row level security;
alter table public.payouts enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- PROFILES: anyone can read public profile info; only the owner can update their own
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ARTIST PROFILES: public read; only the owning artist can write
create policy "artist_profiles_select_all" on public.artist_profiles for select using (true);
create policy "artist_profiles_insert_own" on public.artist_profiles for insert with check (auth.uid() = user_id);
create policy "artist_profiles_update_own" on public.artist_profiles for update using (auth.uid() = user_id);

-- SUBSCRIPTION PLANS: public read only
create policy "subscription_plans_select_all" on public.subscription_plans for select using (true);

-- ARTIST SUBSCRIPTIONS: artist can see/manage only their own
create policy "artist_subscriptions_select_own" on public.artist_subscriptions for select
  using (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));
create policy "artist_subscriptions_insert_own" on public.artist_subscriptions for insert
  with check (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));

-- ARTWORKS: public can view active/sold listings; artists manage their own (any status)
create policy "artworks_select_public_active" on public.artworks for select
  using (status in ('active', 'reserved', 'sold'));
create policy "artworks_select_own_any_status" on public.artworks for select
  using (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));
create policy "artworks_insert_own" on public.artworks for insert
  with check (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));
create policy "artworks_update_own" on public.artworks for update
  using (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));
create policy "artworks_delete_own" on public.artworks for delete
  using (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));

-- ARTWORK MEDIA: visible if the parent artwork is visible; writable by the owning artist
create policy "artwork_media_select" on public.artwork_media for select using (true);
create policy "artwork_media_write_own" on public.artwork_media for all
  using (artwork_id in (
    select a.id from public.artworks a
    join public.artist_profiles ap on ap.id = a.artist_id
    where ap.user_id = auth.uid()
  ));

-- AUCTIONS: public read; owning artist can manage
create policy "auctions_select_all" on public.auctions for select using (true);
create policy "auctions_write_own" on public.auctions for all
  using (artwork_id in (
    select a.id from public.artworks a
    join public.artist_profiles ap on ap.id = a.artist_id
    where ap.user_id = auth.uid()
  ));

-- BIDS: public can read bid history; any authenticated user can place a bid for themself
create policy "bids_select_all" on public.bids for select using (true);
create policy "bids_insert_own" on public.bids for insert with check (auth.uid() = bidder_id);

-- ORDERS: visible to the buyer or the selling artist
create policy "orders_select_own" on public.orders for select
  using (
    auth.uid() = buyer_id
    or artist_id in (select id from public.artist_profiles where user_id = auth.uid())
  );
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "orders_update_own" on public.orders for update
  using (
    auth.uid() = buyer_id
    or artist_id in (select id from public.artist_profiles where user_id = auth.uid())
  );

-- PAYOUTS: visible only to the owning artist
create policy "payouts_select_own" on public.payouts for select
  using (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));

-- FOLLOWS: public read; user manages their own follow rows
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

-- POSTS: public read; owning artist writes
create policy "posts_select_all" on public.posts for select using (true);
create policy "posts_write_own" on public.posts for all
  using (artist_id in (select id from public.artist_profiles where user_id = auth.uid()));

-- LIKES: public read; user manages their own likes
create policy "likes_select_all" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

-- COMMENTS: public read; user manages their own comments
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);
