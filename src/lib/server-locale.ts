import { headers } from 'next/headers'

import { DEFAULT_LOCALE, type Locale, isLocale } from '@/lib/i18n'

export const getServerLocale = async (): Promise<Locale> => {
  const h = await headers()
  const fromHeader = h.get('x-locale')
  if (isLocale(fromHeader)) return fromHeader
  return DEFAULT_LOCALE
}
