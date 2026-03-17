'use client'

import { usePathname, useRouter } from 'next/navigation'

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

import { useCategoryTotal } from '../../hooks/hook-filter/use-category-total'
import { FilterChips } from '../filter/filter-chips'
import { FilterTogleGroup } from '../filter/filter-togle-group'
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
  const router = useRouter()
  const cartVisible = useScroll(3)
  const pathname = usePathname()

  const locale = getLocaleFromPathname(pathname)
  const t = getMessages(locale)
  const cleanPathname = stripLocaleFromPathname(pathname)
  const isCategoryPage = cleanPathname.startsWith('/category/')

  // Знаходимо поточну активну категорію на основі URL
  // Припускаємо, що URL має вигляд /category/slug
  const activeSlug = cleanPathname.split('/')[2]
  const totalFound = useCategoryTotal(categories)

  // Перетворюємо категорії у формат, який очікує FilterTogleGroup
  const filterItems = categories.map((cat) => ({
    text: cat.name,
    value: cat.slug,
  }))

  const handleCategoryClick = (slug: string) => {
    const href = withLocalePath(`/category/${slug}`, locale)
    router.push(href)
  }

  return (
    <div className={cn('sticky top-0 z-10 bg-white py-2 shadow-lg shadow-black/5', className)}>
      <Container className="flex flex-col gap-2">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {/* Викликаємо компонент один раз, а не в циклі */}
          <FilterTogleGroup
            items={filterItems}
            selectedIds={new Set(activeSlug ? [activeSlug] : [])}
            onClickCheckbox={handleCategoryClick}
            className="flex-row" // Щоб кнопки йшли в ряд
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
