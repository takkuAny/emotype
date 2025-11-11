import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// 深夜時間帯の定義（22:00 - 05:00）
const isLateNightHour = (date: Date): boolean => {
  const hour = date.getHours()
  return hour >= 22 || hour < 5
}

// ネガティブ感情の定義
const NEGATIVE_EMOTIONS = ['sadness', 'anger', 'fear', 'disappointment']

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // ユーザー取得
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 過去30日間のポストを取得
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, content, emotion_tag, created_at, source')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (postsError) {
      throw postsError
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        score: 0,
        metrics: {
          negativeRatio: 0,
          lateNightRatio: 0,
          avgPostsPerDay: 0,
          totalPosts: 0,
        },
        message: 'Not enough data to analyze',
      })
    }

    // Xからのポストのみをフィルタリング（source='twitter'のもの）
    const twitterPosts = posts.filter(p => p.source === 'twitter')
    const totalPosts = posts.length
    const twitterPostsCount = twitterPosts.length

    // 1. ネガティブ投稿比率
    const negativePosts = posts.filter(p =>
      p.emotion_tag && NEGATIVE_EMOTIONS.includes(p.emotion_tag.toLowerCase())
    )
    const negativeRatio = totalPosts > 0 ? (negativePosts.length / totalPosts) * 100 : 0

    // 2. 深夜投稿率
    const lateNightPosts = posts.filter(p => {
      const postDate = new Date(p.created_at)
      return isLateNightHour(postDate)
    })
    const lateNightRatio = totalPosts > 0 ? (lateNightPosts.length / totalPosts) * 100 : 0

    // 3. 平均投稿頻度（1日あたり）
    const daysDiff = 30
    const avgPostsPerDay = totalPosts / daysDiff

    // 4. X投稿比率（全体の何%がXから来ているか）
    const twitterRatio = totalPosts > 0 ? (twitterPostsCount / totalPosts) * 100 : 0

    // 5. ドゥームスクロール総合スコア（0-100）
    // 計算式:
    // - ネガティブ比率 × 0.35
    // - 深夜投稿率 × 0.25
    // - 投稿頻度スコア × 0.25（1日5件以上=100点）
    // - X依存度 × 0.15（X比率が高いほど高スコア）

    const frequencyScore = Math.min((avgPostsPerDay / 5) * 100, 100)
    const doomscrollingScore = Math.round(
      (negativeRatio * 0.35) +
      (lateNightRatio * 0.25) +
      (frequencyScore * 0.25) +
      (twitterRatio * 0.15)
    )

    // スコアに基づくリスクレベル
    let riskLevel: 'low' | 'moderate' | 'high' | 'severe'
    let message: string

    if (doomscrollingScore < 30) {
      riskLevel = 'low'
      message = 'Healthy social media usage. Keep it up!'
    } else if (doomscrollingScore < 50) {
      riskLevel = 'moderate'
      message = 'Some patterns to watch. Consider setting boundaries.'
    } else if (doomscrollingScore < 70) {
      riskLevel = 'high'
      message = 'Concerning patterns detected. Time for a digital detox?'
    } else {
      riskLevel = 'severe'
      message = 'High dependency detected. Please consider professional support.'
    }

    return NextResponse.json({
      score: doomscrollingScore,
      riskLevel,
      message,
      metrics: {
        negativeRatio: Math.round(negativeRatio * 10) / 10,
        lateNightRatio: Math.round(lateNightRatio * 10) / 10,
        avgPostsPerDay: Math.round(avgPostsPerDay * 10) / 10,
        twitterRatio: Math.round(twitterRatio * 10) / 10,
        totalPosts,
        twitterPosts: twitterPostsCount,
        negativePosts: negativePosts.length,
        lateNightPosts: lateNightPosts.length,
      },
      breakdown: {
        negativeImpact: Math.round(negativeRatio * 0.35),
        lateNightImpact: Math.round(lateNightRatio * 0.25),
        frequencyImpact: Math.round(frequencyScore * 0.25),
        twitterDependency: Math.round(twitterRatio * 0.15),
      },
    })
  } catch (error) {
    console.error('Doomscrolling analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze doomscrolling patterns' },
      { status: 500 }
    )
  }
}
