'use client'

import { useEffect, useState } from 'react'
import Navigation from '@/components/Navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

type AnalyticsSummary = {
  dau: number
  wau: number
  mau: number
  reviewRate: number
  todoCompletion: number
  conversionRate: number
  timeline: { date: string; count: number }[]
  eventBreakdown: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const t = useTranslations('adminAnalytics')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) {
        router.push({
          pathname: '/login',
          query: { redirect: '/admin/analytics' }
        })
        return
      }
      try {
        const user = session.user
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        if (roleError) {
          throw roleError
        }
        if (roleData?.role !== 'admin') {
          if (!mounted) return
          setError(t('messages.unauthorized'))
          setLoading(false)
          return
        }
        const response = await fetch('/api/admin/analytics/summary', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!response.ok) {
          if (response.status === 403) throw new Error('forbidden')
          throw new Error('network')
        }
        const summary = (await response.json()) as AnalyticsSummary
        if (!mounted) return
        setData(summary)
        setError(null)
      } catch (err) {
        console.error(err)
        if (!mounted) return
        setError(err instanceof Error && err.message === 'forbidden' ? t('messages.unauthorized') : t('messages.error'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [router, t])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="pt-32 text-center text-sm text-slate-500">{t('messages.loading')}</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="pt-32 flex flex-col items-center gap-4 text-slate-600">
          <p>{error}</p>
          {error !== t('messages.unauthorized') && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  const eventData = Object.entries(data.eventBreakdown).map(([event, count]) => ({ event, count }))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16 space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">{t('badge')}</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-base text-slate-600">{t('subtitle')}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric label={t('cards.dau')} value={data.dau} />
          <Metric label={t('cards.wau')} value={data.wau} />
          <Metric label={t('cards.mau')} value={data.mau} />
          <Metric label={t('cards.review')} value={`${data.reviewRate}%`} />
          <Metric label={t('cards.todo')} value={`${data.todoCompletion}%`} />
          <Metric label={t('cards.conversion')} value={`${data.conversionRate}%`} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg shadow-emerald-50 space-y-4">
            <p className="text-xs uppercase tracking-widest text-emerald-500">{t('charts.active')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg shadow-emerald-50 space-y-4">
            <p className="text-xs uppercase tracking-widest text-emerald-500">{t('charts.events')}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="event" hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg shadow-emerald-50 space-y-4">
          <p className="text-xs uppercase tracking-widest text-emerald-500">{t('table.title')}</p>
          <div className="overflow-auto rounded-2xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-widest">
                <tr>
                  <th className="px-3 py-2 text-left">{t('table.event')}</th>
                  <th className="px-3 py-2 text-left">{t('table.count')}</th>
                </tr>
              </thead>
              <tbody>
                {eventData.map((item) => (
                  <tr key={item.event} className="border-b border-slate-50 text-slate-700">
                    <td className="px-3 py-2">{item.event}</td>
                    <td className="px-3 py-2">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg shadow-emerald-50">
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
    </div>
  )
}
