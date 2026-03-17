'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { stripLocaleFromPathname } from '@/lib/i18n'

type CategoryItem = {
  id: number
  name: string
  slug: string
}

export const useCategoryTotal = (categories: CategoryItem[]) => {
  const [totalFound, setTotalFound] = useState<number | null>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadTotal = async () => {
      const cleanPathname = stripLocaleFromPathname(pathname)
      const categorySlug = cleanPathname.split('/category/')[1]?.split('/')[0]
      const currentCategory = categories.find((category) => category.slug === categorySlug)

      if (!currentCategory) {
        setTotalFound(0)
        return
      }

      try {
        const params = new URLSearchParams(searchParams.toString())
        params.set('categorySlug', currentCategory.slug)
        if (!params.get('limit')) {
          params.set('limit', '1')
        }

        const response = await fetch(`/api/devices?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to load total')

        const payload = (await response.json()) as {
          pagination?: { total?: number }
        }
        setTotalFound(payload.pagination?.total ?? 0)
      } catch {
        setTotalFound(null)
      }
    }

    void loadTotal()
  }, [categories, pathname, searchParams])

  return totalFound
}
