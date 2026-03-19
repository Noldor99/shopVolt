'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  getLocaleFromPathname,
  stripLocaleFromPathname,
  withLocalePath,
} from '@/lib/i18n'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  className?: string
  onNavigate?: () => void
}

export const LanguageSwitcher = ({ className, onNavigate }: LanguageSwitcherProps) => {
  const pathname = usePathname() ?? '/'
  const searchParams = useSearchParams()
  const currentLocale = getLocaleFromPathname(pathname)
  const basePath = stripLocaleFromPathname(pathname)
  const query = searchParams?.toString()

  return (
    <div className={cn('flex items-center gap-1 rounded-xl border border-black/10 p-1', className)}>
      {LOCALES.map((locale) => {
        const nextPath = withLocalePath(basePath, locale as Locale)
        const href = query ? `${nextPath}?${query}` : nextPath
        const isActive = currentLocale === locale
        const label = locale === DEFAULT_LOCALE ? 'UA' : 'EN'

        return (
          <Link
            key={locale}
            href={href}
            onClick={onNavigate}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-bold tracking-wide transition-colors',
              isActive ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
