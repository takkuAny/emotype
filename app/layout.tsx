import './globals.css';

import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Emotype - Your Social-Mood Coach',
  description: 'Analyze how X (Twitter) affects your mood. AI-powered weekly reports help you build healthier social media habits.',
  keywords: 'social media mental health, twitter mood tracker, doomscrolling prevention, emotional hygiene, SNS wellness',
  openGraph: {
    title: 'Emotype - Fix Your Social-Mood Loop',
    description: 'Visualize how X impacts your emotions. Get AI-powered detox suggestions weekly.',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ja_JP'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emotype - Your Social-Mood Coach',
    description: 'Build healthier social media habits with AI-powered mood tracking.',
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
