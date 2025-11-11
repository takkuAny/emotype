-- Add emotion_tags array column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS emotion_tags TEXT[];

-- Migrate existing emotion_tag data to emotion_tags array
UPDATE posts
SET emotion_tags = ARRAY[emotion_tag]
WHERE emotion_tag IS NOT NULL AND emotion_tags IS NULL;
