-- Update RLS policies for posts table to include subscription limits

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;

-- Create new insert policy with subscription limits
CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      -- Admins can always post
      public.is_admin(auth.uid()) OR
      -- Pro users can always post
      public.get_user_plan(auth.uid()) = 'pro' OR
      -- Free users can post if under monthly limit (30 posts)
      (
        public.get_user_plan(auth.uid()) = 'free' AND
        public.get_monthly_post_count(auth.uid()) < 30
      )
    )
  );

-- Update select policy to allow admins to view all posts
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;

CREATE POLICY "Users can view their own posts"
  ON posts FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_admin(auth.uid())
  );

-- Update policies to allow admins to manage all posts
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (
    auth.uid() = user_id OR
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (
    auth.uid() = user_id OR
    public.is_admin(auth.uid())
  );

-- Function to check if user can create post (for API use)
CREATE OR REPLACE FUNCTION public.can_create_post(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan subscription_plan;
  monthly_count INTEGER;
  is_admin_user BOOLEAN;
BEGIN
  -- Check if user is admin
  is_admin_user := public.is_admin(user_uuid);
  IF is_admin_user THEN
    RETURN true;
  END IF;

  -- Get user's plan
  user_plan := public.get_user_plan(user_uuid);

  -- Pro users can always post
  IF user_plan = 'pro' THEN
    RETURN true;
  END IF;

  -- Free users: check monthly limit
  IF user_plan = 'free' THEN
    monthly_count := public.get_monthly_post_count(user_uuid);
    RETURN monthly_count < 30;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining posts for free users
CREATE OR REPLACE FUNCTION public.get_remaining_posts(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  user_plan subscription_plan;
  monthly_count INTEGER;
BEGIN
  user_plan := public.get_user_plan(user_uuid);

  -- Admins and Pro users have unlimited posts
  IF public.is_admin(user_uuid) OR user_plan = 'pro' THEN
    RETURN -1; -- -1 indicates unlimited
  END IF;

  -- Free users: calculate remaining posts
  IF user_plan = 'free' THEN
    monthly_count := public.get_monthly_post_count(user_uuid);
    RETURN GREATEST(0, 30 - monthly_count);
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
