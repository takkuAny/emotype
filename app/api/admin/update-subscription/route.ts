import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabase.rpc(
      'is_admin',
      { user_uuid: user.id }
    )

    if (adminError || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      userId,
      plan,
      billingCycle,
      contractDate,
      planStartDate,
      planEndDate,
    } = body

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, plan' },
        { status: 400 }
      )
    }

    // Validate plan value
    if (!['free', 'pro'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "free" or "pro"' },
        { status: 400 }
      )
    }

    // Validate billing cycle if provided
    if (billingCycle && !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Must be "monthly" or "yearly"' },
        { status: 400 }
      )
    }

    // Update subscription
    type SubscriptionUpdate = {
      plan: 'free' | 'pro'
      billing_cycle: 'monthly' | 'yearly' | null
      contract_date: string | null
      plan_start_date: string | null
      plan_end_date: string | null
      updated_at: string
    }

    const updateData: SubscriptionUpdate = {
      plan,
      billing_cycle: plan === 'pro' ? billingCycle : null,
      contract_date: plan === 'pro' ? contractDate : null,
      plan_start_date: plan === 'pro' ? planStartDate || new Date().toISOString() : null,
      plan_end_date: plan === 'pro' ? planEndDate : null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: data,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
