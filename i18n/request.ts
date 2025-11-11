import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: Locale =
    locale && locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
});
