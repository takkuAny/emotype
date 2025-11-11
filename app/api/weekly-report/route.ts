import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 過去7日間のデータを取得
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (postsError) {
      throw postsError
    }

    // 感情タグの集計
    const emotionCounts: Record<string, number> = {}
    posts?.forEach(post => {
      const emotion = post.emotion_tag
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
    })

    // 最も多い感情トップ3
    const topEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }))

    // AIインサイトを取得
    const { data: insight } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      totalPosts: posts?.length || 0,
      topEmotions,
      insight: insight ? {
        insight: insight.insight,
        trend: insight.trend || 'neutral',
        emoji: insight.emoji || '💭'
      } : null,
      weekStart: sevenDaysAgo.toISOString(),
      weekEnd: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Weekly report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate weekly report' },
      { status: 500 }
    )
  }
}
