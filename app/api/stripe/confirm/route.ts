import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'

type StripeSubscriptionPayload = Stripe.Subscription & {
  current_period_start: number
  current_period_end: number
}

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
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
            Authorization: `Bearer ${token}`,
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

    let sessionId: string | undefined
    try {
      const body = await request.json()
      sessionId = body?.sessionId
    } catch (parseError) {
      console.error('Invalid JSON body for Stripe confirm:', parseError)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const stripe = getStripeClient()

    const checkoutSession = await stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ['subscription'],
      }
    )

    if (
      !checkoutSession ||
      checkoutSession.mode !== 'subscription' ||
      checkoutSession.payment_status !== 'paid'
    ) {
      return NextResponse.json(
        { error: 'Checkout session is not paid' },
        { status: 400 }
      )
    }

    const sessionUserId =
      (checkoutSession.metadata?.userId as string | undefined) ??
      checkoutSession.client_reference_id

    if (sessionUserId !== user.id) {
      return NextResponse.json(
        { error: 'Session does not belong to the current user' },
        { status: 403 }
      )
    }

    const stripeSubscriptionId =
      typeof checkoutSession.subscription === 'string'
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Stripe subscription not found' },
        { status: 400 }
      )
    }

    const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(
      stripeSubscriptionId
    )

    const stripeSubscription =
      stripeSubscriptionResponse as unknown as StripeSubscriptionPayload

    const periodStart = new Date(
      stripeSubscription.current_period_start * 1000
    ).toISOString()
    const periodEnd = new Date(
      stripeSubscription.current_period_end * 1000
    ).toISOString()
    const billingInterval =
      stripeSubscription.items?.data?.[0]?.plan?.interval === 'year'
        ? 'yearly'
        : 'monthly'

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: updatedSubscription, error: updateError } =
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          plan: 'pro',
          billing_cycle: billingInterval,
          contract_date: new Date(
            checkoutSession.created * 1000
          ).toISOString(),
          plan_start_date: periodStart,
          plan_end_date: periodEnd,
          stripe_customer_id:
            typeof checkoutSession.customer === 'string'
              ? checkoutSession.customer
              : checkoutSession.customer?.id ?? null,
          stripe_subscription_id: stripeSubscription.id,
        })
        .eq('user_id', user.id)
        .select()
        .single()

    if (updateError) {
      console.error('Error updating subscription after Stripe payment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription after payment' },
        { status: 500 }
      )
    }

    const successMessage =
      stripeSubscription.status === 'trialing'
        ? '無料トライアルを開始しました。7日後に自動的に課金が始まります。'
        : '支払いが完了しました。Proプランが有効になりました。'

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: successMessage,
    })
  } catch (error) {
    console.error('Error confirming Stripe checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to confirm Stripe checkout session' },
      { status: 500 }
    )
  }
}
