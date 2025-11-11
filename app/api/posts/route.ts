import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 投稿作成 API
export async function POST(req: Request) {
  try {
    const { content, image_url, emotion_tag } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // emotion_tag が指定されていない場合は推定
    const inferredTag = emotion_tag ?? inferTag(content)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content,
        image_url: image_url || null,
        emotion_tag: inferredTag, // 👈 追加
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: unknown) {
    console.error('POST error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// 感情推定（簡易）
function inferTag(text: string): string {
  if (/嬉|喜|楽/.test(text)) return 'joy'
  if (/悲|泣/.test(text)) return 'sadness'
  if (/怒|ムカ|腹/.test(text)) return 'anger'
  if (/驚|びっくり|えっ/.test(text)) return 'surprise'
  if (/安|落ち着|ほっ/.test(text)) return 'relief'
  if (/不安|怖|恐/.test(text)) return 'fear'
  if (/退屈|暇/.test(text)) return 'boredom'
  if (/誇|達成|自慢/.test(text)) return 'pride'
  return 'unknown'
}
