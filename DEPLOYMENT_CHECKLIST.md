# Emotype 本番デプロイチェックリスト

## Week 1 機能実装完了 ✅

### 実装済み機能
- [x] Stripe Price ID設定
- [x] 1タップ気分記録ボタン（投稿内容: "今、{label}です"）
- [x] 週次レポート共有カード（Satori OG画像生成）
- [x] ドゥームスクロール計（SNS依存度分析）
- [x] 週次レポート共有ページ（ランディングページ化）

## 本番環境デプロイ前の確認事項

### 1. 環境変数の設定（重要！）

本番環境の `.env.production` または Vercel/hosting platform の環境変数に以下を設定してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<set-via-infra>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<set-via-secret-manager>
SUPABASE_SERVICE_ROLE_KEY=<set-via-secret-manager>

# OpenAI
OPENAI_API_KEY=<set-in-secret-manager>

# Voyage AI
EMBEDDING_PROVIDER=voyage
VOYAGE_MODEL=voyage-3
VOYAGE_API_KEY=<set-in-secret-manager>

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=<set-in-twitter-dev-portal>
TWITTER_CLIENT_SECRET=<set-in-twitter-dev-portal>

# アプリURL（本番URLに変更！）
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# JWT Secret
JWT_SECRET=<generate-and-set-secure-value>

# Stripe
STRIPE_SECRET_KEY=<set-in-stripe-dashboard>
STRIPE_PRICE_MONTHLY_ID=<set-in-stripe-dashboard>
STRIPE_PRICE_YEARLY_ID=<set-in-stripe-dashboard>
STRIPE_TRIAL_DAYS=7

# Cron Token
CRON_TWITTER_TOKEN=<set-via-secret-manager>
```

### 2. Twitter共有機能のテスト手順

本番環境デプロイ後、以下の手順でTwitter共有機能をテストしてください：

#### 2.1 OG画像の確認
1. ダッシュボードで「Xで共有する」ボタンをクリック
2. 生成されたshare URLをコピー（例: `https://your-domain.com/ja/share/1234567890?...`）
3. [Twitter Card Validator](https://cards-dev.twitter.com/validator) でURLを検証
4. OG画像（1200x630px）が正しく表示されることを確認

#### 2.2 実際のTwitter投稿テスト
1. ダッシュボードで週次レポートを生成
2. 「Xで共有する」ボタンをクリック
3. Twitter投稿画面でカードプレビューが表示されることを確認
4. テスト投稿を実行
5. タイムラインでOG画像付きカードが表示されることを確認

### 3. OG画像生成エンドポイントの確認

以下のエンドポイントが正しく動作することを確認：

```bash
# テスト用URL（本番ドメインに置き換え）
https://your-domain.com/api/og-image/weekly-card?totalPosts=10&topEmotion1=joy&topEmotion1Count=5&topEmotion2=sadness&topEmotion2Count=3&topEmotion3=neutral&topEmotion3Count=2&trend=positive&locale=ja
```

- ✅ HTTP 200を返す
- ✅ Content-Type: image/png
- ✅ 画像サイズ: 1200x630px
- ✅ 感情ラベルとemoji が正しく表示される
- ✅ トレンドに応じた背景グラデーション

### 4. 週次レポート共有ページの確認

```bash
# テスト用URL（本番ドメインに置き換え）
https://your-domain.com/ja/share/1234567890?totalPosts=10&topEmotion1=joy&topEmotion1Count=5&topEmotion2=sadness&topEmotion2Count=3&topEmotion3=neutral&topEmotion3Count=2&trend=positive
```

確認項目：
- ✅ ランディングページが表示される
- ✅ 「Emotypeを始める」ボタン → /login へ遷移
- ✅ 「ダッシュボードへ」ボタン → /dashboard へ遷移
- ✅ OGメタタグが正しく設定されている
- ✅ Twitter Card が正しく生成される

### 5. ドゥームスクロール計の確認

1. X連携済みユーザーでログイン
2. ダッシュボード → X連携セクション
3. 「ドゥームスクロール計を確認」ボタンをクリック
4. 以下の指標が表示されることを確認：
   - ✅ 総合スコア（0-100）
   - ✅ ネガティブ投稿比率
   - ✅ 深夜投稿率
   - ✅ X依存度
   - ✅ 1日平均投稿数
   - ✅ リスクレベル（low/moderate/high/severe）

### 6. データベースマイグレーション

デプロイ前に以下のマイグレーションが実行されていることを確認：

```bash
# Supabase管理画面 → SQL Editor で実行
supabase/migrations/20251108110000_update_free_plan_limits.sql
supabase/migrations/20251108120000_create_analytics_events.sql
supabase/migrations/20251108130000_create_beta_testers.sql
```

### 7. localhost vs 本番環境の違い

#### localhost環境の制限
- ❌ TwitterはOG画像を取得できない（外部アクセス不可）
- ⚠️ 警告ダイアログが表示される

#### 本番環境
- ✅ TwitterのクローラーがOG画像を取得可能
- ✅ 警告ダイアログは表示されない
- ✅ Twitter Card が正しく動作

## デプロイ後の動作確認

### 最終チェックリスト
- [ ] NEXT_PUBLIC_APP_URLが本番URLに設定されている
- [ ] OG画像エンドポイントが200を返す
- [ ] Twitter Card Validatorでカードが表示される
- [ ] 実際のTwitter投稿でカードが表示される
- [ ] ドゥームスクロール計が動作する
- [ ] 週次レポート共有ページが正しく表示される
- [ ] ランディングページのCTAボタンが動作する

## トラブルシューティング

### Twitter共有でOG画像が表示されない

1. **NEXT_PUBLIC_APP_URLを確認**
   - `.env.production`または環境変数が正しく設定されているか
   - `http://localhost:3000`になっていないか

2. **OG画像エンドポイントをテスト**
   ```bash
   curl -I https://your-domain.com/api/og-image/weekly-card?totalPosts=10&...
   ```
   - HTTP 200が返ってくるか
   - Content-Type: image/pngか

3. **Twitter Card Validatorで検証**
   - https://cards-dev.twitter.com/validator
   - share URLを入力
   - カードプレビューが表示されるか

4. **Twitterのキャッシュをクリア**
   - Twitter Card Validatorで「Preview card」をクリック
   - キャッシュがクリアされる

### OG画像生成が遅い

- Edge Runtimeを使用しているため、初回は遅い場合がある
- Vercelの場合、CDNキャッシュが効くまで待つ

## Week 1 実装完了

すべての機能が実装され、本番デプロイの準備が整いました！

次のステップ：
1. 本番環境にデプロイ
2. 環境変数の設定確認
3. Twitter共有機能のテスト
4. Week 2の機能実装へ進む

---

**Note**: このチェックリストに従ってデプロイすれば、すべての機能が正しく動作します。
