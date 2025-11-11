'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type TimelineData = {
  date: string
  score: number
  count: number
}

type EmotionTooltipProps = {
  active?: boolean
  payload?: Array<{ payload?: TimelineData }>
}

export default function EmotionGraph() {
  const [user, setUser] = useState<User | null>(null)
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)
  const t = useTranslations('dashboard.emotionGraph')
  const locale = useLocale()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const { user } = data
        if (user) {
          setUser(user)
          loadTimeline(user.id, days)
        }
      } catch (error) {
        console.error('Failed to get user for EmotionGraph:', error)
      }
    }

    loadUser()
  }, [days])

  const loadTimeline = async (userId: string, dayCount: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/emotions/timeline?userId=${userId}&days=${dayCount}`)
      const data = await response.json()

      if (response.ok) {
        setTimelineData(data.timeline || [])
      } else {
        console.error('Error loading timeline:', data.error)
      }
    } catch (error) {
      console.error('Error loading timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
    return `${month}/${day} (${dayOfWeek})`
  }

  const CustomTooltip = ({ active, payload }: EmotionTooltipProps) => {
    if (active && payload && payload.length) {
      const tooltipPayload = payload[0]?.payload as TimelineData | undefined
      if (!tooltipPayload) {
        return null
      }
      const scorePercent = Math.round(tooltipPayload.score * 100)
      let labelKey: 'veryPositive' | 'positive' | 'somewhatNegative' | 'negative' = 'negative'
      if (scorePercent >= 80) labelKey = 'veryPositive'
      else if (scorePercent >= 60) labelKey = 'positive'
      else if (scorePercent >= 40) labelKey = 'somewhatNegative'

      return (
        <div className="bg-white/95 backdrop-blur-xl p-4 border-2 border-gray-200 rounded-2xl shadow-2xl">
          <p className="font-bold text-base mb-2">{formatDate(tooltipPayload.date)}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {t('tooltip.emotionScore')}{' '}
              <span className="font-bold text-emerald-600">{scorePercent}</span>
            </p>
            <p className="text-xs text-gray-500">{t(`tooltip.${labelKey}` as const)}</p>
            {tooltipPayload.count > 0 && (
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                {t('tooltip.postCount', { count: tooltipPayload.count })}
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
        <div className="flex justify-center items-center h-80">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (timelineData.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur opacity-50"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">{t('title')}</h2>
            <p className="text-sm text-gray-500 whitespace-nowrap">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500">
          <div className="text-center">
            <p className="mb-2">{t('noData')}</p>
            <p className="text-sm text-gray-400">{t('noDataDescription')}</p>
          </div>
        </div>
      </div>
    )
  }

  const periodLabels: Record<number, 'periods.7days' | 'periods.14days' | 'periods.30days'> = {
    7: 'periods.7days',
    14: 'periods.14days',
    30: 'periods.30days',
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur opacity-50"></div>
            <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap">{t('title')}</h2>
            <p className="text-xs text-gray-500 whitespace-nowrap">{t('days', { count: days })}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-start">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-shrink-0 px-3.5 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                days === d
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
              >
                {t(periodLabels[d])}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <defs>
              <linearGradient id="emotionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
              interval="preserveStartEnd"
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => (value * 100).toFixed(0)}
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.5} stroke="#d1d5db" strokeDasharray="4 4" strokeWidth={2} label={t('neutralLine')} />
            <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fill="url(#emotionGradient)" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 3, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md"></div>
          <span className="font-medium">{t('emotionScore')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-dashed"></div>
          <span>{t('neutralLine')}</span>
        </div>
      </div>
    </div>
  )
}
