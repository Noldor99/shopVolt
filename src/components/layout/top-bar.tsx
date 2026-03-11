'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import React from 'react'

import { Container } from '@/components/ui/container'

import useScroll from '@/hooks/use-scroll'

import {
  getLocaleFromPathname,
  getMessages,
  stripLocaleFromPathname,
  withLocalePath,
} from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { FilterChips } from '../filter/filter-chips'
import { LanguageSwitcher } from '../shared/LanguageSwitcher'
import { useCategoryTotal } from './hook/use-category-total'
import { SheetFilter } from './sheet-filter'

type CategoryItem = {
  id: number
  name: string
  slug: string
}

interface Props {
  categories: CategoryItem[]
  className?: string
}

export const TopBar: React.FC<Props> = ({ categories, className }) => {
  const cartVisible = useScroll(3)
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)
  const cleanPathname = stripLocaleFromPathname(pathname)
  const isCategoryPage = cleanPathname.startsWith('/category/')

  const totalFound = useCategoryTotal(categories)

  return (
    <div className={cn('sticky top-0 z-10 bg-white py-2 shadow-lg shadow-black/5', className)}>
      <Container className="flex flex-col gap-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((category) => {
            const href = withLocalePath(`/category/${category.slug}`, locale)
            const isActive = cleanPathname === `/category/${category.slug}`
            return (
              <Link
                key={category.id}
                href={href}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'border-slate-200 hover:border-black'
                )}
              >
                {category.name}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          {isCategoryPage && <FilterChips totalFound={totalFound} className="hidden lg:flex" />}
          {isCategoryPage && <SheetFilter totalFound={totalFound} />}
          {isCategoryPage && (
            <p
              className={cn(
                'transition-opacity duration-200',
                !cartVisible ? 'invisible opacity-0' : 'visible opacity-100'
              )}
            >
              {t.common.foundProducts}: {totalFound ?? '...'}
            </p>
          )}
          <LanguageSwitcher />
        </div>
      </Container>
    </div>
  )
}
