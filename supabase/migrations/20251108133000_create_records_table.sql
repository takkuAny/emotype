-- 手動入力ログ（records）テーブルの作成
-- X連携を使わない気分・SNS利用記録を保持

CREATE TABLE IF NOT EXISTS public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  week_start DATE NOT NULL,
  mood_score SMALLINT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  sns_minutes INTEGER NOT NULL DEFAULT 0 CHECK (sns_minutes >= 0),
  posts_count INTEGER NOT NULL DEFAULT 0 CHECK (posts_count >= 0),
  sleep_score SMALLINT CHECK (sleep_score BETWEEN 0 AND 10),
  meals_score SMALLINT CHECK (meals_score BETWEEN 0 AND 10),
  focus_score SMALLINT CHECK (focus_score BETWEEN 0 AND 10),
  memo TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entry_date)
);

COMMENT ON TABLE public.records IS 'ユーザー自身が入力した気分・SNS利用ログ';
COMMENT ON COLUMN public.records.entry_date IS '記録対象日（ユーザー基準）';
COMMENT ON COLUMN public.records.week_start IS '週次集計用の週開始日（ISO週・月曜起点）';
COMMENT ON COLUMN public.records.tags IS 'メモから抽出したタグ（例: #late-night）';

CREATE INDEX idx_records_user_date ON public.records (user_id, entry_date DESC);
CREATE INDEX idx_records_week_start ON public.records (week_start, user_id);

-- updated_at自動更新
CREATE TRIGGER update_records_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 週始まり自動計算
CREATE OR REPLACE FUNCTION public.set_records_week_start()
RETURNS TRIGGER AS $$
BEGIN
  NEW.week_start := date_trunc('week', NEW.entry_date)::date;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER records_set_week_start
  BEFORE INSERT OR UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_records_week_start();

-- RLSポリシー
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own records"
  ON public.records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
  ON public.records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
  ON public.records
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
  ON public.records
  FOR DELETE
  USING (auth.uid() = user_id);
