import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type CooccurrenceResult = {
  emotion: string
  tag: string
  postsAnalyzed: number
  newSynonymsAdded: number
  topWords: Array<{ word: string; freq: number }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const emotionTagMapping: Record<string, string> = {
      joy: 'joy',
      sadness: 'sadness',
      anger: 'anger',
      fear: 'fear',
      neutral: 'neutral',
    }

    const results: CooccurrenceResult[] = []

    for (const [tag, baseEmotion] of Object.entries(emotionTagMapping)) {
      console.log(`[${tag}] fetching posts...`)

      const { data: posts, error: postsError } = await supabaseAdmin
        .from('posts')
        .select('content')
        .eq('emotion_tag', tag)
        .not('content', 'is', null)
        .limit(1000)

      if (postsError) {
        console.error(`[${tag}] failed to fetch posts:`, postsError)
        continue
      }

      if (!posts || posts.length === 0) {
        console.log(`[${tag}] no posts found, skipping`)
        continue
      }

      const allText = posts.map((post) => post.content).join(' ')
      if (!allText.trim()) {
        console.log(`[${tag}] empty content, skipping`)
        continue
      }

      const words = allText
        .replace(/[.,!?;:(){}\[\]"'「」『』、。・\n\r\t]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 2)
        .filter((word) => !/^[0-9]+$/.test(word))

      if (!words.length) {
        console.log(`[${tag}] no valid words extracted, skipping`)
        continue
      }

      const wordFreq: Record<string, number> = {}
      for (const word of words) {
        wordFreq[word] = (wordFreq[word] ?? 0) + 1
      }

      const { data: existingSynonyms } = await supabaseAdmin
        .from('emotion_synonyms')
        .select('synonym')
        .eq('emotion', baseEmotion)

      const existingSet = new Set(existingSynonyms?.map((item) => item.synonym) ?? [])

      const topWords = Object.entries(wordFreq)
        .filter(([word, freq]) => freq >= 3 && !existingSet.has(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, freq]) => ({ word, freq }))

      if (!topWords.length) {
        console.log(`[${tag}] no new words to register`)
        continue
      }

      const maxFreq = topWords[0].freq || 1
      const newSynonyms = topWords.map(({ word, freq }) => ({
        emotion: baseEmotion,
        synonym: word,
        context: 'general',
        weight: Math.min(0.5 + (freq / maxFreq) * 0.3, 0.8),
        source: 'auto_cooccurrence',
      }))

      const { error: insertError } = await supabaseAdmin
        .from('emotion_synonyms')
        .upsert(newSynonyms, {
          onConflict: 'emotion,synonym,context',
          ignoreDuplicates: false,
        })

      if (insertError) {
        console.error(`[${tag}] failed to upsert synonyms:`, insertError)
      } else {
        console.log(
          `[${tag}] added ${newSynonyms.length} synonyms: ${newSynonyms
            .map((synonym) => synonym.synonym)
            .join(', ')}`
        )
      }

      results.push({
        emotion: baseEmotion,
        tag,
        postsAnalyzed: posts.length,
        newSynonymsAdded: newSynonyms.length,
        topWords: topWords.slice(0, 10),
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Cooccurrence analysis failed:', error)

    return new Response(
      JSON.stringify({
        error: 'Cooccurrence analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
