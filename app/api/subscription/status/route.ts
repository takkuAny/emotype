import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripeClient } from '@/lib/stripe'

type StripeSubscriptionPayload = Stripe.Subscription & {
  current_period_end: number | null
  ended_at: number | null
}

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

    // Get user subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subError) {
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // Get user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError) {
      // Silent error handling
    }

    // Check if plan is active
    const { data: isActive, error: activeError } = await supabase.rpc(
      'is_plan_active',
      { user_uuid: user.id }
    )

    if (activeError) {
      // Silent error handling
    }

    // Get remaining posts for free users
    const { data: remainingPosts, error: remainingError } = await supabase.rpc(
      'get_remaining_posts',
      { user_uuid: user.id }
    )

    if (remainingError) {
      // Silent error handling
    }

    // Get monthly post count
    const { data: monthlyCount, error: countError } = await supabase.rpc(
      'get_monthly_post_count',
      { user_uuid: user.id }
    )

    if (countError) {
      // Silent error handling
    }

    const now = new Date()
    let planEndDateValue = subscription.plan_end_date
      ? new Date(subscription.plan_end_date)
      : null
    const isPlanEndDateExpired =
      subscription.plan === 'free' &&
      !!planEndDateValue &&
      planEndDateValue.getTime() < now.getTime()

    let supabaseAdmin: ReturnType<typeof createClient> | null = null
    const getSupabaseAdminClient = () => {
      if (!supabaseAdmin) {
        supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        )
      }
      return supabaseAdmin
    }

    if (isPlanEndDateExpired) {
      const supabaseAdmin = getSupabaseAdminClient() as any
      const { error: cleanupError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({ plan_end_date: null, stripe_subscription_id: null } as Record<string, unknown>)
        .eq('user_id', user.id)

      if (cleanupError) {
        // Silent error handling
      } else {
        planEndDateValue = null
      }
    }

    const needsStripeSync =
      subscription.plan === 'pro' &&
      !!subscription.stripe_subscription_id &&
      (!planEndDateValue || planEndDateValue.getTime() < now.getTime())

    if (needsStripeSync) {
      try {
        const stripe = getStripeClient()
        const stripeSubscriptionResponse = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id!
        )
        const stripeSubscription =
          stripeSubscriptionResponse as unknown as StripeSubscriptionPayload

        if (
          stripeSubscription.status === 'trialing' ||
          stripeSubscription.status === 'active' ||
          stripeSubscription.status === 'past_due' ||
          stripeSubscription.status === 'unpaid'
        ) {
          if (stripeSubscription.current_period_end) {
            planEndDateValue = new Date(
              stripeSubscription.current_period_end * 1000
            )
            const supabaseAdmin = getSupabaseAdminClient() as any
            await supabaseAdmin
              .from('user_subscriptions')
              .update({
                plan_end_date: planEndDateValue.toISOString(),
                billing_cycle:
                  stripeSubscription.items.data[0]?.plan.interval === 'year'
                    ? 'yearly'
                    : 'monthly',
              })
              .eq('user_id', user.id)
          }
        } else if (stripeSubscription.status === 'canceled') {
          const supabaseAdmin = getSupabaseAdminClient() as any
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              plan: 'free',
              plan_end_date:
                stripeSubscription.ended_at !== null
                  ? new Date(stripeSubscription.ended_at * 1000).toISOString()
                  : null,
            })
            .eq('user_id', user.id)
          planEndDateValue = stripeSubscription.ended_at
            ? new Date(stripeSubscription.ended_at * 1000)
            : null
        }
      } catch (stripeError) {
        console.error('Stripe sync failed:', stripeError)
      }
    }

    const isWithinPaidPeriod =
      !!planEndDateValue && planEndDateValue.getTime() >= now.getTime()
    let effectivePlan = subscription.plan

    if (subscription.plan === 'pro' && planEndDateValue && !isWithinPaidPeriod) {
      effectivePlan = 'free'
    } else if (subscription.plan === 'free' && isWithinPaidPeriod) {
      effectivePlan = 'pro'
    }

    return NextResponse.json({
      subscription: {
        plan: effectivePlan,
        originalPlan: subscription.plan,
        billingCycle: subscription.billing_cycle,
        contractDate: subscription.contract_date,
        planStartDate: subscription.plan_start_date,
        planEndDate: planEndDateValue ? planEndDateValue.toISOString() : null,
        isActive: isActive ?? true,
      },
      role: roleData?.role || 'user',
      isAdmin: roleData?.role === 'admin',
      limits: {
        remainingPosts: remainingPosts ?? 0,
        monthlyPostCount: monthlyCount ?? 0,
        monthlyLimit: effectivePlan === 'free' ? 30 : -1, // -1 means unlimited
      },
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


