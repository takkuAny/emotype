// generate-embeddings-voyage.ts
// Voyage AIを使ってpostsテーブルのembeddingを生成・保存するスクリプト

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 環境変数を読み込む（.env.localファイルから）
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // クォートを削除
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

// 環境変数
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;

// クライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateEmbeddingsWithVoyage() {
  console.log('🚀 Voyage AIでEmbedding生成を開始します...\n');

  // embedding が NULL の投稿を取得
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, content, embedding')
    .is('embedding', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ 投稿の取得に失敗:', error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('✅ すべての投稿にembeddingが設定済みです！');
    return;
  }

  console.log(`📝 ${posts.length}件の投稿のembeddingを生成します`);
  console.log(`🔧 モデル: voyage-3\n`);

  let successCount = 0;
  let errorCount = 0;

  // バッチ処理（一度に最大128件まで）
  const batchSize = 128;
  const batches = [];
  
  for (let i = 0; i < posts.length; i += batchSize) {
    batches.push(posts.slice(i, i + batchSize));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    console.log(`\n📦 バッチ ${batchIndex + 1}/${batches.length} (${batch.length}件)`);
    
    try {
      // Voyage AI APIでembeddingを生成
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VOYAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: batch.map(post => post.content),
          model: process.env.VOYAGE_MODEL || 'voyage-2', // generate-embeddingと同じモデル
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // 正規化関数（検索APIと同じ）
      function normalize(v: number[]) {
        const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0))
        return v.map(x => x / n)
      }

      // 各投稿のembeddingをSupabaseに保存
      for (let i = 0; i < batch.length; i++) {
        const post = batch[i];
        const rawEmbedding = data.data[i].embedding;
        const embedding = normalize(rawEmbedding); // 正規化（重要！）

        const { error: updateError } = await supabase
          .from('posts')
          .update({ embedding: embedding })
          .eq('id', post.id);

        if (updateError) {
          console.error(`  ❌ [${i + 1}/${batch.length}] 保存失敗: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`  Batch [${i + 1}/${batch.length}] "${post.content.substring(0, 30)}..." (${embedding.length} dims)`);
          successCount++;
        }
      }

      // Rate limitを考慮して待機
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Batch error: ${message}`);
      errorCount += batch.length;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ 完了: ${successCount}件成功`);
  if (errorCount > 0) {
    console.log(`❌ エラー: ${errorCount}件失敗`);
  }
  console.log('='.repeat(50));
}

// 実行
generateEmbeddingsWithVoyage()
  .then(() => {
    console.log('\n🎉 すべての処理が完了しました！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 予期しないエラー:', err);
    process.exit(1);
  });