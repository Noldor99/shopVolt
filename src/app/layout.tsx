import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import type { Metadata } from 'next'
import { Space_Mono } from 'next/font/google'

import { ReactNode } from 'react'

import { Providers } from '@/components/Providers'
import { Toaster } from '@/components/ui/toaster'

import { getServerLocale } from '@/lib/server-locale'

import './globals.css'

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  preload: true,
  variable: '--space-mono',
})

export const metadata: Metadata = {
  title: 'V3V - Online Tech Store',
  description: 'Browse and buy tablets, monitors and other devices at V3V.',
  robots: {
    index: false,
    follow: false,
  },
}

type RootLayoutPropsT = {
  children: ReactNode
}

const RootLayout = async ({ children }: RootLayoutPropsT) => {
  const locale = await getServerLocale()

  return (
    <html lang={locale === 'ua' ? 'uk' : 'en'}>
      <head>
        <meta name="robots" content="nofollow" />
      </head>
      <body className={`{spaceMono.className} flex min-h-screen flex-col`}>
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

export default RootLayout
