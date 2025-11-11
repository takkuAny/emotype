'use client'

import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { locales, type Locale } from '@/i18n'
import { usePathname, useRouter } from '@/i18n/routing'

type LocaleSwitcherProps = {
  className?: string
}

export default function LocaleSwitcher({ className = '' }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const tCommon = useTranslations('common')

  const changeLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return
      router.replace(pathname, { locale: nextLocale })
    },
    [locale, pathname, router]
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold text-gray-500">{tCommon('language')}</span>
      <div className="flex rounded-full bg-gray-100 p-1">
        {locales.map((item) => {
          const isActive = item === locale
          return (
            <button
              key={item}
              type="button"
              onClick={() => changeLocale(item)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                isActive
                  ? 'bg-white text-emerald-600 shadow'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              aria-pressed={isActive}
              aria-label={tCommon(`languages.${item}`)}
            >
              {tCommon(`languages.${item}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
