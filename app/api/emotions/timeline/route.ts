import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// 感情タグをスコアに変換（-1.0から1.0の範囲）
function emotionToScore(emotionTag: string | null): number {
  if (!emotionTag) return 0.5 // デフォルト値
  
  const emotionScores: Record<string, number> = {
    'joy': 0.9,
    'happiness': 0.9,
    'excitement': 0.85,
    'pride': 0.8,
    'relief': 0.7,
    'contentment': 0.65,
    'calm': 0.6,
    'neutral': 0.5,
    'boredom': 0.4,
    'tired': 0.35,
    'sadness': 0.3,
    'disappointment': 0.25,
    'anxiety': 0.2,
    'fear': 0.15,
    'anger': 0.1,
    'frustration': 0.1,
    'nervous': 0.2,
    'exhausted': 0.3,
    'resigned': 0.35,
  }
  
  return emotionScores[emotionTag.toLowerCase()] ?? 0.5
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const days = parseInt(searchParams.get('days') || '7', 10)

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Service Role Keyを使用
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 指定日数分のデータを取得
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: posts, error } = await admin
      .from('posts')
      .select('created_at, emotion_tag')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 日付ごとにグループ化し、平均スコアを計算
    const dailyData: Record<string, { count: number; sum: number }> = {}
    
    posts?.forEach(post => {
      const date = new Date(post.created_at)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD形式
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { count: 0, sum: 0 }
      }
      
      const score = emotionToScore(post.emotion_tag)
      dailyData[dateKey].count++
      dailyData[dateKey].sum += score
    })

    // 結果を配列に変換（日付順）
    const timeline = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        score: data.count > 0 ? data.sum / data.count : 0.5,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 指定日数分の全データポイントを生成（データがない日は前日の値を継承）
    const fullTimeline: Array<{ date: string; score: number; count: number }> = []
    const dateArray: string[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      dateArray.push(date.toISOString().split('T')[0])
    }

    let lastScore = 0.5
    dateArray.forEach(date => {
      const dayData = timeline.find(t => t.date === date)
      if (dayData) {
        lastScore = dayData.score
        fullTimeline.push({
          date,
          score: dayData.score,
          count: dayData.count,
        })
      } else {
        // データがない日は前日のスコアを使用（滑らかなグラフのため）
        fullTimeline.push({
          date,
          score: lastScore,
          count: 0,
        })
      }
    })

    return NextResponse.json({
      timeline: fullTimeline,
      totalPosts: posts?.length || 0,
      days,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
