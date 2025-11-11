import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (role?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const lastDay = new Date(now)
    lastDay.setDate(now.getDate() - 1)
    const last7 = new Date(now)
    last7.setDate(now.getDate() - 7)
    const last30 = new Date(now)
    last30.setDate(now.getDate() - 30)

    const { data: events } = await supabase
      .from('analytics_events')
      .select('created_at,user_id,event_type')
      .gte('created_at', last30.toISOString())

    const byDate = new Map<string, Set<string>>()
    const weeklyActive = new Set<string>()
    const monthlyActive = new Set<string>()
    const dailyActive = new Set<string>()
    const reviewEvents = ['weekly_report_shared', 'weekly_report_viewed', 'dashboard_viewed']
    let reviewCount = 0

    events?.forEach((event) => {
      const dateKey = event.created_at.slice(0, 10)
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, new Set())
      }
      byDate.get(dateKey)!.add(event.user_id)

      const createdAt = new Date(event.created_at)
      if (createdAt >= last30) {
        monthlyActive.add(event.user_id)
      }
      if (createdAt >= last7) {
        weeklyActive.add(event.user_id)
      }
      if (createdAt >= lastDay) {
        dailyActive.add(event.user_id)
      }
      if (reviewEvents.includes(event.event_type)) {
        reviewCount += 1
      }
    })

    const { data: todos } = await supabase
      .from('todos')
      .select('status')
      .gte('updated_at', last7.toISOString())

    const completedTodos = todos?.filter((todo) => todo.status === 'completed').length ?? 0
    const todoCompletion =
      todos && todos.length
        ? Math.round((completedTodos / todos.length) * 100)
        : 0

    const { count: proCount } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'pro')

    const { count: totalUsers } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })

    const conversionRate =
      totalUsers && totalUsers > 0 ? Math.round(((proCount ?? 0) / totalUsers) * 100) : 0

    const timeline = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(now)
      day.setDate(now.getDate() - (6 - index))
      const key = day.toISOString().slice(0, 10)
      return {
        date: key,
        count: byDate.get(key)?.size ?? 0,
      }
    })

    const eventBreakdown = events?.reduce<Record<string, number>>((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    }, {}) ?? {}

    return NextResponse.json({
      dau: dailyActive.size,
      wau: weeklyActive.size,
      mau: monthlyActive.size,
      reviewRate: events && events.length ? Math.round((reviewCount / events.length) * 100) : 0,
      todoCompletion,
      conversionRate,
      timeline,
      eventBreakdown,
    })
  } catch (error) {
    console.error('admin analytics error', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
