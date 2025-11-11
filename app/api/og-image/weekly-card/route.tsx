import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // パラメータ取得
    const totalPosts = searchParams.get('totalPosts') || '0'
    const topEmotion1 = searchParams.get('topEmotion1') || ''
    const topEmotion1Count = searchParams.get('topEmotion1Count') || '0'
    const topEmotion2 = searchParams.get('topEmotion2') || ''
    const topEmotion2Count = searchParams.get('topEmotion2Count') || '0'
    const topEmotion3 = searchParams.get('topEmotion3') || ''
    const topEmotion3Count = searchParams.get('topEmotion3Count') || '0'
    const trend = searchParams.get('trend') || 'neutral'
    const locale = searchParams.get('locale') || 'ja'

    // 感情ラベルのマッピング
    const emotionLabels: Record<string, { ja: string; en: string; emoji: string }> = {
      joy: { ja: '喜び', en: 'Joy', emoji: '😊' },
      happiness: { ja: '喜び', en: 'Happiness', emoji: '😊' },
      sadness: { ja: '悲しみ', en: 'Sadness', emoji: '😢' },
      anger: { ja: '怒り', en: 'Anger', emoji: '😡' },
      fear: { ja: '恐れ', en: 'Fear', emoji: '😨' },
      love: { ja: '愛', en: 'Love', emoji: '❤️' },
      surprise: { ja: '驚き', en: 'Surprise', emoji: '😲' },
      disappointment: { ja: '失望', en: 'Disappointment', emoji: '😞' },
      excitement: { ja: '興奮', en: 'Excitement', emoji: '🤩' },
      neutral: { ja: '中立', en: 'Neutral', emoji: '😐' },
    }

    const getEmotionLabel = (emotion: string) => {
      const data = emotionLabels[emotion.toLowerCase()] || emotionLabels.neutral
      return locale === 'ja' ? data.ja : data.en
    }

    const getEmotionEmoji = (emotion: string) => {
      return emotionLabels[emotion.toLowerCase()]?.emoji || '😐'
    }

    // トレンド背景色
    const trendColors: Record<string, string> = {
      positive: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      neutral: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      negative: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    }

    const bgGradient = trendColors[trend] || trendColors.neutral

    const title = locale === 'ja' ? '週次感情レポート' : 'Weekly Emotion Report'
    const postsLabel = locale === 'ja' ? '投稿数' : 'Posts'
    const topEmotionsLabel = locale === 'ja' ? 'トップ3感情' : 'Top 3 Emotions'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: bgGradient,
            fontFamily: 'system-ui, sans-serif',
            padding: '60px',
          }}
        >
          {/* メインコンテナ */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '32px',
              padding: '48px 60px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              width: '100%',
              maxWidth: '900px',
            }}
          >
            {/* タイトル */}
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '12px',
                display: 'flex',
              }}
            >
              {title}
            </div>

            {/* 投稿数 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  display: 'flex',
                }}
              >
                {totalPosts}
              </div>
              <div
                style={{
                  fontSize: '28px',
                  color: '#6b7280',
                  display: 'flex',
                }}
              >
                {postsLabel}
              </div>
            </div>

            {/* トップ3感情 */}
            <div
              style={{
                fontSize: '24px',
                color: '#6b7280',
                marginBottom: '24px',
                display: 'flex',
              }}
            >
              {topEmotionsLabel}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '32px',
                marginBottom: '40px',
              }}
            >
              {/* 1位 */}
              {topEmotion1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '56px', display: 'flex' }}>
                    {getEmotionEmoji(topEmotion1)}
                  </div>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: '600',
                      color: '#1f2937',
                      display: 'flex',
                    }}
                  >
                    {getEmotionLabel(topEmotion1)}
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      color: '#6b7280',
                      display: 'flex',
                    }}
                  >
                    {topEmotion1Count}件
                  </div>
                </div>
              )}

              {/* 2位 */}
              {topEmotion2 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '48px', display: 'flex' }}>
                    {getEmotionEmoji(topEmotion2)}
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1f2937',
                      display: 'flex',
                    }}
                  >
                    {getEmotionLabel(topEmotion2)}
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      color: '#6b7280',
                      display: 'flex',
                    }}
                  >
                    {topEmotion2Count}件
                  </div>
                </div>
              )}

              {/* 3位 */}
              {topEmotion3 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '40px', display: 'flex' }}>
                    {getEmotionEmoji(topEmotion3)}
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      display: 'flex',
                    }}
                  >
                    {getEmotionLabel(topEmotion3)}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      color: '#6b7280',
                      display: 'flex',
                    }}
                  >
                    {topEmotion3Count}件
                  </div>
                </div>
              )}
            </div>

            {/* ブランディング */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                  display: 'flex',
                }}
              >
                #emotype
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
