"use client"

import { Link } from '@/i18n/routing'

const sectionClass =
  "bg-white/80 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/60"

export default function CommerceDisclosurePageJa() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl font-bold shadow-xl">
            C
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            特定商取引法に基づく表記
          </h1>
          <p className="text-sm text-gray-500">最終更新日: 2025年11月12日</p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">事業者名</h2>
          <p>Emotype 運営チーム</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">運営統括責任者</h2>
          <p>本島 卓</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">所在地</h2>
          <p>請求があった場合には遅滞なく開示いたします。</p>
          <p className="text-sm text-gray-600 mt-2">
            ※個人情報保護のため、住所は請求時に開示する方式を採用しています
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">連絡先</h2>
          <div className="space-y-2">
            <p>電子メール: info@emotype.app</p>
            <p className="text-sm text-gray-600">
              ※お問い合わせはメールにて受け付けております
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">販売価格</h2>
          <div className="space-y-2">
            <p className="font-medium">各プランのページに表示された価格（米ドル建て、税別）</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              <li>無料プラン: $0</li>
              <li>Pro プラン: 月額 $4.99 または 年額 $39.99（33% OFF）</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              ※初回登録時は7日間の無料トライアル期間があります
            </p>
            <p className="text-sm text-gray-600">
              ※決済時に適用される地域の税金が別途加算される場合があります
            </p>
            <p className="text-sm text-gray-600">
              ※料金は予告なく変更される場合があります
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">商品代金以外の必要料金</h2>
          <p>
            サブスクリプション料金以外に追加費用は発生しません。ただし、インターネット接続に必要な通信料はお客様のご負担となります。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">商品等の引渡時期</h2>
          <p>
            お申し込み後、即時にサービスをご利用いただけます。サブスクリプション契約となるため、契約期間中は継続的にサービスを提供いたします。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">お支払方法</h2>
          <div className="space-y-2">
            <p>クレジットカード決済（Stripe経由）</p>
            <p className="text-sm text-gray-600">
              ※ご利用可能なカード: Visa、Mastercard、American Express、JCB等
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">お支払時期</h2>
          <p>
            月額制サブスクリプションのため、契約開始時および毎月の更新日に自動的に課金されます。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">返品・キャンセルについて</h2>
          <div className="space-y-3">
            <p>
              デジタルコンテンツの性質上、サービスの利用開始後の返金・返品はお受けできません。
            </p>
            <p>
              サブスクリプションの解約はいつでも可能です。解約後は次回の更新日以降、課金が停止されます。日割り返金は行っておりません。
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">サービス提供期間</h2>
          <p>
            サブスクリプション契約期間中は継続的にサービスを提供いたします。解約されるまで、毎月自動的に更新されます。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">動作環境</h2>
          <div className="space-y-2">
            <p className="font-medium">以下の環境でのご利用を推奨します:</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              <li>最新バージョンの主要ブラウザ（Chrome、Firefox、Safari、Edge）</li>
              <li>インターネット接続環境</li>
              <li>JavaScript有効化</li>
            </ul>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">その他の注意事項</h2>
          <div className="space-y-2">
            <p>
              サービスの利用には{' '}
              <Link href="/terms" className="text-emerald-600 font-semibold hover:underline">
                利用規約
              </Link>
              {' '}および{' '}
              <Link href="/privacy" className="text-emerald-600 font-semibold hover:underline">
                プライバシーポリシー
              </Link>
              {' '}が適用されます。
            </p>
            <p className="text-sm text-gray-600">
              ※本表記の内容は予告なく変更される場合があります
            </p>
          </div>
        </section>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white/80 hover:bg-gray-50 text-gray-700 font-medium transition"
          >
            ホームに戻る
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
