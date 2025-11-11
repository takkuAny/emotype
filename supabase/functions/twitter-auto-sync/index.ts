// supabase/functions/twitter-auto-sync/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SyncSettings = {
  include_tweets: boolean
  include_replies: boolean
  include_retweets: boolean
  include_quotes: boolean
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
  bit_rate?: number
  content_type?: string
  url?: string
}

type TweetMedia = {
  media_key: string
  type?: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
  variants?: TweetMediaVariant[]
}

type TwitterApiIncludes = {
  media?: TweetMedia[]
}

type TwitterApiResponse = {
  data?: TweetData[]
  includes?: TwitterApiIncludes
  meta?: {
    next_token?: string
  }
}



const corsHeaders = {

  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',

}



serve(async (req) => {

  try {

    // CORSヘッダー

    if (req.method === 'OPTIONS') {

      return new Response('ok', { headers: corsHeaders })

    }



    const CRON_TWITTER_TOKEN = Deno.env.get('CRON_TWITTER_TOKEN')



    if (!CRON_TWITTER_TOKEN) {

      console.error('CRON_TWITTER_TOKEN is not set')

      return new Response(

        JSON.stringify({ error: 'Server misconfiguration' }),

        { status: 500, headers: { 'Content-Type': 'application/json' } }

      )

    }



    const cronTokenHeader = req.headers.get('x-cron-token')?.trim() ?? ''
    const authHeader = req.headers.get('authorization')?.trim() ?? ''
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : authHeader
    const providedToken = cronTokenHeader || bearerToken

    if (providedToken !== CRON_TWITTER_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    // Supabase Admin クライアント

    const supabaseAdmin = createClient(

      Deno.env.get('SUPABASE_URL') ?? '',

      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',

      {

        auth: {

          autoRefreshToken: false,

          persistSession: false

        }

      }

    )



    console.log('自動同期開始...')



    // すべてのTwitter接続を取得（sync_settings含む）

    const { data: connections, error: connectionsError } = await supabaseAdmin

      .from('twitter_connections')

      .select('*, sync_settings')



    if (connectionsError || !connections || connections.length === 0) {

      console.log('Twitter接続が見つかりません')

      return new Response(

        JSON.stringify({ message: 'No connections found' }),

        { headers: { 'Content-Type': 'application/json' } }

      )

    }



    console.log(`${connections.length}件の接続を処理中`)



    const results: Array<{

      user_id: string

      success?: boolean

      savedCount?: number

      totalFetched?: number

      error?: string

      message?: string

    }> = []



    for (const connection of connections) {

      try {

        console.log(`ユーザー ${connection.user_id} を同期中...`)



        // アクセストークンの有効期限チェック

        const expiresAt = new Date(connection.expires_at)

        const now = new Date()

        

        let accessToken = connection.access_token



        // トークンが期限切れの場合、リフレッシュ

        if (expiresAt <= now) {

          console.log('トークンをリフレッシュ中...')

          

          const refreshResponse = await fetch('https://api.twitter.com/2/oauth2/token', {

            method: 'POST',

            headers: {

              'Content-Type': 'application/x-www-form-urlencoded',

              'Authorization': `Basic ${btoa(

                `${Deno.env.get('TWITTER_CLIENT_ID')}:${Deno.env.get('TWITTER_CLIENT_SECRET')}`

              )}`

            },

            body: new URLSearchParams({

              grant_type: 'refresh_token',

              refresh_token: connection.refresh_token

            })

          })



          if (!refreshResponse.ok) {

            console.error('トークンリフレッシュ失敗')

            results.push({ user_id: connection.user_id, error: 'Token refresh failed' })

            continue

          }



          const newTokens = await refreshResponse.json()

          accessToken = newTokens.access_token



          // 新しいトークンを保存

          await supabaseAdmin

            .from('twitter_connections')

            .update({

              access_token: newTokens.access_token,

              refresh_token: newTokens.refresh_token,

              expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),

              updated_at: new Date().toISOString()

            })

            .eq('user_id', connection.user_id)

        }



        // 最古のツイートIDを取得（これより古いツイートを取得するため）

        const { data: oldestTweet } = await supabaseAdmin

          .from('twitter_posts')

          .select('tweet_id')

          .eq('user_id', connection.user_id)

          .order('tweet_id', { ascending: true })

          .limit(1)

          .maybeSingle()



        console.log(`最古のツイートID: ${oldestTweet?.tweet_id || 'なし'}`)



        // sync_settingsを取得（デフォルト値を設定）

        const syncSettings: SyncSettings = {
          include_tweets: true,
          include_replies: false,
          include_retweets: false,
          include_quotes: true,
          ...(connection.sync_settings as Partial<SyncSettings> | null | undefined),
        }



        // ツイートをページネーションで取得

        // 注意: レート制限は全ユーザー共有のため、1ユーザーあたりの取得数を制限

        let paginationToken: string | undefined = undefined

        let allTweets: TweetData[] = []

        const allIncludes: TwitterApiIncludes = { media: [] }

        let pageCount = 0

        const maxPages = 1 // 1ユーザーあたり20件まで（レート制限対策）



        while (pageCount < maxPages) {

          const params: Record<string, string> = {

            max_results: '20',

            'tweet.fields': 'created_at,public_metrics,entities,attachments,referenced_tweets',

            'media.fields': 'url,preview_image_url,variants,type',

            'expansions': 'attachments.media_keys,referenced_tweets.id'

          }



          // syncSettingsに基づいてexcludeパラメータを設定

          const excludeTypes: string[] = []

          if (!syncSettings.include_replies) {

            excludeTypes.push('replies')

          }

          if (!syncSettings.include_retweets) {

            excludeTypes.push('retweets')

          }

          if (excludeTypes.length > 0) {

            params.exclude = excludeTypes.join(',')

          }



          // 最古のツイートがある場合、それより古いツイートを取得

          // 一時的にコメントアウトして動作確認

          // if (oldestTweet?.tweet_id && pageCount === 0) {

          //   params.until_id = oldestTweet.tweet_id

          // }



          if (paginationToken) {

            params.pagination_token = paginationToken

          }



          const url = `https://api.twitter.com/2/users/${connection.twitter_user_id}/tweets?` + new URLSearchParams(params)

          console.log(`リクエストURL: ${url}`)



          const tweetsResponse = await fetch(url, {

            headers: {

              'Authorization': `Bearer ${accessToken}`

            }

          })



          if (!tweetsResponse.ok) {

            const errorText = await tweetsResponse.text()

            console.error('ツイート取得失敗:', tweetsResponse.status, errorText)



            // 429エラー（レート制限）の場合は特別に処理

            if (tweetsResponse.status === 429) {

              console.log('Twitter APIのレート制限に達しました。15分後に再試行されます。')

              if (pageCount === 0) {

                results.push({

                  user_id: connection.user_id,

                  success: false,

                  savedCount: 0,

                  totalFetched: 0,

                  message: 'Twitter APIのレート制限に達しました。15分後に自動的に再試行されます。'

                })

                break

              }

              // すでにいくつかツイートを取得している場合は、それを保存して終了

              console.log(`${allTweets.length}件のツイートを取得済み。レート制限のため処理を終了します。`)

              break

            }



            if (pageCount === 0) {

              results.push({ user_id: connection.user_id, error: `Failed to fetch tweets: ${tweetsResponse.status}` })

              break

            }

            // 2ページ目以降のエラーは無視して、取得済みのデータで続行

            break

          }



          const tweetsData = (await tweetsResponse.json()) as TwitterApiResponse

          const tweets = tweetsData.data || []



          if (tweets.length === 0) {

            break // もうツイートがない

          }



          allTweets = allTweets.concat(tweets)



          // includesのマージ

          if (tweetsData.includes?.media) {
            allIncludes.media ??= []
            allIncludes.media = allIncludes.media.concat(tweetsData.includes.media)
          }



          console.log(`ページ ${pageCount + 1}: ${tweets.length}件取得`)



          // 次のページがあるかチェック

          if (!tweetsData.meta?.next_token) {

            break // これ以上ページがない

          }



          paginationToken = tweetsData.meta.next_token

          pageCount++

        }



        // syncSettingsに基づいてフィルタリング（引用ポストと通常の投稿）

        if (syncSettings) {

          allTweets = allTweets.filter((tweet) => {

            const references = tweet.referenced_tweets ?? []
            const hasReferencedTweets = references.length > 0



            // リポストのチェック（retweeted）

            const isRetweet = hasReferencedTweets && references.some((ref) => ref.type === 'retweeted')

            if (isRetweet && !syncSettings.include_retweets) {

              return false

            }



            // 引用ポストのチェック（quoted）

            const isQuote = hasReferencedTweets && references.some((ref) => ref.type === 'quoted')

            if (isQuote && !syncSettings.include_quotes) {

              return false

            }



            // リプライのチェック（replied_to）

            const isReply = hasReferencedTweets && references.some((ref) => ref.type === 'replied_to')

            if (isReply && !syncSettings.include_replies) {

              return false

            }



            // 通常ポスト（referenced_tweetsがない）

            const isOriginalTweet = !hasReferencedTweets

            if (isOriginalTweet && !syncSettings.include_tweets) {

              return false

            }



            return true

          })

        }



        console.log(`合計 ${allTweets.length}件のツイートを取得（フィルタ後）`)



        if (allTweets.length === 0 && pageCount === 0) {

          results.push({ user_id: connection.user_id, error: 'Failed to fetch tweets' })

          continue

        }



        let savedCount = 0



        // 各ツイートを処理

        for (const tweet of allTweets) {

          try {

            // 既存チェック

            const { data: existingTwitterPost } = await supabaseAdmin

              .from('twitter_posts')

              .select('id')

              .eq('tweet_id', tweet.id)

              .maybeSingle()



            if (existingTwitterPost) {

              continue // すでに存在する場合はスキップ

            }



            // メディアURLを取得（画像・動画・GIF対応）

            let mediaUrl = null

            if (tweet.attachments?.media_keys && (allIncludes.media?.length ?? 0) > 0) {

              const media = allIncludes.media?.find((item) =>

                tweet.attachments?.media_keys?.includes(item.media_key)

              )

              if (media) {

                if (media.type === 'photo') {

                  mediaUrl = media.url ?? null

                } else if (media.type === 'video' || media.type === 'animated_gif') {

                  // 動画の場合、最高画質のバリアントを選択

                  const variants = media.variants || []

                  const mp4Variants = variants.filter((variant) => variant.content_type === 'video/mp4')

                  if (mp4Variants.length > 0) {

                    // ビットレートでソートして最高画質を選択

                    const bestVariant = mp4Variants

                      .sort((a, b) => (b.bit_rate || 0) - (a.bit_rate || 0))[0]

                    mediaUrl = bestVariant?.url || null

                  }

                  // 動画のサムネイルも利用可能

                  if (!mediaUrl) {

                    mediaUrl = media.preview_image_url ?? null

                  }

                }

              }

            }



            // twitter_postsに保存

            await supabaseAdmin

              .from('twitter_posts')

              .insert({

                user_id: connection.user_id,

                tweet_id: tweet.id,

                text: tweet.text,

                created_at: tweet.created_at,

                retweet_count: tweet.public_metrics?.retweet_count || 0,

                like_count: tweet.public_metrics?.like_count || 0,

                reply_count: tweet.public_metrics?.reply_count || 0,

                impression_count: tweet.public_metrics?.impression_count || 0,

                media_urls: mediaUrl ? [mediaUrl] : null

              })



            // ツイートテキストからURLを除去

            const cleanText = tweet.text.replace(/https?:\/\/\S+/g, '').trim()



            // postsテーブルに既に存在するか確認（クリーンなテキストで検索）

            const { data: existingPost } = await supabaseAdmin

              .from('posts')

              .select('id')

              .eq('user_id', connection.user_id)

              .eq('source', 'twitter')

              .eq('content', cleanText)

              .maybeSingle()



            if (existingPost) {

              continue // 既に存在する場合はスキップ

            }



            // 感情分析を実行（OpenAI版）

            let emotionTag = 'neutral'

            try {

              const emotionResponse = await fetch(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/api/analyze-emotion-openai`, {

                method: 'POST',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ content: cleanText }),

              })



              if (emotionResponse.ok) {

                const emotionData = await emotionResponse.json()

                emotionTag = emotionData.emotion_tag || 'neutral'

              }

            } catch (e) {

              console.error('感情分析エラー:', e)

            }



            // postsテーブルに保存

            const { data: post } = await supabaseAdmin

              .from('posts')

              .insert({

                user_id: connection.user_id,

                content: cleanText,

                image_url: mediaUrl,

                emotion_tag: emotionTag,

                created_at: tweet.created_at,

                source: 'twitter'

              })

              .select()

              .single()



            // エンベディング生成（Next.js APIを呼び出し）

            if (post) {

              try {

                const embeddingResponse = await fetch(`${Deno.env.get('NEXT_PUBLIC_APP_URL')}/api/generate-embedding`, {

                  method: 'POST',

                  headers: { 'Content-Type': 'application/json' },

                  body: JSON.stringify({

                    postId: post.id,

                    content: post.content,

                  }),

                })



                if (!embeddingResponse.ok) {

                  const errorText = await embeddingResponse.text()

                  console.error('エンベディング生成エラー:', errorText)

                } else {

                  const result = await embeddingResponse.json()

                  console.log(`エンベディング生成成功: postId=${post.id}, dim=${result.dim}`)

                }

              } catch (e) {

                console.error('エンベディング生成エラー:', e)

              }

            }



            savedCount++



          } catch (error) {

            console.error('ツイート処理エラー:', error)

          }

        }



        results.push({

          user_id: connection.user_id,

          success: true,

          savedCount,

          totalFetched: allTweets.length

        })



      } catch (error) {

        console.error(`ユーザー ${connection.user_id} の同期エラー:`, error)

        results.push({

          user_id: connection.user_id,

          error: error instanceof Error ? error.message : 'Unknown error'

        })

      }

    }



    console.log('自動同期完了:', results)



    return new Response(

      JSON.stringify({

        success: true,

        processedConnections: connections.length,

        results

      }),

      { headers: { 'Content-Type': 'application/json' } }

    )



  } catch (error) {

    console.error('自動同期エラー:', error)

    return new Response(

      JSON.stringify({

        error: 'Auto sync failed',

        details: error instanceof Error ? error.message : 'Unknown error'

      }),

      { status: 500, headers: { 'Content-Type': 'application/json' } }

    )

  }

})
