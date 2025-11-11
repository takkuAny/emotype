// scripts/check-embeddings.ts
// エンベディングの状態を確認するスクリプト

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// .env.localファイルを読み込む
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkEmbeddings() {
  console.log('エンベディングの状態を確認中...\n')

  // 全投稿数
  const { count: totalCount, error: totalError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })

  if (totalError) {
    console.error('総投稿数の取得に失敗:', totalError)
    return
  }

  console.log(`📊 総投稿数: ${totalCount}件`)

  // エンベディングが存在する投稿数
  const { count: withEmbedding, error: withError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null)

  if (withError) {
    console.error('エンベディング有投稿数の取得に失敗:', withError)
    return
  }

  console.log(`✅ エンベディング有: ${withEmbedding}件`)

  // エンベディングが欠落している投稿数
  const { count: withoutEmbedding, error: withoutError } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)

  if (withoutError) {
    console.error('エンベディング無投稿数の取得に失敗:', withoutError)
    return
  }

  console.log(`❌ エンベディング無: ${withoutEmbedding}件`)

  // エンベディングが欠落している投稿の詳細
  if (withoutEmbedding && withoutEmbedding > 0) {
    console.log('\n📝 エンベディングが欠落している投稿:')
    const { data: missingPosts, error: missingError } = await supabase
      .from('posts')
      .select('id, content, created_at, source')
      .is('embedding', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (missingError) {
      console.error('詳細の取得に失敗:', missingError)
    } else if (missingPosts) {
      missingPosts.forEach((post, index) => {
        console.log(`\n${index + 1}. ID: ${post.id}`)
        console.log(`   作成日時: ${new Date(post.created_at).toLocaleString('ja-JP')}`)
        console.log(`   ソース: ${post.source || 'manual'}`)
        console.log(`   内容: ${post.content.substring(0, 60)}${post.content.length > 60 ? '...' : ''}`)
      })
    }

    console.log('\n💡 エンベディングを再生成するには:')
    console.log('   npm run regenerate-embeddings')
  } else {
    console.log('\n✨ すべての投稿にエンベディングが存在します！')
  }

  // ソース別の統計
  console.log('\n📈 ソース別統計:')
  const sources = ['manual', 'twitter']

  for (const source of sources) {
    const { count: sourceTotal } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('source', source)

    const { count: sourceWithEmbedding } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('source', source)
      .not('embedding', 'is', null)

    console.log(`   ${source}: ${sourceWithEmbedding}/${sourceTotal}件にエンベディング有`)
  }
}

checkEmbeddings().catch(console.error)