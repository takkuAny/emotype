import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: disconnectError } = await supabase.from('twitter_connections').delete().eq('user_id', user.id)

    if (disconnectError) {
      console.error('Failed to delete twitter_connections row:', disconnectError)
      return NextResponse.json({ error: 'Failed to disconnect X account' }, { status: 500 })
    }

    const { error: removeRawPostsError } = await supabase.from('twitter_posts').delete().eq('user_id', user.id)

    if (removeRawPostsError) {
      console.error('Failed to delete twitter_posts rows:', removeRawPostsError)
    }

    const { error: removeFeedPostsError } = await supabase
      .from('posts')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'twitter')

    if (removeFeedPostsError) {
      console.error('Failed to delete posts rows with twitter source:', removeFeedPostsError)
    }

    return NextResponse.json({
      success: true,
      message: 'X account disconnected successfully',
    })
  } catch (error) {
    console.error('Twitter disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect X account' }, { status: 500 })
  }
}
