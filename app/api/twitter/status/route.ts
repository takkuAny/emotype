import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

type TwitterConnectionRow = {
  twitter_username?: string | null
  updated_at?: string | null
  last_sync_at?: string | null
  followers_count?: number | null
}

export async function GET() {
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

    const { data: connection, error: connectionError } = await supabase
      .from('twitter_connections')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (connectionError) {
      console.error('Twitter status fetch error:', connectionError)
      return NextResponse.json({ error: 'Failed to load X integration status' }, { status: 500 })
    }

    if (!connection) {
      return NextResponse.json({ isConnected: false })
    }

    const typedConnection = connection as TwitterConnectionRow
    const lastSync = typedConnection.last_sync_at ?? typedConnection.updated_at ?? null
    const followersCount =
      typeof typedConnection.followers_count === 'number' ? typedConnection.followers_count : null

    const { count: postsCount, error: postsError } = await supabase
      .from('twitter_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (postsError) {
      console.error('Twitter posts count error:', postsError)
    }

    return NextResponse.json({
      isConnected: true,
      username: typedConnection.twitter_username ?? undefined,
      lastSync: lastSync ?? undefined,
      followersCount: followersCount ?? undefined,
      postsCount: typeof postsCount === 'number' ? postsCount : undefined,
    })
  } catch (error) {
    console.error('Twitter status error:', error)
    return NextResponse.json({ error: 'Failed to load X integration status' }, { status: 500 })
  }
}
