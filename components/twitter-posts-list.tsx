'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface TwitterPostMedia {
  type: 'photo' | 'video' | 'animated_gif' | string
  url?: string
  width?: number
  height?: number
}

interface TwitterPost {
  id: string
  tweet_id: string
  text: string
  created_at: string
  retweet_count: number
  like_count: number
  reply_count: number
  impression_count: number
  media_urls: TwitterPostMedia[]
  quoted_tweet_id?: string
  quoted_tweet_text?: string
  quoted_tweet_media_urls: TwitterPostMedia[]
}

export default function TwitterPostsList() {
  const [posts, setPosts] = useState<TwitterPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('dashboard.twitterPosts')
  const locale = useLocale()

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError(t('errors.loginRequired'))
        return
      }

      const { data, error: fetchError } = await supabase
        .from('twitter_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      setPosts(data || [])
      setError(null)
    } catch (err: unknown) {
      console.error(err)
      setError(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        <p>{error}</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="font-semibold">{t('emptyTitle')}</p>
        <p className="text-sm mt-2 text-gray-400">{t('emptyDescription')}</p>
      </div>
    )
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('title', { count: posts.length })}</h2>

      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="mb-3">
            <p className="text-gray-900 whitespace-pre-wrap">{post.text}</p>
          </div>

          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {post.media_urls.map((media, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-gray-100">
                  {media.type === 'photo' && media.url ? (
                    <Image
                      src={media.url}
                      alt={t('media.photo', { index: index + 1 })}
                      width={media.width ?? 600}
                      height={media.height ?? 400}
                      className="w-full h-auto"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : media.type === 'video' && media.url ? (
                    <div className="relative">
                      <Image
                        src={media.url}
                        alt={t('media.video', { index: index + 1 })}
                        width={media.width ?? 600}
                        height={media.height ?? 400}
                        className="w-full h-auto"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {post.quoted_tweet_text && (
            <div className="mb-3 border border-gray-300 rounded-lg p-3 bg-gray-50">
              <p className="text-sm text-gray-700 mb-2">{post.quoted_tweet_text}</p>
              {post.quoted_tweet_media_urls && post.quoted_tweet_media_urls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.quoted_tweet_media_urls.map((media, index) => (
                    <div key={index} className="relative rounded overflow-hidden">
                      {media.type === 'photo' && media.url ? (
                        <Image
                          src={media.url}
                          alt={t('media.quotedPhoto', { index: index + 1 })}
                          width={media.width ?? 600}
                          height={media.height ?? 400}
                          className="w-full h-auto"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : media.type === 'video' && media.url ? (
                        <div className="relative">
                          <Image
                            src={media.url}
                            alt={t('media.quotedVideo', { index: index + 1 })}
                            width={media.width ?? 600}
                            height={media.height ?? 400}
                            className="w-full h-auto"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {post.like_count.toLocaleString(locale)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {post.retweet_count.toLocaleString(locale)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.reply_count.toLocaleString(locale)}
              </span>
            </div>
            <span>{formatDate(post.created_at)}</span>
          </div>

          <div className="mt-2">
            <a
              href={`https://twitter.com/i/web/status/${post.tweet_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('openOnX')}
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
