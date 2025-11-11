-- Fix search_posts function to respect RLS
-- This function should only return posts for the authenticated user

-- Drop the existing function first
DROP FUNCTION IF EXISTS search_posts(vector(1024), float, int);

-- Create the function with user_id filter
CREATE OR REPLACE FUNCTION search_posts(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  image_url text,
  emotion_tag text,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    posts.id,
    posts.content,
    posts.image_url,
    posts.emotion_tag,
    posts.created_at,
    1 - (posts.embedding <=> query_embedding) as similarity
  FROM posts
  WHERE
    posts.user_id = auth.uid()  -- Only return posts for authenticated user
    AND posts.embedding IS NOT NULL
    AND 1 - (posts.embedding <=> query_embedding) > match_threshold
  ORDER BY posts.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_posts(vector(1024), float, int) TO authenticated;
