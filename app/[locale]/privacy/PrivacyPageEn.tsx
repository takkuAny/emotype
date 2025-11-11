"use client"

import { Link } from '@/i18n/routing'

const sectionClass =
  "bg-white/80 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/60"

export default function PrivacyPageEn() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl font-bold shadow-xl">
            P
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Emotype Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">Last updated: November 8, 2025</p>
          <p className="text-base text-gray-600">
            Emotype (“the Service”) respects your privacy and strives to protect personal
            information appropriately. This Policy explains what data we collect and how we use it.
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">1. Information We Collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Registration data (email address, nickname, profile details)</li>
            <li>Text entries, emotion scores, images, and audio submitted by users</li>
            <li>Log data (access timestamps, IP address, browser information)</li>
            <li>Public data obtained through X (Twitter) integration</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">2. Purpose of Use</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Providing emotion analysis, visualization, and related features</li>
            <li>Processing payments and managing subscriptions via Stripe</li>
            <li>Preventing fraud, ensuring security, and improving the Service</li>
            <li>Sending important notices, feature updates, or promotional information</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">3. Third-Party Services</h2>
          <p className="mb-3">
            We rely on the following third-party providers, to whom information may be transmitted as
            necessary:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Supabase (database & authentication)</li>
            <li>OpenAI (AI analysis)</li>
            <li>Stripe (payment processing)</li>
            <li>Google Analytics / Google AdSense (analytics & advertising)</li>
            <li>X API (integration with social posts)</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">4. Data Retention and Deletion</h2>
          <p>
            User data is deleted within 60 days after account termination or upon receiving a deletion
            request. We do not use personal information to train AI models beyond the scope of the
            Service.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">5. Cookies</h2>
          <p>
            We use cookies to improve user experience and analyze traffic. Disabling cookies may limit
            certain features of the Service.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">6. Security Measures</h2>
          <p>
            We implement SSL encryption, Row-Level Security (Supabase), and other safeguards to
            protect personal information from unauthorized access, loss, alteration, or leakage.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">7. Disclosure to Third Parties</h2>
          <p>We do not disclose personal information to third parties without consent except as required by law.</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">8. Children’s Privacy</h2>
          <p>Users under 16 must obtain consent from a parent or guardian before using the Service.</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">9. Changes to This Policy</h2>
          <p>
            We may revise this Privacy Policy as needed. Any updates will be posted on the Service and
            become effective upon publication.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">10. Contact</h2>
          <p className="space-y-1">
            <span className="block font-semibold">Emotype Team</span>
            <span>Privacy inquiries: info@emotype.app</span>
          </p>
        </section>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <p>
            Need the Japanese version?{' '}
            <Link href="/privacy" locale="ja" className="text-emerald-600 font-semibold">
              View Privacy Policy in Japanese
            </Link>
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white/80 hover:bg-gray-50 text-gray-700 font-medium transition"
          >
            Back to Home
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
