'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Twitter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface SyncStatus {
  isConnected: boolean
  lastSync?: string
  username?: string
  followersCount?: number
  postsCount?: number
}

interface DoomscrollingMetrics {
  score: number
  riskLevel: 'low' | 'moderate' | 'high' | 'severe'
  message: string
  metrics: {
    negativeRatio: number
    lateNightRatio: number
    avgPostsPerDay: number
    twitterRatio: number
    totalPosts: number
    twitterPosts: number
  }
  breakdown: {
    negativeImpact: number
    lateNightImpact: number
    frequencyImpact: number
    twitterDependency: number
  }
}

interface RateLimitInfo {
  retryAt?: string | null
  retryAfterMinutes?: number | null
}

export default function TwitterIntegration() {
  const [isLoading, setIsLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isConnected: false })
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null)
  const [doomscrolling, setDoomscrolling] = useState<DoomscrollingMetrics | null>(null)
  const [loadingDoomscrolling, setLoadingDoomscrolling] = useState(false)
  const t = useTranslations('dashboard.twitterIntegration')
  const locale = useLocale()

  const getSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/twitter/status', { credentials: 'include' })
      if (response.status === 401) {
        setSyncStatus({ isConnected: false })
        setError(null)
        return
      }
      if (!response.ok) {
        throw new Error(t('errors.status', { status: response.status }))
      }
      const data = await response.json()
      setSyncStatus(data)
      setError(null)
      setRateLimitInfo(null)
    } catch (err) {
      console.error('Status check error:', err)
      setSyncStatus({ isConnected: false })
      setError(err instanceof Error ? err.message : t('errors.generic'))
    }
  }, [t])

  const getDoomscrollingMetrics = useCallback(async () => {
    setLoadingDoomscrolling(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/analytics/doomscrolling', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDoomscrolling(data)
      }
    } catch (err) {
      console.error('Doomscrolling metrics error:', err)
    } finally {
      setLoadingDoomscrolling(false)
    }
  }, [])

  useEffect(() => {
    getSyncStatus()
    getDoomscrollingMetrics()
  }, [getSyncStatus, getDoomscrollingMetrics])

  const formatRateLimitMessage = useCallback(
    (info?: RateLimitInfo | null) => {
      if (info?.retryAt) {
        const formatted = new Date(info.retryAt).toLocaleString(locale, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        return t('errors.rateLimitTime', { time: formatted })
      }

      if (info?.retryAfterMinutes) {
        return t('errors.rateLimitMinutes', { minutes: info.retryAfterMinutes })
      }

      return t('errors.rateLimit')
    },
    [locale, t]
  )

  const handleConnect = (switchAccount = false) => {
    setError(null)
    setRateLimitInfo(null)
    setIsLoading(true)
    const url = switchAccount ? '/api/twitter/auth?switch_account=true' : '/api/twitter/auth'
    window.location.href = url
  }

  const handleDisconnect = async () => {
    if (!confirm(t('dialogs.disconnectConfirm'))) {
      return
    }
    setIsLoading(true)
    setError(null)
    setRateLimitInfo(null)
    try {
      const response = await fetch('/api/twitter/disconnect', {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(t('errors.disconnect'))
      }
      setSyncStatus({ isConnected: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsLoading(true)
    setError(null)
    setRateLimitInfo(null)
    try {
      const response = await fetch('/api/twitter/sync', {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        let payload: RateLimitInfo & { error?: string } | null = null
        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        if (response.status === 429) {
          setRateLimitInfo(payload)
          throw new Error(formatRateLimitMessage(payload))
        }

        throw new Error(payload?.error ?? t('errors.sync'))
      }
      await getSyncStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const benefits: Array<'followers' | 'performance' | 'engagement'> = ['followers', 'performance', 'engagement']
  const notes: Array<'autoSync' | 'rateLimit' | 'disconnect'> = ['autoSync', 'rateLimit', 'disconnect']

  const nextRetryLabel = useMemo(() => {
    if (rateLimitInfo?.retryAt) {
      const formatted = new Date(rateLimitInfo.retryAt).toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      return t('errors.nextRetryTime', { time: formatted })
    }
    if (rateLimitInfo?.retryAfterMinutes) {
      return t('errors.nextRetryMinutes', { minutes: rateLimitInfo.retryAfterMinutes })
    }
    return null
  }, [locale, rateLimitInfo, t])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Badge variant={syncStatus.isConnected ? 'default' : 'secondary'}>
            {syncStatus.isConnected ? t('statusBadge.connected') : t('statusBadge.disconnected')}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="h-5 w-5" />
              <div>
                <span>{error}</span>
                {nextRetryLabel && (
                  <p className="mt-1 text-xs text-red-700">{nextRetryLabel}</p>
                )}
              </div>
            </div>
          )}

          {!syncStatus.isConnected && (
            <div className="space-y-4">
              <div className="grid gap-4 rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <h3 className="font-semibold text-emerald-900">{t('unconnected.title')}</h3>
                  <p className="text-sm text-emerald-800">{t('unconnected.subtitle')}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                    {t('benefitsTitle')}
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-emerald-900">
                    {benefits.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-600">?</span>
                        <span>{t(`benefits.${item}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button onClick={() => handleConnect()} disabled={isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('actions.connecting')}
                  </>
                ) : (
                  <>
                    <Twitter className="mr-2 h-4 w-4" />
                    {t('actions.connect')}
                  </>
                )}
              </Button>
            </div>
          )}

          {syncStatus.isConnected && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-900">{t('connectedCard.title')}</h3>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-3 text-sm">
                  {syncStatus.username && (
                    <div className="flex justify-between">
                      <span className="text-green-700">{t('connectedCard.username')}</span>
                      <span className="font-medium text-green-900">@{syncStatus.username}</span>
                    </div>
                  )}
                  {typeof syncStatus.followersCount === 'number' && (
                    <div className="flex justify-between">
                      <span className="text-green-700">{t('connectedCard.followers')}</span>
                      <span className="font-medium text-green-900">{syncStatus.followersCount.toLocaleString(locale)}</span>
                    </div>
                  )}
                  {typeof syncStatus.postsCount === 'number' && (
                    <div className="flex justify-between">
                      <span className="text-green-700">{t('connectedCard.posts')}</span>
                      <span className="font-medium text-green-900">{syncStatus.postsCount.toLocaleString(locale)}</span>
                    </div>
                  )}
                  {syncStatus.lastSync && (
                    <div className="flex justify-between pt-2 border-t border-green-200">
                      <span className="text-green-700">{t('connectedCard.lastSync')}</span>
                      <span className="font-medium text-green-900">
                        {new Date(syncStatus.lastSync).toLocaleString(locale)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSync} disabled={isLoading} variant="outline" className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('actions.syncing')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t('actions.manualSync')}
                    </>
                  )}
                </Button>
                <Button onClick={handleDisconnect} disabled={isLoading} variant="destructive" className="flex-1">
                  {t('actions.disconnect')}
                </Button>
              </div>
              <Button onClick={() => handleConnect(true)} disabled={isLoading} variant="secondary" className="w-full">
                {t('actions.connectAnother')}
              </Button>
            </div>
          )}

          {/* ドゥームスクロール計（接続後のみ表示） */}
          {syncStatus.isConnected && doomscrolling && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-900">📊 ドゥームスクロール計</h3>
                <Button
                  onClick={getDoomscrollingMetrics}
                  disabled={loadingDoomscrolling}
                  variant="ghost"
                  size="sm"
                >
                  {loadingDoomscrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* スコアメーター */}
              <div className="mb-6">
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <div className="text-4xl font-bold text-purple-900">{doomscrolling.score}</div>
                    <div className="text-xs text-purple-600">/ 100</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    doomscrolling.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                    doomscrolling.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    doomscrolling.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {doomscrolling.riskLevel.toUpperCase()}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      doomscrolling.riskLevel === 'low' ? 'bg-green-500' :
                      doomscrolling.riskLevel === 'moderate' ? 'bg-yellow-500' :
                      doomscrolling.riskLevel === 'high' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(doomscrolling.score, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-purple-700 mt-2">{doomscrolling.message}</p>
              </div>

              {/* メトリクス詳細 */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">😔 ネガティブ投稿比率</span>
                  <span className="font-bold text-purple-900">{doomscrolling.metrics.negativeRatio}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">🌙 深夜投稿率</span>
                  <span className="font-bold text-purple-900">{doomscrolling.metrics.lateNightRatio}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">📱 X依存度</span>
                  <span className="font-bold text-purple-900">{doomscrolling.metrics.twitterRatio}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-700">✍️ 平均投稿頻度</span>
                  <span className="font-bold text-purple-900">{doomscrolling.metrics.avgPostsPerDay} 件/日</span>
                </div>
              </div>

              {/* 内訳 */}
              <div className="mt-4 pt-4 border-t border-purple-200">
                <div className="text-xs text-purple-600 mb-2">スコア内訳</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/50 rounded px-2 py-1">
                    <div className="text-purple-600">ネガティブ影響</div>
                    <div className="font-bold text-purple-900">{doomscrolling.breakdown.negativeImpact} pt</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1">
                    <div className="text-purple-600">深夜影響</div>
                    <div className="font-bold text-purple-900">{doomscrolling.breakdown.lateNightImpact} pt</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1">
                    <div className="text-purple-600">頻度影響</div>
                    <div className="font-bold text-purple-900">{doomscrolling.breakdown.frequencyImpact} pt</div>
                  </div>
                  <div className="bg-white/50 rounded px-2 py-1">
                    <div className="text-purple-600">X依存度</div>
                    <div className="font-bold text-purple-900">{doomscrolling.breakdown.twitterDependency} pt</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
            <p className="font-medium mb-1">{t('notes.title')}</p>
            <ul className="space-y-1 ml-4 list-disc">
              {notes.map((item) => (
                <li key={item}>{t(`notes.${item}`)}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
