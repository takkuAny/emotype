'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import ProFeatureGuard from '@/components/ProFeatureGuard';

type Result = {
  id: string;
  content: string;
  image_url: string | null;
  emotion_tag: string | null;
  similarity: number;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          matchCount: 10,
          matchThreshold: 0.3,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Search failed');
      setResults(data.results ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getEmotionLabel = (tag: string) => {
    const labels: Record<string, string> = {
      'joy': '喜び',
      'happiness': '喜び',
      'sadness': '悲しみ',
      'anger': '怒り',
      'fear': '恐れ',
      'love': '愛',
      'surprise': '驚き',
      'disappointment': '失望',
      'excitement': '興奮',
      'neutral': '中立',
    }
    return labels[tag.toLowerCase()] || tag
  }

  const getEmotionColor = (tag: string | null) => {
    if (!tag) return 'text-gray-700'
    const colors: Record<string, string> = {
      'joy': 'text-yellow-700',
      'happiness': 'text-yellow-700',
      'sadness': 'text-blue-700',
      'anger': 'text-red-700',
      'fear': 'text-purple-700',
      'love': 'text-pink-700',
      'surprise': 'text-cyan-700',
      'disappointment': 'text-gray-700',
      'excitement': 'text-pink-700',
      'neutral': 'text-gray-700',
    }
    return colors[tag.toLowerCase()] || 'text-gray-700'
  }

  const getEmotionBorderColor = (tag: string | null) => {
    if (!tag) return '#6b7280'
    const colors: Record<string, string> = {
      'joy': '#f59e0b',
      'happiness': '#f59e0b',
      'sadness': '#3b82f6',
      'anger': '#ef4444',
      'fear': '#a855f7',
      'love': '#ec4899',
      'surprise': '#06b6d4',
      'disappointment': '#6b7280',
      'excitement': '#ec4899',
      'neutral': '#6b7280',
    }
    return colors[tag.toLowerCase()] || '#6b7280'
  }

  const getCardGradient = (tag: string | null) => {
    if (!tag) return 'from-gray-50 via-white to-gray-50'
    const gradients: Record<string, string> = {
      'joy': 'from-yellow-50 via-amber-50 to-yellow-50',
      'happiness': 'from-yellow-50 via-amber-50 to-yellow-50',
      'sadness': 'from-blue-50 via-sky-50 to-blue-50',
      'anger': 'from-red-50 via-rose-50 to-red-50',
      'fear': 'from-purple-50 via-violet-50 to-purple-50',
      'surprise': 'from-orange-50 via-amber-50 to-orange-50',
      'disappointment': 'from-gray-50 via-slate-50 to-gray-50',
      'excitement': 'from-pink-50 via-rose-50 to-pink-50',
      'neutral': 'from-gray-50 via-white to-gray-50',
    }
    return gradients[tag.toLowerCase()] || 'from-gray-50 via-white to-gray-50'
  }

  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            {part}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <ProFeatureGuard>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16">
        {/* 検索セクション */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-white/50 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">感情を検索</h1>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                自然な言葉で過去の感情を探してみましょう
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyPress}
                placeholder="例: 悲しい、嬉しい、イライラした時、緊張..."
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl active:scale-95 whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  検索中...
                </span>
              ) : (
                '検索'
              )}
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-bold text-red-900">エラーが発生しました</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 検索結果 */}
        <section>
          {results.length === 0 && !loading && !error && query && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 text-center border border-white/50">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-3xl mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">検索結果が見つかりませんでした</p>
              <p className="text-sm text-gray-500">別のキーワードで試してみてください</p>
            </div>
          )}

          {results.length === 0 && !loading && !error && !query && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 text-center border border-white/50">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl mb-4">
                <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-2">感情を検索してみましょう</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                「悲しい」「嬉しい」「イライラした時」「緊張した時」など、自然な言葉で検索できます。
                <br className="hidden sm:block" />
                AIが感情の意味を理解して、似た気持ちの投稿を見つけます。
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="text-sm font-medium text-gray-600">
                  <span className="text-emerald-600 font-bold">{results.length}</span> 件の結果が見つかりました
                </div>
              </div>
              {results.map((r, index) => (
                <article
                  key={r.id}
                  className={`bg-gradient-to-br ${getCardGradient(r.emotion_tag)} backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-white/50 hover:shadow-2xl hover:border-emerald-200 transition-all group`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {r.emotion_tag && (
                      <span
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl bg-white/90 backdrop-blur-sm border-2 ${getEmotionColor(r.emotion_tag)} shadow-lg`}
                        style={{ borderColor: getEmotionBorderColor(r.emotion_tag) }}
                      >
                        #{getEmotionLabel(r.emotion_tag)}
                      </span>
                    )}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm border-2 shadow-lg ${
                        r.similarity >= 0.6
                          ? 'text-green-700'
                          : r.similarity >= 0.5
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                      style={{
                        borderColor: r.similarity >= 0.6
                          ? '#16a34a'
                          : r.similarity >= 0.5
                          ? '#10b981'
                          : '#f59e0b'
                      }}
                    >
                      <svg className={`w-4 h-4 ${
                        r.similarity >= 0.6
                          ? 'text-green-600'
                          : r.similarity >= 0.5
                          ? 'text-emerald-600'
                          : 'text-amber-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-xs font-bold">
                        類似度 {(r.similarity * 100).toFixed(1)}%
                        {r.similarity < 0.5 && <span className="ml-1 text-xs">（関連性が低い可能性）</span>}
                      </span>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-4">{renderContentWithLinks(r.content)}</p>
                  {r.image_url && (
                    <div className="mt-4 rounded-2xl overflow-hidden ring-2 ring-gray-100 bg-gray-50">
                      {(r.image_url.endsWith('.mp4') ||
                        r.image_url.includes('/video/') ||
                        r.image_url.includes('video.twimg.com') ||
                        r.image_url.includes('.mp4?')) ? (
                        <video
                          src={r.image_url}
                          controls
                          className="w-full max-h-96"
                          preload="metadata"
                          playsInline
                        />
                      ) : (
                        <Image
                          src={r.image_url}
                          alt=""
                          width={1200}
                          height={900}
                          className="w-full max-h-96 object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
    </ProFeatureGuard>
  );
}
