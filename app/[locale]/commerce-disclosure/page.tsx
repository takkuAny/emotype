"use client"

import { useLocale } from 'next-intl'

import CommerceDisclosurePageEn from './CommerceDisclosurePageEn'
import CommerceDisclosurePageJa from './CommerceDisclosurePageJa'

export default function CommerceDisclosurePage() {
  const locale = useLocale()
  return locale === 'en' ? <CommerceDisclosurePageEn /> : <CommerceDisclosurePageJa />
}
