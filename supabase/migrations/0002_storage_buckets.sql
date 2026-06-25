-- ============================================================
-- STORAGE BUCKETS — artwork media, avatars
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('artwork-media', 'artwork-media', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can view artwork media (public showroom images)
create policy "artwork_media_public_read"
  on storage.objects for select
  using (bucket_id = 'artwork-media');

-- Authenticated users can upload into their own folder: artwork-media/{user_id}/...
create policy "artwork_media_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'artwork-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "artwork_media_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'artwork-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Avatars: public read, owner write
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
