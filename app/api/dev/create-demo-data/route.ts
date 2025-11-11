import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// デモデータ生成 API
export async function POST() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // デモ用の感情データ（プレゼン台本の内容を正確に反映）
    const demoPosts = [
      // プレゼン台本で使用する投稿（優先的に追加・正確なテキストで）
      { content: 'Gitのコンフリクト地獄...', emotion_tag: 'anger' },
      { content: 'Dockerのビルドが通らない...', emotion_tag: 'anger' },
      { content: 'TypeScriptのエラーが謎すぎる', emotion_tag: 'anger' },
      
      // その他の怒り・イライラ関連
      { content: 'すごく怒っています。許せません。', emotion_tag: 'anger' },
      { content: '腹が立ちます。', emotion_tag: 'anger' },
      { content: 'イライラして集中できない', emotion_tag: 'anger' },
      { content: '不満がたまっている', emotion_tag: 'anger' },
      { content: 'むかつく。なんでこうなるんだ', emotion_tag: 'anger' },
      
      // 疲労・眠さ（「疲れた...でも楽しい」で検索できるように）
      // 「疲れた」と「眠い」を明示的に組み合わせた投稿を追加（関連性を高めるため）
      { content: '疲れた...でも楽しい', emotion_tag: 'joy' },
      { content: '疲れて眠い。でも充実してる', emotion_tag: 'joy' },
      { content: 'すごく疲れたけど充実してた', emotion_tag: 'pride' },
      { content: '疲れた。眠い。でも楽しかった', emotion_tag: 'joy' },
      { content: '疲れて眠くなる。でも今日はいい日だった', emotion_tag: 'joy' },
      { content: '眠い...でもあと少しで終わる', emotion_tag: 'pride' },
      { content: '疲れたから眠い。でも達成感がある', emotion_tag: 'pride' },
      { content: '眠たい。でも頑張りたい', emotion_tag: 'pride' },
      { content: 'すごく眠い。明日は早い', emotion_tag: 'tiredness' },
      { content: '眠くて眠くて仕方ない', emotion_tag: 'tiredness' },
      { content: '疲れすぎて眠い', emotion_tag: 'tiredness' },
      { content: '家着いた。達成感ある', emotion_tag: 'pride' },
      { content: '疲労がたまってる。でも頑張った', emotion_tag: 'pride' },
      { content: '疲れたけど、充実感があった', emotion_tag: 'joy' },
      { content: '眠い。でも今日は楽しかった', emotion_tag: 'joy' },
      
      // 悲しみ
      { content: '今日はとても悲しい気持ちです。', emotion_tag: 'sadness' },
      { content: '悲しくて泣きそうです。', emotion_tag: 'sadness' },
      
      // 喜び
      { content: '嬉しい！良いニュースが来ました。', emotion_tag: 'joy' },
      { content: '楽しい時間を過ごしています。', emotion_tag: 'joy' },
      
      // その他の感情
      { content: '驚きました。信じられないことが起こりました。', emotion_tag: 'surprise' },
      { content: 'びっくりしました！', emotion_tag: 'surprise' },
      { content: '不安で眠れません。', emotion_tag: 'fear' },
      { content: '怖い夢を見ました。', emotion_tag: 'fear' },
      { content: '退屈です。何もすることがありません。', emotion_tag: 'boredom' },
      { content: '暇で退屈です。', emotion_tag: 'boredom' },
      { content: '落ち着いた気持ちです。', emotion_tag: 'relief' },
      { content: 'ほっとしています。', emotion_tag: 'relief' },
      { content: '誇らしい気持ちです。達成感があります。', emotion_tag: 'pride' },
    ]

    const results = []
    
    for (const post of demoPosts) {
      // 既存の投稿をチェック（重複を避ける）
      const { data: existing } = await admin
        .from('posts')
        .select('id')
        .eq('content', post.content)
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle()
      
      let postId: string
      
      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${post.content}`)
        postId = existing.id
        // 既存の投稿でも埋め込みを再生成（念のため）
      } else {
        // 投稿を追加
        const { data: insertedPost, error: insertError } = await admin
          .from('posts')
          .insert({
            content: post.content,
            emotion_tag: post.emotion_tag,
            user_id: '00000000-0000-0000-0000-000000000000', // デモ用ユーザーID
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Failed to insert post: ${post.content}`, insertError)
          continue
        }
        
        postId = insertedPost.id
        console.log(`✅ Created: ${post.content} [${post.emotion_tag}]`)
      }

      // エンベディングを生成（既存・新規両方）
      try {
        const embeddingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-embedding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postId: postId,
            content: post.content,
          }),
        })
        
        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text()
          throw new Error(`Embedding API error: ${embeddingResponse.status} - ${errorText}`)
        }
        
        results.push({ success: true, content: post.content, emotion_tag: post.emotion_tag })
      } catch (embeddingError) {
        console.error(`Failed to generate embedding for post: ${post.content}`, embeddingError)
        results.push({ success: false, content: post.content, error: String(embeddingError) })
      }
      
      // Rate limitを考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return NextResponse.json({
      success: true,
      created: results.filter(r => r.success).length,
      total: demoPosts.length,
      results,
    })
  } catch (error: unknown) {
    console.error('Demo data creation error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    return NextResponse.json(
      { error: 'Failed to create demo data', details: err.message },
      { status: 500 }
    )
  }
}
