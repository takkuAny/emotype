import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeClient } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

const TRIAL_PERIOD_DAYS = Number(process.env.STRIPE_TRIAL_DAYS ?? '7')

const getBaseUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL

  if (url) {
    return url.startsWith('http') ? url : `https://${url}`
  }

  return 'http://localhost:3000'
}

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

    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const billingCycle =
      body?.billingCycle === 'yearly' ? 'yearly' : 'monthly'

    const priceId =
      billingCycle === 'yearly'
        ? process.env.STRIPE_PRICE_YEARLY_ID
        : process.env.STRIPE_PRICE_MONTHLY_ID

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price is not configured for this billing cycle' },
        { status: 500 }
      )
    }

    const baseUrl = getBaseUrl()
    const successUrl = `${baseUrl}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/dashboard/subscription?canceled=1`

    const stripe = getStripeClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          billingCycle,
        },
        ...(TRIAL_PERIOD_DAYS > 0
          ? { trial_period_days: TRIAL_PERIOD_DAYS }
          : {}),
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
    })

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe checkout session' },
      { status: 500 }
    )
  }
}
