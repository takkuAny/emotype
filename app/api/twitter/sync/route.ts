// app/api/twitter/sync/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

interface SyncSettings {
  include_tweets?: boolean
  include_replies?: boolean
  include_retweets?: boolean
  include_quotes?: boolean
}

type TweetReferenceType = 'retweeted' | 'quoted' | 'replied_to'

type TweetReference = {
  id: string
  type: TweetReferenceType
}

type TweetMetrics = {
  retweet_count?: number
  reply_count?: number
  like_count?: number
  impression_count?: number
}

type TweetAttachments = {
  media_keys?: string[]
}

type TweetData = {
  id: string
  text: string
  created_at?: string
  public_metrics?: TweetMetrics
  attachments?: TweetAttachments
  referenced_tweets?: TweetReference[]
}

type TweetMediaVariant = {
  content_type?: string
  url?: string
  bit_rate?: number
}

type TweetMedia = {
  media_key: string
  type?: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
  width?: number
  height?: number
  variants?: TweetMediaVariant[]
}

type TwitterApiIncludes = {
  media?: TweetMedia[]
  tweets?: TweetData[]
}

type TwitterApiResponse = {
  data?: TweetData[]
  includes?: TwitterApiIncludes
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      maxResults?: number
      syncSettings?: SyncSettings
    }
    const { maxResults = 20, syncSettings } = body

    // 笨・繧ｵ繝ｼ繝舌・蛛ｴSupabase繧ｯ繝ｩ繧､繧｢繝ｳ繝茨ｼ・ookieMethods縺ｧ蝙軌K・・
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            (await cookieStore).set({ name, value, ...options })
          },
          async remove(name: string, options: CookieOptions) {
            (await cookieStore).set({ name, value: '', ...options })
          },
        },
      }
    )

    // 笨・窶懃悄豁｣繝ｦ繝ｼ繧ｶ繝ｼ窶昴・讀懆ｨｼ・・etUser繧貞ｿ・★菴ｿ縺・ｼ・
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 笨・X騾｣謳ｺ諠・ｱ縺ｮ蜿門ｾ暦ｼ・witter_user_id 縺ｨ繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ蜿門ｾ暦ｼ・
    const { data: conn, error: connErr } = await supabase
      .from('twitter_connections')
      .select('twitter_user_id, twitter_username, access_token, expires_at, refresh_token')
      .eq('user_id', user.id)
      .maybeSingle()

    if (connErr) {
      return NextResponse.json({ error: '連携情報の取得に失敗しました' }, { status: 500 })
    }
    if (!conn?.twitter_user_id || !conn?.access_token) {
      return NextResponse.json({ error: 'Xアカウントが未連携です' }, { status: 400 })
    }
    const twitterUserId = conn.twitter_user_id as string
    let accessToken = conn.access_token as string

    // 繝医・繧ｯ繝ｳ縺ｮ譛牙柑譛滄剞繝√ぉ繝・け縺ｨ繝ｪ繝輔Ξ繝・す繝･
    const expiresAt = new Date(conn.expires_at)
    const now = new Date()

    if (expiresAt <= now) {
      console.log('アクセストークンの有効期限切れ。リフレッシュを実行します...')
      const refreshResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: conn.refresh_token,
        }),
      })

      if (!refreshResponse.ok) {
        console.error('トークンの更新に失敗しました')
        return NextResponse.json({ error: 'トークンの更新に失敗しました。再度X連携してください。' }, { status: 401 })
      }
      const newTokens = await refreshResponse.json()
      accessToken = newTokens.access_token

      // 譁ｰ縺励＞繝医・繧ｯ繝ｳ繧剃ｿ晏ｭ・
      await supabase
        .from('twitter_connections')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token,
          expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    }

    // 博 繝・う繝ｼ繝亥叙蠕暦ｼ・Auth 2.0繝医・繧ｯ繝ｳ繧剃ｽｿ逕ｨ縲√Γ繝・ぅ繧｢諠・ｱ縺ｨ蠑慕畑繝・う繝ｼ繝医ｂ蜷ｫ繧・・
    const params = new URLSearchParams({
      max_results: String(Math.min(Math.max(maxResults, 5), 100)),
      'tweet.fields': 'created_at,public_metrics,attachments,referenced_tweets',
      'media.fields': 'url,preview_image_url,variants,type',
      'expansions': 'attachments.media_keys,referenced_tweets.id,referenced_tweets.id.attachments.media_keys'
    })

    // syncSettings縺ｫ蝓ｺ縺･縺・※繝輔ぅ繝ｫ繧ｿ繧定ｨｭ螳・
    // exclude 繝代Λ繝｡繝ｼ繧ｿ縺ｮ蛟､繧呈ｧ狗ｯ・
    const excludeTypes: string[] = []
    if (syncSettings && !syncSettings.include_replies) {
      excludeTypes.push('replies')
    }
    if (syncSettings && !syncSettings.include_retweets) {
      excludeTypes.push('retweets')
    }

    if (excludeTypes.length > 0) {
      params.set('exclude', excludeTypes.join(','))
    }
    const url = `https://api.x.com/2/users/${twitterUserId}/tweets?${params.toString()}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      console.error('Twitter API error:', res.status, await res.text())
      if (res.status === 429) {
        const resetTime = res.headers.get('x-rate-limit-reset')
        let retryAt: string | null = null
        let retryAfterMinutes: number | null = null

        if (resetTime) {
          const resetTimestamp = Number.parseInt(resetTime, 10)
          if (!Number.isNaN(resetTimestamp)) {
            const resetDate = new Date(resetTimestamp * 1000)
            retryAt = resetDate.toISOString()
            const minutes = Math.ceil((resetDate.getTime() - Date.now()) / 60000)
            retryAfterMinutes = Math.max(1, minutes)
          }
        }

        return NextResponse.json(
          {
            error: 'rate_limit',
            message: 'Twitter API rate limit reached',
            retryAt,
            retryAfterMinutes,
          },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: 'ツイートの取得に失敗しました' }, { status: 500 })
    }

    const json = (await res.json()) as TwitterApiResponse
    const tweetsData: TweetData[] = json?.data ?? []
    const includesData: TwitterApiIncludes = json?.includes ?? {}

    let tweets = tweetsData.map((t) => ({
      id: t.id,
      text: t.text,
      created_at: t.created_at,
      public_metrics: t.public_metrics ?? {},
      attachments: t.attachments,
      referenced_tweets: t.referenced_tweets,
    }))

    // syncSettings縺ｫ蝓ｺ縺･縺・※縲・壼ｸｸ縺ｮ謚慕ｨｿ縺ｨ蠑慕畑繝昴せ繝医ｒ繝輔ぅ繝ｫ繧ｿ
    if (syncSettings) {
      tweets = tweets.filter((tweet) => {
        const references = tweet.referenced_tweets ?? []
        const hasReferencedTweets = references.length > 0

        // 繝ｪ繝昴せ繝医・繝√ぉ繝・け・・etweeted・・
        const isRetweet = hasReferencedTweets && references.some((ref) => ref.type === 'retweeted')
        if (isRetweet && !syncSettings.include_retweets) {
          return false
        }

        // 蠑慕畑繝昴せ繝医・繝√ぉ繝・け・・uoted・・
        const isQuote = hasReferencedTweets && references.some((ref) => ref.type === 'quoted')
        if (isQuote && !syncSettings.include_quotes) {
          return false
        }

        // 繝ｪ繝励Λ繧､縺ｮ繝√ぉ繝・け・・eplied_to・・
        const isReply = hasReferencedTweets && references.some((ref) => ref.type === 'replied_to')
        if (isReply && !syncSettings.include_replies) {
          return false
        }

        // 騾壼ｸｸ縺ｮ謚慕ｨｿ縺ｮ繝√ぉ繝・け・・eferenced_tweets縺後↑縺・ｂ縺ｮ・・
        const isOriginalTweet = !hasReferencedTweets
        if (isOriginalTweet && !syncSettings.include_tweets) {
          return false
        }

        return true
      })
    }

    if (!tweets.length) {
      return NextResponse.json({ savedCount: 0, skippedCount: 0 }, { status: 200 })
    }

    // 笨・RLS繧帝壹☆縺溘ａ縺ｫ蠢・★ user_id 繧剃ｻ倅ｸ弱＠縺ｦ菫晏ｭ・
    const rows = tweets.map((t) => ({
      user_id: user.id,
      tweet_id: t.id,
      text: t.text,
      created_at: t.created_at,
      like_count: t.public_metrics?.like_count ?? 0,
      retweet_count: t.public_metrics?.retweet_count ?? 0,
      reply_count: t.public_metrics?.reply_count ?? 0,
      impression_count: t.public_metrics?.impression_count ?? 0,
    }))

    // 笨・驥崎､・屓驕ｿ (user_id, tweet_id) 縺ｧ upsert
    const { data, error: upsertErr } = await supabase
      .from('twitter_posts')
      .upsert(rows, { onConflict: 'user_id,tweet_id', ignoreDuplicates: false })
      .select('tweet_id')

    if (upsertErr) {
      // 縺薙％縺ｧ 42501 縺悟・繧句ｴ蜷・竊・user_id 譛ｪ險ｭ螳・or 繝昴Μ繧ｷ繝ｼ荳崎ｶｳ
      console.error('twitter_posts upsert error:', upsertErr)
      return NextResponse.json({ error: upsertErr.message }, { status: 400 })
    }

    const savedCount = data?.length ?? 0
    const skippedCount = Math.max(0, tweets.length - savedCount)

    // 笨・posts繝・・繝悶Ν縺ｫ繧ゆｿ晏ｭ假ｼ域､懃ｴ｢繝ｻ諢滓ュ蛻・梵逕ｨ・・
    if (savedCount > 0) {
      for (const tweet of tweets) {
        try {
          // 繝・う繝ｼ繝医ユ繧ｭ繧ｹ繝医ｒ縺昴・縺ｾ縺ｾ菴ｿ逕ｨ・・RL繧ゆｿ晄戟・・
          const content = tweet.text.trim()

          // 譌｢縺ｫ蟄伜惠縺吶ｋ縺狗｢ｺ隱・
          const { data: existingPost } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user.id)
            .eq('source', 'twitter')
            .eq('content', content)
            .maybeSingle()

          if (existingPost) {
            continue // 譌｢縺ｫ蟄伜惠縺吶ｋ蝣ｴ蜷医・繧ｹ繧ｭ繝・・
          }

          // 繝｡繝・ぅ繧｢URL繧貞叙蠕暦ｼ育判蜒上・蜍慕判繝ｻGIF蟇ｾ蠢懶ｼ・
          let mediaUrl = null
          if (tweet.attachments?.media_keys && includesData.media) {
            const mediaKeys = tweet.attachments.media_keys
            const media = includesData.media.find(
              (m: { media_key: string; url?: string | null; preview_image_url?: string | null }) =>
                mediaKeys.includes(m.media_key)
            )
            if (media) {

              if (media.type === 'photo') {
                mediaUrl = media.url
              } else if (media.type === 'video' || media.type === 'animated_gif') {
                // 蜍慕判縺ｮ蝣ｴ蜷医∵怙鬮倡判雉ｪ縺ｮ繝舌Μ繧｢繝ｳ繝医ｒ驕ｸ謚・
                const variants = media.variants || []
                const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4')
                if (mp4Variants.length > 0) {
                  // 繝薙ャ繝医Ξ繝ｼ繝医〒繧ｽ繝ｼ繝医＠縺ｦ譛鬮倡判雉ｪ繧帝∈謚・
                  const bestVariant = mp4Variants.sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0))[0]
                  mediaUrl = bestVariant.url
                }
                // 蜍慕判縺ｮ繧ｵ繝繝阪う繝ｫ繧ょ茜逕ｨ蜿ｯ閭ｽ
                if (!mediaUrl) {
                  mediaUrl = media.preview_image_url
                }
              }
            }
          }

          // 蠑慕畑繝・う繝ｼ繝医・繝｡繝・ぅ繧｢繧貞叙蠕・
          if (!mediaUrl && includesData.tweets) {
            // 蠑慕畑繝・う繝ｼ繝茨ｼ・uoted tweet・峨・蝣ｴ蜷・
            const quotedTweet = includesData.tweets.find(
              (t) =>
                tweet.text.includes(t.id) ||
                tweet.referenced_tweets?.some((ref) => ref.type === 'quoted' && ref.id === t.id)
            )

            if (quotedTweet?.attachments?.media_keys && includesData.media) {
              const quotedMediaKeys = quotedTweet.attachments.media_keys
              const quotedMedia = includesData.media.find(
                (m: { media_key: string; type?: string; url?: string | null; preview_image_url?: string | null }) =>
                  quotedMediaKeys.includes(m.media_key)
              )
              if (quotedMedia) {
                if (quotedMedia.type === 'photo') {
                  mediaUrl = quotedMedia.url
                } else if (quotedMedia.type === 'video' || quotedMedia.type === 'animated_gif') {
                  const variants = quotedMedia.variants || []
                  const mp4Variants = variants.filter((v) => v.content_type === 'video/mp4')
                  if (mp4Variants.length > 0) {
                    const bestVariant = mp4Variants.sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0))[0]
                    mediaUrl = bestVariant.url
                  }
                  if (!mediaUrl) {
                    mediaUrl = quotedMedia.preview_image_url
                  }
                }
              }
            }
          }

          // 諢滓ュ蛻・梵繧貞ｮ溯｡鯉ｼ・penAI迚茨ｼ・
          let emotionTag = 'neutral'
          try {
            const emotionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analyze-emotion-openai`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: content }),
            })

            if (emotionResponse.ok) {
              const emotionData = await emotionResponse.json()
              emotionTag = emotionData.emotion_tag || 'neutral'
            }
          } catch (e) {
            console.error('感情分析APIの呼び出しでエラーが発生しました:', e)
          }

          // posts繝・・繝悶Ν縺ｫ菫晏ｭ・
          const { data: post, error: postErr } = await supabase
            .from('posts')
            .insert({
              user_id: user.id,
              content: content,
              image_url: mediaUrl,
              emotion_tag: emotionTag,
              created_at: tweet.created_at,
              source: 'twitter'
            })
            .select()
            .single()

          if (postErr) {
            console.error('posts insert error:', postErr)
            continue
          }

          // 繧ｨ繝ｳ繝吶ョ繧｣繝ｳ繧ｰ逕滓・繧貞酔譛溽噪縺ｫ螳溯｡・
          if (post) {
            try {
              const embeddingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-embedding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postId: post.id,
                  content: post.content,
                }),
              })

              if (!embeddingResponse.ok) {
                const errorText = await embeddingResponse.text()
                console.error('埋め込み生成APIでエラーが発生しました:', errorText)
              } else {
                const result = await embeddingResponse.json()
                console.log(`埋め込み生成成功: postId=${post.id}, dim=${result.dim}`)
              }
            } catch (e) {
              console.error('埋め込み生成APIの呼び出しに失敗しました:', e)
            }
          }
        } catch (e) {
          console.error('post挿入処理でエラーが発生しました:', e)
        }
      }
    }

    return NextResponse.json({ savedCount, skippedCount }, { status: 200 })
  } catch (error: unknown) {
    console.error('sync handler error:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
