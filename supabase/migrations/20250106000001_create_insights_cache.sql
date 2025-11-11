-- Create insights cache table
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight TEXT NOT NULL,
  emoji TEXT NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own insights
CREATE POLICY "Users can view own insights"
  ON public.insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own insights
CREATE POLICY "Users can insert own insights"
  ON public.insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own insights
CREATE POLICY "Users can update own insights"
  ON public.insights
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own insights
CREATE POLICY "Users can delete own insights"
  ON public.insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_expires_at ON public.insights(expires_at);

-- Function to clean up expired insights
CREATE OR REPLACE FUNCTION public.cleanup_expired_insights()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.insights
  WHERE expires_at < NOW();
END;
$$;

-- Create a scheduled job to clean up expired insights daily (if pg_cron is available)
-- This will be done manually or via Edge Function if pg_cron is not available
