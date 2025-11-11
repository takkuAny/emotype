-- Add sync_settings column to twitter_connections table
-- This allows users to choose which types of tweets to sync

ALTER TABLE public.twitter_connections
ADD COLUMN IF NOT EXISTS sync_settings JSONB DEFAULT '{
  "include_tweets": true,
  "include_replies": false,
  "include_retweets": false,
  "include_quotes": true
}'::jsonb;

COMMENT ON COLUMN public.twitter_connections.sync_settings IS 'User preferences for which types of tweets to sync: tweets (original posts), replies, retweets, quotes';
