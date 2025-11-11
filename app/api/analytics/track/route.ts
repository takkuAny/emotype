import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const body = await request.json()

    // ユーザー認証（任意 - 匿名イベントも許可）
    let userId: string | null = null
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    const {
      event_type,
      event_name,
      properties = {},
      session_id,
    } = body

    if (!event_type) {
      return NextResponse.json(
        { error: 'event_type is required' },
        { status: 400 }
      )
    }

    // リクエストメタデータ収集
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || null

    // イベント挿入
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type,
        event_name,
        properties,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer,
        page_url: properties.page_url || null,
        session_id: session_id || null,
      })

    if (error) {
      console.error('Analytics tracking error:', error)
      // エラーでもクライアントには成功を返す（トラッキング失敗でUXを壊さない）
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // エラーでもクライアントには成功を返す
    return NextResponse.json({ success: true })
  }
}
