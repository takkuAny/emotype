import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 投稿の状態を確認するAPI
export async function GET() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 全ての投稿を取得
    const { data: allPosts, error: allError } = await admin
      .from('posts')
      .select('id, content, emotion_tag, embedding')
      .order('created_at', { ascending: false })
      .limit(100)

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // 統計情報
    const stats = {
      total: allPosts?.length || 0,
      withEmbeddings: allPosts?.filter(p => p.embedding !== null).length || 0,
      angerPosts: allPosts?.filter(p => p.emotion_tag === 'anger').length || 0,
      angerWithEmbeddings: allPosts?.filter(p => p.emotion_tag === 'anger' && p.embedding !== null).length || 0,
    }

    // イライラ関連の投稿を探す
    const irritationPosts = allPosts?.filter(p => 
      p.content.includes('イライラ') || 
      p.content.includes('Git') || 
      p.content.includes('Docker') || 
      p.content.includes('TypeScript') ||
      p.emotion_tag === 'anger'
    ) || []

    return NextResponse.json({
      stats,
      irritationPosts: irritationPosts.map(p => ({
        id: p.id,
        content: p.content,
        emotion_tag: p.emotion_tag,
        hasEmbedding: p.embedding !== null,
        embeddingLength: Array.isArray(p.embedding) ? p.embedding.length : 0
      })),
      allPosts: allPosts?.map(p => ({
        content: p.content.substring(0, 50),
        emotion_tag: p.emotion_tag,
        hasEmbedding: p.embedding !== null
      }))
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

