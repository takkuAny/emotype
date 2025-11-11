'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { useSubscription } from '@/hooks/useSubscription'

interface ProFeatureGuardProps {
  children: React.ReactNode
}

export default function ProFeatureGuard({ children }: ProFeatureGuardProps) {
  const router = useRouter()
  const { canAccessProFeatures, loading } = useSubscription()
  const t = useTranslations('dashboard.proFeatureGuard')

  useEffect(() => {
    if (!loading && !canAccessProFeatures) {
      router.push({
        pathname: '/dashboard',
        query: { upgrade: 'true' }
      })
    }
  }, [canAccessProFeatures, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!canAccessProFeatures) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('title')}</h2>
          <p className="text-gray-600 mb-6">{t('description')}</p>
          <div className="space-y-3">
            <button
              onClick={() =>
                router.push({
                  pathname: '/dashboard',
                  query: { upgrade: 'true' }
                })
              }
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t('cta')}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all"
            >
              {t('back')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
