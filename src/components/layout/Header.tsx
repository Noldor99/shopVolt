'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Suspense } from 'react'

import { UserCabinetDrawer } from '@/app/[locale]/cabinet/_components/user-cabinet-drawer'

import { SheetHeader } from '@/components/layout/SheetHeader'

import { type Locale, getLocaleFromPathname, withLocalePath } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { AuthDialog } from '../auth/auth-dialog'
import { BasketButton } from '../shared/basket-button'
import { SearchInput } from '../shared/search-input'

export const Header = () => {
  const pathname = usePathname() || '/'

  const currentLocale = getLocaleFromPathname(pathname) as Locale

  const getHref = (url: string) => withLocalePath(url, currentLocale)

  const nav = [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
    { name: 'News', url: '/news' },
    { name: 'Cabinet', url: '/cabinet' },
    { name: 'Admin panel', url: '/admin' },
  ].map((item) => ({
    ...item,
    url: getHref(item.url),
  }))

  return (
    <header className="border-grey-200 sticky top-0 z-50 w-full border-b bg-white py-2">
      <div className="container px-3 py-0">
        <div className="flex items-center gap-2 xl:justify-between xl:gap-8">
          <Link href={getHref('/')} className="flex min-w-[35px] items-center gap-4">
            <Image src="/logo.svg" alt="Logo" width={35} height={35} priority />
            <h1 className="hidden text-2xl font-black uppercase sm:block">Next</h1>
          </Link>

          <div className="w-full md:order-none md:mx-10 md:w-auto md:flex-1">
            <SearchInput />
          </div>

          <div className="ml-auto flex gap-3">
            <div className="hidden md:flex">
              <AuthDialog />
              <UserCabinetDrawer />
            </div>
            <BasketButton />
            {/* Передаємо вже оновлену навігацію з префіксами */}
            <SheetHeader nav={nav} />
          </div>
        </div>
      </div>
    </header>
  )
}
