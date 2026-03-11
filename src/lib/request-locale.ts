import type { NextRequest } from 'next/server'

import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n'

const parseAcceptLanguage = (headerValue: string | null): Locale => {
  if (!headerValue) return DEFAULT_LOCALE
  const lower = headerValue.toLowerCase()
  if (lower.includes('uk')) return 'ua'
  if (lower.includes('en')) return 'en'
  return DEFAULT_LOCALE
}

export const resolveLocaleFromRequest = (req: NextRequest): Locale => {
  const queryLang = req.nextUrl.searchParams.get('lang')
  if (isLocale(queryLang)) return queryLang

  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value
  if (isLocale(cookieLocale)) return cookieLocale

  const pathSegment = req.nextUrl.pathname.split('/')[1]
  if (isLocale(pathSegment)) return pathSegment

  return parseAcceptLanguage(req.headers.get('accept-language'))
}
