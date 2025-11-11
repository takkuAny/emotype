import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // 一時保存されたX認証情報を取得
    const tempDataCookie = cookieStore.get('x_auth_temp')?.value

    if (!tempDataCookie) {
      console.error('一時X認証情報が見つかりません')
      return NextResponse.json(
        { error: 'X認証情報が見つかりません。再度連携をお試しください。' },
        { status: 400 }
      )
    }

    let tempData
    try {
      tempData = JSON.parse(tempDataCookie)
    } catch (e) {
      console.error('一時データのパースエラー:', e)
      return NextResponse.json(
        { error: 'データが破損しています。再度連携をお試しください。' },
        { status: 400 }
      )
    }

    // タイムスタンプチェック（10分以内）
    const now = Date.now()
    if (now - tempData.timestamp > 600000) {
      console.error('X認証情報の有効期限切れ')
      return NextResponse.json(
        { error: 'X認証情報の有効期限が切れました。再度連携をお試しください。' },
        { status: 400 }
      )
    }

    // Supabaseクライアントを作成
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

    // 現在のユーザーを取得
    const { data: { session } } = await supabase.auth.getSession()

    if (!session || !session.user) {
      console.error('ユーザーセッションが見つかりません')
      return NextResponse.json(
        { error: 'ログインが必要です。' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    console.log('X連携情報を保存中...', { userId, twitterUsername: tempData.twitter_username })

    // Supabaseに接続情報を保存
    const { error: dbError } = await supabase
      .from('twitter_connections')
      .upsert({
        user_id: userId,
        twitter_user_id: tempData.twitter_user_id,
        twitter_username: tempData.twitter_username,
        access_token: tempData.access_token,
        refresh_token: tempData.refresh_token,
        expires_at: new Date(Date.now() + tempData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('データベースエラー:', dbError)
      return NextResponse.json(
        { error: 'データベースエラーが発生しました。' },
        { status: 500 }
      )
    }

    console.log('X連携情報の保存成功！')

    // 一時データを削除
    const response = NextResponse.json({ success: true })
    response.cookies.delete('x_auth_temp')

    return response
  } catch (error) {
    console.error('X認証完了エラー:', error)
    return NextResponse.json(
      { error: '認証完了処理に失敗しました。' },
      { status: 500 }
    )
  }
}
