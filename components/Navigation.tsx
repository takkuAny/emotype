'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

import LocaleSwitcher from './LocaleSwitcher'
import { useRouter, usePathname } from '@/i18n/routing'
import { supabase } from '@/lib/supabase'
import { useSubscription } from '@/hooks/useSubscription'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { canAccessProFeatures, loading: subscriptionLoading, isPro, isAdmin } = useSubscription()
  const tCommon = useTranslations('common')
  const tNavigation = useTranslations('navigation')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  // Keep only the requested navigation items
  const allNavItems = [
    { path: '/dashboard', label: tNavigation('dashboard'), icon: '📊', isPro: false },
    { path: '/dashboard/search', label: tNavigation('search'), icon: '🔍', isPro: true },
    { path: '/dashboard/subscription', label: tNavigation('subscription'), icon: '💎', isPro: false },
  ] as const

  const navItems = allNavItems.filter((item) => {
    if (item.isPro) {
      if (subscriptionLoading) return false
      return canAccessProFeatures
    }
    return true
  })

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/80' 
        : 'bg-white/80 backdrop-blur-md border-b border-gray-100/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* ロゴ */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {tCommon('appName')}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">{tNavigation('searchYourEmotions')}</p>
            </div>
          </button>

          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`relative px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-emerald-700 bg-emerald-50 shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 rounded-full"></div>
                )}
              </button>
            ))}
            <div className="w-px h-6 bg-gray-200 mx-2"></div>

            <LocaleSwitcher />

            <div className="w-px h-6 bg-gray-200 mx-2"></div>

            {/* プランバッジ */}
            {!subscriptionLoading && (
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                isAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : isPro
                  ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isAdmin ? 'ADMIN' : isPro ? 'PRO' : 'FREE'}
              </div>
            )}

            <button
              onClick={handleLogout}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
            >
              {tNavigation('logout')}
            </button>
          </div>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
            aria-label={tNavigation('menu')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* モバイルメニュー */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-2 border-t border-gray-100 overflow-y-auto max-h-[calc(100vh-5rem)]">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  router.push(item.path)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all active:scale-98 ${
                  isActive(item.path)
                    ? 'text-emerald-700 bg-emerald-50 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="px-4">
                <LocaleSwitcher />
              </div>
              {/* プランバッジ（モバイル） */}
              {!subscriptionLoading && (
                <div className="px-4">
                  <div className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold ${
                    isAdmin
                      ? 'bg-purple-100 text-purple-700'
                      : isPro
                      ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isAdmin ? 'ADMIN' : isPro ? 'PRO' : 'FREE'}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-all active:scale-98"
              >
                {tNavigation('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
