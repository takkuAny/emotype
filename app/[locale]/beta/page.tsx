'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

import LocaleSwitcher from '@/components/LocaleSwitcher'
import { useRouter } from '@/i18n/routing'
import { supabase } from '@/lib/supabase'

const benefitIcons = ['🚀', '💬', '🧪', '🎁'] as const
const benefitKeys = ['earlyAccess', 'community', 'feedback', 'perks'] as const
const faqKeys = ['timeline', 'selection', 'cost', 'platform'] as const

export default function BetaPage() {
  const router = useRouter()
  const t = useTranslations('beta')
  const [email, setEmail] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [motivation, setMotivation] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const heroHighlights = [0, 1, 2].map((index) => t(`hero.highlights.${index}`))
  const benefits = benefitKeys.map((key, index) => ({
    key,
    icon: benefitIcons[index],
    title: t(`benefits.${key}.title`),
    description: t(`benefits.${key}.description`),
  }))
  const faqs = faqKeys.map((key) => ({
    key,
    question: t(`faq.items.${key}.question`),
    answer: t(`faq.items.${key}.answer`),
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('beta_testers')
        .insert({
          email,
          twitter_handle: twitterHandle,
          motivation,
        })

      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err) {
      console.error('Beta signup error:', err)
      setError(t('form.submitError'))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('success.title')}</h2>
          <p className="text-lg text-gray-600 mb-8">{t('success.description')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
          >
            {t('success.button')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <header className="border-b border-white/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Emotype
              </span>
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">BETA</span>
            </div>
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900 font-medium">
                {t('header.back')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className="text-center">
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full mb-6">
            {t('badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t('hero.title')}
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('hero.highlight')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-6">{t('hero.subtitle')}</p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {heroHighlights.map((point, index) => (
              <div key={index} className="bg-white/90 rounded-2xl shadow p-4 text-sm text-gray-600">
                {point}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('benefits.title')}</h2>
            <p className="text-gray-600">{t('benefits.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.key} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('form.title')}</h2>
          <p className="text-center text-gray-600 mb-8">{t('form.subtitle')}</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.email')} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                placeholder={t('form.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.twitter')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">@</span>
                <input
                  id="twitter"
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder={t('form.twitterPlaceholder')}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('form.twitterHint')}</p>
            </div>

            <div>
              <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.motivation')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="motivation"
                required
                rows={4}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all resize-none"
                placeholder={t('form.motivationPlaceholder')}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('form.submitting') : t('form.submit')}
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-6">{t('form.disclaimer')}</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('faq.title')}</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.key} className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 cursor-pointer">
                <summary className="font-bold text-gray-900">{faq.question}</summary>
                <p className="text-gray-600 mt-3">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/50 bg-white/80 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p className="text-sm">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="text-xs mt-2">{t('footer.contact')}</p>
        </div>
      </footer>
    </div>
  )
}
