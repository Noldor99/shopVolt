import { cookies, headers } from 'next/headers'

import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n'

const parseAcceptLanguage = (headerValue: string | null): Locale => {
  if (!headerValue) return DEFAULT_LOCALE
  const lower = headerValue.toLowerCase()
  if (lower.includes('uk')) return 'ua'
  if (lower.includes('en')) return 'en'
  return DEFAULT_LOCALE
}

export const getServerLocale = async (): Promise<Locale> => {
  const h = await headers()
  const c = await cookies()
  const fromHeader = h.get('x-locale')
  if (isLocale(fromHeader)) return fromHeader
  const fromCookie = c.get('NEXT_LOCALE')?.value
  if (isLocale(fromCookie)) return fromCookie
  return parseAcceptLanguage(h.get('accept-language'))
}
