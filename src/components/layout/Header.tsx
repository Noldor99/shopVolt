'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Suspense } from 'react'

import { UserCabinetDrawer } from '@/app/cabinet/_components/user-cabinet-drawer'

import { SheetHeader } from '@/components/layout/SheetHeader'

import { cn } from '@/lib/utils'

import { AuthDialog } from '../auth/auth-dialog'
import { BasketButton } from '../shared/basket-button'
import { SearchInput } from '../shared/search-input'

export const Header = () => {
  const pathname = usePathname()
  const nav = [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
    { name: 'News', url: '/news' },
    { name: 'Cabinet', url: '/cabinet' },
    { name: 'Admin panel', url: '/admin' },
  ]

  return (
    <header className="border-grey-200 sticky top-0 z-50 w-full border-b bg-white py-2">
      <div className="container py-0">
        <div className="flex items-center gap-4 xl:justify-between xl:gap-8">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/logo.svg" alt="Logo" width={35} height={35} priority />
            <h1 className="text-2xl font-black uppercase">Next</h1>
          </Link>
          <div className="order-3 w-full md:order-none md:mx-10 md:w-auto md:flex-1">
            <SearchInput />
          </div>
          <div className="ml-auto flex gap-3">
            <AuthDialog />
            <UserCabinetDrawer />
            <BasketButton />
            <SheetHeader nav={nav} />
          </div>
        </div>
      </div>
    </header>
  )
}
