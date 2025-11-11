import OpenAI from 'openai'

// AIモデルの種類
export type AIModel = 'gpt-4o-mini' | 'gpt-4o'

// タスクの複雑度に応じたモデル選択
export type TaskComplexity = 'simple' | 'moderate' | 'complex'

/**
 * タスクの複雑度に応じて最適なモデルを選択
 * コスト最適化のため、可能な限り軽量モデルを使用
 */
export function selectModel(complexity: TaskComplexity): AIModel {
  switch (complexity) {
    case 'simple':
      // 単純な感情分析、短文生成など
      return 'gpt-4o-mini'
    case 'moderate':
      // 中程度の分析、インサイト生成など
      return 'gpt-4o-mini'
    case 'complex':
      // 複雑な分析、長文生成、高度な推論など
      // 通常はgpt-4oだが、コスト削減のため4o-miniで対応できる場合が多い
      return 'gpt-4o-mini'
  }
}

/**
 * OpenAIクライアントのシングルトンインスタンス
 */
let openaiInstance: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiInstance
}

/**
 * プロンプトを最適化してトークン数を削減
 */
export function optimizePrompt(prompt: string): string {
  // 不要な空白・改行を削除
  return prompt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
}

/**
 * AIインサイト生成の最適化版
 */
export interface GenerateInsightOptions {
  recentPosts: Array<{ content: string; emotion_tag: string; created_at: string }>
  previousPosts: Array<{ content: string; emotion_tag: string; created_at: string }>
  totalPosts: number
}

export async function generateInsight(options: GenerateInsightOptions) {
  const { recentPosts, previousPosts, totalPosts } = options

  // 感情タグの集計（効率化）
  const recentEmotions: Record<string, number> = {}
  const previousEmotions: Record<string, number> = {}

  recentPosts.forEach(p => {
    recentEmotions[p.emotion_tag] = (recentEmotions[p.emotion_tag] || 0) + 1
  })

  previousPosts.forEach(p => {
    previousEmotions[p.emotion_tag] = (previousEmotions[p.emotion_tag] || 0) + 1
  })

  // 最適化されたプロンプト（トークン数削減）
  const prompt = optimizePrompt(`
あなたは感情分析の専門家です。ユーザーの投稿データから感情の変化とパターンを分析し、共感的で前向きな助言を提供してください。

データ:
- 総投稿数: ${totalPosts}件(過去30日間)
- 最新週: ${recentPosts.length}件
- 前週: ${previousPosts.length}件

最新週の感情:
${Object.entries(recentEmotions).map(([e, c]) => `${e}: ${c}件`).join(', ')}

前週の感情:
${Object.entries(previousEmotions).map(([e, c]) => `${e}: ${c}件`).join(', ')}

最新投稿(最大5件):
${recentPosts.slice(0, 5).map(p => `[${p.emotion_tag}] ${p.content.substring(0, 100)}`).join('\n')}

分析要件:
1. 感情の変化・パターンを具体的に分析
2. 投稿内容から背景状況を推測
3. 共感的で前向きなトーンで記述
4. 1-2文、20-150文字程度で簡潔に

出力形式(必ずこのJSON形式で返してください):
{
  "insight": "分析コメント",
  "emoji": "感情を表す絵文字1つ",
  "trend": "positive/neutral/negative"
}
`)

  const openai = getOpenAI()
  const model = selectModel('moderate')

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 300, // 500から300に削減
    temperature: 0.7,
    response_format: { type: 'json_object' }, // JSON形式を強制
  })

  const responseText = completion.choices[0]?.message?.content || '{}'

  try {
    const result = JSON.parse(responseText)
    return {
      insight: result.insight || '感情の分析を行いました。',
      emoji: result.emoji || '💭',
      trend: result.trend || 'neutral',
    }
  } catch (error) {
    console.error('JSON parse error:', error)
    return {
      insight: '感情の分析を行いました。',
      emoji: '💭',
      trend: 'neutral' as const,
    }
  }
}

/**
 * 簡易的な感情分析（軽量モデル使用）
 */
export async function analyzeEmotion(text: string): Promise<string> {
  const openai = getOpenAI()
  const model = selectModel('simple')

  const prompt = optimizePrompt(`
次のテキストから最も適切な感情タグを1つ選んでください。

テキスト: ${text.substring(0, 500)}

選択肢: joy, sadness, anger, fear, surprise, love, neutral

回答は選択肢の1つのみを返してください(例: joy)
`)

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 10,
    temperature: 0.3,
  })

  const emotion = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral'

  // バリデーション
  const validEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'love', 'neutral']
  return validEmotions.includes(emotion) ? emotion : 'neutral'
}

/**
 * コスト見積もり（概算）
 */
export function estimateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
  // 2024年時点の価格（$per 1M tokens）
  const pricing = {
    'gpt-4o-mini': {
      input: 0.15,
      output: 0.6,
    },
    'gpt-4o': {
      input: 2.5,
      output: 10,
    },
  }

  const modelPricing = pricing[model]
  return (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1_000_000
}
