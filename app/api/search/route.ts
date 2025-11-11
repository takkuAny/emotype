// /app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
const MATCH_COUNT_DEFAULT = 10
const MATCH_THRESHOLD_DEFAULT = 0.3 // 繧医ｊ菴弱￥險ｭ螳壹＠縺ｦ遒ｺ螳溘↓繝偵ャ繝医☆繧九ｈ縺・↓
const MIN_SIMILARITY_DISPLAY = 0.25 // 縺輔ｉ縺ｫ菴弱￥險ｭ螳・
const MODEL = process.env.VOYAGE_MODEL || 'voyage-2'
const DB_DIM = 1024

type SearchResult = {
  similarity: number | null
} & Record<string, unknown>

// 繧ｨ繝ｳ繝吶ョ繧｣繝ｳ繧ｰ繧呈ｭ｣隕丞喧
function normalize(v: number[]) {
  const n = Math.sqrt(v.reduce((a, x) => a + x * x, 0))
  return v.map(x => x / n)
}

// 繧ｰ繝ｭ繝ｼ繝舌Ν繧ｭ繝｣繝・す繝･・医Γ繝｢繝ｪ繧ｭ繝｣繝・す繝･・・
let emotionExpansionsCache: Record<string, string[]> | null = null
let cacheLastUpdated: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5蛻・俣繧ｭ繝｣繝・す繝･

// DB縺九ｉ諢滓ュ霎樊嶌繧定ｪｭ縺ｿ霎ｼ繧
async function loadEmotionExpansions(): Promise<Record<string, string[]>> {
  // 繧ｭ繝｣繝・す繝･縺梧怏蜉ｹ縺ｪ蝣ｴ蜷医・蜀榊茜逕ｨ
  const now = Date.now()
  if (emotionExpansionsCache && (now - cacheLastUpdated) < CACHE_TTL) {
    return emotionExpansionsCache
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabase
      .from('emotion_synonyms')
      .select('emotion, synonym, context, weight')
      .order('weight', { ascending: false })

    if (error) {
      console.error('Failed to load emotion synonyms:', error)
      return {} // 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
    }

    // emotion -> synonyms[] 縺ｮ蠖｢蠑上↓螟画鋤
    const expansions: Record<string, string[]> = {}
    data?.forEach(row => {
      if (!expansions[row.emotion]) {
        expansions[row.emotion] = []
      }
      expansions[row.emotion].push(row.synonym)
    })

    // 繧ｭ繝｣繝・す繝･譖ｴ譁ｰ
    emotionExpansionsCache = expansions
    cacheLastUpdated = now

    console.log(`[Search] Loaded ${Object.keys(expansions).length} emotion expansions from DB`)
    return expansions
  } catch (e) {
    console.error('Error loading emotion expansions:', e)
    return {}
  }
}

// 讀懃ｴ｢繧ｯ繧ｨ繝ｪ繧呈僑蠑ｵ縺励※縲√ｈ繧願憶縺・沂繧∬ｾｼ縺ｿ繧貞ｾ励ｋ
async function expandQuery(query: string): Promise<string> {
  const trimmed = query.trim()

  // 遏ｭ縺吶℃繧九け繧ｨ繝ｪ縺ｯ縺昴・縺ｾ縺ｾ霑斐☆
  if (trimmed.length < 2) {
    return trimmed
  }

  // DB縺九ｉ諢滓ュ霎樊嶌繧定ｪｭ縺ｿ霎ｼ繧
  const emotionExpansions = await loadEmotionExpansions()

  // 霎樊嶌縺檎ｩｺ縺ｮ蝣ｴ蜷医・縺昴・縺ｾ縺ｾ霑斐☆・医ヵ繧ｩ繝ｼ繝ｫ繝舌ャ繧ｯ・・
  if (Object.keys(emotionExpansions).length === 0) {
    return trimmed
  }

  // 繧ｯ繧ｨ繝ｪ縺ｫ蜷ｫ縺ｾ繧後ｋ諢滓ュ隱槭ｒ讀懷・
  const lowerQuery = trimmed.toLowerCase()
  const matchedSynonyms: string[] = []

  // 蜷・─諠・→縺昴・蜷檎ｾｩ隱槭ｒ繝√ぉ繝・け
  for (const [emotion, synonyms] of Object.entries(emotionExpansions)) {
    const emotionLower = emotion.toLowerCase()

    // 繧ｯ繧ｨ繝ｪ縺ｫ諢滓ュ隱槭′蜷ｫ縺ｾ繧後※縺・ｋ縺具ｼ磯Κ蛻・ｸ閾ｴ・・
    if (lowerQuery.includes(emotionLower)) {
      // weight鬆・ｼ磯剄鬆・ｼ峨〒繧ｽ繝ｼ繝域ｸ医∩縺ｪ縺ｮ縺ｧ縲∽ｸ贋ｽ阪・蜷檎ｾｩ隱槭ｒ霑ｽ蜉
      matchedSynonyms.push(...synonyms.slice(0, 8)) // 譛螟ｧ8縺､縺ｮ蜷檎ｾｩ隱・
      break // 譛蛻昴↓繝槭ャ繝√＠縺滓─諠・・縺ｿ菴ｿ逕ｨ・郁､・尅蛹悶ｒ驕ｿ縺代ｋ・・
    }

    // 蜷檎ｾｩ隱槭′繧ｯ繧ｨ繝ｪ縺ｫ蜷ｫ縺ｾ繧後※縺・ｋ縺・
    for (const synonym of synonyms) {
      const synonymLower = synonym.toLowerCase()
      if (lowerQuery.includes(synonymLower)) {
        // 縺薙・諢滓ュ縺ｮ蜷檎ｾｩ隱槭ｒ霑ｽ蜉
        matchedSynonyms.push(...synonyms.slice(0, 8))
        break
      }
    }

    if (matchedSynonyms.length > 0) {
      break // 譛蛻昴↓繝槭ャ繝√＠縺滓─諠・・縺ｿ
    }
  }

  // 繝槭ャ繝√＠縺溷酔鄒ｩ隱槭′縺ゅｋ蝣ｴ蜷医∵僑蠑ｵ繧ｯ繧ｨ繝ｪ繧剃ｽ懈・
  if (matchedSynonyms.length > 0) {
    // 驥崎､・ｒ髯､蜴ｻ
    const uniqueSynonyms = Array.from(new Set(matchedSynonyms))

    // 蜈・・繧ｯ繧ｨ繝ｪ + 荳贋ｽ榊酔鄒ｩ隱橸ｼ域怙螟ｧ5縺､・・
    return `${trimmed} ${uniqueSynonyms.slice(0, 5).join(' ')}`
  }

  // 繝槭ャ繝√＠縺ｪ縺・ｴ蜷医・蜈・・繧ｯ繧ｨ繝ｪ繧偵◎縺ｮ縺ｾ縺ｾ霑斐☆
  // Voyage AI縺ｯ螟夊ｨ隱槫ｯｾ蠢懊＠縺ｦ縺翫ｊ縲∬恭隱槭・譌･譛ｬ隱槭・蜷檎ｾｩ隱槭ｂ逅・ｧ｣縺励※縺・ｋ
  return trimmed
}

export async function POST(req: NextRequest) {
  try {
    const { query, matchCount, matchThreshold } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }
    if (!process.env.VOYAGE_API_KEY) {
      return NextResponse.json({ error: 'VOYAGE_API_KEY is missing' }, { status: 500 })
    }

    // 隱崎ｨｼ貂医∩繝ｦ繝ｼ繧ｶ繝ｼ縺ｮSupabase繧ｯ繝ｩ繧､繧｢繝ｳ繝医ｒ菴懈・・・LS縺碁←逕ｨ縺輔ｌ繧具ｼ・
    const cookieStore = await cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // 繝ｦ繝ｼ繧ｶ繝ｼ隱崎ｨｼ繧堤｢ｺ隱・
    const { data: { session } } = await sb.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 繧ｯ繧ｨ繝ｪ繧呈僑蠑ｵ縺励※繧医ｊ濶ｯ縺・沂繧∬ｾｼ縺ｿ繧堤函謌・
    const expandedQuery = await expandQuery(query)
    console.log(`[Search] Original query: "${query}" -> Expanded: "${expandedQuery}"`)

    // Voyage REST API繧剃ｽｿ逕ｨ
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: [expandedQuery],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[Search] Voyage API error: ${text}`)
      return NextResponse.json({ error: `Voyage API error: ${text}` }, { status: 500 })
    }

    const json = await res.json()
    const raw: number[] = json.data[0].embedding
    const vec = normalize(raw)

    if (!Array.isArray(vec)) {
      return NextResponse.json({ error: 'embedding generation failed' }, { status: 500 })
    }
    if (vec.length !== DB_DIM) {
      return NextResponse.json({ error: `embedding dims ${vec.length}, expected ${DB_DIM}` }, { status: 500 })
    }
    
    // 繝・ヰ繝・げ: 繝・・繧ｿ繝吶・繧ｹ縺ｮ迥ｶ諷九ｒ遒ｺ隱・
    const { count: postsCount } = await sb
      .from('posts')
      .select('*', { count: 'exact', head: true })
    
    const { count: embeddingCount } = await sb
      .from('posts')
      .select('embedding', { count: 'exact', head: true })
      .not('embedding', 'is', null)
    
    // 繧､繝ｩ繧､繝ｩ/諤偵ｊ髢｢騾｣縺ｮ謚慕ｨｿ繧堤｢ｺ隱・
    const { count: angerPostsCount } = await sb
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('emotion_tag', 'anger')
    
    // content縺ｫ縲後う繝ｩ繧､繝ｩ縲阪梧偵ｊ縲阪隈it縲阪轡ocker縲阪卦ypeScript縲阪′蜷ｫ縺ｾ繧後ｋ謚慕ｨｿ
    const { data: irritationPosts } = await sb
      .from('posts')
      .select('id, content, emotion_tag, embedding')
      .or('content.ilike.%繧､繝ｩ繧､繝ｩ%,content.ilike.%Git%,content.ilike.%Docker%,content.ilike.%TypeScript%,emotion_tag.eq.anger')
      .limit(10)
    
    const irritationWithEmbeddings = irritationPosts?.filter(p => p.embedding !== null).length || 0
    
    console.log(`[Search] Posts: ${postsCount}, With embeddings: ${embeddingCount}`)
    console.log(`[Search] Anger tag: ${angerPostsCount}, Irritation posts: ${irritationPosts?.length || 0}, With embeddings: ${irritationWithEmbeddings}`)
    if (irritationPosts && irritationPosts.length > 0) {
      console.log(`[Search] Irritation post contents:`, irritationPosts.map(p => ({
        content: p.content.substring(0, 40),
        hasEmbedding: p.embedding !== null
      })))
    }
    
    const actualThreshold = matchThreshold ?? MATCH_THRESHOLD_DEFAULT
    const { data, error } = await sb.rpc('search_posts', {
      query_embedding: vec,
      match_threshold: actualThreshold,
      match_count: (matchCount ?? MATCH_COUNT_DEFAULT) * 3, // 繧医ｊ螟壹￥縺ｮ蛟呵｣懊ｒ蜿門ｾ・
    })

    if (error) {
      console.error('[Search] RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Search] Found ${data?.length ?? 0} results with threshold ${actualThreshold}`)

    // 邨先棡繧帝｡樔ｼｼ蠎ｦ縺ｧ繧ｽ繝ｼ繝・
    let filteredResults: SearchResult[] = (data ?? [])
      .map((item: SearchResult) => ({
        ...item,
        similarity: typeof item.similarity === 'number' ? item.similarity : 0
      }))
      .sort((a: SearchResult, b: SearchResult) => (b.similarity ?? 0) - (a.similarity ?? 0)) // 鬘樔ｼｼ蠎ｦ縺ｮ鬮倥＞鬆・

    // 邨先棡縺悟ｰ代↑縺・ｴ蜷医・明蛟､繧呈ｮｵ髫守噪縺ｫ荳九￡縺ｦ蜀肴､懃ｴ｢
    if (filteredResults.length === 0) {
      const fallbackThresholds = [
        0.35,
        0.3,
        0.25,
        0.2,
        0.15,
        0.1,
      ]
      
      for (const fallbackThreshold of fallbackThresholds) {
        console.log(`[Search] No results, trying threshold ${fallbackThreshold}...`)
        
        const { data: fallbackData, error: fallbackError } = await sb.rpc('search_posts', {
          query_embedding: vec,
          match_threshold: fallbackThreshold,
          match_count: (matchCount ?? MATCH_COUNT_DEFAULT) * 5,
        })
        
        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          filteredResults = fallbackData
            .map((item: SearchResult) => ({
              ...item,
              similarity: typeof item.similarity === 'number' ? item.similarity : 0
            }))
            .sort((a: SearchResult, b: SearchResult) => (b.similarity ?? 0) - (a.similarity ?? 0))
          
          console.log(`[Search] Found ${filteredResults.length} results with threshold ${fallbackThreshold}`)
          break
        }
      }
    }

    // 譛菴朱｡樔ｼｼ蠎ｦ縺ｧ繝輔ぅ繝ｫ繧ｿ繝ｪ繝ｳ繧ｰ・医◆縺縺励∫ｵ先棡縺後≠繧句ｴ蜷医・陦ｨ遉ｺ・・
    if (filteredResults.length > 0) {
      filteredResults = filteredResults
        .filter((item: SearchResult) => item.similarity !== null && item.similarity >= MIN_SIMILARITY_DISPLAY)
        .slice(0, matchCount ?? MATCH_COUNT_DEFAULT)
    }

    return NextResponse.json({ 
      results: filteredResults,
      debug: {
        originalQuery: query,
        expandedQuery: expandedQuery,
        threshold: actualThreshold,
        resultCount: filteredResults.length,
        minSimilarity: MIN_SIMILARITY_DISPLAY,
        postsCount,
        embeddingCount,
        angerPostsCount,
        irritationPostsCount: irritationPosts?.length || 0,
        irritationWithEmbeddings,
        allResultsCount: data?.length || 0
      }
    })
  } catch (error: unknown) {
    console.error('[Search] Error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
