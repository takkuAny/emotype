// app/[locale]/signup/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import LocaleSwitcher from '@/components/LocaleSwitcher'
import { Link, useRouter, pathnames } from '@/i18n/routing'
import { supabase } from '@/lib/supabase'

const MIN_PASSWORD_LENGTH = 6

type KnownPath = keyof typeof pathnames
const DEFAULT_REDIRECT: KnownPath = '/dashboard'

const resolveRedirect = (value: string | null): KnownPath => {
  if (value && value in pathnames) {
    return value as KnownPath
  }
  return DEFAULT_REDIRECT
}

function SignupContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = resolveRedirect(searchParams.get('redirect'))

  const tCommon = useTranslations('common')
  const tSignup = useTranslations('signup')
  const tSignupErrors = useTranslations('signup.errors')
  const tLogin = useTranslations('login')

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(tSignupErrors('passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(tSignupErrors('passwordMismatch'))
      return
    }

    try {
      setLoading(true)
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      })

      if (error) {
        throw error
      }

      if (data.session) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        router.push(redirect)
        router.refresh()
        return
      }

      setSuccess(true)
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : String(unknownError ?? '')
      let errorMessage = tSignupErrors('signupFailed')

      if (message.includes('User already registered')) {
        errorMessage = tSignupErrors('alreadyRegistered')
      } else if (message.includes('Password should be at least')) {
        errorMessage = tSignupErrors('passwordTooShort')
      } else if (message) {
        errorMessage = message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setError('')
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })

      if (error) throw error
    } catch (unknownError) {
      setError(tSignupErrors('googleSignupFailed'))
      console.error('Google signup error:', unknownError)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 sm:px-6 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/4 right-1/3 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex justify-end mb-4">
          <LocaleSwitcher />
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {tCommon('appName')}
          </h1>
          <p className="text-gray-600">{tCommon('tagline')}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{tSignup('title')}</h2>
          <p className="text-sm text-gray-500 text-center mb-8">{tSignup('subtitle')}</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-900 mb-1">{tSignupErrors('title')}</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && !error && (
            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-semibold text-emerald-900 mb-1">{tSignup('confirmationEmailTitle')}</p>
                  <p className="text-sm text-emerald-700">{tSignup('confirmationEmailDescription')}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {tSignup('email')}
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-base placeholder:text-gray-400"
                  placeholder={tSignup('emailPlaceholder')}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {tSignup('password')}
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-base placeholder:text-gray-400"
                  placeholder={tSignup('passwordPlaceholder')}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                {tSignup('confirmPassword')}
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-base placeholder:text-gray-400"
                  placeholder={tSignup('confirmPasswordPlaceholder')}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
            >
              {loading ? tSignup('signingUp') : tSignup('signupButton')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{tCommon('or')}</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignup}
              type="button"
              className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300 active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {tSignup('googleSignup')}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {tSignup('haveAccount')}{' '}
              <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all">
                {tSignup('login')}
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {tLogin('backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignupFallback() {
  const tCommon = useTranslations('common')
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="text-center text-gray-600 font-medium">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
        <p className="mt-4">{tCommon('loading')}</p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupContent />
    </Suspense>
  )
}
