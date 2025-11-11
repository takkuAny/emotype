-- Create enum for subscription types
CREATE TYPE subscription_plan AS ENUM ('free', 'pro');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  billing_cycle billing_cycle,
  -- Contract dates
  contract_date TIMESTAMPTZ,
  plan_start_date TIMESTAMPTZ,
  plan_end_date TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_roles table for admin permissions
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan ON public.user_subscriptions(plan);
CREATE INDEX idx_user_subscriptions_plan_end_date ON public.user_subscriptions(plan_end_date);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert subscriptions"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Function to automatically create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create free subscription
  INSERT INTO public.user_subscriptions (user_id, plan, plan_start_date)
  VALUES (NEW.id, 'free', NOW());

  -- Create user role (default: user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user's plan is active
CREATE OR REPLACE FUNCTION public.is_plan_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription RECORD;
BEGIN
  SELECT * INTO subscription
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;

  -- If no subscription found, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Free plan is always active
  IF subscription.plan = 'free' THEN
    RETURN true;
  END IF;

  -- Pro plan: check if within valid date range
  IF subscription.plan = 'pro' THEN
    IF subscription.plan_end_date IS NULL THEN
      RETURN true;
    END IF;
    RETURN NOW() BETWEEN subscription.plan_start_date AND subscription.plan_end_date;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS subscription_plan AS $$
DECLARE
  user_plan subscription_plan;
BEGIN
  SELECT plan INTO user_plan
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;

  -- If subscription not found or expired, return free
  IF NOT FOUND OR NOT public.is_plan_active(user_uuid) THEN
    RETURN 'free';
  END IF;

  RETURN user_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count user's posts in current month
CREATE OR REPLACE FUNCTION public.get_monthly_post_count(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  post_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO post_count
  FROM public.posts
  WHERE user_id = user_uuid
  AND created_at >= DATE_TRUNC('month', NOW())
  AND created_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

  RETURN COALESCE(post_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
