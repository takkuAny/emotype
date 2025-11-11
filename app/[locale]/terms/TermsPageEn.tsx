"use client"

import { Link } from '@/i18n/routing'

const sectionClass =
  "bg-white/80 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/60"

export default function TermsPageEn() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-2xl font-bold shadow-xl">
            E
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Emotype Terms of Service
          </h1>
          <p className="text-sm text-gray-500">Last updated: November 8, 2025</p>
          <p className="text-base text-gray-600">
            These Terms of Service (“Terms”) govern your access to and use of Emotype (“the
            Service”). By using the Service, you agree to be bound by these Terms.
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">1. Scope of Agreement</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              These Terms apply to all relationships between the user (“you”) and the operator
              (“we,” “us,” or “our”).
            </li>
            <li>
              We may modify these Terms at any time. The updated Terms become effective once posted on
              the Service.
            </li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">2. Description of Service</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Emotype is a web application that analyzes and visualizes emotions using AI.</li>
            <li>We may change, add, suspend, or discontinue parts of the Service without notice.</li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">3. User Account and Registration</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Provide accurate and updated information when creating an account.</li>
            <li>Users must promptly update their profile if information changes.</li>
            <li>
              We may suspend or delete accounts containing false, inappropriate, or fraudulent data.
            </li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">4. Prohibited Actions</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Violating laws or public order</li>
            <li>Interfering with the Service’s operation</li>
            <li>Infringing others’ rights, privacy, or intellectual property</li>
            <li>Using the Service for unauthorized commercial purposes</li>
            <li>Reverse engineering, unauthorized access, or tampering with data</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">5. Paid Plans and Billing</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Paid subscriptions are processed via Stripe.</li>
            <li>After any free trial, billing renews automatically unless canceled.</li>
            <li>Payment information is managed through Stripe’s systems.</li>
            <li>Except where required by law, payments are non-refundable.</li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">6. User Data and Content</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Text, emotion scores, images, and audio submitted by users may be temporarily stored or
              processed for AI analysis.
            </li>
            <li>The Service relies on third-party providers such as Supabase and OpenAI.</li>
            <li>Users may request deletion of their data at any time.</li>
          </ol>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">7. Disclaimer</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>We are not liable for damages arising from the use or inability to use the Service.</li>
            <li>AI results are solely informational and do not constitute medical or psychological advice.</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">8. Suspension or Termination</h2>
          <p>
            We may suspend or discontinue the Service for maintenance, system failure, or other
            operational reasons.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">9. Intellectual Property</h2>
          <p>
            All copyrights, trademarks, and other intellectual property associated with the Service
            belong to us or the respective rights holders.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">10. Governing Law and Jurisdiction</h2>
          <p>
            These Terms are governed by the laws of Japan. Any disputes shall be subject to the
            exclusive jurisdiction of the courts located in Japan.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Contact</h2>
          <p className="space-y-1">
            <span className="block font-semibold">Emotype Team</span>
            <span>info@emotype.app</span>
          </p>
        </section>

        <div className="text-center space-y-2 text-sm text-gray-500">
          <p>
            Looking for the Japanese version?{' '}
            <Link href="/terms" locale="ja" className="text-emerald-600 font-semibold">
              View Terms in Japanese
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
