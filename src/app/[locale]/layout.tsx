import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'

import { ReactNode } from 'react'

import { Providers } from '@/components/Providers'
import { Toaster } from '@/components/ui/toaster'

import { LOCALES, type Locale } from '@/lib/i18n'

import '../globals.css'

export const metadata: Metadata = {
  title: 'V3V - Online Tech Store',
  description: 'Browse and buy tablets, monitors and other devices at V3V.',
}

export const generateStaticParams = () =>
  LOCALES.map((locale) => ({ locale }))

type LocaleLayoutProps = {
  children: ReactNode
  params: { locale: string }
}

const LocaleLayout = ({ children, params }: LocaleLayoutProps) => {
  const locale = (params.locale as Locale) ?? 'ua'

  return (
    <html lang={locale === 'ua' ? 'uk' : 'en'}>
      <body className={`flex min-h-screen flex-col`}>
        <Providers>
          <div className="fixed left-0 right-0 top-0 z-[-1]">
            <div className="h-[80vh] bg-background blur-[90px] filter"></div>
          </div>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

export default LocaleLayout
