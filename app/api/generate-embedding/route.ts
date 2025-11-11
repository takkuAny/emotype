import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

export const runtime = 'nodejs' // 念のため

const DB_DIM = 1024
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-2'
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'

function normalize(v: number[]) {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0))
  return v.map(x => x / n)
}

export async function POST(req: Request) {
  const { postId, content } = await req.json()

  // 1) OpenAIで感情分析（複数タグ）
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  let emotionTags: string[] = ['neutral']
  let primaryEmotion = 'neutral'

  try {
    const emotionAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `以下のテキストから感じられる感情を強い順に2〜3個選んでください。

選択肢: joy, sadness, anger, fear, love, surprise, neutral

テキスト: "${content}"

回答はJSON形式で返してください:
{
  "emotions": ["最も強い感情", "2番目に強い感情", "3番目に強い感情(オプション)"]
}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
    })

    const responseText = emotionAnalysis.choices[0]?.message?.content?.trim()
    if (responseText) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        const validEmotions = ['joy', 'sadness', 'anger', 'fear', 'love', 'surprise', 'neutral']
        const emotions = (result.emotions || [])
          .map((e: string) => e.toLowerCase())
          .filter((e: string) => validEmotions.includes(e))
          .slice(0, 3) // 最大3個まで

        if (emotions.length > 0) {
          emotionTags = emotions
          primaryEmotion = emotions[0]
        }
      }
    }
  } catch (error) {
    console.error('Emotion analysis error:', error)
    // エラーが起きてもデフォルトのneutralで続行
  }

  // 2) Voyage REST で埋め込み生成
  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY!}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,  // ← 1024次元モデル
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

  // 3) 次元ガード
  if (embedding.length !== DB_DIM) {
    throw new Error(
      `Embedding dim ${embedding.length} ≠ DB ${DB_DIM}. ` +
      `Set VOYAGE_MODEL=voyage-2 and restart dev server.`
    )
  }

  // 4) Supabase へ保存（Service Role で）
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ← public anon ではなく SRK
  )

  const { error } = await admin
    .from('posts')
    .update({
      embedding,
      emotion_tag: primaryEmotion,
      emotion_tags: emotionTags
    })
    .eq('id', postId)

  if (error) throw new Error(`Supabase update failed: ${error.message}`)

  return NextResponse.json({ ok: true, dim: embedding.length, emotions: emotionTags })
}
