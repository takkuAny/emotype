"use client"

import { Link } from '@/i18n/routing'

const sectionClass =
  "bg-white/80 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/60"

export default function PrivacyPageJa() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl font-bold shadow-xl">
            P
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Emotype プライバシーポリシー
          </h1>
          <p className="text-sm text-gray-500">最終更新日：2025年11月8日</p>
          <p className="text-base text-gray-600">
            Emotype（以下「本サービス」）はユーザーのプライバシーを尊重し、個人情報の保護に努めます。本ポリシーでは取得する情報と利用目的を説明します。
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第1条（取得する情報）</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>メールアドレス、ニックネームなどの登録情報</li>
            <li>入力されたテキスト、感情スコア、投稿データ</li>
            <li>ログデータ（アクセス日時、ブラウザ、IP アドレス等）</li>
            <li>外部サービス（X/Twitter）連携による公開投稿情報</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第2条（利用目的）</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>AI 解析や可視化など本サービスの提供・運営のため</li>
            <li>有料プランの決済・契約管理のため（Stripe を利用）</li>
            <li>不正利用防止、サーバーメンテナンス、品質改善のため</li>
            <li>新機能や重要なお知らせの通知のため</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第3条（外部送信）</h2>
          <p className="mb-3">
            本サービスは以下の外部サービスを利用しており、必要な範囲で情報が送信される場合があります。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Supabase（データベース・認証）</li>
            <li>OpenAI（感情解析・生成 AI）</li>
            <li>Stripe（決済処理）</li>
            <li>Google Analytics / AdSense（アクセス解析・広告配信）</li>
            <li>X API（感情投稿分析）</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第4条（情報の保存期間）</h2>
          <p>
            ユーザーのデータは、退会後または削除申請から 60
            日以内に削除します。AI 学習のために個人情報を再利用することはありません。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第5条（Cookie の利用）</h2>
          <p>
            利便性向上やアクセス解析のため Cookie を使用します。Cookie
            を無効にすると一部機能が利用できない場合があります。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第6条（安全管理）</h2>
          <p>
            SSL
            暗号化通信や Supabase の Row Level Security 等を利用し、個人情報の漏えいや不正アクセスを防ぐための安全管理措置を講じます。
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第7条（第三者提供）</h2>
          <p>法令で定められた場合を除き、ユーザーの同意なく第三者へ個人情報を提供しません。</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第8条（未成年の利用）</h2>
          <p>16 歳未満のユーザーは、保護者の同意を得た上で本サービスをご利用ください。</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第9条（ポリシーの改定）</h2>
          <p>必要に応じて本ポリシーを変更する場合があります。変更後は本サイト上に掲示します。</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">第10条（お問い合わせ窓口）</h2>
          <p className="space-y-1">
            <span className="block font-semibold">Emotype 運営チーム</span>
            <span>個人情報に関するお問い合わせ：info@emotype.app</span>
          </p>
        </section>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <p>
            利用条件については{" "}
            <Link href="/terms" className="text-emerald-600 font-semibold">
              利用規約
            </Link>
            もご覧ください。
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
