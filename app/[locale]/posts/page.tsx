'use client'
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Link } from '@/i18n/routing'

type Post = {
  id: string
  content: string
  emotion_tag: string
  emotion_tags?: string[]
  image_url?: string
  audio_url?: string
  created_at: string
  url?: string
}

const EMOTION_TAGS = [
  { value: 'joy', label: '喜び', color: 'from-yellow-400 to-orange-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  { value: 'sadness', label: '悲しみ', color: 'from-blue-400 to-indigo-400', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  { value: 'anger', label: '怒り', color: 'from-red-400 to-pink-400', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  { value: 'fear', label: '恐れ', color: 'from-purple-400 to-indigo-400', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  { value: 'love', label: '愛', color: 'from-pink-400 to-rose-400', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
  { value: 'surprise', label: '驚き', color: 'from-cyan-400 to-blue-400', bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
  { value: 'neutral', label: '中立', color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
]

export default function PostsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        loadPosts(user.id)
      } else {
        window.location.href = '/'
      }
    }
    checkUser()
  }, [])

  const loadPosts = async (userId: string) => {
    setLoading(true)
    try {
      const query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    // 感情タグフィルター: emotion_tags配列のいずれか、またはemotion_tagにマッチ
    const matchesTag = !selectedTag ||
                      (post.emotion_tags && post.emotion_tags.includes(selectedTag)) ||
                      post.emotion_tag === selectedTag
    const matchesSearch = !searchQuery || post.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTag && matchesSearch
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'たった今'
    if (diffMins < 60) return `${diffMins}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays < 7) return `${diffDays}日前`

    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hours}:${minutes}`
  }

  const getEmotionConfig = (tag: string) => {
    return EMOTION_TAGS.find(t => t.value === tag) || EMOTION_TAGS[6]
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">投稿一覧</h1>
                <p className="text-xs text-gray-500">すべての投稿を表示</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルター & 検索 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/50 mb-8">
          {/* 検索バー */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="投稿を検索..."
                className="w-full px-6 py-4 pl-14 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-500 transition-colors text-gray-900 placeholder-gray-400"
              />
              <svg className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 感情タグフィルター */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">感情で絞り込む</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  selectedTag === null
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {EMOTION_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => setSelectedTag(tag.value)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    selectedTag === tag.value
                      ? `bg-gradient-to-r ${tag.color} text-white shadow-lg scale-105`
                      : `${tag.bgColor} ${tag.textColor} hover:scale-105`
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* 件数表示 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-emerald-600">{filteredPosts.length}</span>件の投稿
              {selectedTag && (
                <span className="text-gray-400"> (フィルター適用中)</span>
              )}
            </p>
          </div>
        </div>

        {/* 投稿リスト */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-12 border border-white/50 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl mx-auto mb-6 flex items-center justify-center opacity-50">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">投稿が見つかりませんでした</p>
            <p className="text-sm text-gray-400">
              {searchQuery || selectedTag ? 'フィルターを変更してみてください' : 'まだ投稿がありません'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              // 感情タグごとの背景グラデーション
              const getBgGradient = (tag: string) => {
                switch(tag) {
                  case 'joy': return 'bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50'
                  case 'sadness': return 'bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50'
                  case 'anger': return 'bg-gradient-to-br from-red-50 via-pink-50 to-rose-50'
                  case 'fear': return 'bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50'
                  case 'love': return 'bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50'
                  case 'surprise': return 'bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50'
                  default: return 'bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50'
                }
              }

              return (
                <div
                  key={post.id}
                  className={`${getBgGradient(post.emotion_tag)} backdrop-blur-xl rounded-3xl shadow-lg p-6 border border-white/50 hover:shadow-2xl transition-all hover:scale-[1.01]`}
                >
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 複数の感情タグを表示 */}
                      {(post.emotion_tags && post.emotion_tags.length > 0 ? post.emotion_tags : [post.emotion_tag]).map((tag, index) => {
                        const tagConfig = getEmotionConfig(tag)
                        const borderColor = tagConfig.textColor.includes('yellow') ? '#f59e0b' :
                                          tagConfig.textColor.includes('blue') ? '#3b82f6' :
                                          tagConfig.textColor.includes('red') ? '#ef4444' :
                                          tagConfig.textColor.includes('purple') ? '#a855f7' :
                                          tagConfig.textColor.includes('pink') ? '#ec4899' :
                                          tagConfig.textColor.includes('cyan') ? '#06b6d4' :
                                          '#6b7280'

                        return (
                          <div
                            key={index}
                            className={`px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm border-2 ${tagConfig.textColor} font-bold text-xs shadow-lg`}
                            style={{ borderColor }}
                          >
                            #{tagConfig.label}
                          </div>
                        )
                      })}
                      <span className="text-sm text-gray-600 font-medium ml-1">{formatDate(post.created_at)}</span>
                    </div>
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                  </div>

                  {/* 本文 */}
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap leading-relaxed">
                    {post.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, i) => {
                      if (part.match(/^https?:\/\//)) {
                        return (
                          <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 underline hover:no-underline transition-colors"
                          >
                            {part}
                          </a>
                        )
                      }
                      return part
                    })}
                  </p>

                  {/* メディア */}
                  <div className="space-y-3">
                    {post.image_url && (
                      <div className="rounded-2xl overflow-hidden max-w-md">
                        <img src={post.image_url} alt="投稿画像" className="w-full h-auto object-contain max-h-96" />
                      </div>
                    )}
                    {post.audio_url && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">音声メモ</span>
                        </div>
                        <audio src={post.audio_url} controls className="w-full" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
