-- 英語の感情語とその同義語を追加
INSERT INTO emotion_synonyms (emotion, synonym, context, weight, source) VALUES
  -- happy (楽しい・嬉しいの英語版)
  ('happy', 'happy', 'general', 1.0, 'manual'),
  ('happy', 'joyful', 'general', 0.9, 'manual'),
  ('happy', 'cheerful', 'general', 0.9, 'manual'),
  ('happy', 'delighted', 'general', 0.8, 'manual'),
  ('happy', 'pleased', 'general', 0.8, 'manual'),
  ('happy', 'excited', 'general', 0.8, 'manual'),
  ('happy', 'glad', 'general', 0.9, 'manual'),
  ('happy', '楽しい', 'general', 0.9, 'manual'),
  ('happy', '嬉しい', 'general', 0.9, 'manual'),
  ('happy', 'うれしい', 'general', 0.9, 'manual'),

  -- sad (悲しいの英語版)
  ('sad', 'sad', 'general', 1.0, 'manual'),
  ('sad', 'unhappy', 'general', 0.9, 'manual'),
  ('sad', 'depressed', 'general', 0.8, 'manual'),
  ('sad', 'miserable', 'general', 0.8, 'manual'),
  ('sad', 'down', 'general', 0.8, 'manual'),
  ('sad', 'blue', 'general', 0.7, 'manual'),
  ('sad', 'sorrowful', 'general', 0.8, 'manual'),
  ('sad', '悲しい', 'general', 1.0, 'manual'),
  ('sad', 'つらい', 'general', 0.9, 'manual'),
  ('sad', '憂鬱', 'general', 0.8, 'manual'),

  -- angry (怒り・イライラの英語版)
  ('angry', 'angry', 'general', 1.0, 'manual'),
  ('angry', 'mad', 'general', 0.9, 'manual'),
  ('angry', 'irritated', 'general', 0.9, 'manual'),
  ('angry', 'frustrated', 'general', 0.9, 'manual'),
  ('angry', 'annoyed', 'general', 0.8, 'manual'),
  ('angry', 'furious', 'general', 0.8, 'manual'),
  ('angry', 'upset', 'general', 0.8, 'manual'),
  ('angry', 'イライラ', 'general', 1.0, 'manual'),
  ('angry', '怒り', 'general', 1.0, 'manual'),
  ('angry', '腹立つ', 'general', 0.9, 'manual'),

  -- angry (technical context)
  ('angry', 'Git', 'technical', 0.7, 'manual'),
  ('angry', 'Docker', 'technical', 0.7, 'manual'),
  ('angry', 'TypeScript', 'technical', 0.7, 'manual'),
  ('angry', 'error', 'technical', 0.8, 'manual'),
  ('angry', 'bug', 'technical', 0.8, 'manual'),
  ('angry', 'conflict', 'technical', 0.8, 'manual'),
  ('angry', 'エラー', 'technical', 0.8, 'manual'),
  ('angry', 'コンフリクト', 'technical', 0.8, 'manual'),

  -- tired (疲れた・眠いの英語版)
  ('tired', 'tired', 'general', 1.0, 'manual'),
  ('tired', 'exhausted', 'general', 0.9, 'manual'),
  ('tired', 'weary', 'general', 0.8, 'manual'),
  ('tired', 'fatigued', 'general', 0.9, 'manual'),
  ('tired', 'drained', 'general', 0.8, 'manual'),
  ('tired', 'worn out', 'general', 0.8, 'manual'),
  ('tired', 'sleepy', 'sleep', 0.9, 'manual'),
  ('tired', 'drowsy', 'sleep', 0.9, 'manual'),
  ('tired', '疲れた', 'general', 1.0, 'manual'),
  ('tired', '疲労', 'general', 1.0, 'manual'),
  ('tired', '眠い', 'sleep', 0.9, 'manual'),
  ('tired', '眠たい', 'sleep', 0.9, 'manual'),
  ('tired', 'だるい', 'general', 0.9, 'manual'),

  -- anxious (緊張・不安の英語版)
  ('anxious', 'anxious', 'general', 1.0, 'manual'),
  ('anxious', 'nervous', 'general', 0.9, 'manual'),
  ('anxious', 'worried', 'general', 0.9, 'manual'),
  ('anxious', 'tense', 'general', 0.9, 'manual'),
  ('anxious', 'stressed', 'general', 0.9, 'manual'),
  ('anxious', 'uneasy', 'general', 0.8, 'manual'),
  ('anxious', 'concerned', 'general', 0.8, 'manual'),
  ('anxious', '緊張', 'general', 1.0, 'manual'),
  ('anxious', '不安', 'general', 0.9, 'manual'),
  ('anxious', '心配', 'general', 0.9, 'manual'),

  -- relaxed (リラックスの英語版)
  ('relaxed', 'relaxed', 'general', 1.0, 'manual'),
  ('relaxed', 'calm', 'general', 0.9, 'manual'),
  ('relaxed', 'peaceful', 'general', 0.9, 'manual'),
  ('relaxed', 'tranquil', 'general', 0.8, 'manual'),
  ('relaxed', 'serene', 'general', 0.8, 'manual'),
  ('relaxed', 'chill', 'general', 0.8, 'manual'),
  ('relaxed', 'リラックス', 'general', 1.0, 'manual'),
  ('relaxed', '落ち着く', 'general', 0.9, 'manual'),
  ('relaxed', '安らぎ', 'general', 0.8, 'manual')
ON CONFLICT (emotion, synonym, context) DO NOTHING;
