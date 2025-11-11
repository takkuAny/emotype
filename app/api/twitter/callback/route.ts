import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('コールバック受信:', { hasCode: !!code, hasState: !!state, error })

    // OAuth エラーをチェック
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/x-integration?error=${error}`, request.url)
      )
    }

    // stateを検証
    const savedState = cookieStore.get('twitter_oauth_state')?.value
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value

    console.log('State検証:', {
      stateMatch: state === savedState,
      hasVerifier: !!codeVerifier
    })

    if (!code || !state || state !== savedState || !codeVerifier) {
      console.error('State検証エラー')
      return NextResponse.redirect(
        new URL('/dashboard/x-integration?error=invalid_state', request.url)
      )
    }

    // stateからユーザーIDと切り替えフラグを復元
    let userId: string | null = null
    let switchAccount = false
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64url').toString())
      userId = stateData.userId
      switchAccount = stateData.switchAccount || false
      console.log('State復元:', { userId, switchAccount })
    } catch (e) {
      console.error('State解析エラー:', e)
      return NextResponse.redirect(
        new URL('/dashboard/x-integration?error=invalid_state', request.url)
      )
    }

    // アクセストークンと交換
    console.log('トークン交換開始')
    
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`,
        code_verifier: codeVerifier
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('トークン交換に失敗:', errorData)
      return NextResponse.redirect(
        new URL('/dashboard/x-integration?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()
    console.log('トークン取得成功')

    // Twitterユーザー情報を取得
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('ユーザー情報取得に失敗:', errorData)
      return NextResponse.redirect(
        new URL('/dashboard/x-integration?error=user_fetch_failed', request.url)
      )
    }

    const twitterUser = await userResponse.json()
    console.log('Twitterユーザー情報取得成功:', twitterUser.data.username)

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

    // セッションからユーザーIDを取得
    const { data: { session } } = await supabase.auth.getSession()
    const effectiveUserId = session?.user?.id

    if (!effectiveUserId) {
      console.error('Supabaseユーザーが見つかりません')
      return NextResponse.redirect(
        new URL('/login?redirect=/dashboard/x-integration&error=session_expired', request.url)
      )
    }

    console.log('データベースに保存中...', { effectiveUserId, switchAccount })

    // アカウント切り替えの場合、既存データを削除
    if (switchAccount) {
      console.log('アカウント切り替えモード: 既存データを削除中...', { effectiveUserId })

      // twitter_postsテーブルから削除
      const { data: deletedTwitterPosts, error: deleteTwitterPostsError } = await supabase
        .from('twitter_posts')
        .delete()
        .eq('user_id', effectiveUserId)
        .select()

      if (deleteTwitterPostsError) {
        console.error('Twitter投稿削除エラー:', deleteTwitterPostsError)
      } else {
        console.log('Twitter投稿削除完了:', deletedTwitterPosts?.length || 0, '件')
      }

      // postsテーブルからTwitter由来の投稿を削除（sourceで判定）
      const { data: deletedPosts, error: deletePostsError } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', effectiveUserId)
        .eq('source', 'twitter')
        .select()

      if (deletePostsError) {
        console.error('Posts投稿削除エラー:', deletePostsError)
      } else {
        console.log('Posts投稿削除完了:', deletedPosts?.length || 0, '件')
      }

      // 既存のtwitter_connectionsを削除
      const { data: deletedConnections, error: deleteConnectionsError } = await supabase
        .from('twitter_connections')
        .delete()
        .eq('user_id', effectiveUserId)
        .select()

      if (deleteConnectionsError) {
        console.error('連携情報削除エラー:', deleteConnectionsError)
      } else {
        console.log('連携情報削除完了:', deletedConnections?.length || 0, '件')
      }

      console.log('既存データ削除処理完了')
    }

    // Supabaseに接続情報を保存
    const { error: dbError } = await supabase
      .from('twitter_connections')
      .upsert({
        user_id: effectiveUserId,
        twitter_user_id: twitterUser.data.id,
        twitter_username: twitterUser.data.username,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('データベースエラー:', dbError)
      return NextResponse.redirect(
        new URL('/dashboard/x-integration?error=db_error', request.url)
      )
    }

    console.log('保存成功！')

    // Cookieをクリア
    const response = NextResponse.redirect(
      new URL('/dashboard/x-integration?success=true', request.url)
    )

    response.cookies.delete('twitter_oauth_state')
    response.cookies.delete('twitter_code_verifier')

    return response
  } catch (error) {
    console.error('コールバックエラー:', error)
    return NextResponse.redirect(
      new URL('/dashboard/x-integration?error=callback_failed', request.url)
    )
  }
}