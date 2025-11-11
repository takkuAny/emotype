import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// シングルトンインスタンスを保持
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

// ブラウザ用クライアント（@supabase/ssr を使用）
// シングルトンパターンで同じインスタンスを返す
export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
})()

// サーバー側用（サービスロールキー）- RLS（Row Level Security）をバイパス可能
// embeddingの更新に使用
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 認証済みユーザーのSupabaseクライアントを取得（後方互換性のため残す）
export function createServerClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  )
}