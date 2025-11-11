import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 繧ｵ繝ｼ繝薙せ繝ｭ繝ｼ繝ｫ繧ｭ繝ｼ縺ｧ螳溯｡鯉ｼ・ron Job縺ｫ縺ｯ隱崎ｨｼ縺後↑縺・◆繧・ｼ・
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Cron Job縺九ｉ縺ｮ繝ｪ繧ｯ繧ｨ繧ｹ繝医ｒ讀懆ｨｼ
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_TWITTER_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Auto sync job started...')

    // 縺吶∋縺ｦ縺ｮTwitter謗･邯壹ｒ蜿門ｾ・
    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from('twitter_connections')
      .select('*')

    if (connectionsError || !connections || connections.length === 0) {
      console.log('Twitter connections not found')
      return NextResponse.json({ message: 'No connections found' })
    }

    console.log(`${connections.length} connection(s) to process`)

    const results = []

    for (const connection of connections) {
      try {
        console.log(`Starting sync for user ${connection.user_id}...`)

        // 繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ縺ｮ譛牙柑譛滄剞繝√ぉ繝・け
        const expiresAt = new Date(connection.expires_at)
        const now = new Date()
        
        let accessToken = connection.access_token

        // 繝医・繧ｯ繝ｳ縺梧悄髯仙・繧後・蝣ｴ蜷医√Μ繝輔Ξ繝・す繝･
        if (expiresAt <= now) {
          console.log('Access token expired. Refreshing token...')
          
          const refreshResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(
                `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
              ).toString('base64')}`
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: connection.refresh_token
            })
          })

          if (!refreshResponse.ok) {
            console.error('トークンのリフレッシュに失敗しました')
            results.push({ user_id: connection.user_id, error: 'Token refresh failed' })
            continue
          }

          const newTokens = await refreshResponse.json()
          accessToken = newTokens.access_token

          // 譁ｰ縺励＞繝医・繧ｯ繝ｳ繧剃ｿ晏ｭ・
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

        // 譛譁ｰ20莉ｶ縺ｮ繝・う繝ｼ繝医ｒ蜿門ｾ・
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${connection.twitter_user_id}/tweets?` + new URLSearchParams({
            max_results: '20',
            'tweet.fields': 'created_at,public_metrics,entities,attachments',
            'media.fields': 'url,preview_image_url',
            'expansions': 'attachments.media_keys'
          }),
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )

        if (!tweetsResponse.ok) {
          console.error('ツイートの取得に失敗しました')
          results.push({ user_id: connection.user_id, error: 'Failed to fetch tweets' })
          continue
        }

        const tweetsData = await tweetsResponse.json()
        const tweets = tweetsData.data || []
        const includes = tweetsData.includes || {}

        let savedCount = 0

        // 蜷・ヤ繧､繝ｼ繝医ｒ蜃ｦ逅・
        for (const tweet of tweets) {
          try {
            // 譌｢蟄倥メ繧ｧ繝・け
            const { data: existingTwitterPost } = await supabaseAdmin
              .from('twitter_posts')
              .select('id')
              .eq('tweet_id', tweet.id)
              .maybeSingle()

            if (existingTwitterPost) {
              continue // 縺吶〒縺ｫ蟄伜惠縺吶ｋ蝣ｴ蜷医・繧ｹ繧ｭ繝・・
            }

            // 繝｡繝・ぅ繧｢URL繧貞叙蠕・
            let mediaUrl = null
            if (tweet.attachments && tweet.attachments.media_keys && includes.media) {
              const media = includes.media.find(
                (m: { media_key: string; url?: string | null; preview_image_url?: string | null }) =>
                  tweet.attachments.media_keys.includes(m.media_key)
              )
              if (media) {
                mediaUrl = media.url || media.preview_image_url
              }
            }

            // twitter_posts縺ｫ菫晏ｭ・
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

            // posts繝・・繝悶Ν縺ｫ菫晏ｭ・
            const { data: post } = await supabaseAdmin
              .from('posts')
              .insert({
                user_id: connection.user_id,
                content: tweet.text,
                image_url: mediaUrl,
                created_at: tweet.created_at,
                source: 'twitter'
              })
              .select()
              .single()

            // 繧ｨ繝ｳ繝吶ョ繧｣繝ｳ繧ｰ逕滓・
            if (post) {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-embedding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  postId: post.id,
                  content: post.content,
                }),
              })
            }

            savedCount++

          } catch (error) {
            console.error('Failed to insert tweet data:', error)
          }
        }

        results.push({
          user_id: connection.user_id,
          success: true,
          savedCount,
          totalFetched: tweets.length
        })

      } catch (error) {
        console.error(`Sync error for user ${connection.user_id}:`, error)
        results.push({
          user_id: connection.user_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log('Auto sync job completed', results)

    return NextResponse.json({
      success: true,
      processedConnections: connections.length,
      results
    })

  } catch (error) {
    console.error('Auto sync job failed:', error)
    return NextResponse.json(
      { error: 'Auto sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
