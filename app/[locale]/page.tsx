'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import LocaleSwitcher from '@/components/LocaleSwitcher'
import { supabase } from '@/lib/supabase'
import { Link, useRouter } from '@/i18n/routing'

type Highlight = {
  icon: string
  label: string
  subLabel: string
}

type MockupPost = {
  id: string
  badgeClasses: string
  similarity: string
  text: string
  emotionLabel: string
}

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  const tCommon = useTranslations('common')
  const tLanding = useTranslations('landing')
  const tLogin = useTranslations('login')
  const tNavigation = useTranslations('navigation')
  const tEmotions = useTranslations('emotions.labels')

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      const { user } = data
      if (user) {
        router.push('/dashboard')
      } else {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  const highlights = useMemo<Highlight[]>(

    () => [

      { icon: '✨', label: tLanding('hero.feature1'), subLabel: tNavigation('search') },

      { icon: '🤖', label: tLanding('hero.feature2'), subLabel: 'AI' }

    ],

    [tLanding, tNavigation]

  )



  const featureIcons = ['🧭', '📈'] as const



  const featureCards = useMemo(
    () => [
      {
        key: 'vectorSearch',
        title: tLanding('features.vectorSearch.title'),
        badge: tLanding('features.vectorSearch.badge'),
        description: tLanding('features.vectorSearch.description')
      },
      {
        key: 'emotionGraph',
        title: tLanding('features.emotionGraph.title'),
        badge: tLanding('features.emotionGraph.badge'),
        description: tLanding('features.emotionGraph.description')
      }
    ],
    [tLanding]
  )

  const mockupPosts = useMemo<MockupPost[]>(
    () => [
      {
        id: 'joy',
        badgeClasses: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        similarity: '92.4',
        text: tLanding('mockup.examples.joy'),
        emotionLabel: tEmotions('joy')
      },
      {
        id: 'love',
        badgeClasses: 'bg-pink-100 text-pink-700 border-pink-200',
        similarity: '87.8',
        text: tLanding('mockup.examples.love'),
        emotionLabel: tEmotions('love')
      },
      {
        id: 'surprise',
        badgeClasses: 'bg-blue-100 text-blue-700 border-blue-200',
        similarity: '83.2',
        text: tLanding('mockup.examples.surprise'),
        emotionLabel: tEmotions('surprise')
      }
    ],
    [tLanding, tEmotions]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/4 right-1/3 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <header className="px-4 sm:px-6 lg:px-8 pt-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">{tCommon('appName')}</span>
            </div>
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200/50"
            >
              {tLogin('loginButton')}
            </Link>
          </div>
          <div className="sm:hidden mt-3">
            <LocaleSwitcher />
          </div>
        </header>

        <section className="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-6 shadow-sm border border-white/80">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-gray-700">{tLanding('hero.badge')}</span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  {tLanding('hero.title')}
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    {tLanding('hero.titleHighlight')}
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  {tLanding('hero.description')}
                  <br className="hidden sm:block" />
                  {tLanding('hero.descriptionLine2')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Link
                    href="/login"
                    className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {tLanding('hero.cta')}
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <a
                    href="#features"
                    className="px-8 py-4 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-200/50"
                  >
                    {tLanding('hero.features')}
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-600">
                  {highlights.map((highlight) => (
                    <div key={highlight.label} className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-emerald-500 text-lg">{highlight.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{highlight.label}</p>
                        <p className="text-xs text-gray-500">{highlight.subLabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-16 -right-10 hidden lg:block" aria-hidden="true">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full shadow-2xl flex items-center justify-center">
                        <div className="absolute top-8 left-6 w-4 h-4 bg-white rounded-full shadow-inner"></div>
                        <div className="absolute top-8 right-6 w-4 h-4 bg-white rounded-full shadow-inner"></div>
                        <div className="absolute bottom-10 left-4 w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="absolute bottom-10 right-4 w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/70 rounded-full"></div>
                        <div className="absolute -left-4 top-1/2 w-12 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full origin-right -rotate-12"></div>
                        <div className="absolute -right-4 top-1/2 w-12 h-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full origin-left animate-[wave_3s_ease-in-out_infinite]"></div>
                      </div>
                      <div className="absolute -top-4 -right-4 text-yellow-300 text-2xl animate-pulse">✨</div>
                      <div className="absolute top-0 -left-6 text-emerald-200 text-xl animate-pulse delay-150">⭐</div>
                    </div>
                  </div>
                </div>

                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900">{tLanding('mockup.searchTitle')}</h3>
                      <p className="text-xs text-gray-500">{tLanding('mockup.searchSubtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span>{tLanding('mockup.live')}</span>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none"
                      placeholder={tLanding('mockup.searchPlaceholder')}
                      readOnly
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="space-y-3">
                    {mockupPosts.map((post) => (
                      <div key={post.id} className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 text-xs font-bold rounded-lg border shadow-sm ${post.badgeClasses}`}>
                            #{post.emotionLabel}
                          </span>
                          <span className="px-2 py-1 bg-white text-gray-600 text-xs font-medium rounded-lg border border-gray-200 shadow-sm">
                            {`${tLanding('mockup.similarityLabel')} ${post.similarity}%`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {post.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-10 -left-10 hidden lg:block" aria-hidden="true">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-4 animate-[float_4s_ease-in-out_infinite]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-600 text-xl">📊</div>
                      <div>
                        <span className="text-xs font-bold text-gray-900">{tLanding('mockup.emotionGraphTitle')}</span>
                        <p className="text-xs text-gray-500">{tLanding('mockup.searchSubtitle')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-6 hidden lg:block" aria-hidden="true">
                  <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 p-4 animate-[float_5s_ease-in-out_infinite]">
                    <span className="text-xs font-bold text-gray-900">{tLanding('mockup.aiAnalysisTitle')}</span>
                    <p className="text-xs text-gray-600">
                      {tLanding('mockup.aiAnalysisText')}{' '}
                      <span className="font-bold text-emerald-600">{tLanding('mockup.aiAnalysisIncrease')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {tLanding('features.title')}
              </h2>
              <p className="text-lg text-gray-600">
                {tLanding('features.subtitle')}
                <br />
                {tLanding('features.subtitleLine2')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {featureCards.map((feature, index) => (
                <div key={feature.key} className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col gap-4">
                  <div className="absolute -top-4 -right-4 px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {feature.badge}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center text-2xl">
                    {featureIcons[index] ?? '✨'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -top-8 -right-8 w-48 h-48 border border-white/30 rounded-full"></div>
                <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
              </div>

              <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/80 mb-4">
                    {tLanding('hero.badge')}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                    {tLanding('cta.title')}
                  </h2>
                  <p className="text-lg text-white/90 mb-4">
                    {tLanding('cta.description')}
                  </p>
                  <p className="text-lg text-white/90 mb-8">
                    {tLanding('cta.descriptionLine2')}
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-2xl shadow-2xl hover:translate-y-0.5 transition-transform"
                  >
                    {tLanding('cta.button')}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-4 sm:px-6 lg:px-8 pb-10">
          <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm space-y-3">
            <p>
              {tLanding('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                {tLanding('footer.terms')}
              </Link>
              <span className="text-gray-300">/</span>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                {tLanding('footer.privacy')}
              </Link>
              <span className="text-gray-300">/</span>
              <Link href="/commerce-disclosure" className="hover:text-gray-900 transition-colors">
                特定商取引法に基づく表記
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
              <Link href="/terms" locale="en" className="hover:text-gray-700 transition-colors">
                {tLanding('footer.termsEn')}
              </Link>
              <span className="text-gray-300">/</span>
              <Link href="/privacy" locale="en" className="hover:text-gray-700 transition-colors">
                {tLanding('footer.privacyEn')}
              </Link>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-[float_4s_ease-in-out_infinite] {
          animation: float 4s ease-in-out infinite;
        }
        .animate-[float_5s_ease-in-out_infinite] {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes wave {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(10deg);
          }
          75% {
            transform: rotate(-8deg);
          }
        }
        .animate-[wave_3s_ease-in-out_infinite] {
          animation: wave 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
