import { TwitterApi } from 'twitter-api-v2';

export interface TwitterAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

export interface TwitterMedia {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
}

export interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    impression_count: number;
  };
  media?: TwitterMedia[];
  quoted_tweet?: {
    id: string;
    text: string;
    media?: TwitterMedia[];
  };
}

type QuotedTweetData = {
  id: string;
  text: string;
  attachments?: {
    media_keys?: string[];
  };
};

// OAuth 2.0繧ｯ繝ｩ繧､繧｢繝ｳ繝茨ｼ郁ｪ崎ｨｼ逕ｨ・・
export const twitterClient = new TwitterApi({
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

// OAuth 2.0隱崎ｨｼURL繧堤函謌・
export function generateAuthUrl(state: string) {
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`;
  
  const { url, codeVerifier, state: returnedState } = twitterClient.generateOAuth2AuthLink(
    callbackUrl,
    {
      scope: ['tweet.read', 'users.read', 'offline.access'],
      state,
    }
  );

  return { url, codeVerifier, state: returnedState };
}

// 隱崎ｨｼ繧ｳ繝ｼ繝峨ｒ繝医・繧ｯ繝ｳ縺ｫ莠､謠・
export async function getAccessToken(
  code: string,
  codeVerifier: string
): Promise<TwitterAuthTokens> {
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`;
  
  const {
    accessToken,
    refreshToken,
    expiresIn,
  } = await twitterClient.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: callbackUrl,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

// 繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ縺ｧ繧ｯ繝ｩ繧､繧｢繝ｳ繝医ｒ菴懈・
export function getAuthenticatedClient(accessToken: string) {
  return new TwitterApi(accessToken);
}

// 繝ｦ繝ｼ繧ｶ繝ｼ諠・ｱ繧貞叙蠕・
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const client = getAuthenticatedClient(accessToken);
  const { data } = await client.v2.me({
    'user.fields': ['id', 'username', 'name']
  });

  return {
    id: data.id,
    username: data.username,
    name: data.name,
  };
}

// 繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ繝・う繝ｼ繝医ｒ蜿門ｾ暦ｼ域怙譁ｰ100莉ｶ・・
// 蠑慕畑繝・う繝ｼ繝医→繝｡繝・ぅ繧｢諠・ｱ繧ょ性繧√ｋ
export async function getUserTweets(
  accessToken: string,
  userId: string,
  maxResults: number = 100
): Promise<TwitterPost[]> {
  const client = getAuthenticatedClient(accessToken);
  
  try {
    // 蠑慕畑繝・う繝ｼ繝医→繝｡繝・ぅ繧｢繧貞叙蠕励☆繧九◆繧√・險ｭ螳・
    const tweets = await client.v2.userTimeline(userId, {
      max_results: maxResults,
      'tweet.fields': ['created_at', 'public_metrics', 'attachments', 'referenced_tweets'],
      'media.fields': ['url', 'preview_image_url', 'type', 'width', 'height', 'media_key'],
      expansions: ['attachments.media_keys', 'referenced_tweets.id'],
      exclude: ['retweets', 'replies'], // 繝ｪ繝・う繝ｼ繝医→繝ｪ繝励Λ繧､繧帝勁螟・
    });

    // 繝・・繧ｿ縺檎ｩｺ縺ｮ蝣ｴ蜷・
    if (!tweets.data || !tweets.data.data || tweets.data.data.length === 0) {
      return [];
    }

    // 繝｡繝・ぅ繧｢縺ｮ繝槭ャ繝斐Φ繧ｰ繧剃ｽ懈・
    const mediaMap = new Map<string, TwitterMedia>();
    if (tweets.includes?.media) {
      for (const media of tweets.includes.media) {
        mediaMap.set(media.media_key, {
          media_key: media.media_key,
          type: media.type as 'photo' | 'video' | 'animated_gif',
          url: media.url,
          preview_image_url: media.preview_image_url,
          width: media.width,
          height: media.height,
        });
      }
    }

    // 蠑慕畑繝・う繝ｼ繝医・繝槭ャ繝斐Φ繧ｰ繧剃ｽ懈・
    const quotedTweetsMap = new Map<string, QuotedTweetData>();
    if (tweets.includes?.tweets) {
      for (const tweet of tweets.includes.tweets) {
        quotedTweetsMap.set(tweet.id, tweet);
      }
    }

    // 繝・う繝ｼ繝医ョ繝ｼ繧ｿ繧貞､画鋤
    const posts: TwitterPost[] = [];
    
    for (const tweet of tweets.data.data) {
      const post: TwitterPost = {
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at ?? "",
        public_metrics: tweet.public_metrics || {
          retweet_count: 0,
          reply_count: 0,
          like_count: 0,
          impression_count: 0,
        },
      };

      // 繝｡繝・ぅ繧｢繧定ｿｽ蜉
      if (tweet.attachments?.media_keys) {
        const mediaItems: TwitterMedia[] = [];
        for (const key of tweet.attachments.media_keys) {
          const media = mediaMap.get(key);
          if (media) {
            mediaItems.push(media);
          }
        }
        if (mediaItems.length > 0) {
          post.media = mediaItems;
        }
      }

      // 蠑慕畑繝・う繝ｼ繝医ｒ霑ｽ蜉
      if (tweet.referenced_tweets) {
        const quotedTweet = tweet.referenced_tweets.find(
          (ref) => ref.type === 'quoted'
        );
        
        if (quotedTweet) {
          const quotedTweetData = quotedTweetsMap.get(quotedTweet.id);
          if (quotedTweetData) {
            post.quoted_tweet = {
              id: quotedTweetData.id,
              text: quotedTweetData.text,
            };

            // 蠑慕畑繝・う繝ｼ繝医・繝｡繝・ぅ繧｢繧定ｿｽ蜉
            if (quotedTweetData.attachments?.media_keys) {
              const quotedMediaItems: TwitterMedia[] = [];
              for (const key of quotedTweetData.attachments.media_keys) {
                const media = mediaMap.get(key);
                if (media) {
                  quotedMediaItems.push(media);
                }
              }
              if (quotedMediaItems.length > 0) {
                post.quoted_tweet.media = quotedMediaItems;
              }
            }
          }
        }
      }

      posts.push(post);
    }

    return posts;
  } catch (error) {
    console.error('Error fetching tweets:', error);
    throw error;
  }
}

// 繝ｪ繝輔Ξ繝・す繝･繝医・繧ｯ繝ｳ縺ｧ譁ｰ縺励＞繧｢繧ｯ繧ｻ繧ｹ繝医・繧ｯ繝ｳ繧貞叙蠕・
export async function refreshAccessToken(
  refreshToken: string
): Promise<TwitterAuthTokens> {
  const {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  } = await twitterClient.refreshOAuth2Token(refreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  };
}
