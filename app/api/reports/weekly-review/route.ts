import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildFallbackReview,
  buildWeeklyStats,
  fetchWeeklyRecords,
  generateWeeklyReview,
} from '@/lib/reports/weekly'

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
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const { records, start, end } = await fetchWeeklyRecords(supabase, user.id)

    if (!records || records.length === 0) {
      return NextResponse.json(
        {
          summary: '今週の自己記録がまだありません。ダッシュボードで気分ログを入力すると週次レビューを生成できます。',
          highlights: [],
          warnings: [],
          doomscroll_index: 0,
          action_points: [],
          generated_at: new Date().toISOString(),
          range: { start, end },
          stats: buildWeeklyStats(records),
          records: [],
        },
        { status: 200 }
      )
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

    return NextResponse.json({
      ...review,
      generated_at: new Date().toISOString(),
      plan: subscription?.plan ?? 'free',
      range: {
        start,
        end,
      },
      stats,
      records,
    })
  } catch (error) {
    console.error('weekly-review error:', error)
    return NextResponse.json({ error: 'Failed to generate weekly review' }, { status: 500 })
  }
}
