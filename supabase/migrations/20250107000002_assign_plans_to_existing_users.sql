-- Assign free plan to all existing users who don't have a subscription
INSERT INTO public.user_subscriptions (user_id, plan, plan_start_date)
SELECT
  au.id,
  'free'::subscription_plan,
  NOW()
FROM auth.users au
LEFT JOIN public.user_subscriptions us ON au.id = us.user_id
WHERE us.user_id IS NULL;

-- Assign user role to all existing users who don't have a role
INSERT INTO public.user_roles (user_id, role)
SELECT
  au.id,
  'user'::user_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Log the results
DO $$
DECLARE
  subscription_count INTEGER;
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subscription_count FROM public.user_subscriptions;
  SELECT COUNT(*) INTO role_count FROM public.user_roles;

  RAISE NOTICE 'Total subscriptions created: %', subscription_count;
  RAISE NOTICE 'Total roles assigned: %', role_count;
END $$;
