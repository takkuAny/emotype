import { createNavigation } from 'next-intl/navigation';
import type { Pathnames } from 'next-intl/routing';

import { defaultLocale, localePrefix, locales, type Locale } from './config';

export const pathnames = {
  '/': '/',
  '/login': '/login',
  '/signup': '/signup',
  '/privacy': '/privacy',
  '/terms': '/terms',
  '/posts': '/posts',
  '/dashboard': '/dashboard',
  '/dashboard/search': '/dashboard/search',
  '/dashboard/subscription': '/dashboard/subscription',
  '/dashboard/x-integration': '/dashboard/x-integration',
  '/admin/analytics': '/admin/analytics'
} satisfies Pathnames<typeof locales>;

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname
} = createNavigation({
  locales,
  localePrefix,
  defaultLocale,
  pathnames
});
