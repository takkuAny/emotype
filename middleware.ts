import createMiddleware from 'next-intl/middleware';

import { defaultLocale, localePrefix, locales } from './i18n/config';
import { pathnames } from './i18n/routing';

export default createMiddleware({
  defaultLocale,
  locales,
  localePrefix,
  pathnames
});

export const config = {
  matcher: [
    '/((?!api|auth|_next|_vercel|.*\\..*).*)'
  ]
};
