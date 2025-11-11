import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInsight } from '@/lib/ai'

export async function GET(req: Request) {
  try {
    // リクエストのヘッダーからAuthorizationトークンを取得
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Supabaseクライアントを作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // キャッシュされたインサイトをチェック
    const { data: cachedInsight, error: cacheErr } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // キャッシュが有効な場合は返す
    if (cachedInsight && !cacheErr && new Date(cachedInsight.expires_at) > new Date()) {
      return NextResponse.json({
        insight: cachedInsight.insight,
        emoji: cachedInsight.emoji,
        trend: cachedInsight.trend,
        cached: true
      })
    }

    // 過去30日間の投稿を取得
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: posts, error: postsErr } = await supabase
      .from('posts')
      .select('content, emotion_tag, created_at')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (postsErr) {
      console.error('Posts fetch error:', postsErr)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        insight: 'まだ十分なデータがありません。もっと投稿を追加すると、AIがあなたの感情パターンを分析できるようになります。',
        emoji: '📝',
        trend: 'neutral'
      })
    }

    // 最近1週間と2週間前を比較
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const recentPosts = posts.filter(p => new Date(p.created_at) >= oneWeekAgo)
    const previousWeekPosts = posts.filter(p => {
      const date = new Date(p.created_at)
      return date >= twoWeeksAgo && date < oneWeekAgo
    })

    // AI分析を実行（最適化版）
    const result = await generateInsight({
      recentPosts,
      previousPosts: previousWeekPosts,
      totalPosts: posts.length,
    })

    // キャッシュに保存（24時間有効）
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // 既存のキャッシュがあれば更新、なければ挿入
    if (cachedInsight) {
      await supabase
        .from('insights')
        .update({
          insight: result.insight,
          emoji: result.emoji,
          trend: result.trend,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('insights')
        .insert({
          user_id: user.id,
          insight: result.insight,
          emoji: result.emoji,
          trend: result.trend,
          expires_at: expiresAt.toISOString()
        })
    }

    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error('Insights error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    return NextResponse.json({
      error: err.message || 'Failed to generate insights',
      insight: '感情の分析中にエラーが発生しました。',
      emoji: '🤔',
      trend: 'neutral'
    }, { status: 500 })
  }
}
