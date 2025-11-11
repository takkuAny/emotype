'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { supabase } from '@/lib/supabase'
import { useRouter } from '@/i18n/routing'
import { trackSubscriptionEvent } from '@/lib/analytics'

type BillingCycle = 'monthly' | 'yearly'

function SubscriptionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { subscription, loading, isPro, isFree, isAdmin, refetch } = useSubscription()
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly')
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false)
  const [hasCheckedStripeSession, setHasCheckedStripeSession] = useState(false)

  // 料金計算（USD）
  const pricing = {
    monthly: 4.99,
    yearly: 39.99, // Save 33% ($59.88 → $39.99)
  }

  const getPrice = (cycle: BillingCycle) => pricing[cycle]
  const getSavings = (cycle: BillingCycle) => cycle === 'yearly' ? 19.89 : 0
  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId || hasCheckedStripeSession) {
      return
    }

    setHasCheckedStripeSession(true)

    const confirmSession = async () => {
      setIsConfirmingCheckout(true)
      setMessage({ type: 'success', text: '決済完了を確認しています...' })

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('No session found')
        }

        const response = await fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ sessionId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '決済の確認に失敗しました')
        }

        setMessage({ type: 'success', text: data.message || '決済が完了しました。' })
        await refetch()
        router.replace('/dashboard/subscription')
      } catch (error) {
        const message = error instanceof Error ? error.message : '決済の確認に失敗しました'
        setMessage({ type: 'error', text: message })
        setHasCheckedStripeSession(false)
      } finally {
        setIsConfirmingCheckout(false)
      }
    }

    confirmSession()
  }, [searchParams, hasCheckedStripeSession, refetch, router])

  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      setMessage({ type: 'error', text: '決済がキャンセルされました。' })
      router.replace('/dashboard/subscription')
    }
  }, [searchParams, router])

  const handleUpgrade = async () => {
    setIsProcessing(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          billingCycle: selectedBillingCycle
        })
      })

      const data = await response.json()

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Stripe決済セッションの作成に失敗しました')
      }

      setIsUpgradeModalOpen(false)
      setMessage({ type: 'success', text: 'Stripe決済ページへ移動します...' })
      window.location.href = data.url
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stripe決済の開始に失敗しました'
      setMessage({ type: 'error', text: message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDowngrade = async () => {
    setIsProcessing(true)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ plan: 'free' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to downgrade')
      }

      setMessage({ type: 'success', text: data.message || '無料プランへの変更が完了しました。' })
      setIsDowngradeModalOpen(false)

      // Refresh subscription data
      await refetch()

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'ダウングレードに失敗しました'
      setMessage({ type: 'error', text: message })
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
          <div className="text-gray-600 font-medium">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pb-20">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-6 shadow-2xl">
            <span className="text-4xl">⭐</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            プラン管理
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            あなたの現在のプランと利用状況を確認できます
          </p>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`max-w-2xl mx-auto mb-6 p-4 rounded-2xl font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-2 border-green-200'
              : 'bg-red-50 text-red-800 border-2 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* 現在のプラン表示 */}
        {subscription && (
          <div className="mb-12">
            {/* 管理者プラン */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">👑</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium opacity-90">現在のプラン</div>
                      <h2 className="text-3xl font-bold">管理者アカウント</h2>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-lg rounded-xl font-bold">
                      ADMIN
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <div className="text-sm opacity-90 mb-1">今月の投稿数</div>
                    <div className="text-3xl font-bold">{subscription.limits.monthlyPostCount}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <div className="text-sm opacity-90 mb-1">利用可能な機能</div>
                    <div className="text-3xl font-bold">すべて</div>
                  </div>
                </div>

                <div className="text-sm opacity-90">
                  すべての機能とユーザー管理機能が利用可能です
                </div>
              </div>
            )}

            {/* Proプラン */}
            {isPro && !isAdmin && (
              <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">⭐</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium opacity-90">現在のプラン</div>
                      <h2 className="text-3xl font-bold">Proプラン</h2>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-lg rounded-xl font-bold">
                      PRO
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <div className="text-sm opacity-90 mb-1">今月の投稿数</div>
                    <div className="text-3xl font-bold">{subscription.limits.monthlyPostCount}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <div className="text-sm opacity-90 mb-1">月額料金</div>
                    <div className="text-3xl font-bold">${pricing.monthly}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm opacity-90">
                    すべてのPro機能が利用可能です
                  </div>
                  <button
                    onClick={() => setIsDowngradeModalOpen(true)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-lg rounded-xl font-medium hover:bg-white/30 transition-all whitespace-nowrap"
                  >
                    無料プランに変更
                  </button>
                </div>
              </div>
            )}

            {/* Freeプラン */}
            {isFree && (
              <div className="bg-gradient-to-br from-gray-600 via-gray-500 to-gray-700 rounded-3xl p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🆓</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium opacity-90">現在のプラン</div>
                      <h2 className="text-3xl font-bold">無料プラン</h2>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="px-4 py-2 bg-white/20 backdrop-blur-lg rounded-xl font-bold">
                      FREE
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <div className="text-sm opacity-90 mb-1">今月の投稿数</div>
                    <div className="text-3xl font-bold">
                      {subscription.limits.monthlyPostCount} / 100
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
                    <div className="text-sm opacity-90 mb-1">残り投稿可能数</div>
                    <div className="text-3xl font-bold">{subscription.limits.remainingPosts}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="text-sm opacity-90">
                    Pro（$4.99/月）で無制限投稿とすべての機能を開放。初回は7日間の無料トライアル付きです。
                  </div>
                  <button
                    onClick={() => {
                      trackSubscriptionEvent('upgrade_modal_opened')
                      setIsUpgradeModalOpen(true)
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    7日間無料トライアルを開始
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* プラン比較 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">プラン比較</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Freeプラン */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border-2 border-gray-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🆓</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <div className="text-sm text-gray-500">永久無料</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-700">基本的な感情投稿</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-700">月100件まで投稿可能</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-700">感情グラフ（30日間）</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-700">軽量AIインサイト（週1回）</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-700">週次レポート共有カード</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="text-xl">×</span>
                  <span>画像・音声添付</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="text-xl">×</span>
                  <span>X連携</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="text-xl">×</span>
                  <span>デトックス提案</span>
                </li>
              </ul>

              {isFree && (
                <div className="px-4 py-3 bg-gray-100 rounded-2xl text-center font-bold text-gray-700">
                  現在のプラン
                </div>
              )}
            </div>

            {/* Proプラン */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl shadow-2xl p-8 border-4 border-emerald-500 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                おすすめ
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⭐</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">${pricing.monthly}</div>
                <div className="text-sm text-gray-600">月額 / 年額 $39.99（33% OFF）</div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">無制限投稿</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">感情トレンドグラフ</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">AIインサイト（日次・週次）</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">画像・音声添付</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">X連携</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">カレンダー機能</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">感情コード機能</span>
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <span className="text-emerald-600 text-xl">✓</span>
                  <span className="text-gray-900">優先サポート</span>
                </li>
              </ul>

              <p className="text-sm font-semibold text-emerald-600 mb-6">
                初回7日間の無料トライアル付き。いつでもキャンセルできます。
              </p>

              {isFree ? (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                >
                  7日間無料トライアルを始める
                </button>
              ) : (isPro || isAdmin) ? (
                <div className="px-4 py-3 bg-emerald-100 rounded-2xl text-center font-bold text-emerald-700">
                  現在のプラン
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* よくある質問 */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">よくある質問</h2>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">支払い方法は何がありますか？</h3>
              <p className="text-gray-600">Stripeを通じてクレジットカード決済に対応しています。安全で確実な決済が可能です。</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">いつでもプランを変更できますか？</h3>
              <p className="text-gray-600">はい、いつでもアップグレード・ダウングレードが可能です。アップグレードは即座に反映されます。ダウングレードの場合、現在の契約期間終了までProプランが継続され、その後無料プランに切り替わります。</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">無料プランから有料プランに変更すると過去のデータはどうなりますか？</h3>
              <p className="text-gray-600">過去のデータはすべて保持され、Proプランの機能で活用できるようになります。</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">返金はできますか？</h3>
              <p className="text-gray-600">月額課金は返金対象外ですが、プランをいつでもキャンセルできます。キャンセル後は次回更新時から課金が停止されます。</p>
            </div>
          </div>
        </div>
      </div>

      {/* アップグレードモーダル */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-300 my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl sm:text-4xl">⭐</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                7日間無料トライアルを開始
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                すべての機能を開放して、感情記録を最大限に活用しましょう
              </p>
            </div>

            {/* 課金サイクル選択 */}
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
              <button
                onClick={() => setSelectedBillingCycle('monthly')}
                className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                  selectedBillingCycle === 'monthly'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className={`text-xl sm:text-2xl font-bold mb-1 ${
                    selectedBillingCycle === 'monthly' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    ${pricing.monthly}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">月額</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedBillingCycle('yearly')}
                className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all relative ${
                  selectedBillingCycle === 'yearly'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                  Save 33%
                </div>
                <div className="text-center">
                  <div className={`text-xl sm:text-2xl font-bold mb-1 ${
                    selectedBillingCycle === 'yearly' ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    ${pricing.yearly}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">年額（月$3.33相当）</div>
                </div>
              </button>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="text-center mb-3 sm:mb-4">
                <div className="text-2xl sm:text-4xl font-bold text-emerald-600 mb-1 sm:mb-2">
                  ${getPrice(selectedBillingCycle)}
                  {selectedBillingCycle === 'monthly' ? ' / 月' : ' / 年'}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {selectedBillingCycle === 'monthly' ? '月額課金' : '年額課金'}
                  {selectedBillingCycle === 'yearly' && (
                    <span className="block sm:inline sm:ml-2 text-orange-600 font-bold mt-1 sm:mt-0">
                      月額より${getSavings(selectedBillingCycle).toFixed(2)}お得！（33% OFF）
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>無制限投稿</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>感情トレンドグラフ</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>AIインサイト</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>すべてのPro機能</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <button
                onClick={handleUpgrade}
                disabled={isProcessing || isConfirmingCheckout}
                className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    処理中...
                  </span>
                ) : (
                  '7日間無料トライアルを始める'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ダウングレードモーダル */}
      {isDowngradeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-300 my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDowngradeModalOpen(false)}
              disabled={isProcessing || isConfirmingCheckout}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl sm:text-4xl">🆓</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                無料プランに変更
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                本当に無料プランに変更しますか？
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">変更後の制限事項：</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">×</span>
                  <span>月100件までの投稿制限</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">×</span>
                  <span>感情トレンドグラフが利用不可</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">×</span>
                  <span>AIインサイトが利用不可</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">×</span>
                  <span>画像・音声添付が利用不可</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">×</span>
                  <span>X連携が利用不可</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">×</span>
                  <span>カレンダー機能が利用不可</span>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>ご安心ください：</strong>過去のデータはすべて保持されます。いつでもProプランに再アップグレードできます。
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsDowngradeModalOpen(false)}
                disabled={isProcessing || isConfirmingCheckout}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isProcessing || isConfirmingCheckout}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    処理中...
                  </span>
                ) : (
                  '無料プランに変更する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SubscriptionPageContent />
    </Suspense>
  )
}
