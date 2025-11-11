"use client"

import { useLocale } from 'next-intl'

import TermsPageEn from './TermsPageEn'
import TermsPageJa from './TermsPageJa'

export default function TermsPage() {
  const locale = useLocale()
  return locale === 'en' ? <TermsPageEn /> : <TermsPageJa />
}
