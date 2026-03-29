-- supabase/migrations/add_thumbnails_table.sql
-- Add thumbnails table and storage bucket for thumbnail generation

-- Create thumbnails table
CREATE TABLE public.thumbnails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  platform text NOT NULL,
  variation_type text NOT NULL,
  version text DEFAULT 'v1',
  parent_id uuid REFERENCES public.thumbnails(id) ON DELETE CASCADE,
  ctr_score integer CHECK (ctr_score >= 0 AND ctr_score <= 100),
  design_spec jsonb,
  storage_url text,
  feedback text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX idx_thumbnails_user_id ON public.thumbnails(user_id);
CREATE INDEX idx_thumbnails_created_at ON public.thumbnails(created_at DESC);
CREATE INDEX idx_thumbnails_parent_id ON public.thumbnails(parent_id);
CREATE INDEX idx_thumbnails_platform ON public.thumbnails(platform);

-- RLS policies
ALTER TABLE public.thumbnails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own thumbnails"
  ON public.thumbnails
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create thumbnails"
  ON public.thumbnails
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thumbnails"
  ON public.thumbnails
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thumbnails"
  ON public.thumbnails
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage bucket configuration
-- This should be created via Supabase dashboard:
-- 1. Storage → Create new bucket → "thumbnails"
-- 2. Make it private (access via RLS)
-- 3. Add RLS policy:

-- CREATE POLICY "Users can upload and view their thumbnails"
--   ON storage.objects
--   FOR ALL
--   USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);