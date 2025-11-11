'use client'

import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef, Suspense } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import type { User, AuthChangeEvent } from '@supabase/supabase-js'
import Navigation from '@/components/Navigation'
import EmotionGraph from '@/components/EmotionGraph'
import AudioRecorder from '@/components/AudioRecorder'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from '@/i18n/routing'
import { trackPageView, trackPostCreated, trackWeeklyReportShared } from '@/lib/analytics'

type Post = {
  id: string
  content: string
  image_url: string | null
  created_at: string
  emotion_tag: string | null
  emotion_tags?: string[]
}

type Stats = {
  total: number
  thisWeek: number
  thisMonth: number
}

type Insight = {
  insight: string
  emoji: string
  trend: 'positive' | 'neutral' | 'negative'
}

const FREE_PLAN_AVAILABLE_FEATURES = ['basicPosts', 'monthlyLimit'] as const
const FREE_PLAN_UNAVAILABLE_FEATURES = ['noGraph', 'noInsights', 'noXIntegration', 'noMedia', 'noEmotionCode'] as const
const PRO_PLAN_FEATURE_KEYS = ['unlimitedPosts', 'emotionGraph', 'aiInsights', 'xIntegration', 'media', 'emotionCode', 'prioritySupport'] as const

function DashboardPageContent() {
  const [user, setUser] = useState<User | null>(null)
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [audio, setAudio] = useState<Blob | null>(null)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageStatus, setMessageStatus] = useState<'success' | 'error' | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, thisWeek: 0, thisMonth: 0 })
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(true)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { subscription, isFree, isPro, isAdmin, canAccessProFeatures } = useSubscription()
  const tCommon = useTranslations('common')
  const tDashboard = useTranslations('dashboard')
  const tTime = useTranslations('time')
  const tEmotions = useTranslations('emotions.labels')
  const locale = useLocale()
  const monthlyPostCount = subscription?.limits?.monthlyPostCount ?? 0
  const remainingPosts = subscription?.limits?.remainingPosts ?? Math.max(30 - monthlyPostCount, 0)

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Failed to load user:', error)
        return
      }
      const currentUser = data.user
      if (!currentUser) {
        router.push('/login')
        return
      }
      if (!isMounted) return
      setUser(currentUser)
      await Promise.all([loadRecentPosts(currentUser.id), loadStats(currentUser.id), loadInsight()])

      // ページビュートラッキング
      trackPageView('dashboard')
    }

    initialize()

    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [router])

  // Check for upgrade query parameter
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    if (upgrade === 'true' && isFree) {
      setShowUpgradePrompt(true)
    }
  }, [searchParams, isFree])

  const loadInsight = async () => {
    setLoadingInsight(true)
    try {
      // Supabaseセッションからトークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No session found')
        return
      }

      const response = await fetch('/api/insights', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        setInsight(data)
      } else {
        console.error('Error loading insight:', data.error)
      }
    } catch (error) {
      console.error('Error loading insight:', error)
    } finally {
      setLoadingInsight(false)
    }
  }

  const loadRecentPosts = async (userId: string) => {
    setLoadingPosts(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setRecentPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  const loadStats = async (userId: string) => {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [totalResult, weekResult, monthResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekAgo.toISOString()),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', monthAgo.toISOString()),
      ])

      setStats({
        total: totalResult.count || 0,
        thisWeek: weekResult.count || 0,
        thisMonth: monthResult.count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`

    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleAudioUpload = async (audioBlob: Blob): Promise<string> => {
    const fileName = `${Date.now()}_audio.webm`

    const { error } = await supabase.storage
      .from('post-audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm'
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('post-audio')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handlePost = async () => {
    if (!user || !content.trim()) {
      setMessage(tDashboard('postForm.emptyContent'))
      setMessageStatus('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageStatus(null)

    if (textareaRef.current) {
      textareaRef.current.blur()
    }

    try {
      let imageUrl = null
      let audioUrl = null

      if (image) {
        imageUrl = await handleImageUpload(image)
      }

      if (audio) {
        audioUrl = await handleAudioUpload(audio)
      }

      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert({
          content,
          image_url: imageUrl,
          audio_url: audioUrl,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetch('/api/generate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          content: post.content,
        }),
      })

      await supabase
        .from('insights')
        .delete()
        .eq('user_id', user.id)

      // トラッキング：フル投稿
      trackPostCreated('full', !!imageUrl, !!audioUrl)

      setMessage(tDashboard('postForm.successMessage'))
      setMessageStatus('success')
      setContent('')
      setImage(null)
      setAudio(null)

      const fileInput = document.getElementById('image-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      loadRecentPosts(user.id)
      loadStats(user.id)
      loadInsight()

      setTimeout(() => {
        setMessage('')
        setMessageStatus(null)
      }, 3000)

    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessage(tDashboard('postForm.errorMessage', { message: fallbackMessage }))
      setMessageStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return tTime('justNow')
    if (diffMins < 60) return tTime('minutesAgo', { count: diffMins })
    if (diffHours < 24) return tTime('hoursAgo', { count: diffHours })
    if (diffDays < 7) return tTime('daysAgo', { count: diffDays })
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)
  }

  const getEmotionLabel = (tag: string | null) => {
    if (!tag) return tEmotions('neutral')
    const key = tag.toLowerCase()
    try {
      return tEmotions(key)
    } catch {
      return tag
    }
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
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
          <div className="text-gray-600 font-medium">{tCommon('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pb-20 sm:pb-8">
      <Navigation />

      {/* アップグレードプロンプトモーダル */}
      {showUpgradePrompt && isFree && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setShowUpgradePrompt(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💎</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {tDashboard('upgradePrompt.title')}
              </h2>
              <p className="text-gray-600 text-lg">
                {tDashboard('upgradePrompt.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tDashboard('upgradePrompt.planComparison.free.title')}</h3>
                  <div className="text-3xl font-bold text-gray-900">{tDashboard('upgradePrompt.planComparison.free.price')}</div>
                  <div className="text-sm text-gray-500">{tDashboard('upgradePrompt.planComparison.free.period')}</div>
                </div>
                <ul className="space-y-3">
                  {FREE_PLAN_AVAILABLE_FEATURES.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✔</span>
                      <span>{tDashboard(`upgradePrompt.planComparison.free.features.${key}`)}</span>
                    </li>
                  ))}
                  {FREE_PLAN_UNAVAILABLE_FEATURES.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm text-gray-400">
                      <span>✕</span>
                      <span>{tDashboard(`upgradePrompt.planComparison.free.features.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-4 border-emerald-500 rounded-2xl p-6 relative bg-gradient-to-br from-emerald-50 to-teal-50">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  {tDashboard('upgradePrompt.planComparison.pro.popular')}
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tDashboard('upgradePrompt.planComparison.pro.title')}</h3>
                  <div className="text-3xl font-bold text-emerald-600">{tDashboard('upgradePrompt.planComparison.pro.price')}</div>
                  <div className="text-sm text-gray-500">{tDashboard('upgradePrompt.planComparison.pro.period')}</div>
                </div>
                <ul className="space-y-3">
                  {PRO_PLAN_FEATURE_KEYS.map((key) => (
                    <li key={key} className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-emerald-600">✔</span>
                      <span>{tDashboard(`upgradePrompt.planComparison.pro.features.${key}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => { alert(tDashboard('upgradePrompt.paymentNotice')) }}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl text-lg"
              >
                {tDashboard('upgradePrompt.startButton')}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                {tDashboard('upgradePrompt.paymentNotice')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
        {/* プラン表示バナー */}
        {subscription && (
          <>
            {isFree && (
              <div className="mb-6 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/70">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 text-2xl">
                      🌱
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{tDashboard('planBanner.free.title')}</div>
                      <div className="text-sm opacity-90 space-y-0.5">
                        <p>{tDashboard('planBanner.free.posts', { count: monthlyPostCount })}</p>
                        <p>{tDashboard('planBanner.free.remaining', { count: remainingPosts })}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/subscription')}
                    className="px-4 py-2 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    {tDashboard('planBanner.free.upgradeButton')}
                  </button>
                </div>
              </div>
            )}

            {isPro && (
              <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💎</span>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {tDashboard('planBanner.pro.title')}
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{tDashboard('planBanner.pro.badge')}</span>
                      </div>
                      <div className="text-sm opacity-90">
                        {tDashboard('planBanner.pro.description')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75">{tDashboard('planBanner.pro.postsLabel')}</div>
                    <div className="text-2xl font-bold">{monthlyPostCount}</div>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {tDashboard('planBanner.admin.title')}
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded">{tDashboard('planBanner.admin.badge')}</span>
                      </div>
                      <div className="text-sm opacity-90">
                        {tDashboard('planBanner.admin.description')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-75">{tDashboard('planBanner.admin.postsLabel')}</div>
                    <div className="text-2xl font-bold">{monthlyPostCount}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick emotion log */}
        <div className="mb-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/70">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{tDashboard('quickLog.title')}</h3>
                <p className="text-xs text-gray-500">{tDashboard('quickLog.subtitle')}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {[
                { emotion: 'joy', emoji: '😊' },
                { emotion: 'love', emoji: '❤️' },
                { emotion: 'surprise', emoji: '😲' },
                { emotion: 'neutral', emoji: '😐' },
                { emotion: 'sadness', emoji: '😢' },
                { emotion: 'anger', emoji: '😡' },
                { emotion: 'fear', emoji: '😰' },
              ].map(({ emotion, emoji }) => {
                const label = tEmotions(emotion)

                return (
                <button
                  key={emotion}
                  onClick={async () => {
                    if (!user) return

                    try {
                      setLoading(true)

                      const { error } = await supabase
                        .from('posts')
                        .insert({
                          user_id: user.id,
                          content: tDashboard('quickLog.defaultContent', { label }),
                          emotion_tag: emotion,
                        })
                        .select()
                        .single()

                      if (error) throw error

                      trackPostCreated('quick', false, false)

                      setMessage(tDashboard('quickLog.success', { emoji, label }))
                      setMessageStatus('success')

                      loadRecentPosts(user.id)
                      loadStats(user.id)
                      loadInsight()

                      setTimeout(() => {
                        setMessage('')
                        setMessageStatus(null)
                      }, 3000)

                    } catch (error) {
                      const fallbackMessage = error instanceof Error ? error.message : 'Unknown error'
                      setMessage(tDashboard('quickLog.error', { message: fallbackMessage }))
                      setMessageStatus('error')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  disabled={loading}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${
                    loading
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                      : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <span className="text-2xl mb-1">{emoji}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-700">{label}</span>
                </button>
              )})}
            </div>
          </div>
        </div>

        <div className="md:hidden mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="text-xs text-gray-500 mb-1">{tDashboard('stats.total')}</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="text-xs text-gray-500 mb-1">{tDashboard('stats.thisWeek')}</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.thisWeek}</div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/50">
              <div className="text-xs text-gray-500 mb-1">{tDashboard('stats.thisMonth')}</div>
              <div className="text-2xl font-bold text-teal-600">{stats.thisMonth}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* 左側: 投稿エリアと最近の投稿 */}
          <div className="lg:col-span-8 space-y-6">
            {/* 投稿フォーム */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{tDashboard('postForm.title')}</h2>
                  <p className="text-sm text-gray-500">{tDashboard('postForm.subtitle')}</p>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={tDashboard('postForm.placeholder')}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all resize-none text-base min-h-[140px] placeholder:text-gray-400"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-500">
                  {tDashboard('postForm.characterCount', { count: content.length })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                {/* 画像・音声添付はProユーザーのみ */}
                {canAccessProFeatures && (
                  <>
                    <label
                      htmlFor="image-input"
                      className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all font-medium active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {tDashboard('postForm.imageButton')}
                    </label>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAudioRecorder(true)}
                      className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      {tDashboard('postForm.audioButton')}
                    </button>
                  </>
                )}
                <button
                  onClick={handlePost}
                  disabled={loading || !content.trim()}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 disabled:from-gray-300 disabled:via-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl hover:shadow-2xl disabled:cursor-not-allowed text-base active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {tDashboard('postForm.posting')}
                </span>
              ) : (
                tDashboard('postForm.submitButton')
              )}
                </button>
              </div>

              {(image || audio) && (
                <div className="mt-4 space-y-3">
                  {image && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-emerald-800 font-medium">{tDashboard('postForm.imageAttached', { fileName: image.name })}</p>
                        <button
                          onClick={() => setImage(null)}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                  {audio && (
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                          <p className="text-sm text-purple-800 font-medium">{tDashboard('postForm.audioAttached')}</p>
                        </div>
                        <button
                          onClick={() => setAudio(null)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {message && (
                <div
                  className={`mt-4 p-4 rounded-2xl text-sm font-medium ${
                    messageStatus === 'error'
                      ? 'bg-red-50 text-red-800 border-2 border-red-200'
                      : 'bg-green-50 text-green-800 border-2 border-green-200'
                  }`}
                >
                  {message}
                </div>
              )}
            </div>

            {/* 最近の投稿 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl blur opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-teal-500 to-cyan-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{tDashboard('recentPosts.title')}</h2>
                    <p className="text-sm text-gray-500">{tDashboard('recentPosts.subtitle')}</p>
                  </div>
                </div>
                {recentPosts.length > 0 && (
                  <button
                    onClick={() => router.push('/posts')}
                    className="hidden sm:flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline transition-all"
                  >
                    {tDashboard('recentPosts.viewAll')}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              {loadingPosts ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-24 bg-gray-100 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : recentPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl mb-4">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-700 mb-2">{tDashboard('recentPosts.noPostsTitle')}</p>
                  <p className="text-sm text-gray-500">{tDashboard('recentPosts.noPostsDescription')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post, index) => {
                    // 感情タグに基づいた背景グラデーション
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

                    return (
                      <article
                        key={post.id}
                        className={`group p-5 bg-gradient-to-br ${getCardGradient(post.emotion_tag)} border-2 border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-xl transition-all cursor-pointer active:scale-[0.98]`}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex gap-4">
                          {post.image_url && (
                            <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden ring-2 ring-white shadow-md relative">
                              <Image
                                src={post.image_url}
                                alt=""
                                fill
                                sizes="96px"
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {(post.emotion_tags && post.emotion_tags.length > 0 ? post.emotion_tags : [post.emotion_tag]).filter(Boolean).map((tag, index) => (
                                <span
                                  key={index}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-xl bg-white/90 backdrop-blur-sm border-2 ${getEmotionColor(tag!)} shadow-lg`}
                                  style={{ borderColor: getEmotionBorderColor(tag!) }}
                                >
                                  #{getEmotionLabel(tag!)}
                                </span>
                              ))}
                            </div>
                            <p className="text-base text-gray-800 line-clamp-3 mb-3 leading-relaxed">
                              {renderContentWithLinks(post.content)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(post.created_at)}
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                  <button
                    onClick={() => router.push('/posts')}
                    className="w-full sm:hidden mt-4 py-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium border-2 border-emerald-200 rounded-2xl hover:bg-emerald-50 transition-all active:scale-95"
                  >
                    {tDashboard('recentPosts.viewAll')} →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 右側: サイドバー */}
          <div className="lg:col-span-4 space-y-6">
            {/* AIインサイト（全ユーザー利用可、無料版は軽量版） */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{tDashboard('aiInsight.title')}</h3>
                  <p className="text-xs text-gray-500">
                    {tDashboard('aiInsight.subtitle')}
                    {isFree && <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">週1回更新</span>}
                  </p>
                </div>
              </div>

              {/* Free版のアップグレード促進バナー */}
              {isFree && (
                <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs text-gray-700">
                    <span className="font-bold">Pro版</span>で毎日更新＋6ヶ月履歴にアップグレード →{' '}
                    <button
                      onClick={() => router.push('/dashboard/subscription')}
                      className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                    >
                      詳細を見る
                    </button>
                  </p>
                </div>
              )}

              {loadingInsight ? (
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-600"></div>
                  </div>
                </div>
              ) : insight ? (
                <div className={`p-4 rounded-2xl ${
                  insight.trend === 'positive'
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100'
                    : insight.trend === 'negative'
                    ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl flex-shrink-0 mt-1">{insight.emoji}</div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-gray-800 font-medium">
                        {insight.insight}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xs text-gray-500">{tDashboard('aiInsight.byClaudeAI')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {tDashboard('aiInsight.noInsight')}
                </div>
              )}
            </div>

            {/* 週次レポート共有カード */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">週次レポート</h3>
                  <p className="text-xs text-gray-500">SNSで共有してフィードバックをもらおう</p>
                </div>
              </div>

              <button
                onClick={async () => {
                  let shareWindow: Window | null = null
                  try {
                    shareWindow = window.open('', '_blank')
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) {
                      shareWindow?.close()
                      return
                    }

                    const response = await fetch('/api/weekly-report', {
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`
                      }
                    })
                    const reportData = await response.json()

                    if (reportData.totalPosts === 0) {
                      setMessage(
                        locale === 'ja'
                          ? 'まだ今週のデータがありません'
                          : 'No data available for this week'
                      )
                      setMessageStatus('error')
                      setTimeout(() => {
                        setMessage('')
                        setMessageStatus(null)
                      }, 3000)
                      return
                    }

                    // 共有ページのパラメータ
                    const shareParams = new URLSearchParams({
                      totalPosts: reportData.totalPosts.toString(),
                      topEmotion1: reportData.topEmotions[0]?.emotion || '',
                      topEmotion1Count: reportData.topEmotions[0]?.count.toString() || '0',
                      topEmotion2: reportData.topEmotions[1]?.emotion || '',
                      topEmotion2Count: reportData.topEmotions[1]?.count.toString() || '0',
                      topEmotion3: reportData.topEmotions[2]?.emotion || '',
                      topEmotion3Count: reportData.topEmotions[2]?.count.toString() || '0',
                      trend: reportData.insight?.trend || 'neutral',
                    })

                    // 一意のレポートIDを生成（タイムスタンプベース）
                    const reportId = Date.now().toString()
                    const shareUrl = `${window.location.origin}/${locale}/share/${reportId}?${shareParams}`

                      const twitterText = locale === 'ja'
                        ? `今週の感情レポート📊\n${reportData.totalPosts}件記録しました\n\n#Emotype`
                        : `Weekly emotion report 📊\n${reportData.totalPosts} posts this week\n\n#Emotype`

                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`

                      // トラッキング：週次レポート共有
                      trackWeeklyReportShared('twitter')

                    if (shareWindow) {
                      shareWindow.location.href = twitterUrl
                    } else {
                      window.open(twitterUrl, '_blank')
                    }
                  } catch (error) {
                    shareWindow?.close()
                    console.error('Share error:', error)
                    setMessage(
                      locale === 'ja'
                        ? '共有に失敗しました'
                        : 'Failed to share'
                    )
                    setMessageStatus('error')
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                Xで共有する
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                あなたの感情パターンを友達と共有しよう
              </p>
            </div>

            {/* 統計カード（デスクトップ） */}
            <div className="hidden md:block">
              <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">📊 {tDashboard('stats.title')}</h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium opacity-90">{tDashboard('stats.total')}</span>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{stats.total}</div>
                </div>

                <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium opacity-90">{tDashboard('stats.thisWeek')}</span>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{stats.thisWeek}</div>
                </div>

                <div className="bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500 rounded-3xl p-6 text-white shadow-2xl hover:shadow-3xl transition-all transform hover:scale-[1.02] cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium opacity-90">{tDashboard('stats.thisMonth')}</span>
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-4xl font-bold">{stats.thisMonth}</div>
                </div>
              </div>
            </div>

            {/* 感情グラフ（全ユーザー利用可、無料版は30日間のみ） */}
            <>
              <div className="hidden md:block relative">
                <EmotionGraph />
                {isFree && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                    直近30日間
                  </div>
                )}
              </div>

              {/* モバイル: 感情グラフ */}
              <div className="md:hidden relative">
                <EmotionGraph />
                {isFree && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm">
                    直近30日間
                  </div>
                )}
              </div>
            </>

            {/* クイックアクション（Proのみ） */}
            {canAccessProFeatures && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50">
              <h4 className="text-lg font-bold text-gray-900 mb-4">{tDashboard('quickActions.title')}</h4>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/search')}
                  className="w-full flex items-center gap-4 p-4 text-left bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl transition-all group border-2 border-transparent hover:border-emerald-200 active:scale-95"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900">{tDashboard('quickActions.searchEmotions')}</div>
                    <div className="text-xs text-gray-600">{tDashboard('quickActions.searchEmotionsDescription')}</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* X連携 - 一時的に無効化（API費用のため） */}
                {/* <button
                  onClick={() => router.push('/dashboard/x-integration')}
                  className="w-full flex items-center gap-4 p-4 text-left bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 rounded-2xl transition-all group border-2 border-transparent hover:border-cyan-200 active:scale-95"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🐦</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">{tDashboard('quickActions.xIntegration')}</div>
                      <div className="text-xs text-gray-600">{tDashboard('quickActions.xIntegrationDescription')}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button> */}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {showAudioRecorder && (
        <AudioRecorder
          onRecordingComplete={(audioBlob) => {
            setAudio(audioBlob)
            setShowAudioRecorder(false)
          }}
          onCancel={() => setShowAudioRecorder(false)}
        />
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardPageContent />
    </Suspense>
  )
}
