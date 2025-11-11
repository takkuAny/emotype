-- 無料プランの制限を30件→100件に緩和
-- これにより、無料ユーザーの体験が大幅に向上し、有料転換率の改善が期待できる

-- 既存の can_create_post 関数を更新
CREATE OR REPLACE FUNCTION public.can_create_post(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan public.subscription_plan;
  user_role public.user_role;
  monthly_count INTEGER;
  free_limit INTEGER := 100; -- 30から100に変更
BEGIN
  -- 管理者チェック
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uuid
  LIMIT 1;

  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- プラン取得
  SELECT get_user_plan(user_uuid) INTO user_plan;

  -- Proユーザーは無制限
  IF user_plan = 'pro' THEN
    RETURN TRUE;
  END IF;

  -- 無料ユーザーの月間投稿数チェック
  SELECT get_monthly_post_count(user_uuid) INTO monthly_count;

  RETURN monthly_count < free_limit;
END;
$$;

-- 既存の get_remaining_posts 関数を更新
CREATE OR REPLACE FUNCTION public.get_remaining_posts(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan public.subscription_plan;
  user_role public.user_role;
  monthly_count INTEGER;
  free_limit INTEGER := 100; -- 30から100に変更
BEGIN
  -- 管理者チェック
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uuid
  LIMIT 1;

  IF user_role = 'admin' THEN
    RETURN -1; -- 無制限
  END IF;

  -- プラン取得
  SELECT get_user_plan(user_uuid) INTO user_plan;

  -- Proユーザーは無制限
  IF user_plan = 'pro' THEN
    RETURN -1;
  END IF;

  -- 無料ユーザーの残り投稿可能数
  SELECT get_monthly_post_count(user_uuid) INTO monthly_count;
  RETURN GREATEST(0, free_limit - monthly_count);
END;
$$;

-- コメント
COMMENT ON FUNCTION public.can_create_post IS '無料プランの月間投稿制限を100件に変更（2025-01-08）';
COMMENT ON FUNCTION public.get_remaining_posts IS '無料プランの月間投稿制限を100件に変更（2025-01-08）';
