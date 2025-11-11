// app/api/dev/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POSTメソッドをエクスポート
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードが必要です' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role keyが必要
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // ユーザーを作成
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split('@')[0]
      }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: data.user
    })
  } catch (error) {
    console.error('ユーザー作成エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// 開発環境でのみ使用可能にする
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'このエンドポイントは開発環境でのみ使用できます' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    message: 'POST /api/dev/create-user を使用してユーザーを作成してください',
    example: {
      method: 'POST',
      body: {
        email: 'user@example.com',
        password: 'password123',
        name: 'User Name'
      }
    }
  })
}
