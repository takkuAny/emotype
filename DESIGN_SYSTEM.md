# Emotype Design System

## カラーパレット

### プライマリカラー
- **Indigo**: `#6366f1` (indigo-600)
- **Purple**: `#9333ea` (purple-600)
- **Pink**: `#ec4899` (pink-600)

### グラデーション
- **Primary Gradient**: `from-indigo-600 via-purple-600 to-pink-600`
- **Background Gradient**: `from-slate-50 via-indigo-50/30 to-purple-50`

### 感情タグの色分け
- **Joy/Happiness**: `bg-yellow-100 text-yellow-700`
- **Sadness**: `bg-blue-100 text-blue-700`
- **Anger**: `bg-red-100 text-red-700`
- **Fear**: `bg-purple-100 text-purple-700`
- **Surprise**: `bg-orange-100 text-orange-700`
- **Disappointment**: `bg-gray-100 text-gray-700`
- **Excitement**: `bg-pink-100 text-pink-700`

### 状態カラー
- **Success**: `bg-green-50 text-green-800 border-green-200`
- **Error**: `bg-red-50 text-red-800 border-red-200`
- **Warning**: `bg-amber-50 text-amber-800 border-amber-200`
- **Info**: `bg-blue-50 text-blue-800 border-blue-200`

## タイポグラフィ

### フォント
- **Sans**: Geist Sans (デフォルト)
- **Mono**: Geist Mono (コード用)

### フォントサイズ
- **H1**: `text-4xl` (36px) - ログインページのタイトル
- **H2**: `text-2xl` (24px) - セクションタイトル
- **H3**: `text-xl` (20px) - サブセクションタイトル
- **Body**: `text-base` (16px) - 本文
- **Small**: `text-sm` (14px) - 補足情報
- **XSmall**: `text-xs` (12px) - ラベル・タグ

### フォントウェイト
- **Bold**: `font-bold` (700) - 見出し・強調
- **Semibold**: `font-semibold` (600) - サブ見出し
- **Medium**: `font-medium` (500) - ボタン・リンク
- **Normal**: `font-normal` (400) - 本文

## スペーシング

### パディング
- **XS**: `p-2` (8px)
- **SM**: `p-4` (16px)
- **MD**: `p-6` (24px)
- **LG**: `p-8` (32px)
- **XL**: `p-10` (40px)

### マージン
- **XS**: `gap-2` (8px)
- **SM**: `gap-4` (16px)
- **MD**: `gap-6` (24px)
- **LG**: `gap-8` (32px)

## ボーダー

### 角丸
- **SM**: `rounded-xl` (12px) - 小さな要素
- **MD**: `rounded-2xl` (16px) - カード・ボタン
- **LG**: `rounded-3xl` (24px) - 大きなカード

### ボーダー幅
- **Default**: `border-2` (2px)
- **Thick**: `border-4` (4px)

## シャドウ

### エレベーション
- **None**: `shadow-none`
- **SM**: `shadow-lg` - カード
- **MD**: `shadow-xl` - ホバー時
- **LG**: `shadow-2xl` - モーダル・重要な要素

## コンポーネント

### ボタン

#### プライマリボタン
```tsx
<button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                   hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 
                   text-white font-bold py-3.5 rounded-2xl 
                   transition-all shadow-xl hover:shadow-2xl 
                   disabled:opacity-50 disabled:cursor-not-allowed 
                   active:scale-95">
  ボタン
</button>
```

#### セカンダリボタン
```tsx
<button className="px-6 py-3 border-2 border-gray-200 text-gray-700 
                   rounded-2xl hover:bg-gray-50 hover:border-gray-300 
                   transition-all active:scale-95">
  ボタン
</button>
```

### カード

#### 標準カード
```tsx
<div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl 
                p-6 sm:p-8 border border-white/50">
  コンテンツ
</div>
```

#### 統計カード
```tsx
<div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 
                rounded-3xl p-6 text-white shadow-2xl 
                hover:shadow-3xl transition-all transform hover:scale-[1.02]">
  コンテンツ
</div>
```

### 入力フィールド

#### テキスト入力
```tsx
<input className="w-full px-4 py-3.5 border-2 border-gray-200 
                   rounded-2xl focus:border-indigo-500 
                   focus:ring-4 focus:ring-indigo-100 
                   transition-all outline-none text-base 
                   placeholder:text-gray-400" />
```

### ナビゲーション

#### ナビゲーションアイテム
```tsx
<button className={`px-4 py-2.5 text-sm font-medium rounded-xl 
                    transition-all duration-200 ${
  isActive
    ? 'text-indigo-700 bg-indigo-50 shadow-sm'
    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
}`}>
  メニュー
</button>
```

## アニメーション

### トランジション
- **Default**: `transition-all`
- **Duration**: `duration-200`, `duration-300`

### ホバーエフェクト
- **Scale**: `hover:scale-110`, `hover:scale-[1.02]`
- **Shadow**: `hover:shadow-xl`, `hover:shadow-2xl`

### アクティブエフェクト
- **Press**: `active:scale-95`, `active:scale-98`

## レスポンシブブレークポイント

- **Mobile**: `< 640px` (sm未満)
- **Tablet**: `640px - 1024px` (sm - lg)
- **Desktop**: `> 1024px` (lg以上)

## アイコンサイズ

- **XS**: `w-4 h-4` (16px)
- **SM**: `w-5 h-5` (20px)
- **MD**: `w-6 h-6` (24px)
- **LG**: `w-7 h-7` (28px)
- **XL**: `w-8 h-8` (32px)

## 使用例

### 投稿フォーム
- カード背景: `bg-white/80 backdrop-blur-xl`
- 角丸: `rounded-3xl`
- シャドウ: `shadow-2xl`
- ボーダー: `border border-white/50`

### 検索結果
- カード: 標準カードスタイル
- ホバー: `hover:shadow-2xl hover:border-indigo-200`
- 類似度バッジ: グラデーション背景（類似度に応じて色変更）

### 統計カード
- グラデーション背景（indigo, purple, pink）
- アイコン背景: `bg-white/20 backdrop-blur-sm`
- ホバー: `hover:scale-[1.02]`

