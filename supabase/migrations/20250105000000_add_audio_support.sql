-- Add audio_url column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create post-audio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-audio', 'post-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for post-audio bucket
CREATE POLICY "Public Access for post-audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-audio');

CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-audio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own audio"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
