// 環境変数の確認用スクリプト
async function main() {
  const { config } = await import('dotenv')
  config({ path: '.env.local' })

  console.log('=== 環境変数確認 ===')
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('TWITTER_CLIENT_ID:', process.env.TWITTER_CLIENT_ID ? '設定済み' : '未設定')
  console.log('TWITTER_CLIENT_SECRET:', process.env.TWITTER_CLIENT_SECRET ? '設定済み' : '未設定')

  console.log('\n=== 重要なURL ===')
  console.log('認証コールバックURL:', `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`)
  console.log('X認証コールバックURL:', `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`)

  console.log('\n=== Supabase設定で必要なRedirect URLs ===')
  console.log('1.', `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`)

  console.log('\n上記のURLがSupabaseの「Authentication > URL Configuration > Redirect URLs」に追加されているか確認してください。')
}

main().catch(error => {
  console.error('環境変数チェックでエラーが発生しました:', error)
  process.exit(1)
})
