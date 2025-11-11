import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'

type StripeSubscriptionPayload = Stripe.Subscription & {
  current_period_end: number | null
  cancel_at: number | null
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { plan } = body

    if (!plan || !['free', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "free" or "pro"' },
        { status: 400 }
      )
    }

    if (plan === 'pro') {
      return NextResponse.json(
        { error: 'Stripe決済でのアップグレードをご利用ください。' },
        { status: 400 }
      )
    }

    // Check if user is admin (admins cannot change their plan)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot change their plan' },
        { status: 403 }
      )
    }

    // Get current subscription
    const { data: currentSubscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError || !currentSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Check if the plan is the same
    if (currentSubscription.plan === plan) {
      return NextResponse.json(
        { error: 'You are already on this plan' },
        { status: 400 }
      )
    }

    const now = new Date()

    let planEndDateISO = currentSubscription.plan_end_date

    if (currentSubscription.stripe_subscription_id) {
      try {
        const stripe = getStripeClient()
        const stripeSubscriptionResponse = await stripe.subscriptions.update(
          currentSubscription.stripe_subscription_id,
          {
            cancel_at_period_end: true,
          }
        )
        const stripeSubscription =
          stripeSubscriptionResponse as unknown as StripeSubscriptionPayload

        const cancelAt = stripeSubscription.cancel_at
        if (cancelAt) {
          planEndDateISO = new Date(cancelAt * 1000).toISOString()
        } else if (stripeSubscription.current_period_end) {
          planEndDateISO = new Date(stripeSubscription.current_period_end * 1000).toISOString()
        }
      } catch (stripeError) {
        console.error('Stripe subscription cancellation failed:', stripeError)
        return NextResponse.json(
          { error: 'Stripeサブスクリプションの解約に失敗しました' },
          { status: 500 }
        )
      }
    }

    const updateData = {
      plan: 'free',
      billing_cycle: null,
      contract_date: null,
      plan_start_date:
        currentSubscription.plan_start_date ?? now.toISOString(),
      plan_end_date: planEndDateISO,
      updated_at: now.toISOString(),
    }

    // Update subscription using service role to bypass RLS
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

    const { data: updatedSubscription, error: updateError } = await supabaseAdmin
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: plan === 'pro'
        ? 'Successfully upgraded to Pro plan!'
        : 'Successfully downgraded to Free plan.'
    })

  } catch (error) {
    console.error('Subscription change plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
