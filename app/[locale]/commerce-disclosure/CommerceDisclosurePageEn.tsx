"use client"

import { Link } from '@/i18n/routing'

const sectionClass =
  "bg-white/80 backdrop-blur rounded-3xl p-6 sm:p-8 shadow-lg border border-gray-200/60"

export default function CommerceDisclosurePageEn() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 text-gray-800">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-2xl font-bold shadow-xl">
            C
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Commerce Disclosure
          </h1>
          <p className="text-sm text-gray-500">Last updated: November 12, 2025</p>
          <p className="text-base text-gray-600">
            Based on the Specified Commercial Transactions Act (Japan)
          </p>
        </header>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Business Name</h2>
          <p>Emotype Operations Team</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Chief Operating Officer</h2>
          <p>Taku Motojima</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Business Address</h2>
          <p>2-18-33-702 Higashi-Narashino, Narashino-shi, Chiba 275-0001, Japan</p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Contact Information</h2>
          <div className="space-y-2">
            <p>Email: info@emotype.app</p>
            <p className="text-sm text-gray-600">
              ※Inquiries are accepted via email
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Pricing</h2>
          <div className="space-y-2">
            <p className="font-medium">Prices displayed on each plan page (USD, excluding tax)</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              <li>Free Plan: $0</li>
              <li>Pro Plan: $4.99/month or $39.99/year (33% OFF)</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              ※7-day free trial is available for first-time subscribers
            </p>
            <p className="text-sm text-gray-600">
              ※Applicable taxes may be added at checkout depending on your region
            </p>
            <p className="text-sm text-gray-600">
              ※Prices are subject to change without notice
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Additional Costs</h2>
          <p>
            No additional costs beyond the subscription fee. However, internet connection fees are your responsibility.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Service Delivery Time</h2>
          <p>
            The service is available immediately after registration. As this is a subscription service,
            the service will be provided continuously during the contract period.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
          <div className="space-y-2">
            <p>Credit Card Payment (via Stripe)</p>
            <p className="text-sm text-gray-600">
              ※Accepted cards: Visa, Mastercard, American Express, JCB, etc.
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Payment Timing</h2>
          <p>
            As a monthly subscription service, charges are automatically processed at the start of
            the contract and on each monthly renewal date.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Returns and Cancellations</h2>
          <div className="space-y-3">
            <p>
              Due to the nature of digital content, refunds or returns are not accepted after
              service use has begun.
            </p>
            <p>
              Subscription cancellation is possible at any time. After cancellation, billing will
              stop from the next renewal date. Pro-rated refunds are not available.
            </p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Service Period</h2>
          <p>
            The service is provided continuously during the subscription period. It will automatically
            renew monthly until cancelled.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">System Requirements</h2>
          <div className="space-y-2">
            <p className="font-medium">We recommend using the following environment:</p>
            <ul className="list-disc space-y-1 pl-5 text-gray-700">
              <li>Latest version of major browsers (Chrome, Firefox, Safari, Edge)</li>
              <li>Internet connection</li>
              <li>JavaScript enabled</li>
            </ul>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold mb-4">Other Notes</h2>
          <div className="space-y-2">
            <p>
              Use of the service is subject to our{' '}
              <Link href="/terms" className="text-emerald-600 font-semibold hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-emerald-600 font-semibold hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-sm text-gray-600">
              ※The contents of this disclosure are subject to change without notice
            </p>
          </div>
        </section>

        <div className="text-center space-y-2 text-sm text-gray-500">
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
