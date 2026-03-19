'use client'

import { usePathname, useSearchParams } from 'next/navigation'

import React from 'react'

import { Container } from '@/components/ui/container'

import { stripLocaleFromPathname } from '@/lib/i18n'
import { cn } from '@/lib/utils'

import { useCategoryTotal } from '../../hooks/hook-filter/use-category-total'
import { FilterChips } from '../filter/filter-chips'
import { ToggleServer } from '../shared/toggle-server'
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

/** Static shell for Suspense while search params stream (Next.js CSR bailout). */
export function TopBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('sticky top-0 z-10 bg-white py-2 shadow-lg shadow-black/5', className)}>
      <Container className="flex flex-col gap-2">
        <div className="no-scrollbar flex min-h-10 items-center gap-2 overflow-x-auto">
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-zinc-100" />
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-zinc-100" />
        </div>
      </Container>
    </div>
  )
}

function searchParamsToParamArray(
  searchParams: ReturnType<typeof useSearchParams>
): { [key: string]: string }[] {
  const arr: { [key: string]: string }[] = []
  searchParams.forEach((value, key) => {
    arr.push({ [key]: value })
  })
  return arr
}

export const TopBar: React.FC<Props> = ({ categories, className }) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const cleanPathname = stripLocaleFromPathname(pathname)
  const isCategoryPage = cleanPathname.startsWith('/category/')

  const activeSlug = cleanPathname.split('/')[2]
  const totalFound = useCategoryTotal()

  const filterItems = categories.map((cat) => ({
    text: cat.name,
    value: cat.slug,
  }))

  const currentParams = searchParamsToParamArray(searchParams)

  return (
    <div className={cn('sticky top-0 z-10 bg-white py-2 shadow-lg shadow-black/5', className)}>
      <Container className="flex flex-col gap-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          <ToggleServer
            paramName="category"
            isPathnameMode
            activeValue={activeSlug}
            currentParams={currentParams}
            defaultArrValue={filterItems}
            className="flex-row"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {isCategoryPage && <FilterChips totalFound={totalFound} className="hidden lg:flex" />}
          {isCategoryPage && <SheetFilter totalFound={totalFound} />}
        </div>
      </Container>
    </div>
  )
}
