import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'
import { Buffer } from 'node:buffer'

export async function GET(request: NextRequest) {
  try {
    // Determine whether the switch_account query flag is enabled
    const { searchParams } = new URL(request.url)
    const switchAccount = searchParams.get('switch_account') === 'true'

    const cookieStore = await cookies()

    // Log cookie details for lightweight debugging
    const allCookies = cookieStore.getAll()
    console.log('=== Cookie dump start ===')
    console.log('Cookie count:', allCookies.length)
    console.log('switchAccount flag:', switchAccount)

    const authCookie = allCookies.find(c => c.name.includes('auth-token'))
    if (authCookie) {
      console.log('Auth cookie name:', authCookie.name)
      console.log('Auth cookie length:', authCookie.value.length)
      console.log('Auth cookie preview (first 50 chars):', authCookie.value.substring(0, 50))

      // Try parsing as JSON while supporting base64-prefixed payloads
      let payload = authCookie.value
      if (payload.startsWith('base64-')) {
        const base64Payload = payload.slice('base64-'.length)
        payload = Buffer.from(base64Payload, 'base64').toString('utf-8')
      }

      try {
        const parsed = JSON.parse(payload)
        console.log('Auth cookie parsed successfully. Keys:', Object.keys(parsed))
      } catch {
        console.log('Auth cookie could not be parsed as JSON.')
      }
    }

    // Initialize the Supabase client
    const supabase = createServerClient(
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

    // Check if the user is already authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    console.log('Session state:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      error: sessionError,
      sessionKeys: session ? Object.keys(session) : null
    })
    console.log('=== Cookie dump end ===')

    // Redirect to the login page when no session is found
    if (!session || !session.user) {
      console.log('No active session. Redirecting to the login page.')
      return NextResponse.redirect(new URL('/login?redirect=/dashboard/x-integration&error=login_required', request.url))
    }

    const userId = session.user.id

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('Twitter API client ID or secret is not configured.')
      return NextResponse.redirect(new URL('/x-integration?error=missing_credentials', request.url))
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/twitter/callback`

    // Store user context inside the OAuth state
    const stateData = {
      uuid: crypto.randomUUID(),
      userId: userId,
      switchAccount: switchAccount
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64url')

    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    console.log('Twitter OAuth redirect info:', { redirectUri, state, switchAccount, userId })

    // Build the OAuth URL
    const params: Record<string, string> = {
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read offline.access',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    }

    // Force the login screen when switching accounts so users can pick the right profile
    if (switchAccount) {
      params.force_login = 'true'
    }

    const authUrl = `https://twitter.com/i/oauth2/authorize?${new URLSearchParams(params)}`

    const response = NextResponse.redirect(authUrl)

    // Persist OAuth state and verifier values in httpOnly cookies
    response.cookies.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    })

    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Twitter auth error:', error)
    return NextResponse.redirect(new URL('/x-integration?error=auth_failed', request.url))
  }
}
