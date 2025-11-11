-- emotion_synonyms テーブル作成
CREATE TABLE IF NOT EXISTS emotion_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion TEXT NOT NULL, -- 基本感情（例: '疲れた', 'イライラ'）
  synonym TEXT NOT NULL, -- 同義語・関連語
  context TEXT, -- 'general', 'technical', 'sleep' などのコンテキスト
  weight FLOAT DEFAULT 1.0, -- 重み（頻出度や関連性の強さ）
  source TEXT DEFAULT 'manual', -- 'manual', 'auto_cooccurrence', 'user_feedback'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(emotion, synonym, context)
);

-- インデックス
CREATE INDEX idx_emotion_synonyms_emotion ON emotion_synonyms(emotion);
CREATE INDEX idx_emotion_synonyms_context ON emotion_synonyms(context);
CREATE INDEX idx_emotion_synonyms_weight ON emotion_synonyms(weight DESC);

-- 既存のハードコーディングされた辞書を移行
INSERT INTO emotion_synonyms (emotion, synonym, context, weight, source) VALUES
  -- 楽しい
  ('楽しい', '楽しい', 'general', 1.0, 'manual'),
  ('楽しい', '嬉しい', 'general', 0.9, 'manual'),
  ('楽しい', 'ハッピー', 'general', 0.9, 'manual'),
  ('楽しい', '喜び', 'general', 0.8, 'manual'),
  ('楽しい', '愉快', 'general', 0.8, 'manual'),
  ('楽しい', 'うれしい', 'general', 0.9, 'manual'),
  ('楽しい', 'joy', 'general', 0.9, 'manual'),
  ('楽しい', 'happy', 'general', 0.9, 'manual'),
  ('楽しい', 'fun', 'general', 0.9, 'manual'),

  -- 嬉しい
  ('嬉しい', '嬉しい', 'general', 1.0, 'manual'),
  ('嬉しい', '楽しい', 'general', 0.9, 'manual'),
  ('嬉しい', 'ハッピー', 'general', 0.9, 'manual'),
  ('嬉しい', '喜び', 'general', 0.8, 'manual'),
  ('嬉しい', '愉快', 'general', 0.8, 'manual'),
  ('嬉しい', 'うれしい', 'general', 1.0, 'manual'),
  ('嬉しい', 'joy', 'general', 0.9, 'manual'),
  ('嬉しい', 'happy', 'general', 0.9, 'manual'),

  -- 悲しい
  ('悲しい', '悲しい', 'general', 1.0, 'manual'),
  ('悲しい', 'つらい', 'general', 0.9, 'manual'),
  ('悲しい', '憂鬱', 'general', 0.8, 'manual'),
  ('悲しい', '悲しみ', 'general', 0.9, 'manual'),
  ('悲しい', '落ち込む', 'general', 0.9, 'manual'),
  ('悲しい', 'sad', 'general', 1.0, 'manual'),
  ('悲しい', 'sadness', 'general', 0.9, 'manual'),
  ('悲しい', 'depressed', 'general', 0.8, 'manual'),

  -- イライラ（一般）
  ('イライラ', 'イライラ', 'general', 1.0, 'manual'),
  ('イライラ', '怒り', 'general', 0.9, 'manual'),
  ('イライラ', '腹立つ', 'general', 0.9, 'manual'),
  ('イライラ', '不満', 'general', 0.8, 'manual'),
  ('イライラ', 'frustration', 'general', 1.0, 'manual'),
  ('イライラ', 'anger', 'general', 0.9, 'manual'),
  ('イライラ', 'angry', 'general', 0.9, 'manual'),
  ('イライラ', 'irritated', 'general', 1.0, 'manual'),

  -- イライラ（技術系）
  ('イライラ', 'Git', 'technical', 0.7, 'manual'),
  ('イライラ', 'Docker', 'technical', 0.7, 'manual'),
  ('イライラ', 'TypeScript', 'technical', 0.7, 'manual'),
  ('イライラ', 'エラー', 'technical', 0.8, 'manual'),
  ('イライラ', 'コンフリクト', 'technical', 0.8, 'manual'),
  ('イライラ', 'Gitのコンフリクト', 'technical', 0.9, 'manual'),
  ('イライラ', 'Dockerのビルド', 'technical', 0.8, 'manual'),
  ('イライラ', 'TypeScriptのエラー', 'technical', 0.8, 'manual'),
  ('イライラ', 'ビルド', 'technical', 0.7, 'manual'),
  ('イライラ', 'プログラミング', 'technical', 0.6, 'manual'),
  ('イライラ', '開発', 'technical', 0.6, 'manual'),
  ('イライラ', 'コーディング', 'technical', 0.6, 'manual'),
  ('イライラ', 'error', 'technical', 0.8, 'manual'),
  ('イライラ', 'bug', 'technical', 0.8, 'manual'),
  ('イライラ', 'conflict', 'technical', 0.8, 'manual'),

  -- 怒
  ('怒', '怒り', 'general', 1.0, 'manual'),
  ('怒', 'イライラ', 'general', 0.9, 'manual'),
  ('怒', '腹立つ', 'general', 0.9, 'manual'),
  ('怒', '不満', 'general', 0.8, 'manual'),
  ('怒', 'anger', 'general', 1.0, 'manual'),
  ('怒', 'angry', 'general', 1.0, 'manual'),
  ('怒', 'mad', 'general', 0.9, 'manual'),

  -- 緊張
  ('緊張', '緊張', 'general', 1.0, 'manual'),
  ('緊張', '不安', 'general', 0.9, 'manual'),
  ('緊張', '心配', 'general', 0.8, 'manual'),
  ('緊張', '焦り', 'general', 0.8, 'manual'),
  ('緊張', 'anxiety', 'general', 0.9, 'manual'),
  ('緊張', 'nervous', 'general', 1.0, 'manual'),
  ('緊張', 'worried', 'general', 0.8, 'manual'),
  ('緊張', 'tense', 'general', 1.0, 'manual'),

  -- 疲れた
  ('疲れた', '疲れた', 'general', 1.0, 'manual'),
  ('疲れた', '疲労', 'general', 1.0, 'manual'),
  ('疲れた', '倦怠', 'general', 0.8, 'manual'),
  ('疲れた', 'だるい', 'general', 0.9, 'manual'),
  ('疲れた', '眠い', 'sleep', 0.9, 'manual'),
  ('疲れた', '眠たい', 'sleep', 0.9, 'manual'),
  ('疲れた', 'tired', 'general', 1.0, 'manual'),
  ('疲れた', 'exhausted', 'general', 0.9, 'manual'),
  ('疲れた', 'fatigue', 'general', 1.0, 'manual'),
  ('疲れた', 'sleepy', 'sleep', 0.9, 'manual'),

  -- 疲労
  ('疲労', '疲れた', 'general', 1.0, 'manual'),
  ('疲労', '疲労', 'general', 1.0, 'manual'),
  ('疲労', '倦怠', 'general', 0.8, 'manual'),
  ('疲労', 'だるい', 'general', 0.9, 'manual'),
  ('疲労', '眠い', 'sleep', 0.9, 'manual'),
  ('疲労', '眠たい', 'sleep', 0.9, 'manual'),
  ('疲労', 'tired', 'general', 1.0, 'manual'),
  ('疲労', 'exhausted', 'general', 0.9, 'manual'),
  ('疲労', 'fatigue', 'general', 1.0, 'manual'),

  -- 眠い
  ('眠い', '眠い', 'sleep', 1.0, 'manual'),
  ('眠い', '眠たい', 'sleep', 1.0, 'manual'),
  ('眠い', '疲れた', 'sleep', 0.9, 'manual'),
  ('眠い', '疲労', 'sleep', 0.8, 'manual'),
  ('眠い', 'だるい', 'sleep', 0.8, 'manual'),
  ('眠い', 'sleepy', 'sleep', 1.0, 'manual'),
  ('眠い', 'tired', 'sleep', 0.8, 'manual'),
  ('眠い', 'drowsy', 'sleep', 1.0, 'manual'),

  -- リラックス
  ('リラックス', 'リラックス', 'general', 1.0, 'manual'),
  ('リラックス', '落ち着く', 'general', 0.9, 'manual'),
  ('リラックス', '安らぎ', 'general', 0.8, 'manual'),
  ('リラックス', 'relaxed', 'general', 1.0, 'manual'),
  ('リラックス', 'calm', 'general', 0.9, 'manual'),
  ('リラックス', 'peaceful', 'general', 0.8, 'manual')
ON CONFLICT (emotion, synonym, context) DO NOTHING;

-- RLS設定（全ユーザーが読み取り可能、管理者のみ書き込み）
ALTER TABLE emotion_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read emotion_synonyms"
  ON emotion_synonyms FOR SELECT
  USING (true);

-- 将来的にユーザーフィードバック機能を追加する場合のポリシー（コメントアウト）
-- CREATE POLICY "Authenticated users can suggest synonyms"
--   ON emotion_synonyms FOR INSERT
--   TO authenticated
--   WITH CHECK (source = 'user_feedback');
