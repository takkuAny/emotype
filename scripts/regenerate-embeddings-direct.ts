// scripts/regenerate-embeddings-direct.ts
// エンベディングが欠落している投稿のエンベディングを直接再生成（APIサーバー不要）

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const voyageApiKey = process.env.VOYAGE_API_KEY!
const voyageModel = process.env.VOYAGE_MODEL || 'voyage-2'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const DB_DIM = 1024
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'

function normalize(v: number[]) {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0))
  return v.map(x => x / n)
}

async function generateEmbedding(content: string): Promise<number[]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${voyageApiKey}`,
    },
    body: JSON.stringify({
      model: voyageModel,
      input: [content ?? ''],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Voyage API error: ${text}`)
  }

  const json = await res.json()
  const raw: number[] = json.data[0].embedding
  const embedding = normalize(raw)

  if (embedding.length !== DB_DIM) {
    throw new Error(
      `Embedding dim ${embedding.length} ≠ DB ${DB_DIM}. ` +
      `Set VOYAGE_MODEL=voyage-2 and restart.`
    )
  }

  return embedding
}

async function regenerateEmbeddings() {
  console.log('エンベディングが欠落している投稿を検索中...\n')

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

  console.log(`${posts.length}件の投稿のエンベディングを生成します...\n`)

  let successCount = 0
  let errorCount = 0

  for (const post of posts) {
    try {
  console.log(`\n完了: 成功 ${successCount}件, 失敗 ${errorCount}件`)

      // エンベディング生成
      const embedding = await generateEmbedding(post.content)

      // Supabaseに保存
      const { error: updateError } = await supabase
        .from('posts')
        .update({ embedding })
        .eq('id', post.id)

      if (updateError) {
        console.error(`  Error: ${updateError.message}`)
        errorCount++
        continue
      }

      console.log(`  Success (dim: ${embedding.length})`)
      successCount++

      // レート制限を避けるため少し待機
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.error(`  Error: ${message}`)
      errorCount++
    }
  }

  console.log(`\n完了: 成功 ${successCount}件, 失敗 ${errorCount}件`)
}

regenerateEmbeddings().catch(console.error)
