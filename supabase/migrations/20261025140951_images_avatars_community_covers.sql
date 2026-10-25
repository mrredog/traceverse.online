-- Profile pictures and community cover photos. Mirrors what is applied on the live project.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS cover_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars', 'avatars', true, 5242880, ARRAY['image/png','image/jpeg','image/webp']),
  ('community-covers', 'community-covers', true, 8388608, ARRAY['image/png','image/jpeg','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own community covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own community covers" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'community-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own community covers" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'community-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
