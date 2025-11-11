'use client'

import { Suspense } from 'react'

import Navigation from '@/components/Navigation'
import ProFeatureGuard from '@/components/ProFeatureGuard'
import TwitterIntegration from '@/components/twitter-integration'

function IntegrationFallback() {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-2xl">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-32 bg-gray-100 rounded-2xl"></div>
      </div>
    </div>
  )
}

export default function XIntegrationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12">
        <ProFeatureGuard>
          <Suspense fallback={<IntegrationFallback />}>
            <TwitterIntegration />
          </Suspense>
        </ProFeatureGuard>
      </main>
    </div>
  )
}
