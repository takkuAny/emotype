'use client'

import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('common')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ブランド情報 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {t('appName')}
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              感情を記録し、AIで分析。<br />
              あなたの心の健康をサポートします。
            </p>
          </div>

          {/* リンク */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">サービス</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  ダッシュボード
                </Link>
              </li>
              <li>
                <Link href="/dashboard/subscription" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  プラン・料金
                </Link>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900">法的情報</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/commerce-disclosure" className="text-gray-600 hover:text-emerald-600 transition-colors">
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Emotype. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
