import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (!year || !month) {
      return NextResponse.json(
        { error: 'year and month are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

    // 指定月の投稿を取得
    const { data: posts, error } = await supabase
      .from('posts')
      .select('content, created_at')
      .eq('user_id', session.user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('投稿取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 日付ごとにデータを集計
    const dataByDate: Record<string, {
      date: string
      postCount: number
      avgEmotion: number
      posts: Array<{ content: string; created_at: string }>
    }> = {}

    posts?.forEach((post) => {
      const dateObj = new Date(post.created_at)
      const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {
          date: dateKey,
          postCount: 0,
          avgEmotion: 0,
          posts: []
        }
      }

      dataByDate[dateKey].postCount++
      dataByDate[dateKey].posts.push({
        content: post.content,
        created_at: post.created_at
      })
    })

    // 感情スコアを計算（簡易版）
    // 実際にはembeddingを使って感情分析を行う
    Object.keys(dataByDate).forEach((dateKey) => {
      const dayData = dataByDate[dateKey]
      // 暫定的に投稿数が多いほどポジティブとする（後で改善）
      dayData.avgEmotion = Math.min(dayData.postCount / 10, 1)
    })

    return NextResponse.json({ data: dataByDate })
  } catch (error) {
    console.error('カレンダーAPIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
