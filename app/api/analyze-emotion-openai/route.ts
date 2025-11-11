// app/api/analyze-emotion-openai/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const EMOTION_TAGS = {
  joy: 'joy',
  happy: 'joy',
  excited: 'joy',
  sad: 'sadness',
  unhappy: 'sadness',
  angry: 'anger',
  mad: 'anger',
  irritated: 'anger',
  anxious: 'fear',
  nervous: 'fear',
  neutral: 'neutral',
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY not found, returning neutral emotion')
      return NextResponse.json({ emotion_tag: 'neutral', confidence: 0 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 高速・低コスト
      temperature: 0,
      max_tokens: 10,
      messages: [
        {
          role: 'system',
          content: `あなたは感情分析の専門家です。与えられたテキストから主要な感情を1つだけ選んでください。

感情カテゴリ:
- joy: 喜び、楽しい、嬉しい、幸せ、ワクワク
- sadness: 悲しい、つらい、憂鬱、落ち込む
- anger: 怒り、イライラ、腹立つ、不満、フラストレーション
- fear: 不安、緊張、心配、恐れ、焦り
- neutral: 中立、情報共有、事実の記述、感情が不明瞭

回答は感情カテゴリ名のみを1語で答えてください（例: "joy", "anger", "neutral"）。`,
        },
        {
          role: 'user',
          content: `以下のテキストの感情を分析してください:\n\n${content}`,
        },
      ],
    })

    const responseText = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral'

    let emotion_tag = EMOTION_TAGS[responseText as keyof typeof EMOTION_TAGS] || 'neutral'

    if (emotion_tag === 'neutral') {
      for (const [key, value] of Object.entries(EMOTION_TAGS)) {
        if (responseText.includes(key)) {
          emotion_tag = value
          break
        }
      }
    }

    console.log(`[Emotion Analysis OpenAI] Content: "${content.substring(0, 50)}..." -> Emotion: ${emotion_tag}`)

    return NextResponse.json({
      emotion_tag,
      confidence: 0.8,
    })
  } catch (error: unknown) {
    console.error('[Emotion Analysis OpenAI] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    return NextResponse.json({
      emotion_tag: 'neutral',
      confidence: 0,
      error: err.message,
    })
  }
}
