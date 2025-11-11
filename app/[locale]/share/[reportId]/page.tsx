import { Metadata } from 'next'

type Props = {
  params: { reportId: string; locale: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const totalPosts = searchParams.totalPosts || '0'
  const topEmotion1 = searchParams.topEmotion1 || ''
  const topEmotion1Count = searchParams.topEmotion1Count || '0'
  const topEmotion2 = searchParams.topEmotion2 || ''
  const topEmotion2Count = searchParams.topEmotion2Count || '0'
  const topEmotion3 = searchParams.topEmotion3 || ''
  const topEmotion3Count = searchParams.topEmotion3Count || '0'
  const trend = searchParams.trend || 'neutral'
  const locale = params.locale || 'ja'

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const ogImageUrl = `${baseUrl}/api/og-image/weekly-card?totalPosts=${totalPosts}&topEmotion1=${topEmotion1}&topEmotion1Count=${topEmotion1Count}&topEmotion2=${topEmotion2}&topEmotion2Count=${topEmotion2Count}&topEmotion3=${topEmotion3}&topEmotion3Count=${topEmotion3Count}&trend=${trend}&locale=${locale}`

  const title = locale === 'ja'
    ? `今週の感情レポート - ${totalPosts}件記録 | Emotype`
    : `Weekly Emotion Report - ${totalPosts} Posts | Emotype`

  const description = locale === 'ja'
    ? `今週は${totalPosts}件の感情を記録しました。Emotypeで感情と向き合う習慣を始めよう。`
    : `${totalPosts} emotions tracked this week. Start your emotion tracking journey with Emotype.`

  const ogTitle = locale === 'ja'
    ? `今週の感情レポート📊`
    : `Weekly Emotion Report 📊`

  const ogDescription = locale === 'ja'
    ? `記録数: ${totalPosts}件 | Emotypeで感情と向き合う習慣`
    : `${totalPosts} posts this week | Track your emotions with Emotype`

  return {
    title,
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: locale === 'ja' ? '週次感情レポート' : 'Weekly Emotion Report',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImageUrl],
    },
  }
}

export default function SharePage({ params, searchParams }: Props) {
  const locale = params.locale || 'ja'
  const totalPosts = searchParams.totalPosts || '0'

  const title = locale === 'ja'
    ? `今週の感情レポート - ${totalPosts}件記録 | Emotype`
    : `Weekly Emotion Report - ${totalPosts} Posts | Emotype`

  const description = locale === 'ja'
    ? `今週は${totalPosts}件の感情を記録しました。Emotypeで感情と向き合う習慣を始めよう。`
    : `${totalPosts} emotions tracked this week. Start your emotion tracking journey with Emotype.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>

        <div className="space-y-4">
          <a
            href={`/${locale}/login`}
            className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            {locale === 'ja' ? 'Emotypeを始める' : 'Start with Emotype'}
          </a>

          <a
            href={`/${locale}/dashboard`}
            className="block w-full border-2 border-green-500 text-green-600 py-3 px-6 rounded-lg font-medium hover:bg-green-50 transition-all"
          >
            {locale === 'ja' ? 'ダッシュボードへ' : 'Go to Dashboard'}
          </a>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          {locale === 'ja'
            ? 'Emotypeで感情と向き合う習慣を始めましょう'
            : 'Start tracking your emotions with Emotype'}
        </p>
      </div>
    </div>
  )
}
