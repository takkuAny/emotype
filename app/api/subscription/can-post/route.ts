import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can create post
    const { data: canPost, error } = await supabase.rpc('can_create_post', {
      user_uuid: user.id,
    })

    if (error) {
      console.error('Error checking post permission:', error)
      return NextResponse.json(
        { error: 'Failed to check permission' },
        { status: 500 }
      )
    }

    // Get remaining posts
    const { data: remainingPosts } = await supabase.rpc('get_remaining_posts', {
      user_uuid: user.id,
    })

    // Get user plan
    const { data: plan } = await supabase.rpc('get_user_plan', {
      user_uuid: user.id,
    })

    return NextResponse.json({
      canPost: canPost ?? false,
      remainingPosts: remainingPosts ?? 0,
      plan: plan || 'free',
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
