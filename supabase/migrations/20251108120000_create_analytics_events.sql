-- イベントトラッキング用テーブル作成
-- ユーザー行動を分析してプロダクト改善につなげる

-- イベントタイプのENUM定義
CREATE TYPE public.event_type AS ENUM (
  -- ユーザー登録・認証
  'user_signup',
  'user_login',
  'user_logout',

  -- 投稿関連
  'post_created',
  'post_created_quick', -- 1タップ記録
  'post_created_full',  -- フル投稿フォーム
  'post_with_image',
  'post_with_audio',
  'post_deleted',

  -- 閲覧・エンゲージメント
  'dashboard_viewed',
  'posts_list_viewed',
  'post_detail_viewed',
  'emotion_graph_viewed',

  -- SNS連携
  'twitter_connected',
  'twitter_disconnected',
  'twitter_sync_started',
  'twitter_sync_completed',

  -- 共有・バイラル
  'weekly_report_shared',
  'weekly_report_viewed',

  -- サブスクリプション
  'upgrade_modal_opened',
  'upgrade_started',
  'upgrade_completed',
  'downgrade_started',
  'downgrade_completed',
  'trial_started',

  -- 検索・発見
  'search_performed',
  'calendar_viewed',

  -- その他
  'feature_used',
  'error_occurred'
);

-- analytics_eventsテーブル作成
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  event_name TEXT, -- 追加のイベント名（カスタムイベント用）
  properties JSONB DEFAULT '{}'::jsonb, -- イベント固有のプロパティ
  user_agent TEXT, -- ブラウザ情報
  ip_address INET, -- IPアドレス（プライバシー考慮で保存は任意）
  referrer TEXT, -- リファラー
  page_url TEXT, -- イベント発生ページ
  session_id TEXT, -- セッションID
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成（クエリ最適化）
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_event ON public.analytics_events(user_id, event_type);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);

-- GINインデックス（JSONB検索用）
CREATE INDEX idx_analytics_events_properties ON public.analytics_events USING GIN(properties);

-- RLS（Row Level Security）設定
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のイベントのみ参照可能
CREATE POLICY "Users can view own events"
  ON public.analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- イベント挿入はサービスロールのみ（APIから実行）
CREATE POLICY "Service role can insert events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- 管理者は全イベント参照可能
CREATE POLICY "Admins can view all events"
  ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- コメント
COMMENT ON TABLE public.analytics_events IS 'ユーザー行動トラッキング用テーブル（2025-01-08）';
COMMENT ON COLUMN public.analytics_events.event_type IS 'イベントタイプ（ENUM）';
COMMENT ON COLUMN public.analytics_events.properties IS 'イベント固有のプロパティ（JSONB）';
COMMENT ON COLUMN public.analytics_events.session_id IS 'セッションID（ユーザージャーニー分析用）';
