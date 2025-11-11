import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildFallbackReview,
  buildWeeklyStats,
  fetchWeeklyRecords,
  generateWeeklyReview,
  type RecordRow,
} from '@/lib/reports/weekly'

export const runtime = 'edge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic =
  process.env.ANTHROPIC_API_KEY &&
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

    const locale = new URL(request.url).searchParams.get('locale') === 'en' ? 'en' : 'ja'

    const { records, start, end } = await fetchWeeklyRecords(supabase, user.id)
    if (!records.length) {
      return renderEmptyCard(locale)
    }

    const stats = buildWeeklyStats(records)
    const review = anthropic
      ? await generateWeeklyReview({
          stats,
          records,
          plan: subscription?.plan === 'pro' ? 'pro' : 'free',
          anthropic,
        })
      : buildFallbackReview(stats)

    const highlights = getHighlights(review, locale)
    const emotionBalance = buildEmotionBalance(records)
    const weeklyScore = calcWeeklyScore(stats, review.doomscroll_index)

    return new ImageResponse(
      <Card
        locale={locale}
        stats={stats}
        range={{ start, end }}
        weeklyScore={weeklyScore}
        emotionBalance={emotionBalance}
        snsMinutes={stats.total_sns_minutes}
        highlights={highlights}
        summary={review.summary}
      />,
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('weekly-card error:', error)
    return NextResponse.json({ error: 'Failed to render card' }, { status: 500 })
  }
}

function renderEmptyCard(locale: 'ja' | 'en') {
  const message =
    locale === 'ja'
      ? '今週のログがまだありません。\nEmotypeで気分を記録してシェアカードを作りましょう。'
      : 'No records for this week.\nLog your mood to unlock a shareable card.'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 42,
          textAlign: 'center',
          padding: '0 120px',
          whiteSpace: 'pre-line',
        }}
      >
        {message}
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

function getHighlights(review: { summary: string; highlights: string[] }, locale: 'ja' | 'en') {
  const items = review.highlights && review.highlights.length > 0 ? [...review.highlights] : [review.summary]
  const filler = locale === 'ja' ? '継続ログで来週の分析精度が向上します。' : 'Keep logging to improve next week’s insights.'
  while (items.length < 3) {
    items.push(filler)
  }
  return items.slice(0, 3)
}

function buildEmotionBalance(records: RecordRow[]) {
  const categories = { positive: 0, neutral: 0, negative: 0 }
  records.forEach((record) => {
    if (record.mood_score >= 7) {
      categories.positive += 1
    } else if (record.mood_score <= 3) {
      categories.negative += 1
    } else {
      categories.neutral += 1
    }
  })
  const total = Math.max(records.length, 1)
  return {
    positive: Math.round((categories.positive / total) * 100),
    neutral: Math.round((categories.neutral / total) * 100),
    negative: Math.round((categories.negative / total) * 100),
  }
}

function calcWeeklyScore(stats: ReturnType<typeof buildWeeklyStats>, doomscrollIndex: number) {
  const moodComponent = (stats.avg_mood / 10) * 70
  const balanceComponent = ((100 - doomscrollIndex) / 100) * 30
  const raw = moodComponent + balanceComponent
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function Card(props: {
  locale: 'ja' | 'en'
  stats: ReturnType<typeof buildWeeklyStats>
  range: { start: string; end: string }
  weeklyScore: number
  emotionBalance: { positive: number; neutral: number; negative: number }
  snsMinutes: number
  highlights: string[]
  summary: string
}) {
  const { locale, stats, range, weeklyScore, emotionBalance, snsMinutes, highlights, summary } = props
  const strings = locale === 'ja'
    ? {
        title: 'Emotype Weekly Card',
        score: '週次スコア',
        mood: '平均気分スコア',
        sns: 'SNS利用時間',
        balance: '感情バランス',
        highlightsLabel: 'ハイライト',
        positive: 'ポジティブ',
        neutral: 'ニュートラル',
        negative: 'ネガティブ',
        minutes: '分',
        range: `${range.start} 〜 ${range.end}`,
        summaryLabel: 'まとめ',
      }
    : {
        title: 'Emotype Weekly Card',
        score: 'Weekly Score',
        mood: 'Avg Mood',
        sns: 'SNS Minutes',
        balance: 'Emotion Balance',
        highlightsLabel: 'Highlights',
        positive: 'Positive',
        neutral: 'Neutral',
        negative: 'Negative',
        minutes: 'min',
        range: `${range.start} to ${range.end}`,
        summaryLabel: 'Summary',
      }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#0f172a 0%,#0d9488 100%)',
        color: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
        padding: '40px 60px',
      }}
    >
      <div
        style={{
          background: '#fdfdfd',
          width: '100%',
          height: '100%',
          borderRadius: '36px',
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          boxShadow: '0 40px 80px rgba(15, 23, 42, 0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '42px', fontWeight: 700 }}>{strings.title}</div>
          <div style={{ fontSize: '20px', color: '#475569' }}>{strings.range}</div>
        </div>

        <div style={{ display: 'flex', gap: '28px' }}>
          <div
            style={{
              flex: '0 0 320px',
              borderRadius: '28px',
              background: 'linear-gradient(180deg,#34d399 0%,#10b981 100%)',
              color: '#f0fdf4',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 600 }}>{strings.score}</div>
            <div style={{ fontSize: '96px', fontWeight: 800, lineHeight: 1 }}>{weeklyScore}</div>
            <div style={{ fontSize: '18px', color: 'rgba(240,253,244,0.85)' }}>
              {strings.mood}: {stats.avg_mood.toFixed(1)} / 10
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(240,253,244,0.85)' }}>
              {strings.sns}: {snsMinutes} {strings.minutes}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{strings.balance}</div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[
                  { label: strings.positive, value: emotionBalance.positive, color: '#10b981' },
                  { label: strings.neutral, value: emotionBalance.neutral, color: '#6366f1' },
                  { label: strings.negative, value: emotionBalance.negative, color: '#f97316' },
                ].map((item) => (
                  <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '14px', color: '#475569' }}>{item.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: item.color }}>{item.value}%</div>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '999px',
                        background: '#e2e8f0',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: `${item.value}%`, height: '100%', background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: '24px',
                border: '1px solid #e2e8f0',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>{strings.summaryLabel}</div>
              <div style={{ fontSize: '20px', color: '#0f172a', lineHeight: 1.4 }}>
                {summary.slice(0, 120)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: '28px',
            border: '1px solid #e2e8f0',
            padding: '28px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>{strings.highlightsLabel}</div>
          <div style={{ display: 'flex', gap: '18px' }}>
            {highlights.map((text, index) => (
              <div
                key={`${text}-${index}`}
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  borderRadius: '22px',
                  padding: '18px 20px',
                  fontSize: '18px',
                  lineHeight: 1.5,
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
