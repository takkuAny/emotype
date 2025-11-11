# Emotype Component Library

## 概要

このドキュメントは、Emotypeアプリケーションで使用されている主要なコンポーネントの仕様を記載しています。

## ページレイアウト

### 基本構造
```
┌─────────────────────────────────┐
│ Navigation (Fixed)              │
├─────────────────────────────────┤
│                                 │
│  Main Content Area              │
│  (Gradient Background)          │
│                                 │
│  ┌─────────┐  ┌──────────┐    │
│  │  Left   │  │  Right   │    │
│  │  (8/12) │  │  (4/12)  │    │
│  │         │  │          │    │
│  └─────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

## コンポーネント一覧

### 1. Navigation (固定ナビゲーション)

**特徴:**
- スクロール時に背景が変化（blur効果）
- ロゴはグラデーション背景
- アクティブなページには下線インジケーター

**レスポンシブ:**
- モバイル: ハンバーガーメニュー
- デスクトップ: 水平メニュー

### 2. Post Form (投稿フォーム)

**要素:**
- アイコン付きヘッダー（グラデーション背景）
- テキストエリア（min-height: 140px）
- 文字数カウンター（500文字制限）
- 画像アップロードボタン
- 投稿ボタン（グラデーション）

**状態:**
- ローディング: スピナー表示
- 成功: 緑のメッセージ
- エラー: 赤のメッセージ

### 3. Post Card (投稿カード)

**レイアウト:**
```
┌─────────────────────────────┐
│ [Emotion Tag] [Time]        │
│                             │
│  Content text...            │
│                             │
│  [Image if exists]         │
└─────────────────────────────┘
```

**特徴:**
- ホバーでボーダーとシャドウが変化
- 画像がある場合、サムネイル表示
- 感情タグは色分け表示

### 4. Stats Card (統計カード)

**デザイン:**
- グラデーション背景（indigo/purple/pink）
- 白文字
- アイコン付き
- ホバーで拡大

**レイアウト:**
```
┌─────────────────┐
│ Label      [Icon]│
│                 │
│   123           │
└─────────────────┘
```

### 5. Emotion Graph (感情グラフ)

**要素:**
- ヘッダー: タイトル + 期間選択ボタン（7/14/30日）
- グラフ: AreaChart with Line
- ツールチップ: 日付、スコア、感情ラベル
- 凡例: 感情スコア、中立ライン

**カラー:**
- グラフ線: `#6366f1` (indigo-600)
- グラデーション: indigo with opacity

### 6. Search Results (検索結果)

**カード構造:**
```
┌─────────────────────────────┐
│ [Tag] [Similarity Badge]    │
│                             │
│  Content...                 │
│                             │
│  [Image if exists]         │
└─────────────────────────────┘
```

**類似度バッジの色:**
- ≥60%: 緑（高い関連性）
- 50-60%: 青紫（中程度）
- 40-50%: オレンジ（低い可能性）+ 警告

### 7. Quick Actions (クイックアクション)

**レイアウト:**
```
┌─────────────────────────────┐
│ Quick Actions                │
├─────────────────────────────┤
│ [Icon] Title                 │
│       Description      →     │
├─────────────────────────────┤
│ [Icon] Title                 │
│       Description      →     │
└─────────────────────────────┘
```

**特徴:**
- グラデーション背景（アイコン用）
- ホバーでボーダーが表示
- アクティブ時にscale効果

## 共通パターン

### ローディング状態
```tsx
<div className="flex justify-center items-center">
  <div className="relative">
    <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
    <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
  </div>
</div>
```

### 空の状態
```tsx
<div className="text-center py-16">
  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-4">
    <Icon className="w-10 h-10 text-indigo-500" />
  </div>
  <p className="text-lg font-medium text-gray-700 mb-2">タイトル</p>
  <p className="text-sm text-gray-500">説明文</p>
</div>
```

### エラーメッセージ
```tsx
<div className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
  <div className="flex items-start gap-3">
    <ErrorIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-bold text-red-900 mb-1">エラーが発生しました</p>
      <p className="text-sm text-red-700">エラーメッセージ</p>
    </div>
  </div>
</div>
```

## アニメーション

### フェードイン
```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### スケールイン
```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

## アクセシビリティ

### キーボード操作
- すべてのボタンはキーボードでフォーカス可能
- Tab順序は論理的
- Enter/Spaceでボタンをアクティブ化

### スクリーンリーダー
- 適切なaria-labelを設定
- アイコンにはテキスト代替を提供
- フォーム入力にはラベルを付与

## パフォーマンス最適化

### 画像
- `loading="lazy"` で遅延読み込み
- 適切なサイズの画像を使用
- `object-cover` でアスペクト比を維持

### アニメーション
- `will-change` を適切に使用
- `transform` と `opacity` のみでアニメーション
- GPU アクセラレーションを活用

