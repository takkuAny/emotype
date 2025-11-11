// app/api/analyze-emotion/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

// 感情タグのマッピング
const EMOTION_TAGS = {
  joy: 'joy',
  happy: 'joy',
  excited: 'joy',
  delighted: 'joy',
  pleased: 'joy',

  sad: 'sadness',
  unhappy: 'sadness',
  depressed: 'sadness',
  down: 'sadness',

  angry: 'anger',
  mad: 'anger',
  irritated: 'anger',
  frustrated: 'anger',
  annoyed: 'anger',

  anxious: 'fear',
  nervous: 'fear',
  worried: 'fear',
  scared: 'fear',
  tense: 'fear',

  neutral: 'neutral',
  calm: 'neutral',
  relaxed: 'neutral',
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not found, returning neutral emotion')
      return NextResponse.json({ emotion_tag: 'neutral', confidence: 0 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // 高速・低コストモデル
      max_tokens: 50,
      temperature: 0,
      system: `あなたは感情分析の専門家です。与えられたテキストから主要な感情を1つだけ選んでください。

感情カテゴリ:
- joy: 喜び、楽しい、嬉しい、幸せ、ワクワク
- sadness: 悲しい、つらい、憂鬱、落ち込む
- anger: 怒り、イライラ、腹立つ、不満、フラストレーション
- fear: 不安、緊張、心配、恐れ、焦り
- neutral: 中立、情報共有、事実の記述、感情が不明瞭

回答は感情カテゴリ名のみを1語で答えてください（例: "joy", "anger", "neutral"）。`,
      messages: [
        {
          role: 'user',
          content: `以下のテキストの感情を分析してください:\n\n${content}`,
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text.trim().toLowerCase() : 'neutral'

    // 感情タグの正規化
    let emotion_tag = EMOTION_TAGS[responseText as keyof typeof EMOTION_TAGS] || 'neutral'

    // 部分一致でも検出
    if (emotion_tag === 'neutral') {
      for (const [key, value] of Object.entries(EMOTION_TAGS)) {
        if (responseText.includes(key)) {
          emotion_tag = value
          break
        }
      }
    }

    console.log(`[Emotion Analysis] Content: "${content.substring(0, 50)}..." -> Emotion: ${emotion_tag}`)

    return NextResponse.json({
      emotion_tag,
      confidence: 0.8, // Claudeの応答なので高信頼度
    })
  } catch (error: unknown) {
    console.error('[Emotion Analysis] Error:', error)
    const err = error instanceof Error ? error : new Error(String(error))
    // エラー時はneutralを返す
    return NextResponse.json({
      emotion_tag: 'neutral',
      confidence: 0,
      error: err.message,
    })
  }
}
