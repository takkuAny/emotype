-- βテスター登録用テーブル作成
-- 初期ユーザー獲得とプロダクトフィードバック収集

CREATE TABLE public.beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  twitter_handle TEXT,
  motivation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invited')),
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_beta_testers_email ON public.beta_testers(email);
CREATE INDEX idx_beta_testers_status ON public.beta_testers(status);
CREATE INDEX idx_beta_testers_created_at ON public.beta_testers(created_at DESC);

-- RLS（Row Level Security）設定
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- 誰でも登録可能（INSERT）
CREATE POLICY "Anyone can register as beta tester"
  ON public.beta_testers
  FOR INSERT
  WITH CHECK (true);

-- 管理者のみ閲覧・更新可能
CREATE POLICY "Admins can view all beta testers"
  ON public.beta_testers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update beta testers"
  ON public.beta_testers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.beta_testers IS 'βテスター登録管理テーブル（2025-01-08）';
COMMENT ON COLUMN public.beta_testers.status IS '審査ステータス: pending/approved/rejected/invited';
COMMENT ON COLUMN public.beta_testers.motivation IS '応募動機・期待すること';
