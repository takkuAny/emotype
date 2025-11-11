-- Update plan resolution so paid access remains available until the stored end date
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS subscription_plan AS $$
DECLARE
  subscription_record RECORD;
  effective_plan subscription_plan;
  now_ts TIMESTAMPTZ := NOW();
BEGIN
  SELECT plan, plan_end_date
  INTO subscription_record
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;

  IF NOT FOUND THEN
    RETURN 'free';
  END IF;

  IF subscription_record.plan = 'pro' THEN
    IF subscription_record.plan_end_date IS NULL
       OR subscription_record.plan_end_date >= now_ts THEN
      effective_plan := 'pro';
    ELSE
      effective_plan := 'free';
    END IF;
  ELSE
    IF subscription_record.plan_end_date IS NOT NULL
       AND subscription_record.plan_end_date >= now_ts THEN
      effective_plan := 'pro';
    ELSE
      effective_plan := 'free';
    END IF;
  END IF;

  RETURN effective_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
