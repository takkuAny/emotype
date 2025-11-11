import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'

export type SubscriptionPlan = 'free' | 'pro'

export type RecordRow = {
  entry_date: string
  mood_score: number
  sns_minutes: number
  posts_count: number
  sleep_score: number | null
  meals_score: number | null
  focus_score: number | null
  memo: string | null
  tags: string[] | null
}

export type WeeklyStats = {
  total_days: number
  avg_mood: number
  total_sns_minutes: number
  avg_sns_minutes: number
  late_night_mentions: number
  entries: Array<{
    date: string
    memo: string
    mood: number
    sns_minutes: number
    tags: string[]
  }>
}

export type WeeklyReview = {
  summary: string
  highlights: string[]
  warnings: string[]
  doomscroll_index: number
  action_points: string[]
}

export async function fetchWeeklyRecords(
  supabase: SupabaseClient,
  userId: string
): Promise<{ records: RecordRow[]; start: string; end: string }> {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 6)

  const range = {
    start: formatDate(sevenDaysAgo),
    end: formatDate(today),
  }

  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .gte('entry_date', range.start)
    .lte('entry_date', range.end)
    .order('entry_date', { ascending: true })

  if (error) {
    throw error
  }

  return { records: data ?? [], ...range }
}

export function buildWeeklyStats(records: RecordRow[]): WeeklyStats {
  if (records.length === 0) {
    return {
      total_days: 0,
      avg_mood: 0,
      total_sns_minutes: 0,
      avg_sns_minutes: 0,
      late_night_mentions: 0,
      entries: [],
    }
  }

  const totalMood = records.reduce((sum, record) => sum + (record.mood_score ?? 0), 0)
  const avgMood = totalMood / records.length
  const totalSns = records.reduce((sum, record) => sum + (record.sns_minutes ?? 0), 0)
  const avgSns = totalSns / records.length
  const lateNightEntries = records.filter((record) => {
    if (!record.memo) return false
    return /夜更かし|夜|midnight|late/i.test(record.memo)
  }).length

  const notes = records
    .filter((record) => record.memo)
    .map((record) => ({
      date: record.entry_date,
      memo: record.memo!,
      mood: record.mood_score,
      sns_minutes: record.sns_minutes,
      tags: record.tags ?? [],
    }))

  return {
    total_days: records.length,
    avg_mood: Number(avgMood.toFixed(2)),
    total_sns_minutes: totalSns,
    avg_sns_minutes: Number(avgSns.toFixed(1)),
    late_night_mentions: lateNightEntries,
    entries: notes,
  }
}

export async function generateWeeklyReview(
  params: {
    stats: WeeklyStats
    records: RecordRow[]
    plan: SubscriptionPlan | null | undefined
    anthropic: Anthropic | null
  }
): Promise<WeeklyReview> {
  const { stats, records, plan, anthropic } = params
  if (!anthropic) {
    return buildFallbackReview(stats)
  }

  const model = plan === 'pro' ? 'claude-3-5-sonnet-20241022' : 'claude-3-haiku-20240307'
  const instruction = `
あなたはデジタル衛生とメンタルケアのコーチです。ユーザーの1週間の自己記録から、感情とSNS行動の傾向を分析し、JSON形式で応答してください。
必ず以下のキーのみを含むJSONを返してください:
{
  "summary": "1週間の総括（日本語、2文程度）",
  "highlights": ["ポジティブな気付きや良かった習慣を箇条書き（最大3件）"],
  "warnings": ["注意すべき行動パターンやリスクを箇条書き（最大3件）"],
  "doomscroll_index": 数値(0-100でSNSの依存度。50が中間),
  "action_points": ["翌週の具体的なアクション（最大3件）"]
}

参考データ:
- 1週間の記録件数、平均気分スコア、SNS利用時間
- メモとタグ（ストレス要因や改善点）

アドバイスは共感的かつ実行可能な内容にしてください。
`

  const payload = {
    stats,
    sample_entries: records.slice(-7).map((record) => ({
      date: record.entry_date,
      mood_score: record.mood_score,
      sns_minutes: record.sns_minutes,
      memo: record.memo,
      tags: record.tags ?? [],
      sleep: record.sleep_score,
      meals: record.meals_score,
      focus: record.focus_score,
    })),
  }

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 800,
      temperature: 0.3,
      system: 'You are Emotype, a weekly emotion coach who must answer in Japanese and return valid JSON.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${instruction}\n\nデータ:\n${JSON.stringify(payload, null, 2)}`,
            },
          ],
        },
      ],
    })

    const aiText = response.content[0]?.type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(aiText) as WeeklyReview
    return normalizeReview(parsed)
  } catch (error) {
    console.warn('weekly-review JSON parse failed, fallback to heuristic output', error)
    return buildFallbackReview(stats)
  }
}

export function buildFallbackReview(stats: WeeklyStats): WeeklyReview {
  const doomscrollIndex = Math.min(Math.round((stats.avg_sns_minutes / 120) * 100), 100)

  const highlight =
    stats.avg_mood >= 6
      ? '平均気分スコアが目標ラインを上回り、安定していました。'
      : '記録を続けられていることが何よりの強みです。'

  const warning =
    stats.avg_sns_minutes > 120
      ? 'SNS利用が2時間を超える日が続いているため、夜の使用を区切る工夫を検討しましょう。'
      : '記録日数をさらに増やすと、より精度の高い分析が可能になります。'

  const action =
    stats.avg_sns_minutes > 120
      ? '22時以降は通知をオフにして、代わりにノートやストレッチの時間を確保する。'
      : '朝一番に気分スコアをつけるルーティンを続けて平均Moodを底上げする。'

  return {
    summary: 'AIレビューを生成するためのデータは十分でしたが、現在は簡易サマリーを表示しています。',
    highlights: [highlight],
    warnings: [warning],
    doomscroll_index: doomscrollIndex,
    action_points: [action],
  }
}

function normalizeReview(review: WeeklyReview): WeeklyReview {
  return {
    summary: review.summary ?? '',
    highlights: review.highlights ?? [],
    warnings: review.warnings ?? [],
    doomscroll_index: clampNumber(review.doomscroll_index, 0, 100),
    action_points: review.action_points ?? [],
  }
}

function clampNumber(value: number | undefined, min: number, max: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}
