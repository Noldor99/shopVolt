'use client'

import { useQuery } from '@tanstack/react-query'

import { apiCategory } from '@/actions/client/categoryAction'
import { TopBar } from '@/components/layout/top-bar'
import type { ICategory } from '@/types/category'

type TopBarWrapperProps = {
  locale: 'ua' | 'en'
  className?: string
}

export const TopBarWrapper = ({ locale, className }: TopBarWrapperProps) => {
  const { data = [] } = useQuery({
    queryKey: ['main-layout-categories', locale],
    queryFn: () => apiCategory.getAll({ lang: locale }),
  })

  const categories = (data as ICategory[])
    .filter((c) => c.name.length > 0)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.nameLocalized ?? category.name,
    }))

  return <TopBar categories={categories} className={className} />
}
