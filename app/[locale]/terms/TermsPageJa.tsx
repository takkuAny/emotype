"use client"

import { Link } from '@/i18n/routing'

const sectionClass =
  "bg-white/80 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/60"

export default function TermsPageJa() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold shadow-xl">
            E
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Emotype 利用規約
          </h1>
          <p className="text-sm text-gray-500">最終更新日：2025年11月8日</p>
          <p className="text-base text-gray-600">
            この利用規約（以下「本規約」）は、Emotype（以下「本サービス」）のご利用条件を定めるものです。
            本サービスの利用にあたっては本規約への同意が必要です。
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第1条（適用）</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              本規約は、ユーザーと本サービス運営者（以下「運営者」）との間の本サービスの利用に関わる一切の関係に適用されます。
            </li>
            <li>
              運営者は、本規約を改定できるものとし、改定後に本サービスを利用した場合は改定後の規約に同意したものとみなします。
            </li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第2条（サービスの内容）</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              本サービスは、AI を用いて日々の感情や投稿内容を分析・可視化する Web
              アプリケーションです。
            </li>
            <li>
              運営者は、ユーザーへの事前通知なく本サービスの内容を変更・追加・中止することがあります。
            </li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第3条（登録・アカウント）</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>ユーザーは、正確かつ最新の情報を用いてアカウントを作成するものとします。</li>
            <li>登録情報に変更が生じた場合、速やかに修正してください。</li>
            <li>
              不正な登録や虚偽の情報が判明した場合、運営者は利用停止・削除等の措置を行うことがあります。
            </li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第4条（禁止事項）</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>法令または公序良俗に違反する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>他者の知的財産権、プライバシー権を侵害する行為</li>
            <li>本サービスを商用目的で不正利用する行為</li>
            <li>不正アクセス、情報改ざん、解析等の行為</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第5条（有料プラン・決済）</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>有料プランは Stripe による決済機能を通じて提供されます。</li>
            <li>無料トライアル期間終了後、自動的に有料課金が開始されます。</li>
            <li>支払い情報の管理は Stripe の決済システム上で行ってください。</li>
            <li>特別な事情を除き、支払い済み料金の返金は行いません。</li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第6条（データの取扱い）</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              ユーザーが入力したテキスト、感情データ、画像、音声等は AI
              解析のために一時的に保存・処理される場合があります。
            </li>
            <li>本サービスは Supabase・OpenAI API 等の外部サービスを利用しています。</li>
            <li>退会時にはデータ削除の申請に応じます。</li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第7条（免責事項）</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>本サービスの利用により発生した損害について運営者は責任を負いません。</li>
            <li>AI 解析結果は参考情報であり、医学的・心理学的診断を代替するものではありません。</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第8条（サービスの停止・終了）</h2>
          <p>
            運営者は、システム保守や障害、その他やむを得ない事情がある場合には本サービスの提供を停止または終了することがあります。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第9条（知的財産権）</h2>
          <p>
            本サービスに関する著作権・商標・デザイン等の知的財産権は運営者または正当な権利者に帰属し、無断利用を禁じます。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第10条（準拠法・管轄）</h2>
          <p>
            本規約の解釈および本サービスに関する紛争については日本法を準拠法とし、運営者所在地を管轄する日本の裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">運営者情報・お問い合わせ</h2>
          <p className="space-y-1">
            <span className="block font-semibold">Emotype 運営チーム</span>
            <span>お問い合わせ：info@emotype.app</span>
          </p>
          <p className="text-sm text-gray-500 mt-4">
            個人運営の場合はメール窓口のみで問題ありません。詳細な連絡先が必要な場合はお問い合わせください。
          </p>
        </section>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <p>
            プライバシーに関する詳細は{" "}
            <Link href="/privacy" className="text-emerald-600 font-semibold">
              プライバシーポリシー
            </Link>{" "}
            をご確認ください。
          </p>
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
