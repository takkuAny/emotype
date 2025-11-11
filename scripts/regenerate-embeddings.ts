// scripts/regenerate-embeddings.ts
// エンベディングが欠落している投稿のエンベディングを再生成

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const appUrl = process.env.NEXT_PUBLIC_APP_URL!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function regenerateEmbeddings() {
  console.log('エンベディングが欠落している投稿を検索中...')

  // エンベディングがnullの投稿を取得
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content')
    .is('embedding', null)
    .order('created_at', { ascending: false })
    .limit(100) // 一度に100件まで

  if (error) {
    console.error('投稿の取得に失敗:', error)
    return
  }

  if (!posts || posts.length === 0) {
    console.log('✅ すべての投稿にエンベディングが存在します')
    return
  }

  console.log(`${posts.length}件の投稿のエンベディングを生成します...`)

  let successCount = 0
  let errorCount = 0

  for (const post of posts) {
    try {
      console.log(`[${successCount + errorCount + 1}/${posts.length}] ID: ${post.id}`)

      const response = await fetch(`${appUrl}/api/generate-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          content: post.content,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`  ❌ エラー: ${errorText}`)
        errorCount++
        continue
      }

      const result = await response.json()
      console.log(`  ✅ 成功 (dim: ${result.dim})`)
      successCount++

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e) {
      console.error(`  ❌ エラー:`, e)
      errorCount++
    }
  }

  console.log(`\n完了: 成功 ${successCount}件, 失敗 ${errorCount}件`)
}

regenerateEmbeddings().catch(console.error)