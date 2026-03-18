import type { NextRequest } from 'next/server'

import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n'

export const resolveLocaleFromRequest = (req: NextRequest): Locale => {
  const queryLang = req.nextUrl.searchParams.get('lang')
  if (isLocale(queryLang)) return queryLang

  const pathSegment = req.nextUrl.pathname.split('/')[1]
  if (isLocale(pathSegment)) return pathSegment

  return DEFAULT_LOCALE
}
