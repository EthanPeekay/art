-- ============================================================
-- OPTIONAL SEED DATA — for local testing after running migrations
-- Run this AFTER creating at least one real auth user for yourself
-- via Supabase Auth (sign up through the app), since artist_profiles
-- and orders need a real auth.users row to attach to via RLS-safe FKs.
--
-- This script seeds artworks/media/auctions/posts attached to whichever
-- artist_profiles already exist, so run it after you've signed up at
-- least one artist through the app's /signup flow.
-- ============================================================

do $$
declare
  v_artist_id uuid;
begin
  select id into v_artist_id from public.artist_profiles limit 1;

  if v_artist_id is null then
    raise notice 'No artist_profiles found. Sign up as an artist through the app first, then re-run this seed.';
    return;
  end if;

  -- Fixed-price sculpture
  insert into public.artworks (
    id, artist_id, title, description, medium, category,
    region_origin, dimensions, year_created, price, sale_type, status
  ) values (
    gen_random_uuid(), v_artist_id,
    'Seated Figure in Springstone',
    'Carved from a single block of springstone over six weeks, this piece explores stillness and ancestral memory.',
    'Springstone sculpture', 'sculpture',
    'Zimbabwe', '45cm x 30cm x 20cm', 2025,
    850.00, 'fixed', 'active'
  );

  -- Auction painting
  insert into public.artworks (
    id, artist_id, title, description, medium, category,
    region_origin, dimensions, year_created, price, sale_type, status
  ) values (
    gen_random_uuid(), v_artist_id,
    'Market Day, Mbare',
    'Oil on canvas capturing the colour and motion of Harare''s largest market.',
    'Oil on canvas', 'painting',
    'Zimbabwe', '90cm x 60cm', 2024,
    0, 'auction', 'active'
  );

  -- Attach a live auction to the second artwork
  insert into public.auctions (artwork_id, starting_price, reserve_price, min_increment, start_time, end_time, status)
  select id, 200.00, 600.00, 25.00, now() - interval '1 day', now() + interval '5 days', 'live'
  from public.artworks where title = 'Market Day, Mbare' and artist_id = v_artist_id;

  -- A feed post
  insert into public.posts (artist_id, content)
  values (v_artist_id, 'Back in the studio after a long week sourcing stone in Nyanga. New pieces coming soon.');

end $$;
