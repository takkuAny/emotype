import { supabase } from './supabase'

// セッションIDを生成・保持
let sessionId: string | null = null

const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''

  if (!sessionId) {
    // セッションストレージから取得、なければ生成
    const stored = sessionStorage.getItem('emotype_session_id')
    if (stored) {
      sessionId = stored
    } else {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('emotype_session_id', sessionId)
    }
  }

  return sessionId
}

export type EventType =
  // ユーザー登録・認証
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  // 投稿関連
  | 'post_created'
  | 'post_created_quick'
  | 'post_created_full'
  | 'post_with_image'
  | 'post_with_audio'
  | 'post_deleted'
  // 閲覧・エンゲージメント
  | 'dashboard_viewed'
  | 'posts_list_viewed'
  | 'post_detail_viewed'
  | 'emotion_graph_viewed'
  // SNS連携
  | 'twitter_connected'
  | 'twitter_disconnected'
  | 'twitter_sync_started'
  | 'twitter_sync_completed'
  // 共有・バイラル
  | 'weekly_report_shared'
  | 'weekly_report_viewed'
  // サブスクリプション
  | 'upgrade_modal_opened'
  | 'upgrade_started'
  | 'upgrade_completed'
  | 'downgrade_started'
  | 'downgrade_completed'
  | 'trial_started'
  // 検索・発見
  | 'search_performed'
  | 'calendar_viewed'
  // その他
  | 'feature_used'
  | 'error_occurred'

export interface TrackEventOptions {
  event_type: EventType
  event_name?: string
  properties?: Record<string, unknown>
}

/**
 * イベントをトラッキング
 * @param options - イベントオプション
 */
export const trackEvent = async (options: TrackEventOptions): Promise<void> => {
  try {
    const { event_type, event_name, properties = {} } = options

    // ページURLを追加
    const enrichedProperties = {
      ...properties,
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      timestamp: new Date().toISOString(),
    }

    // セッション取得（認証トークン用）
    const { data: { session } } = await supabase.auth.getSession()

    // トラッキングAPIを呼び出し
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`
        }),
      },
      body: JSON.stringify({
        event_type,
        event_name,
        properties: enrichedProperties,
        session_id: getSessionId(),
      }),
    })

    // トラッキング失敗してもエラーをスローしない（UXに影響させない）
  } catch (error) {
    // サイレントに失敗（コンソールログのみ）
    console.debug('Analytics tracking failed:', error)
  }
}

/**
 * ページビューをトラッキング
 * @param pageName - ページ名
 */
export const trackPageView = (pageName: string): void => {
  trackEvent({
    event_type: 'dashboard_viewed',
    event_name: pageName,
    properties: {
      page_name: pageName,
    },
  })
}

/**
 * 投稿作成をトラッキング
 * @param method - 作成方法（quick/full）
 * @param hasImage - 画像添付有無
 * @param hasAudio - 音声添付有無
 */
export const trackPostCreated = (
  method: 'quick' | 'full',
  hasImage: boolean = false,
  hasAudio: boolean = false
): void => {
  const event_type = method === 'quick' ? 'post_created_quick' : 'post_created_full'

  trackEvent({
    event_type,
    properties: {
      method,
      has_image: hasImage,
      has_audio: hasAudio,
    },
  })

  // 追加イベント
  if (hasImage) {
    trackEvent({ event_type: 'post_with_image' })
  }
  if (hasAudio) {
    trackEvent({ event_type: 'post_with_audio' })
  }
}

/**
 * サブスクリプション関連イベントをトラッキング
 */
export const trackSubscriptionEvent = (
  event_type: 'upgrade_modal_opened' | 'upgrade_started' | 'upgrade_completed' | 'trial_started',
  properties?: Record<string, unknown>
): void => {
  trackEvent({
    event_type,
    properties,
  })
}

/**
 * 週次レポート共有をトラッキング
 */
export const trackWeeklyReportShared = (platform: string = 'twitter'): void => {
  trackEvent({
    event_type: 'weekly_report_shared',
    properties: {
      platform,
    },
  })
}

/**
 * エラーをトラッキング
 */
export const trackError = (error: Error | string, context?: string): void => {
  const errorMessage = typeof error === 'string' ? error : error.message

  trackEvent({
    event_type: 'error_occurred',
    properties: {
      error_message: errorMessage,
      context,
      stack: typeof error === 'object' ? error.stack : undefined,
    },
  })
}
