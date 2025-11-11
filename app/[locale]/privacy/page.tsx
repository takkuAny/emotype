"use client"

import { useLocale } from 'next-intl'

import PrivacyPageEn from './PrivacyPageEn'
import PrivacyPageJa from './PrivacyPageJa'

export default function PrivacyPage() {
  const locale = useLocale()
  return locale === 'en' ? <PrivacyPageEn /> : <PrivacyPageJa />
}
